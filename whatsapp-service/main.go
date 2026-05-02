package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"

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
	godotenv.Load()

	// Inicializa o AI Router
	_ = ai.GetRouter()
	fmt.Println("AI Router inicializado")

	// Servidor HTTP com API REST completa
	go func() {
		apiServer := api.NewAPIServer(whatsappClient)
		
		// Middleware de CORS Global
		handlerWithCORS := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Access-Control-Allow-Origin", "*")
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
			
			if r.Method == "OPTIONS" {
				w.WriteHeader(http.StatusOK)
				return
			}
			
			apiServer.ServeHTTP(w, r)
		})

		port := os.Getenv("PORT")
		if port == "" {
			port = "3001"
		}
		fmt.Printf("API REST rodando na porta %s\n", port)
		http.ListenAndServe(":"+port, handlerWithCORS)
	}()

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "file:whatsapp_sessions.db?_pragma=foreign_keys(1)"
	}

	driver := "postgres"
	if len(dbURL) > 4 && dbURL[0:4] == "file" {
		driver = "sqlite"
	}

	dbLog := waLog.Stdout("Database", "DEBUG", true)
	container, err := sqlstore.New(context.Background(), driver, dbURL, dbLog)
	if err != nil {
		panic(err)
	}

	deviceStore, err := container.GetFirstDevice(context.Background())
	if err != nil {
		panic(err)
	}

	clientLog := waLog.Stdout("Client", "DEBUG", true)
	whatsappClient = whatsmeow.NewClient(deviceStore, clientLog)

	whatsappClient.AddEventHandler(func(evt interface{}) {
		switch v := evt.(type) {
		case *events.Message:
			handler.ProcessMessage(whatsappClient, v)
		}
	})

	if whatsappClient.Store.ID == nil {
		qrChan, _ := whatsappClient.GetQRChannel(context.Background())
		err = whatsappClient.Connect()
		if err != nil {
			panic(err)
		}
		for evt := range qrChan {
			if evt.Event == "code" {
				latestQR = evt.Code
				os.Setenv("LATEST_QR", latestQR)
				fmt.Println(">>> NOVO QR CODE GERADO")
			}
		}
	} else {
		err = whatsappClient.Connect()
		if err != nil {
			panic(err)
		}
		latestQR = ""
		os.Setenv("LATEST_QR", "")
	}

	c := make(chan os.Signal, 1)
	signal.Notify(c, os.Interrupt, syscall.SIGTERM)
	<-c
	whatsappClient.Disconnect()
}
