package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/fluowai/meugabinete/whatsapp-service/ai"
	"github.com/fluowai/meugabinete/whatsapp-service/api"
	"github.com/fluowai/meugabinete/whatsapp-service/database"
	"github.com/fluowai/meugabinete/whatsapp-service/instances"
	"github.com/fluowai/meugabinete/whatsapp-service/official-api"
	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
	"go.mau.fi/whatsmeow/store/sqlstore"
	waLog "go.mau.fi/whatsmeow/util/log"
	_ "modernc.org/sqlite"
)

func main() {
	if err := godotenv.Load(); err != nil {
		fmt.Println("No .env file found, using environment variables")
	}

	_ = ai.GetRouter()
	fmt.Println("AI Router initialized")

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "file:whatsapp_sessions.db?_pragma=foreign_keys(1)"
	}

	driver := "postgres"
	if len(dbURL) >= 4 && dbURL[0:4] == "file" {
		driver = "sqlite"
	}

	dbLog := waLog.Stdout("Database", "INFO", false)
	container, err := sqlstore.New(context.Background(), driver, dbURL, dbLog)
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}

	instanceLog := waLog.Stdout("WhatsApp", "INFO", false)
	instanceManager, err := instances.NewManager(container, instanceLog)
	if err != nil {
		log.Fatalf("Failed to initialize WhatsApp instances: %v", err)
	}

	var apiOptions []api.APIServerOption

	if officialapi.IsCloudAPIConfigured() {
		cloudClient := officialapi.GetClient()
		ws := officialapi.NewWebhookServer(cloudClient)

		ws.OnMessage(func(msg *officialapi.WhatsAppMessage) {
			log.Printf("[Cloud API Webhook] Message from %s: type=%s text=%s",
				msg.From, msg.Type, msg.TextBody)

			chatJID := msg.From + "@s.whatsapp.net"
			phone := msg.From
			now := time.Now()

			chatID := upsertCloudChat(chatJID, phone, msg.SenderName, msg.TextBody, now)
			upsertCloudMessage(chatID, chatJID, phone, msg, now)
		})

		ws.OnStatus(func(status *officialapi.StatusUpdate) {
			log.Printf("[Cloud API Webhook] Status: message=%s status=%s", status.ID, status.Status)
		})

		fmt.Println("[Cloud API] Webhook handlers registered")
		apiOptions = append(apiOptions, api.WithWebhookServer(ws))
		if provider, err := officialapi.GetActiveProvider(); err == nil {
			apiOptions = append(apiOptions, api.WithCloudProvider(provider))
		}
	}
	apiServer := api.NewAPIServer(instanceManager, apiOptions...)

	allowedOrigins := os.Getenv("ALLOWED_ORIGINS")
	if allowedOrigins == "" {
		allowedOrigins = "http://localhost:3000,http://localhost:3003"
	}
	allowedList := withDefaultOrigins(splitOrigins(allowedOrigins))

	handlerWithMiddleware := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		if isAllowed(origin, allowedList) {
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Access-Control-Allow-Credentials", "true")
		}

		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		w.Header().Set("Access-Control-Max-Age", "86400")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		apiServer.ServeHTTP(w, r)
	})

	srv := &http.Server{
		Addr:         ":" + getPort(),
		Handler:      handlerWithMiddleware,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	go func() {
		fmt.Printf("API REST starting on port %s\n", getPort())
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("HTTP server failed: %v", err)
		}
	}()

	c := make(chan os.Signal, 1)
	signal.Notify(c, os.Interrupt, syscall.SIGTERM)
	<-c

	fmt.Println("Shutting down...")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Printf("HTTP server shutdown error: %v", err)
	}

	instanceManager.Close()
	if err := container.Close(); err != nil {
		log.Printf("Failed to close WhatsApp session database: %v", err)
	}
	fmt.Println("Shutdown complete")
}

func getPort() string {
	port := os.Getenv("PORT")
	if port == "" {
		port = "3001"
	}
	return port
}

func splitOrigins(s string) []string {
	var result []string
	for _, origin := range split(s, ",") {
		trimmed := trim(origin)
		if trimmed != "" {
			result = append(result, trimmed)
		}
	}
	return result
}

func withDefaultOrigins(origins []string) []string {
	defaults := []string{
		"https://gabinete.consultio.com.br",
		"https://meugabinete-production.up.railway.app",
		"http://localhost:3000",
		"http://localhost:3003",
	}

	for _, origin := range defaults {
		if !containsOrigin(origins, origin) {
			origins = append(origins, origin)
		}
	}

	return origins
}

func containsOrigin(origins []string, target string) bool {
	for _, origin := range origins {
		if origin == target {
			return true
		}
	}
	return false
}

func split(s, sep string) []string {
	var result []string
	start := 0
	for i := 0; i <= len(s)-len(sep); i++ {
		if s[i:i+len(sep)] == sep {
			result = append(result, s[start:i])
			start = i + len(sep)
			i += len(sep) - 1
		}
	}
	result = append(result, s[start:])
	return result
}

func trim(s string) string {
	start := 0
	end := len(s)
	for start < end && (s[start] == ' ' || s[start] == '\t' || s[start] == '\n' || s[start] == '\r') {
		start++
	}
	for end > start && (s[end-1] == ' ' || s[end-1] == '\t' || s[end-1] == '\n' || s[end-1] == '\r') {
		end--
	}
	return s[start:end]
}

func isAllowed(origin string, allowed []string) bool {
	if origin == "" {
		return false
	}
	for _, a := range allowed {
		if a == "*" || a == origin {
			return true
		}
	}
	return false
}

func upsertCloudChat(chatJID, phone, senderName, lastMessage string, receivedAt time.Time) string {
	displayName := senderName
	if displayName == "" {
		displayName = phone
	}
	payload := map[string]interface{}{
		"chat_jid":         chatJID,
		"chat_type":        "direct",
		"display_name":     displayName,
		"normalized_phone": phone,
		"country_code":     "55",
		"last_message":     lastMessage,
		"last_message_at":  receivedAt.Format(time.RFC3339),
	}
	resp, err := database.UpsertToSupabase("whatsapp_chats", "chat_jid", payload)
	if err != nil {
		log.Printf("Failed to upsert Cloud API chat: %v", err)
		return ""
	}
	var created struct {
		ID string `json:"id"`
	}
	if err := json.Unmarshal(resp, &created); err == nil {
		return created.ID
	}
	return ""
}

func upsertCloudMessage(chatID, chatJID, phone string, msg *officialapi.WhatsAppMessage, receivedAt time.Time) {
	if msg == nil {
		return
	}
	messageType := msg.Type
	if messageType == "" {
		messageType = "text"
	}
	textContent := msg.TextBody
	if textContent == "" && msg.MediaID != "" {
		textContent = fmt.Sprintf("[%s recebida]", messageType)
	}
	payload := map[string]interface{}{
		"chat_id":             nilIfEmpty(chatID),
		"message_id":          msg.ID,
		"chat_jid":            chatJID,
		"sender_jid":          msg.From + "@s.whatsapp.net",
		"sender_phone":        phone,
		"sender_country_code": "55",
		"sender_display_name": msg.SenderName,
		"is_group":            false,
		"message_type":        messageType,
		"text_content":        nilIfEmpty(textContent),
		"media_url":           nilIfEmpty(msg.MediaID),
		"media_mime_type":     nilIfEmpty(msg.MediaMimeType),
		"media_filename":      nilIfEmpty(msg.MediaFilename),
		"received_at":         receivedAt.Format(time.RFC3339),
	}
	_, err := database.UpsertToSupabase("whatsapp_messages", "message_id", payload)
	if err != nil {
		log.Printf("Failed to upsert Cloud API message: %v", err)
	}
}

func nilIfEmpty(value string) interface{} {
	if strings.TrimSpace(value) == "" {
		return nil
	}
	return value
}
