package main

import (
	"context"
	"fmt"
	"os"
	"os/signal"
	"syscall"

	_ "github.com/mattn/go-sqlite3"
	"go.mau.fi/whatsmeow"
	"go.mau.fi/whatsmeow/store/sqlstore"
	"go.mau.fi/whatsmeow/types/events"
	waLog "go.mau.fi/whatsmeow/util/log"
)

func main() {
	// 1. Configuração de Log e Banco de Sessão Local (SQLite)
	dbLog := waLog.Stdout("Database", "DEBUG", true)
	container, err := sqlstore.New("sqlite3", "file:whatsapp_sessions.db?_foreign_keys=on", dbLog)
	if err != nil {
		panic(err)
	}

	deviceStore, err := container.GetFirstDevice()
	if err != nil {
		panic(err)
	}

	clientLog := waLog.Stdout("Client", "DEBUG", true)
	client := whatsmeow.NewClient(deviceStore, clientLog)

	// 2. Handler de Eventos (Onde as mensagens chegam)
	client.AddEventHandler(func(evt interface{}) {
		switch v := evt.(type) {
		case *events.Message:
			// Aqui chamaremos a lógica de salvar no Supabase e IA
			fmt.Printf("Mensagem recebida de %s: %s\n", v.Info.Sender.String(), v.Message.GetConversation())
			
			// TODO: Integrar com Supabase e IA Classifier
		}
	})

	// 3. Conexão e Gerenciamento de QR Code
	if client.Store.ID == nil {
		qrChan, _ := client.GetQRChannel(context.Background())
		err = client.Connect()
		if err != nil {
			panic(err)
		}
		for evt := range qrChan {
			if evt.Event == "code" {
				// Este código deve ser enviado para o seu frontend MeuGabinete
				fmt.Println(">>> QR CODE DISPONÍVEL:", evt.Code)
			}
		}
	} else {
		err = client.Connect()
		if err != nil {
			panic(err)
		}
	}

	// 4. Manter o serviço rodando
	c := make(chan os.Signal, 1)
	signal.Notify(c, os.Interrupt, syscall.SIGTERM)
	<-c
	client.Disconnect()
}
