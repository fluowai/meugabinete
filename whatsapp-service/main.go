package main

import (
	"context"
	"fmt"
	"os"
	"os/signal"
	"syscall"

	"github.com/fluowai/meugabinete/whatsapp-service/handler"
	"github.com/joho/godotenv"
	_ "github.com/lib/pq" // Driver Postgres para produção
	"go.mau.fi/whatsmeow"
	"go.mau.fi/whatsmeow/store/sqlstore"
	"go.mau.fi/whatsmeow/types/events"
	waLog "go.mau.fi/whatsmeow/util/log"
)

func main() {
	godotenv.Load()

	// 1. Configuração do Banco de Dados (Postgres do Supabase)
	// No Railway, a variável DATABASE_URL deve ser configurada
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		// Fallback para SQLite se não houver Postgres (para testes locais)
		dbURL = "file:whatsapp_sessions.db?_pragma=foreign_keys(1)"
	}

	driver := "postgres"
	if dbURL[0:4] == "file" {
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
				fmt.Println(">>> QR CODE:", evt.Code)
			}
		}
	} else {
		err = client.Connect()
		if err != nil {
			panic(err)
		}
	}

	c := make(chan os.Signal, 1)
	signal.Notify(c, os.Interrupt, syscall.SIGTERM)
	<-c
	client.Disconnect()
}
