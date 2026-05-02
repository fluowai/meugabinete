package api

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strings"

	"github.com/fluowai/meugabinete/whatsapp-service/ai"
	"github.com/fluowai/meugabinete/whatsapp-service/campaign"
	"github.com/golang-jwt/jwt/v5"
	"go.mau.fi/whatsmeow"
)

type APIServer struct {
	router        *http.ServeMux
	whatsappClient *whatsmeow.Client
}

func NewAPIServer(client *whatsmeow.Client) *APIServer {
	s := &APIServer{
		router:        http.NewServeMux(),
		whatsappClient: client,
	}
	s.registerRoutes()
	return s
}

func (s *APIServer) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	s.router.ServeHTTP(w, r)
}

func (s *APIServer) registerRoutes() {
	s.router.HandleFunc("/api/health", s.handleHealth)
	s.router.HandleFunc("/api/qr", s.handleQR)
	s.router.HandleFunc("/api/ai/providers", s.handleAIProviders)
	s.router.HandleFunc("/api/ai/classify", s.handleClassify)
	s.router.HandleFunc("/api/ai/chat", s.handleAIChat)
	s.router.HandleFunc("/api/campaigns/send", s.handleSendCampaign)
	s.router.HandleFunc("/api/insights/summary", s.handleInsights)
}

func (s *APIServer) handleHealth(w http.ResponseWriter, r *http.Request) {
	respondJSON(w, map[string]string{"status": "ok", "service": "whatsapp-service"})
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
	
	json.NewDecoder(r.Body).Decode(&req)
	if req.Message == "" {
		http.Error(w, "message is required", http.StatusBadRequest)
		return
	}

	result, err := ai.ClassifyDemand(req.Message)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
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
	
	json.NewDecoder(r.Body).Decode(&req)
	
	router := ai.GetRouter()
	if req.Provider != "" {
		router.SetActiveProvider(ai.AIProvider(req.Provider))
	}

	response, err := router.Chat(req.Messages, req.SystemPrompt)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
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

	json.NewDecoder(r.Body).Decode(&req)
	
	if req.Title == "" || req.Message == "" || len(req.Targets) == 0 {
		http.Error(w, "title, message and targets are required", http.StatusBadRequest)
		return
	}

	if s.whatsappClient == nil {
		http.Error(w, "WhatsApp client not initialized", http.StatusServiceUnavailable)
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
		http.Error(w, err.Error(), http.StatusInternalServerError)
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
	w.Header().Set("Access-Control-Allow-Origin", "*")
	json.NewEncoder(w).Encode(data)
}

func authMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		token := extractToken(r)
		if token == "" {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
		next(w, r)
	}
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
	})
	return token.SignedString([]byte(os.Getenv("JWT_SECRET")))
}
