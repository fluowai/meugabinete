package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/fluowai/meugabinete/whatsapp-service/ai"
	"github.com/fluowai/meugabinete/whatsapp-service/api"
	"github.com/fluowai/meugabinete/whatsapp-service/handler"
	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
	"go.mau.fi/whatsmeow"
	"go.mau.fi/whatsmeow/store/sqlstore"
	"go.mau.fi/whatsmeow/types/events"
	waLog "go.mau.fi/whatsmeow/util/log"
)

var latestQR string
var whatsappClient *whatsmeow.Client

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

	deviceStore, err := container.GetFirstDevice(context.Background())
	if err != nil {
		log.Fatalf("Failed to get device store: %v", err)
	}

	clientLog := waLog.Stdout("Client", "INFO", false)
	whatsappClient = whatsmeow.NewClient(deviceStore, clientLog)

	whatsappClient.AddEventHandler(func(evt interface{}) {
		switch v := evt.(type) {
		case *events.Message:
			handler.ProcessMessage(whatsappClient, v)
		}
	})

	if whatsappClient.Store.ID == nil {
		qrChan, err := whatsappClient.GetQRChannel(context.Background())
		if err != nil {
			log.Fatalf("Failed to get QR channel: %v", err)
		}

		err = whatsappClient.Connect()
		if err != nil {
			log.Fatalf("Failed to connect to WhatsApp: %v", err)
		}

		go func() {
			for evt := range qrChan {
				if evt.Event == "code" {
					latestQR = evt.Code
					os.Setenv("LATEST_QR", latestQR)
					fmt.Println(">>> QR Code generated")
				} else if evt.Event == "success" {
					fmt.Println(">>> WhatsApp connected successfully")
					latestQR = ""
					os.Setenv("LATEST_QR", "")
				} else if evt.Event == "timeout" {
					fmt.Println(">>> QR Code scan timed out")
					latestQR = ""
					os.Setenv("LATEST_QR", "")
				}
			}
		}()
	} else {
		err = whatsappClient.Connect()
		if err != nil {
			log.Fatalf("Failed to connect to WhatsApp: %v", err)
		}
		latestQR = ""
		os.Setenv("LATEST_QR", "")
		fmt.Println("WhatsApp client connected (existing session)")
	}

	apiServer := api.NewAPIServer(whatsappClient)

	allowedOrigins := os.Getenv("ALLOWED_ORIGINS")
	if allowedOrigins == "" {
		allowedOrigins = "http://localhost:3000"
	}
	allowedList := splitOrigins(allowedOrigins)

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

	whatsappClient.Disconnect()
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
