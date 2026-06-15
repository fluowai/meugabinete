package api

import (
	"context"
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/x509"
	"encoding/base64"
	"encoding/json"
	"encoding/pem"
	"fmt"
	"math/big"
	"net/http"
	"net/url"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/fluowai/meugabinete/whatsapp-service/ai"
	"github.com/fluowai/meugabinete/whatsapp-service/campaign"
	"github.com/fluowai/meugabinete/whatsapp-service/database"
	"github.com/fluowai/meugabinete/whatsapp-service/handler"
	"github.com/fluowai/meugabinete/whatsapp-service/instances"
	"github.com/fluowai/meugabinete/whatsapp-service/official-api"
	"github.com/golang-jwt/jwt/v5"
	"go.mau.fi/whatsmeow/types"
)

type APIServer struct {
	router        *http.ServeMux
	instances     *instances.Manager
	cloudProvider officialapi.WhatsAppProvider
	webhookServer *officialapi.WebhookServer
	rateLimiter   *MultiRateLimiter
	jwksCache     *JWKSCache
}

type JWKSCache struct {
	mu        sync.Mutex
	keys      []jwtVerificationKey
	expiresAt time.Time
}

type jwtVerificationKey struct {
	Kid string `json:"kid"`
	Kty string `json:"kty"`
	Alg string `json:"alg"`
	Crv string `json:"crv"`
	X   string `json:"x"`
	Y   string `json:"y"`
	Use string `json:"use"`
}

type RateLimiter struct {
	mu       sync.Mutex
	requests map[string][]time.Time
	limit    int
	window   time.Duration
}

type MultiRateLimiter struct {
	global    *RateLimiter
	sensitive *RateLimiter
}

func NewMultiRateLimiter() *MultiRateLimiter {
	return &MultiRateLimiter{
		global:    NewRateLimiter(60, time.Minute),
		sensitive: NewRateLimiter(10, time.Minute),
	}
}

func (m *MultiRateLimiter) Allow(ip string) bool {
	return m.global.Allow(ip)
}

func (m *MultiRateLimiter) AllowSensitive(ip string) bool {
	return m.sensitive.Allow(ip)
}

func NewRateLimiter(limit int, window time.Duration) *RateLimiter {
	return &RateLimiter{
		requests: make(map[string][]time.Time),
		limit:    limit,
		window:   window,
	}
}

func (rl *RateLimiter) Allow(ip string) bool {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	now := time.Now()
	windowStart := now.Add(-rl.window)

	var valid []time.Time
	for _, t := range rl.requests[ip] {
		if t.After(windowStart) {
			valid = append(valid, t)
		}
	}

	if len(valid) >= rl.limit {
		rl.requests[ip] = valid
		return false
	}

	rl.requests[ip] = append(valid, now)
	return true
}

type APIServerOption func(*APIServer)

func WithCloudProvider(provider officialapi.WhatsAppProvider) APIServerOption {
	return func(s *APIServer) {
		s.cloudProvider = provider
	}
}

func WithWebhookServer(ws *officialapi.WebhookServer) APIServerOption {
	return func(s *APIServer) {
		s.webhookServer = ws
	}
}

func NewAPIServer(instanceManager *instances.Manager, opts ...APIServerOption) *APIServer {
	s := &APIServer{
		router:      http.NewServeMux(),
		instances:   instanceManager,
		rateLimiter: NewMultiRateLimiter(),
		jwksCache:   &JWKSCache{},
	}

	if officialapi.IsCloudAPIConfigured() {
		provider, err := officialapi.GetActiveProvider()
		if err == nil {
			s.cloudProvider = provider
			ws := officialapi.NewWebhookServer(officialapi.GetClient())
			s.webhookServer = ws
			fmt.Println("[Cloud API] WhatsApp Cloud API provider initialized")
		}
	}

	for _, opt := range opts {
		opt(s)
	}

	s.registerRoutes()
	return s
}

func (s *APIServer) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	s.router.ServeHTTP(w, r)
}

func (s *APIServer) registerRoutes() {
	s.router.HandleFunc("/api/health", s.handleHealth)
	s.router.HandleFunc("/api/cep/", s.requireAuth(s.handleCEPLookup))
	s.router.HandleFunc("/api/qr", s.requireAuth(s.handleQR))
	s.router.HandleFunc("/api/ai/providers", s.requireAuth(s.handleAIProviders))
	s.router.HandleFunc("/api/ai/classify", s.requireAuth(s.handleClassify))
	s.router.HandleFunc("/api/ai/chat", s.requireAuth(s.handleAIChat))
	s.router.HandleFunc("/api/campaigns/send", s.requireAuth(s.rateLimitSensitive(s.handleSendCampaign)))
	s.router.HandleFunc("/api/insights/summary", s.requireAuth(s.handleInsights))
	s.router.HandleFunc("/api/whatsapp/connections", s.requireAuth(s.handleWhatsAppConnections))
	s.router.HandleFunc("/api/whatsapp/connections/", s.requireAuth(s.handleWhatsAppConnectionAction))
	s.router.HandleFunc("/api/whatsapp/chats", s.requireAuth(s.handleWhatsAppChats))
	s.router.HandleFunc("/api/whatsapp/chats/", s.requireAuth(s.handleWhatsAppChatMessages))
	s.router.HandleFunc("/api/whatsapp/groups/", s.requireAuth(s.handleWhatsAppGroupAction))
	s.router.HandleFunc("/api/whatsapp/messages", s.requireAuth(s.handleWhatsAppMessages))
	s.router.HandleFunc("/api/whatsapp/messages/", s.requireAuth(s.handleWhatsAppMessageAction))
	s.router.HandleFunc("/api/whatsapp/debug/persist-test", s.requireAuth(s.handleWhatsAppPersistTest))
	s.router.HandleFunc("/api/agents", s.requireAuth(s.handleAgents))

	// Webhook for WhatsApp Cloud API (no auth - called by Meta)
	if s.webhookServer != nil {
		s.router.HandleFunc("/api/webhook/whatsapp", s.webhookServer.Handler())
		fmt.Println("[Webhook] Cloud API webhook registered at /api/webhook/whatsapp")
	}

	// Cloud API message sending endpoints (auth required)
	s.router.HandleFunc("/api/whatsapp/cloud/send-text", s.requireAuth(s.rateLimitSensitive(s.handleCloudSendText)))
	s.router.HandleFunc("/api/whatsapp/cloud/send-media", s.requireAuth(s.rateLimitSensitive(s.handleCloudSendMedia)))
	s.router.HandleFunc("/api/whatsapp/cloud/send-template", s.requireAuth(s.rateLimitSensitive(s.handleCloudSendTemplate)))
	s.router.HandleFunc("/api/whatsapp/cloud/upload-media", s.requireAuth(s.rateLimitSensitive(s.handleCloudUploadMedia)))
	s.router.HandleFunc("/api/whatsapp/cloud/templates", s.requireAuth(s.handleCloudTemplates))
	s.router.HandleFunc("/api/whatsapp/cloud/media/", s.requireAuth(s.handleCloudMediaDownload))

	// Cloud API status endpoint (no auth)
	s.router.HandleFunc("/api/whatsapp/cloud-status", s.handleCloudStatus)
}

func (s *APIServer) rateLimitSensitive(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		clientIP := getClientIP(r)
		if !s.rateLimiter.AllowSensitive(clientIP) {
			respondError(w, http.StatusTooManyRequests, "Rate limit exceeded for sensitive endpoint")
			return
		}
		next(w, r)
	}
}

func (s *APIServer) requireAuth(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		clientIP := getClientIP(r)
		if !s.rateLimiter.Allow(clientIP) {
			respondError(w, http.StatusTooManyRequests, "Rate limit exceeded")
			return
		}

		token := extractToken(r)
		if token == "" {
			respondError(w, http.StatusUnauthorized, "Missing authentication token")
			return
		}

		jwtSecret := os.Getenv("JWT_SECRET")
		supabaseJWTSecret := os.Getenv("SUPABASE_JWT_SECRET")
		supabaseURL := os.Getenv("SUPABASE_URL")

		// Try JWT_SECRET
		if jwtSecret != "" {
			parsedToken, err := jwt.Parse(token, func(t *jwt.Token) (interface{}, error) {
				if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
					return nil, fmt.Errorf("unexpected signing method")
				}
				decoded, decodeErr := base64.StdEncoding.DecodeString(jwtSecret)
				if decodeErr == nil && len(decoded) > 0 {
					return decoded, nil
				}
				return []byte(jwtSecret), nil
			})
			if err == nil && parsedToken != nil && parsedToken.Valid {
				next(w, r)
				return
			}
		}

		// Try SUPABASE_JWT_SECRET
		if supabaseJWTSecret != "" {
			parsedToken, err := jwt.Parse(token, func(t *jwt.Token) (interface{}, error) {
				if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
					return nil, fmt.Errorf("unexpected signing method")
				}
				return []byte(supabaseJWTSecret), nil
			})
			if err == nil && parsedToken != nil && parsedToken.Valid {
				next(w, r)
				return
			}
		}

		// Try Supabase JWKS (ES256) - works with any Supabase project automatically
		if supabaseURL != "" {
			keys := s.getJWKS(supabaseURL)
			for _, key := range keys {
				parsedToken, err := jwt.Parse(token, func(t *jwt.Token) (interface{}, error) {
					if _, ok := t.Method.(*jwt.SigningMethodECDSA); !ok {
						return nil, fmt.Errorf("unexpected signing method")
					}
					publicKey, err := jwt.ParseECPublicKeyFromPEM([]byte(key))
					if err != nil {
						return nil, err
					}
					return publicKey, nil
				})
				if err == nil && parsedToken != nil && parsedToken.Valid {
					next(w, r)
					return
				}
			}
		}

		respondError(w, http.StatusUnauthorized, "Invalid or expired token")
	}
}

func (s *APIServer) getJWKS(supabaseURL string) []string {
	s.jwksCache.mu.Lock()
	defer s.jwksCache.mu.Unlock()

	if time.Now().Before(s.jwksCache.expiresAt) && len(s.jwksCache.keys) > 0 {
		return pemEncodeKeys(s.jwksCache.keys)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	req, _ := http.NewRequestWithContext(ctx, "GET", supabaseURL+"/auth/v1/.well-known/jwks.json", nil)
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil
	}
	defer resp.Body.Close()

	var jwks struct {
		Keys []jwtVerificationKey `json:"keys"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&jwks); err != nil {
		return nil
	}

	s.jwksCache.keys = jwks.Keys
	s.jwksCache.expiresAt = time.Now().Add(1 * time.Hour)

	return pemEncodeKeys(jwks.Keys)
}

func pemEncodeKeys(keys []jwtVerificationKey) []string {
	var result []string
	for _, k := range keys {
		if k.Kty != "EC" || k.Crv != "P-256" {
			continue
		}
		xBytes, err := base64.RawURLEncoding.DecodeString(k.X)
		if err != nil {
			continue
		}
		yBytes, err := base64.RawURLEncoding.DecodeString(k.Y)
		if err != nil {
			continue
		}
		pubKey := &ecdsa.PublicKey{Curve: elliptic.P256(), X: new(big.Int).SetBytes(xBytes), Y: new(big.Int).SetBytes(yBytes)}

		der, err := x509.MarshalPKIXPublicKey(pubKey)
		if err != nil {
			continue
		}
		pemBlock := pem.EncodeToMemory(&pem.Block{Type: "PUBLIC KEY", Bytes: der})
		result = append(result, string(pemBlock))
	}
	return result
}

func getClientIP(r *http.Request) string {
	// Only trust X-Forwarded-For when behind a trusted reverse proxy (nginx/traefik)
	// In production, the proxy should be on localhost or docker network
	remoteIP := strings.Split(r.RemoteAddr, ":")[0]
	isTrustedProxy := remoteIP == "127.0.0.1" || remoteIP == "::1" || strings.HasPrefix(remoteIP, "10.") || strings.HasPrefix(remoteIP, "172.") || strings.HasPrefix(remoteIP, "192.168.")

	if isTrustedProxy {
		forwarded := r.Header.Get("X-Forwarded-For")
		if forwarded != "" {
			return strings.Split(forwarded, ",")[0]
		}
		ip := r.Header.Get("X-Real-IP")
		if ip != "" {
			return ip
		}
	}
	return remoteIP
}

func (s *APIServer) handleHealth(w http.ResponseWriter, r *http.Request) {
	status := map[string]interface{}{
		"status":  "ok",
		"service": "whatsapp-service",
		"time":    time.Now().UTC().Format(time.RFC3339),
	}
	if release := strings.TrimSpace(os.Getenv("MEUGABINETE_RELEASE")); release != "" {
		status["release"] = release
	}

	connectedInstances := 0
	if s.instances != nil {
		connectedInstances = s.instances.ConnectedCount()
	}
	status["whatsapp_instances"] = connectedInstances
	if connectedInstances > 0 {
		status["whatsapp"] = "connected"
	} else {
		status["whatsapp"] = "disconnected"
	}
	status["whatsapp_processing"] = handler.GetProcessingStats()

	if s.cloudProvider != nil {
		if s.cloudProvider.IsConnected() {
			status["cloud_api"] = "connected"
		} else {
			status["cloud_api"] = "configured"
		}
	} else {
		status["cloud_api"] = "not_configured"
	}

	respondJSON(w, status)
}

func (s *APIServer) handleQR(w http.ResponseWriter, r *http.Request) {
	respondError(w, http.StatusBadRequest, "Use /api/whatsapp/connections/{instance_key}/qr")
}

func (s *APIServer) handleWhatsAppConnections(w http.ResponseWriter, r *http.Request) {
	if r.Method == "POST" {
		var request struct {
			Name string `json:"name"`
		}
		if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
			respondError(w, http.StatusBadRequest, "Invalid request body")
			return
		}

		request.Name = strings.TrimSpace(request.Name)
		if request.Name == "" {
			respondError(w, http.StatusBadRequest, "Instance name is required")
			return
		}
		if len(request.Name) > 255 {
			respondError(w, http.StatusBadRequest, "Instance name is too long")
			return
		}

		if s.instances == nil {
			respondError(w, http.StatusServiceUnavailable, "WhatsApp instance manager is not available")
			return
		}
		snapshot, err := s.instances.Create(request.Name)
		if err != nil {
			respondError(w, http.StatusBadGateway, err.Error())
			return
		}
		respondJSONWithStatus(w, http.StatusCreated, snapshot)
		return
	}

	if r.Method != "GET" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	if s.instances == nil {
		respondJSON(w, []instances.Snapshot{})
		return
	}
	respondJSON(w, s.instances.List())
}

func (s *APIServer) handleWhatsAppConnectionAction(w http.ResponseWriter, r *http.Request) {
	path := strings.TrimPrefix(r.URL.Path, "/api/whatsapp/connections/")
	parts := strings.Split(strings.Trim(path, "/"), "/")
	if len(parts) != 2 || parts[0] == "" {
		respondError(w, http.StatusNotFound, "Not found")
		return
	}

	switch parts[1] {
	case "qr":
		if r.Method != "GET" {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}
		if s.instances == nil {
			respondError(w, http.StatusServiceUnavailable, "WhatsApp instance manager is not available")
			return
		}
		state, err := s.instances.QR(parts[0])
		if err != nil {
			respondError(w, http.StatusNotFound, err.Error())
			return
		}
		respondJSON(w, state)
	case "sync-groups":
		if r.Method != "POST" {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}
		client, ok := s.instances.Client(parts[0])
		if !ok || client == nil || !client.IsConnected() {
			respondError(w, http.StatusServiceUnavailable, "WhatsApp client not connected")
			return
		}
		groups, participants, err := handler.SyncJoinedGroups(client)
		if err != nil {
			respondError(w, http.StatusInternalServerError, "Failed to sync groups")
			return
		}
		respondJSON(w, map[string]int{"groups": groups, "participants": participants})
	default:
		respondError(w, http.StatusNotFound, "Not found")
	}
}

func (s *APIServer) handleAIProviders(w http.ResponseWriter, r *http.Request) {
	router := ai.GetRouter()
	providers := router.GetAvailableProviders()
	active := router.GetActiveProvider()

	respondJSON(w, map[string]interface{}{
		"providers": providers,
		"active":    active,
	})
}

func (s *APIServer) handleClassify(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		Message string `json:"message"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.Message == "" {
		respondError(w, http.StatusBadRequest, "message is required")
		return
	}

	if len(req.Message) > 5000 {
		respondError(w, http.StatusBadRequest, "message exceeds maximum length of 5000 characters")
		return
	}

	result, err := ai.ClassifyDemand(req.Message)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to classify message")
		return
	}

	respondJSON(w, result)
}

func (s *APIServer) handleAIChat(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		Messages     []ai.ChatMessage `json:"messages"`
		SystemPrompt string           `json:"system_prompt"`
		Provider     string           `json:"provider"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	router := ai.GetRouter()
	if req.Provider != "" {
		validProviders := router.GetAvailableProviders()
		isValid := false
		for _, p := range validProviders {
			if p == ai.AIProvider(req.Provider) {
				isValid = true
				break
			}
		}
		if !isValid {
			respondError(w, http.StatusBadRequest, "Invalid AI provider")
			return
		}
		router.SetActiveProvider(ai.AIProvider(req.Provider))
	}

	response, err := router.Chat(req.Messages, req.SystemPrompt)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to get AI response")
		return
	}

	respondJSON(w, map[string]string{"response": response})
}

func (s *APIServer) handleSendCampaign(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		Title   string   `json:"title"`
		Message string   `json:"message"`
		Targets []string `json:"targets"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.Title == "" || req.Message == "" || len(req.Targets) == 0 {
		respondError(w, http.StatusBadRequest, "title, message and targets are required")
		return
	}

	if len(req.Targets) > 500 {
		respondError(w, http.StatusBadRequest, "maximum 500 targets per campaign")
		return
	}

	var invalidPhones []string
	for _, phone := range req.Targets {
		if len(phone) < 10 || len(phone) > 15 {
			invalidPhones = append(invalidPhones, phone)
		}
	}
	if len(invalidPhones) > 0 {
		respondError(w, http.StatusBadRequest, fmt.Sprintf("invalid phone number format for %d target(s)", len(invalidPhones)))
		return
	}

	client := s.instances.PrimaryConnectedClient()
	if client == nil {
		respondError(w, http.StatusServiceUnavailable, "WhatsApp client not initialized")
		return
	}

	if !client.IsConnected() {
		respondError(w, http.StatusServiceUnavailable, "WhatsApp client not connected")
		return
	}

	go func() {
		sent, failed := campaign.SendBulk(context.Background(), client, req.Targets, req.Message)
		fmt.Printf("Campaign '%s' sent: %d success, %d failed\n", req.Title, sent, failed)
	}()

	respondJSON(w, map[string]string{
		"status":  "queued",
		"message": "Campaign is being sent",
	})
}

func (s *APIServer) handleInsights(w http.ResponseWriter, r *http.Request) {
	summary, err := generateInsights()
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to generate insights")
		return
	}

	respondJSON(w, map[string]string{"insights": summary})
}

func (s *APIServer) handleWhatsAppChats(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	chatType := r.URL.Query().Get("type")
	query := "select=*&order=last_message_at.desc&limit=200"
	if chatType == "direct" || chatType == "group" {
		query += "&chat_type=eq." + url.QueryEscape(chatType)
	}
	body, err := database.FetchFromSupabase("whatsapp_chats", query)
	if err != nil {
		fmt.Printf("Failed to fetch WhatsApp chats: %v\n", err)
		if isMissingWhatsAppSchema(err) {
			respondJSON(w, []map[string]interface{}{})
			return
		}
		respondError(w, http.StatusInternalServerError, "Failed to fetch chats")
		return
	}
	respondRawJSON(w, body)
}

func (s *APIServer) handleWhatsAppMessages(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	limit := r.URL.Query().Get("limit")
	if limit == "" {
		limit = "250"
	}
	query := "select=*&order=received_at.desc&limit=" + url.QueryEscape(limit)
	chatType := r.URL.Query().Get("type")
	if chatType == "direct" {
		query += "&is_group=eq.false"
	} else if chatType == "group" {
		query += "&is_group=eq.true"
	}

	body, err := database.FetchFromSupabase("whatsapp_messages", query)
	if err != nil {
		fmt.Printf("Failed to fetch WhatsApp messages: %v\n", err)
		if isMissingWhatsAppSchema(err) {
			respondJSON(w, []map[string]interface{}{})
			return
		}
		respondError(w, http.StatusInternalServerError, "Failed to fetch messages")
		return
	}
	respondRawJSON(w, body)
}

func (s *APIServer) handleWhatsAppChatMessages(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	path := strings.TrimPrefix(r.URL.Path, "/api/whatsapp/chats/")
	parts := strings.Split(strings.Trim(path, "/"), "/")
	if len(parts) != 2 || parts[1] != "messages" || parts[0] == "" {
		respondError(w, http.StatusNotFound, "Not found")
		return
	}

	chatID := url.QueryEscape(parts[0])
	query := "select=*&chat_id=eq." + chatID + "&order=received_at.asc&limit=300"
	body, err := database.FetchFromSupabase("whatsapp_messages", query)
	if err != nil {
		fmt.Printf("Failed to fetch WhatsApp chat messages: %v\n", err)
		if isMissingWhatsAppSchema(err) {
			respondJSON(w, []map[string]interface{}{})
			return
		}
		respondError(w, http.StatusInternalServerError, "Failed to fetch messages")
		return
	}
	respondRawJSON(w, body)
}

func (s *APIServer) handleWhatsAppPersistTest(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	now := time.Now().UTC()
	messageID := fmt.Sprintf("debug-%d", now.UnixNano())
	chatJID := "5548991138937@s.whatsapp.net"

	chatResp, err := database.UpsertToSupabase("whatsapp_chats", "chat_jid", map[string]interface{}{
		"chat_jid":         chatJID,
		"chat_type":        "direct",
		"display_name":     "Debug WhatsApp",
		"normalized_phone": "5548991138937",
		"country_code":     "55",
		"last_message":     "Teste de persistencia WhatsApp",
		"last_message_at":  now.Format(time.RFC3339),
	})
	if err != nil {
		respondJSONWithStatus(w, http.StatusBadGateway, map[string]interface{}{
			"ok":    false,
			"stage": "whatsapp_chats",
			"error": err.Error(),
		})
		return
	}

	var chat map[string]interface{}
	_ = json.Unmarshal(chatResp, &chat)
	chatID, _ := chat["id"].(string)

	messageResp, err := database.UpsertToSupabase("whatsapp_messages", "message_id", map[string]interface{}{
		"chat_id":             nilIfEmptyString(chatID),
		"message_id":          messageID,
		"chat_jid":            chatJID,
		"sender_jid":          "5548991138937@s.whatsapp.net",
		"sender_phone":        "5548991138937",
		"sender_country_code": "55",
		"sender_display_name": "Debug WhatsApp",
		"is_group":            false,
		"message_type":        "text",
		"text_content":        "Teste de persistencia WhatsApp",
		"mentioned_phones":    []string{},
		"received_at":         now.Format(time.RFC3339),
	})
	if err != nil {
		respondJSONWithStatus(w, http.StatusBadGateway, map[string]interface{}{
			"ok":    false,
			"stage": "whatsapp_messages",
			"error": err.Error(),
		})
		return
	}

	respondJSON(w, map[string]interface{}{
		"ok":         true,
		"chat":       json.RawMessage(chatResp),
		"message":    json.RawMessage(messageResp),
		"message_id": messageID,
	})
}

func (s *APIServer) handleWhatsAppGroupAction(w http.ResponseWriter, r *http.Request) {
	path := strings.TrimPrefix(r.URL.Path, "/api/whatsapp/groups/")
	parts := strings.Split(strings.Trim(path, "/"), "/")
	if len(parts) != 2 || parts[0] == "" {
		respondError(w, http.StatusNotFound, "Not found")
		return
	}

	chatID := parts[0]
	chat, err := fetchChatByID(chatID)
	if err != nil {
		respondError(w, http.StatusNotFound, "Group not found")
		return
	}
	groupJID, _ := chat["chat_jid"].(string)
	if groupJID == "" {
		respondError(w, http.StatusNotFound, "Group JID not found")
		return
	}

	switch parts[1] {
	case "participants":
		if r.Method != "GET" {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}
		query := "select=*&group_jid=eq." + url.QueryEscape(groupJID) + "&order=last_seen_at.desc&limit=500"
		body, err := database.FetchFromSupabase("whatsapp_group_participants", query)
		if err != nil {
			fmt.Printf("Failed to fetch WhatsApp group participants: %v\n", err)
			if isMissingWhatsAppSchema(err) {
				respondJSON(w, []map[string]interface{}{})
				return
			}
			respondError(w, http.StatusInternalServerError, "Failed to fetch participants")
			return
		}
		respondRawJSON(w, body)
	case "sync-participants":
		if r.Method != "POST" {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}
		client := s.instances.PrimaryConnectedClient()
		if client == nil || !client.IsConnected() {
			respondError(w, http.StatusServiceUnavailable, "WhatsApp client not connected")
			return
		}
		jid, err := types.ParseJID(groupJID)
		if err != nil {
			respondError(w, http.StatusBadRequest, "Invalid group JID")
			return
		}
		count, err := handler.SyncGroupParticipants(client, jid, true)
		if err != nil {
			respondError(w, http.StatusInternalServerError, "Failed to sync participants")
			return
		}
		respondJSON(w, map[string]int{"participants": count})
	default:
		respondError(w, http.StatusNotFound, "Not found")
	}
}

func (s *APIServer) handleWhatsAppMessageAction(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	path := strings.TrimPrefix(r.URL.Path, "/api/whatsapp/messages/")
	parts := strings.Split(strings.Trim(path, "/"), "/")
	if len(parts) != 2 || parts[1] != "create-request" || parts[0] == "" {
		respondError(w, http.StatusNotFound, "Not found")
		return
	}

	messageID := parts[0]
	body, err := database.FetchFromSupabase("whatsapp_messages", "select=*&id=eq."+url.QueryEscape(messageID)+"&limit=1")
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to fetch message")
		return
	}
	var messages []map[string]interface{}
	if err := json.Unmarshal(body, &messages); err != nil || len(messages) == 0 {
		respondError(w, http.StatusNotFound, "Message not found")
		return
	}
	msg := messages[0]
	text, _ := msg["text_content"].(string)
	senderName, _ := msg["sender_display_name"].(string)
	senderPhone, _ := msg["sender_phone"].(string)
	groupName, _ := msg["group_name"].(string)
	title := text
	if title == "" {
		title = "Demanda recebida pelo WhatsApp"
	}
	if len([]rune(title)) > 120 {
		title = string([]rune(title)[:120])
	}
	description := text
	if mediaURL, _ := msg["media_url"].(string); mediaURL != "" {
		description = strings.TrimSpace(description + "\n\nMidia: " + mediaURL)
	}
	if groupName != "" {
		description = strings.TrimSpace(description + "\n\nGrupo: " + groupName)
	}
	resp, err := database.SaveToSupabase("requests", map[string]interface{}{
		"title":           title,
		"description":     description,
		"category":        "request",
		"priority":        "medium",
		"status":          "open",
		"requester_name":  senderName,
		"requester_phone": senderPhone,
		"subject":         "WhatsApp",
		"resolution":      "Criada a partir da mensagem WhatsApp " + messageID,
	})
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to create request")
		return
	}
	requestID := extractID(resp)
	if requestID != "" {
		_, _ = database.UpsertToSupabase("whatsapp_messages", "id", map[string]interface{}{
			"id":                 messageID,
			"created_request_id": requestID,
		})
	}
	respondRawJSON(w, resp)
}

func (s *APIServer) handleAgents(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case "GET":
		body, err := database.FetchFromSupabase("service_agents", "select=*&order=created_at.asc")
		if err != nil {
			respondError(w, http.StatusInternalServerError, "Failed to fetch agents")
			return
		}
		respondRawJSON(w, body)
	case "POST":
		var req map[string]interface{}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			respondError(w, http.StatusBadRequest, "Invalid request body")
			return
		}
		if req["name"] == nil || req["type"] == nil {
			respondError(w, http.StatusBadRequest, "name and type are required")
			return
		}
		resp, err := database.SaveToSupabase("service_agents", req)
		if err != nil {
			respondError(w, http.StatusInternalServerError, "Failed to create agent")
			return
		}
		respondRawJSON(w, resp)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

func (s *APIServer) handleCloudStatus(w http.ResponseWriter, r *http.Request) {
	status := "not_configured"
	phoneNumberID := ""
	businessAcctID := ""
	apiVersion := ""
	webhookRegistered := s.webhookServer != nil
	missingFields := []string{}

	if officialapi.IsCloudAPIConfigured() {
		client := officialapi.GetClient()
		phoneNumberID = client.GetPhoneNumberID()
		businessAcctID = client.GetBusinessAcctID()
		apiVersion = client.GetConfig().APIVersion
		if s.cloudProvider != nil && s.cloudProvider.IsConnected() {
			status = "connected"
		} else {
			status = "configured"
		}
	} else {
		if strings.TrimSpace(os.Getenv("WHATSAPP_ACCESS_TOKEN")) == "" {
			missingFields = append(missingFields, "WHATSAPP_ACCESS_TOKEN")
		}
		if strings.TrimSpace(os.Getenv("WHATSAPP_PHONE_NUMBER_ID")) == "" {
			missingFields = append(missingFields, "WHATSAPP_PHONE_NUMBER_ID")
		}
		if strings.TrimSpace(os.Getenv("WHATSAPP_BUSINESS_ACCOUNT_ID")) == "" {
			missingFields = append(missingFields, "WHATSAPP_BUSINESS_ACCOUNT_ID")
		}
		if strings.TrimSpace(os.Getenv("WHATSAPP_WEBHOOK_VERIFY_TOKEN")) == "" {
			missingFields = append(missingFields, "WHATSAPP_WEBHOOK_VERIFY_TOKEN")
		}
		if strings.TrimSpace(os.Getenv("WHATSAPP_APP_SECRET")) == "" {
			missingFields = append(missingFields, "WHATSAPP_APP_SECRET")
		}
	}

	appURL := strings.TrimRight(strings.TrimSpace(os.Getenv("APP_URL")), "/")
	webhookURL := ""
	if appURL != "" {
		webhookURL = appURL + "/api/webhook/whatsapp"
	}

	respondJSON(w, map[string]interface{}{
		"status":              status,
		"provider":            "cloud_api",
		"phone_number_id":     phoneNumberID,
		"business_account_id": businessAcctID,
		"webhook_registered":  webhookRegistered,
		"version":             apiVersion,
		"configured":          status != "not_configured",
		"missing_fields":      missingFields,
		"webhook_url":         webhookURL,
	})
}

func (s *APIServer) handleCloudSendText(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	if s.cloudProvider == nil {
		respondError(w, http.StatusServiceUnavailable, "Cloud API not configured: set WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID")
		return
	}

	var req struct {
		To   string `json:"to"`
		Text string `json:"text"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}
	if req.To == "" || req.Text == "" {
		respondError(w, http.StatusBadRequest, "to and text are required")
		return
	}

	if err := s.cloudProvider.SendText(req.To, req.Text); err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to send message: "+err.Error())
		return
	}

	respondJSON(w, map[string]string{"status": "sent"})
}

func (s *APIServer) handleCloudSendMedia(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	if s.cloudProvider == nil {
		respondError(w, http.StatusServiceUnavailable, "Cloud API not configured")
		return
	}

	var req struct {
		To       string `json:"to"`
		MediaID  string `json:"media_id"`
		Caption  string `json:"caption,omitempty"`
		MimeType string `json:"mime_type"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}
	if req.To == "" || req.MediaID == "" {
		respondError(w, http.StatusBadRequest, "to and media_id are required")
		return
	}

	if err := s.cloudProvider.SendMedia(req.To, req.MediaID, req.Caption, req.MimeType); err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to send media: "+err.Error())
		return
	}

	respondJSON(w, map[string]string{"status": "sent"})
}

func (s *APIServer) handleCloudSendTemplate(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	if s.cloudProvider == nil {
		respondError(w, http.StatusServiceUnavailable, "Cloud API not configured")
		return
	}

	var req struct {
		To       string            `json:"to"`
		Name     string            `json:"name"`
		Language string            `json:"language"`
		Params   map[string]string `json:"params,omitempty"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}
	if req.To == "" || req.Name == "" {
		respondError(w, http.StatusBadRequest, "to and name are required")
		return
	}
	lang := req.Language
	if lang == "" {
		lang = "pt_BR"
	}

	tmpl := &officialapi.TemplateMessage{
		Name:     req.Name,
		Language: officialapi.TemplateLanguage{Code: lang},
	}

	if len(req.Params) > 0 {
		var bodyParams []officialapi.TemplateParameter
		for _, val := range req.Params {
			bodyParams = append(bodyParams, officialapi.TemplateParameter{
				Type: "text",
				Text: val,
			})
		}
		tmpl.Components = []officialapi.TemplateComponent{
			{
				Type:       "body",
				Parameters: bodyParams,
			},
		}
	}

	if err := s.cloudProvider.SendTemplate(req.To, tmpl); err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to send template: "+err.Error())
		return
	}

	respondJSON(w, map[string]string{"status": "sent"})
}

func (s *APIServer) handleCloudUploadMedia(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	if s.cloudProvider == nil {
		respondError(w, http.StatusServiceUnavailable, "Cloud API not configured")
		return
	}

	client := officialapi.GetClient()
	mediaManager := officialapi.NewMediaManager(client)

	var req struct {
		URL      string `json:"url"`
		MimeType string `json:"mime_type"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}
	if req.URL == "" {
		respondError(w, http.StatusBadRequest, "url is required")
		return
	}
	mimeType := req.MimeType
	if mimeType == "" {
		mimeType = "application/octet-stream"
	}

	mediaID, err := mediaManager.UploadMediaFromURL(req.URL, mimeType)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to upload media: "+err.Error())
		return
	}

	respondJSON(w, map[string]string{"media_id": mediaID})
}

func (s *APIServer) handleCloudTemplates(w http.ResponseWriter, r *http.Request) {
	if s.cloudProvider == nil {
		respondError(w, http.StatusServiceUnavailable, "Cloud API not configured")
		return
	}

	client := officialapi.GetClient()
	tm := officialapi.NewTemplateManager(client)

	switch r.Method {
	case "GET":
		templates, err := tm.ListTemplates()
		if err != nil {
			respondError(w, http.StatusInternalServerError, "Failed to list templates: "+err.Error())
			return
		}
		respondJSON(w, templates)

	case "POST":
		var req struct {
			Name     string `json:"name"`
			Language string `json:"language"`
			Category string `json:"category"`
			Body     string `json:"body"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			respondError(w, http.StatusBadRequest, "Invalid request body")
			return
		}
		if req.Name == "" || req.Body == "" {
			respondError(w, http.StatusBadRequest, "name and body are required")
			return
		}
		lang := req.Language
		if lang == "" {
			lang = "pt_BR"
		}
		category := req.Category
		if category == "" {
			category = "UTILITY"
		}
		if err := tm.CreateTemplate(req.Name, lang, category, req.Body); err != nil {
			respondError(w, http.StatusInternalServerError, "Failed to create template: "+err.Error())
			return
		}
		respondJSON(w, map[string]string{"status": "created"})

	case "DELETE":
		var req struct {
			Name string `json:"name"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			respondError(w, http.StatusBadRequest, "Invalid request body")
			return
		}
		if req.Name == "" {
			respondError(w, http.StatusBadRequest, "name is required")
			return
		}
		if err := tm.DeleteTemplate(req.Name); err != nil {
			respondError(w, http.StatusInternalServerError, "Failed to delete template: "+err.Error())
			return
		}
		respondJSON(w, map[string]string{"status": "deleted"})

	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

func (s *APIServer) handleCloudMediaDownload(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	if s.cloudProvider == nil {
		respondError(w, http.StatusServiceUnavailable, "Cloud API not configured")
		return
	}

	mediaID := strings.TrimPrefix(r.URL.Path, "/api/whatsapp/cloud/media/")
	if mediaID == "" {
		respondError(w, http.StatusBadRequest, "media_id is required")
		return
	}

	client := officialapi.GetClient()
	mediaManager := officialapi.NewMediaManager(client)

	data, mimeType, err := mediaManager.DownloadMedia(mediaID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to download media: "+err.Error())
		return
	}

	w.Header().Set("Content-Type", mimeType)
	w.Header().Set("Content-Length", fmt.Sprintf("%d", len(data)))
	w.WriteHeader(http.StatusOK)
	w.Write(data)
}

func sendCampaignAsync(req struct {
	Title   string   `json:"title"`
	Message string   `json:"message"`
	Targets []string `json:"targets"`
	UseAI   bool     `json:"use_ai"`
}) {
	fmt.Printf("Campaign '%s' queued for sending\n", req.Title)
}

func generateInsights() (string, error) {
	router := ai.GetRouter()

	messages := []ai.ChatMessage{
		{Role: "user", Content: `Analise os dados históricos de demandas de um gabinete político. 
		Gere 3 insights estratégicos sobre tendências de bairros, assuntos mais recorrentes e sentimento da população.
		Seja conciso e objetivo.`},
	}

	response, err := router.Chat(messages, "Você é um analista de dados políticos especializado em gabinetes de prefeitura.")
	if err != nil {
		return "", err
	}

	return response, nil
}

func respondJSON(w http.ResponseWriter, data interface{}) {
	respondJSONWithStatus(w, http.StatusOK, data)
}

func respondJSONWithStatus(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

func respondRawJSON(w http.ResponseWriter, body []byte) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write(body)
}

func respondError(w http.ResponseWriter, status int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(map[string]string{"error": message})
}

func isMissingWhatsAppSchema(err error) bool {
	if err == nil {
		return false
	}
	message := strings.ToLower(err.Error())
	return strings.Contains(message, "relation") && strings.Contains(message, "does not exist") ||
		strings.Contains(message, "could not find the table") ||
		strings.Contains(message, "could not find a relationship") ||
		strings.Contains(message, "column") && strings.Contains(message, "does not exist") ||
		strings.Contains(message, "schema cache")
}

func extractToken(r *http.Request) string {
	auth := r.Header.Get("Authorization")
	if auth == "" {
		return ""
	}
	parts := strings.Split(auth, " ")
	if len(parts) != 2 || parts[0] != "Bearer" {
		return ""
	}
	return parts[1]
}

func generateJWT(userID string) (string, error) {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": userID,
		"exp":     time.Now().Add(24 * time.Hour).Unix(),
		"iat":     time.Now().Unix(),
	})
	return token.SignedString([]byte(os.Getenv("JWT_SECRET")))
}

func extractID(resp []byte) string {
	var created struct {
		ID string `json:"id"`
	}
	if err := json.Unmarshal(resp, &created); err == nil {
		return created.ID
	}
	return ""
}

func fetchChatByID(id string) (map[string]interface{}, error) {
	body, err := database.FetchFromSupabase("whatsapp_chats", "select=*&id=eq."+url.QueryEscape(id)+"&limit=1")
	if err != nil {
		return nil, err
	}
	var chats []map[string]interface{}
	if err := json.Unmarshal(body, &chats); err != nil || len(chats) == 0 {
		return nil, fmt.Errorf("chat not found")
	}
	return chats[0], nil
}

func nilIfEmptyString(value string) interface{} {
	if strings.TrimSpace(value) == "" {
		return nil
	}
	return value
}

func valueIfConnected(connected bool, value string) interface{} {
	if !connected {
		return nil
	}
	return value
}
