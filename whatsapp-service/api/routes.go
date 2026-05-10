package api

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/fluowai/meugabinete/whatsapp-service/ai"
	"github.com/fluowai/meugabinete/whatsapp-service/campaign"
	"github.com/golang-jwt/jwt/v5"
	"go.mau.fi/whatsmeow"
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
	s.router.HandleFunc("/api/qr", s.requireAuth(s.handleQR))
	s.router.HandleFunc("/api/ai/providers", s.requireAuth(s.handleAIProviders))
	s.router.HandleFunc("/api/ai/classify", s.requireAuth(s.handleClassify))
	s.router.HandleFunc("/api/ai/chat", s.requireAuth(s.handleAIChat))
	s.router.HandleFunc("/api/campaigns/send", s.requireAuth(s.handleSendCampaign))
	s.router.HandleFunc("/api/insights/summary", s.requireAuth(s.handleInsights))
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

		_, err := jwt.Parse(token, func(t *jwt.Token) (interface{}, error) {
			if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method")
			}
			return []byte(jwtSecret), nil
		})

		if err != nil {
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
