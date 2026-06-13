package officialapi

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strconv"
	"time"
)

type MessageHandler func(msg *WhatsAppMessage)
type StatusHandler func(status *StatusUpdate)

type WebhookServer struct {
	client         *WhatsAppCloudClient
	messageHandler MessageHandler
	statusHandler  StatusHandler
	verifyToken    string
	appSecret      string
}

func NewWebhookServer(client *WhatsAppCloudClient) *WebhookServer {
	return &WebhookServer{
		client:      client,
		verifyToken: os.Getenv("WHATSAPP_WEBHOOK_VERIFY_TOKEN"),
		appSecret:   os.Getenv("WHATSAPP_APP_SECRET"),
	}
}

func (s *WebhookServer) OnMessage(handler MessageHandler) {
	s.messageHandler = handler
}

func (s *WebhookServer) OnStatus(handler StatusHandler) {
	s.statusHandler = handler
}

func (s *WebhookServer) Handler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			s.handleVerification(w, r)
		case http.MethodPost:
			s.handleEvent(w, r)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	}
}

// GET /webhook/whatsapp?hub.mode=subscribe&hub.verify_token=<token>&hub.challenge=<challenge>
func (s *WebhookServer) handleVerification(w http.ResponseWriter, r *http.Request) {
	mode := r.URL.Query().Get("hub.mode")
	token := r.URL.Query().Get("hub.verify_token")
	challenge := r.URL.Query().Get("hub.challenge")

	if mode != "subscribe" {
		http.Error(w, "Invalid mode", http.StatusBadRequest)
		return
	}

	if token == "" || token != s.verifyToken {
		http.Error(w, "Invalid verify token", http.StatusForbidden)
		return
	}

	w.Header().Set("Content-Type", "text/plain")
	w.Write([]byte(challenge))

	fmt.Printf("[Webhook] Verified successfully at %s\n", time.Now().Format(time.RFC3339))
}

// POST /webhook/whatsapp
func (s *WebhookServer) handleEvent(w http.ResponseWriter, r *http.Request) {
	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "Failed to read body", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	if s.appSecret != "" {
		if !s.verifySignature(r, body) {
			http.Error(w, "Invalid signature", http.StatusForbidden)
			return
		}
	}

	var payload WebhookPayload
	if err := json.Unmarshal(body, &payload); err != nil {
		log.Printf("[Webhook] Failed to parse payload: %v", err)
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	if payload.Object != "whatsapp_business_account" {
		http.Error(w, "Invalid object", http.StatusBadRequest)
		return
	}

	for _, entry := range payload.Entry {
		for _, change := range entry.Changes {
			if change.Field != "messages" {
				continue
			}

			// Process status updates (delivery receipts, read receipts)
			for _, status := range change.Value.Statuses {
				s.processStatus(&status)
			}

			// Process incoming messages
			for _, msg := range change.Value.Messages {
				s.processMessage(&msg, &change.Value)
			}
		}
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

func (s *WebhookServer) verifySignature(r *http.Request, body []byte) bool {
	signature := r.Header.Get("X-Hub-Signature-256")
	if signature == "" {
		return false
	}

	mac := hmac.New(sha256.New, []byte(s.appSecret))
	mac.Write(body)
	expected := "sha256=" + hex.EncodeToString(mac.Sum(nil))

	return hmac.Equal([]byte(signature), []byte(expected))
}

func (s *WebhookServer) processStatus(status *StatusUpdate) {
	if s.statusHandler != nil {
		s.statusHandler(status)
	}

	log.Printf("[Webhook] Status update: message=%s status=%s recipient=%s",
		status.ID, status.Status, status.RecipientID)
}

func (s *WebhookServer) processMessage(raw *IncomingMessage, value *ChangeValue) {
	timestamp, _ := strconv.ParseInt(raw.Timestamp, 10, 64)

	msg := &WhatsAppMessage{
		ID:        raw.ID,
		From:      raw.From,
		Timestamp: time.Unix(timestamp, 0),
		Type:      messageTypeFromCloud(raw.Type),
	}

	if len(value.Contacts) > 0 {
		msg.SenderName = value.Contacts[0].Profile.Name
	}

	if raw.Context != nil {
		msg.ContextFrom = raw.Context.From
		msg.ContextMsgID = raw.Context.ID
	}

	switch raw.Type {
	case "text":
		if raw.Text != nil {
			msg.TextBody = raw.Text.Body
		}
	case "image":
		if raw.Image != nil {
			msg.MediaID = raw.Image.ID
			msg.MediaMimeType = raw.Image.MimeType
			msg.MediaCaption = raw.Image.Caption
			msg.MediaFilename = raw.Image.Filename
		}
	case "audio":
		if raw.Audio != nil {
			msg.MediaID = raw.Audio.ID
			msg.MediaMimeType = raw.Audio.MimeType
		}
	case "video":
		if raw.Video != nil {
			msg.MediaID = raw.Video.ID
			msg.MediaMimeType = raw.Video.MimeType
			msg.MediaCaption = raw.Video.Caption
		}
	case "document":
		if raw.Document != nil {
			msg.MediaID = raw.Document.ID
			msg.MediaMimeType = raw.Document.MimeType
			msg.MediaCaption = raw.Document.Caption
			msg.MediaFilename = raw.Document.Filename
		}
	case "sticker":
		if raw.Sticker != nil {
			msg.MediaID = raw.Sticker.ID
			msg.MediaMimeType = raw.Sticker.MimeType
		}
	}

	if s.messageHandler != nil {
		s.messageHandler(msg)
	} else {
		log.Printf("[Webhook] Received message from %s: type=%s text=%s media=%s",
			msg.From, msg.Type, truncateString(msg.TextBody, 80), msg.MediaID)
	}
}

func truncateString(s string, maxLen int) string {
	runes := []rune(s)
	if len(runes) > maxLen {
		return string(runes[:maxLen]) + "..."
	}
	return s
}
