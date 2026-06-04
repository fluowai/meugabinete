package api

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
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
	"github.com/golang-jwt/jwt/v5"
	"go.mau.fi/whatsmeow"
	"go.mau.fi/whatsmeow/types"
)

type APIServer struct {
	router         *http.ServeMux
	whatsappClient *whatsmeow.Client
	rateLimiter    *RateLimiter
}

type RateLimiter struct {
	mu       sync.Mutex
	requests map[string][]time.Time
	limit    int
	window   time.Duration
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

func NewAPIServer(client *whatsmeow.Client) *APIServer {
	s := &APIServer{
		router:         http.NewServeMux(),
		whatsappClient: client,
		rateLimiter:    NewRateLimiter(100, time.Minute),
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
	s.router.HandleFunc("/api/campaigns/send", s.requireAuth(s.handleSendCampaign))
	s.router.HandleFunc("/api/insights/summary", s.requireAuth(s.handleInsights))
	s.router.HandleFunc("/api/whatsapp/connections", s.requireAuth(s.handleWhatsAppConnections))
	s.router.HandleFunc("/api/whatsapp/connections/", s.requireAuth(s.handleWhatsAppConnectionAction))
	s.router.HandleFunc("/api/whatsapp/chats", s.requireAuth(s.handleWhatsAppChats))
	s.router.HandleFunc("/api/whatsapp/chats/", s.requireAuth(s.handleWhatsAppChatMessages))
	s.router.HandleFunc("/api/whatsapp/groups/", s.requireAuth(s.handleWhatsAppGroupAction))
	s.router.HandleFunc("/api/whatsapp/messages", s.requireAuth(s.handleWhatsAppMessages))
	s.router.HandleFunc("/api/whatsapp/messages/", s.requireAuth(s.handleWhatsAppMessageAction))
	s.router.HandleFunc("/api/agents", s.requireAuth(s.handleAgents))
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
		if jwtSecret == "" || jwtSecret == "meugabinete-secret-key-change-in-prod" {
			respondError(w, http.StatusUnauthorized, "Authentication service unavailable")
			return
		}

		parsedToken, err := jwt.Parse(token, func(t *jwt.Token) (interface{}, error) {
			if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method")
			}
			// Attempt to base64 decode if the secret looks like base64
			decoded, decodeErr := base64.StdEncoding.DecodeString(jwtSecret)
			if decodeErr == nil && len(decoded) > 0 {
				return decoded, nil
			}
			return []byte(jwtSecret), nil
		})

		if err != nil || parsedToken == nil || !parsedToken.Valid {
			respondError(w, http.StatusUnauthorized, "Invalid or expired token")
			return
		}

		next(w, r)
	}
}

func getClientIP(r *http.Request) string {
	forwarded := r.Header.Get("X-Forwarded-For")
	if forwarded != "" {
		return strings.Split(forwarded, ",")[0]
	}
	ip := r.Header.Get("X-Real-IP")
	if ip != "" {
		return ip
	}
	return strings.Split(r.RemoteAddr, ":")[0]
}

func (s *APIServer) handleHealth(w http.ResponseWriter, r *http.Request) {
	status := map[string]interface{}{
		"status":  "ok",
		"service": "whatsapp-service",
		"time":    time.Now().UTC().Format(time.RFC3339),
	}

	if s.whatsappClient != nil && s.whatsappClient.IsConnected() {
		status["whatsapp"] = "connected"
	} else {
		status["whatsapp"] = "disconnected"
	}

	respondJSON(w, status)
}

func (s *APIServer) handleQR(w http.ResponseWriter, r *http.Request) {
	respondJSON(w, map[string]string{"qr": os.Getenv("LATEST_QR")})
}

func (s *APIServer) handleWhatsAppConnections(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	snapshot := s.connectionSnapshot()
	if _, err := database.UpsertToSupabase("whatsapp_connections", "instance_key", snapshot); err != nil {
		fmt.Printf("Failed to upsert WhatsApp connection snapshot: %v\n", err)
	}

	body, err := database.FetchFromSupabase("whatsapp_connections", "select=*&order=updated_at.desc")
	if err != nil {
		respondJSON(w, []map[string]interface{}{snapshot})
		return
	}
	respondRawJSON(w, body)
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
		respondJSON(w, map[string]string{"qr": os.Getenv("LATEST_QR")})
	case "sync-groups":
		if r.Method != "POST" {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}
		if s.whatsappClient == nil || !s.whatsappClient.IsConnected() {
			respondError(w, http.StatusServiceUnavailable, "WhatsApp client not connected")
			return
		}
		groups, participants, err := handler.SyncJoinedGroups(s.whatsappClient)
		if err != nil {
			respondError(w, http.StatusInternalServerError, "Failed to sync groups")
			return
		}
		respondJSON(w, map[string]int{"groups": groups, "participants": participants})
	default:
		respondError(w, http.StatusNotFound, "Not found")
	}
}

func (s *APIServer) connectionSnapshot() map[string]interface{} {
	status := "disconnected"
	connected := false
	phone := ""
	jid := ""
	pushName := ""
	now := time.Now().UTC().Format(time.RFC3339)

	if s.whatsappClient != nil {
		pushName = s.whatsappClient.Store.PushName
		if s.whatsappClient.Store.ID != nil {
			jid = s.whatsappClient.Store.ID.String()
			_, phone = handler.NormalizePhone(s.whatsappClient.Store.ID.User)
		}
		if s.whatsappClient.IsConnected() {
			status = "connected"
			connected = true
		}
	}

	return map[string]interface{}{
		"instance_key":      "default",
		"name":              "Instancia principal",
		"provider":          "whatsmeow",
		"status":            status,
		"connected":         connected,
		"jid":               nilIfEmptyString(jid),
		"phone":             nilIfEmptyString(phone),
		"push_name":         nilIfEmptyString(pushName),
		"last_seen_at":      now,
		"last_connected_at": valueIfConnected(connected, now),
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

	if s.whatsappClient == nil {
		respondError(w, http.StatusServiceUnavailable, "WhatsApp client not initialized")
		return
	}

	if !s.whatsappClient.IsConnected() {
		respondError(w, http.StatusServiceUnavailable, "WhatsApp client not connected")
		return
	}

	go func() {
		sent, failed := campaign.SendBulk(context.Background(), s.whatsappClient, req.Targets, req.Message)
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
	query := "select=*&order=last_message_at.desc.nullslast&limit=200"
	if chatType == "direct" || chatType == "group" {
		query += "&chat_type=eq." + url.QueryEscape(chatType)
	}
	body, err := database.FetchFromSupabase("whatsapp_chats", query)
	if err != nil {
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
		respondError(w, http.StatusInternalServerError, "Failed to fetch messages")
		return
	}
	respondRawJSON(w, body)
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
			respondError(w, http.StatusInternalServerError, "Failed to fetch participants")
			return
		}
		respondRawJSON(w, body)
	case "sync-participants":
		if r.Method != "POST" {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}
		if s.whatsappClient == nil || !s.whatsappClient.IsConnected() {
			respondError(w, http.StatusServiceUnavailable, "WhatsApp client not connected")
			return
		}
		jid, err := types.ParseJID(groupJID)
		if err != nil {
			respondError(w, http.StatusBadRequest, "Invalid group JID")
			return
		}
		count, err := handler.SyncGroupParticipants(s.whatsappClient, jid, true)
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
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
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
