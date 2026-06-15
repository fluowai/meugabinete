package instances

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"sort"
	"strings"
	"sync"
	"time"

	"github.com/fluowai/meugabinete/whatsapp-service/database"
	"github.com/fluowai/meugabinete/whatsapp-service/handler"
	"go.mau.fi/whatsmeow"
	"go.mau.fi/whatsmeow/store"
	"go.mau.fi/whatsmeow/store/sqlstore"
	"go.mau.fi/whatsmeow/types/events"
	waLog "go.mau.fi/whatsmeow/util/log"
)

type Snapshot struct {
	InstanceKey     string  `json:"instance_key"`
	Name            string  `json:"name"`
	Provider        string  `json:"provider"`
	Status          string  `json:"status"`
	Connected       bool    `json:"connected"`
	JID             *string `json:"jid"`
	Phone           *string `json:"phone"`
	PushName        *string `json:"push_name"`
	LastSeenAt      string  `json:"last_seen_at"`
	LastConnectedAt *string `json:"last_connected_at"`
}

type qrState struct {
	Code      string `json:"qr"`
	Status    string `json:"status"`
	Connected bool   `json:"connected"`
}

type Instance struct {
	mu              sync.RWMutex
	key             string
	name            string
	client          *whatsmeow.Client
	qr              string
	status          string
	connected       bool
	pairing         bool
	lastSeenAt      time.Time
	lastConnectedAt time.Time
}

type Manager struct {
	mu        sync.RWMutex
	container *sqlstore.Container
	instances map[string]*Instance
	log       waLog.Logger
}

type connectionRecord struct {
	InstanceKey string `json:"instance_key"`
	Name        string `json:"name"`
	JID         string `json:"jid"`
}

func NewManager(container *sqlstore.Container, log waLog.Logger) (*Manager, error) {
	manager := &Manager{
		container: container,
		instances: make(map[string]*Instance),
		log:       log,
	}

	devices, err := container.GetAllDevices(context.Background())
	if err != nil {
		return nil, fmt.Errorf("failed to load WhatsApp devices: %w", err)
	}
	records := loadConnectionRecords()
	usedRecords := make(map[string]bool)

	for index, device := range devices {
		key, name := metadataForDevice(device, records, usedRecords, index)
		instance := manager.newInstance(key, name, device)
		manager.instances[key] = instance
		go manager.connectExisting(instance)
	}
	for _, record := range records {
		if record.InstanceKey == "" || usedRecords[record.InstanceKey] {
			continue
		}
		manager.instances[record.InstanceKey] = manager.newInstance(record.InstanceKey, record.Name, container.NewDevice())
	}

	return manager, nil
}

func (m *Manager) Create(name string) (Snapshot, error) {
	key, err := newInstanceKey()
	if err != nil {
		return Snapshot{}, err
	}
	instance := m.newInstance(key, strings.TrimSpace(name), m.container.NewDevice())

	m.mu.Lock()
	m.instances[key] = instance
	m.mu.Unlock()

	if err := m.startPairing(instance); err != nil {
		m.mu.Lock()
		delete(m.instances, key)
		m.mu.Unlock()
		return Snapshot{}, err
	}

	snapshot := instance.snapshot()
	m.persist(snapshot)
	return snapshot, nil
}

func (m *Manager) List() []Snapshot {
	m.mu.RLock()
	instances := make([]*Instance, 0, len(m.instances))
	for _, instance := range m.instances {
		instances = append(instances, instance)
	}
	m.mu.RUnlock()

	snapshots := make([]Snapshot, 0, len(instances))
	for _, instance := range instances {
		snapshots = append(snapshots, instance.snapshot())
	}
	sort.Slice(snapshots, func(i, j int) bool {
		return snapshots[i].Name < snapshots[j].Name
	})
	return snapshots
}

func (m *Manager) QR(key string) (qrState, error) {
	instance, ok := m.instance(key)
	if !ok {
		return qrState{}, fmt.Errorf("WhatsApp instance not found")
	}

	instance.mu.RLock()
	needsPairing := instance.client.Store.ID == nil && !instance.connected && !instance.pairing
	instance.mu.RUnlock()
	if needsPairing {
		if err := m.startPairing(instance); err != nil {
			return qrState{}, err
		}
	}

	deadline := time.Now().Add(8 * time.Second)
	for {
		instance.mu.RLock()
		state := qrState{Code: instance.qr, Status: instance.status, Connected: instance.connected}
		instance.mu.RUnlock()
		if state.Code != "" || state.Connected || time.Now().After(deadline) {
			return state, nil
		}
		time.Sleep(200 * time.Millisecond)
	}
}

func (m *Manager) Client(key string) (*whatsmeow.Client, bool) {
	instance, ok := m.instance(key)
	if !ok {
		return nil, false
	}
	instance.mu.RLock()
	defer instance.mu.RUnlock()
	return instance.client, true
}

func (m *Manager) PrimaryConnectedClient() *whatsmeow.Client {
	m.mu.RLock()
	instances := make([]*Instance, 0, len(m.instances))
	for _, instance := range m.instances {
		instances = append(instances, instance)
	}
	m.mu.RUnlock()
	for _, instance := range instances {
		instance.mu.RLock()
		connected := instance.connected && instance.client.IsConnected()
		client := instance.client
		instance.mu.RUnlock()
		if connected {
			return client
		}
	}
	return nil
}

func (m *Manager) ConnectedCount() int {
	count := 0
	for _, snapshot := range m.List() {
		if snapshot.Connected {
			count++
		}
	}
	return count
}

func (m *Manager) Close() {
	m.mu.RLock()
	instances := make([]*Instance, 0, len(m.instances))
	for _, instance := range m.instances {
		instances = append(instances, instance)
	}
	m.mu.RUnlock()
	for _, instance := range instances {
		instance.client.Disconnect()
	}
}

func (m *Manager) newInstance(key, name string, device *store.Device) *Instance {
	if name == "" {
		name = "WhatsApp " + key
	}
	instance := &Instance{
		key:        key,
		name:       name,
		client:     whatsmeow.NewClient(device, m.log.Sub(key)),
		status:     "disconnected",
		lastSeenAt: time.Now().UTC(),
	}
	instance.client.AddEventHandler(func(event interface{}) {
		m.handleEvent(instance, event)
	})
	return instance
}

func (m *Manager) connectExisting(instance *Instance) {
	instance.setStatus("connecting", false)
	if err := instance.client.Connect(); err != nil {
		instance.setStatus("error", false)
		fmt.Printf("Failed to connect WhatsApp instance %s: %v\n", instance.key, err)
	}
	m.persist(instance.snapshot())
}

func (m *Manager) startPairing(instance *Instance) error {
	instance.mu.Lock()
	if instance.client.Store.ID != nil {
		instance.mu.Unlock()
		return nil
	}
	if instance.pairing {
		instance.mu.Unlock()
		return nil
	}
	instance.pairing = true
	instance.status = "pairing"
	instance.qr = ""
	instance.lastSeenAt = time.Now().UTC()
	instance.mu.Unlock()

	qrChannel, err := instance.client.GetQRChannel(context.Background())
	if err != nil {
		instance.finishPairing("error")
		return fmt.Errorf("failed to initialize QR channel: %w", err)
	}
	if err := instance.client.Connect(); err != nil {
		instance.finishPairing("error")
		return fmt.Errorf("failed to connect WhatsApp instance: %w", err)
	}

	go func() {
		for item := range qrChannel {
			switch item.Event {
			case whatsmeow.QRChannelEventCode:
				instance.setQR(item.Code)
			case whatsmeow.QRChannelSuccess.Event:
				instance.finishPairing("connected")
			case whatsmeow.QRChannelTimeout.Event:
				instance.finishPairing("qr_expired")
			default:
				instance.finishPairing("error")
			}
			m.persist(instance.snapshot())
		}
	}()
	return nil
}

func (m *Manager) handleEvent(instance *Instance, event interface{}) {
	switch value := event.(type) {
	case *events.Message:
		handler.ProcessMessage(instance.client, value)
	case *events.Connected:
		instance.mu.Lock()
		instance.connected = true
		instance.pairing = false
		instance.status = "connected"
		instance.qr = ""
		instance.lastSeenAt = time.Now().UTC()
		instance.lastConnectedAt = instance.lastSeenAt
		instance.mu.Unlock()
		m.persist(instance.snapshot())
	case *events.Disconnected:
		instance.setStatus("disconnected", false)
		m.persist(instance.snapshot())
	case *events.LoggedOut:
		instance.setStatus("logged_out", false)
		m.persist(instance.snapshot())
	}
}

func (m *Manager) instance(key string) (*Instance, bool) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	instance, ok := m.instances[key]
	return instance, ok
}

func (m *Manager) persist(snapshot Snapshot) {
	if _, err := database.UpsertToSupabase("whatsapp_connections", "instance_key", snapshot); err != nil {
		fmt.Printf("Failed to persist WhatsApp instance %s: %v\n", snapshot.InstanceKey, err)
	}
}

func (i *Instance) snapshot() Snapshot {
	i.mu.RLock()
	defer i.mu.RUnlock()

	var jid, phone, pushName *string
	if i.client.Store.ID != nil {
		jidValue := i.client.Store.ID.String()
		_, phoneValue := handler.NormalizePhone(i.client.Store.ID.User)
		jid = &jidValue
		phone = &phoneValue
	}
	if value := strings.TrimSpace(i.client.Store.PushName); value != "" {
		pushName = &value
	}
	lastSeen := i.lastSeenAt
	if lastSeen.IsZero() {
		lastSeen = time.Now().UTC()
	}
	var lastConnected *string
	if !i.lastConnectedAt.IsZero() {
		value := i.lastConnectedAt.UTC().Format(time.RFC3339)
		lastConnected = &value
	}
	return Snapshot{
		InstanceKey:     i.key,
		Name:            i.name,
		Provider:        "whatsmeow",
		Status:          i.status,
		Connected:       i.connected && i.client.IsConnected(),
		JID:             jid,
		Phone:           phone,
		PushName:        pushName,
		LastSeenAt:      lastSeen.UTC().Format(time.RFC3339),
		LastConnectedAt: lastConnected,
	}
}

func (i *Instance) setStatus(status string, connected bool) {
	i.mu.Lock()
	i.status = status
	i.connected = connected
	i.lastSeenAt = time.Now().UTC()
	i.mu.Unlock()
}

func (i *Instance) setQR(code string) {
	i.mu.Lock()
	i.qr = code
	i.status = "pairing"
	i.pairing = true
	i.lastSeenAt = time.Now().UTC()
	i.mu.Unlock()
}

func (i *Instance) finishPairing(status string) {
	i.mu.Lock()
	i.qr = ""
	i.pairing = false
	i.status = status
	if status != "connected" {
		i.connected = false
	}
	i.lastSeenAt = time.Now().UTC()
	i.mu.Unlock()
}

func loadConnectionRecords() []connectionRecord {
	body, err := database.FetchFromSupabase("whatsapp_connections", "select=instance_key,name,jid&provider=eq.whatsmeow")
	if err != nil {
		return nil
	}
	var records []connectionRecord
	if json.Unmarshal(body, &records) != nil {
		return nil
	}
	return records
}

func metadataForDevice(device *store.Device, records []connectionRecord, used map[string]bool, index int) (string, string) {
	jid := ""
	if device.ID != nil {
		jid = device.ID.String()
	}
	for _, record := range records {
		if record.JID != "" && record.JID == jid {
			used[record.InstanceKey] = true
			return record.InstanceKey, record.Name
		}
	}
	if index == 0 {
		for _, record := range records {
			if record.InstanceKey == "default" && !used[record.InstanceKey] {
				used[record.InstanceKey] = true
				return record.InstanceKey, record.Name
			}
		}
	}
	user := "device"
	if device.ID != nil && device.ID.User != "" {
		user = device.ID.User
	}
	return "wa-" + user, "WhatsApp " + user
}

func newInstanceKey() (string, error) {
	buffer := make([]byte, 8)
	if _, err := rand.Read(buffer); err != nil {
		return "", fmt.Errorf("failed to generate instance key: %w", err)
	}
	return "wa-" + hex.EncodeToString(buffer), nil
}
