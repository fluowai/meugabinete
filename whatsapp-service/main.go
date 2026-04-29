package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"

	"github.com/fluowai/meugabinete/whatsapp-service/handler"
	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
	"go.mau.fi/whatsmeow"
	"go.mau.fi/whatsmeow/store/sqlstore"
	"go.mau.fi/whatsmeow/types/events"
	waLog "go.mau.fi/whatsmeow/util/log"
)

var latestQR string

func main() {
	godotenv.Load()

	// Servidor de Health Check e QR Code para o Railway
	go func() {
		mux := http.NewServeMux()
		
		mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Access-Control-Allow-Origin", "*")
			fmt.Fprintf(w, "WhatsApp Service is Running")
		})
		
		mux.HandleFunc("/qr", func(w http.ResponseWriter, r *http.Request) {
			if latestQR == "" {
				w.WriteHeader(http.StatusNotFound)
				fmt.Fprintf(w, "QR Code não gerado ou já conectado")
				return
			}
			fmt.Fprintf(w, latestQR)
		})

		// Middleware de CORS Global
		handlerWithCORS := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Access-Control-Allow-Origin", "*")
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
			
			if r.Method == "OPTIONS" {
				w.WriteHeader(http.StatusOK)
				return
			}
			
			mux.ServeHTTP(w, r)
		})

		port := os.Getenv("PORT")
		if port == "" {
			port = "8080"
		}
		fmt.Printf("Servidor HTTP rodando na porta %s\n", port)
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
	client := whatsmeow.NewClient(deviceStore, clientLog)

	client.AddEventHandler(func(evt interface{}) {
		switch v := evt.(type) {
		case *events.Message:
			handler.ProcessMessage(client, v)
		}
	})

	if client.Store.ID == nil {
		qrChan, _ := client.GetQRChannel(context.Background())
		err = client.Connect()
		if err != nil {
			panic(err)
		}
		for evt := range qrChan {
			if evt.Event == "code" {
				latestQR = evt.Code
				fmt.Println(">>> NOVO QR CODE GERADO")
			}
		}
	} else {
		err = client.Connect()
		if err != nil {
			panic(err)
		}
		latestQR = ""
	}

	c := make(chan os.Signal, 1)
	signal.Notify(c, os.Interrupt, syscall.SIGTERM)
	<-c
	client.Disconnect()
}
