package handler

import (
	"context"
	"fmt"
	"regexp"
	"strings"

	"github.com/fluowai/meugabinete/whatsapp-service/storage"
	"go.mau.fi/whatsmeow"
	"go.mau.fi/whatsmeow/proto/waE2E"
	"go.mau.fi/whatsmeow/types"
	"go.mau.fi/whatsmeow/types/events"
	"google.golang.org/protobuf/proto"
)

// NormalizePhone limpa o número e garante o formato +55...
func NormalizePhone(phone string) (normalized string, digits string) {
	re := regexp.MustCompile(`[^\d]`)
	digits = re.ReplaceAllString(phone, "")
	if !strings.HasPrefix(digits, "55") && len(digits) >= 10 {
		digits = "55" + digits
	}
	normalized = "+" + digits
	return
}

// SendReply envia uma resposta simples de texto
func SendReply(client *whatsmeow.Client, jid types.JID, text string) {
	_, err := client.SendMessage(context.Background(), jid, &waE2E.Message{
		Conversation: proto.String(text),
	})
	if err != nil {
		fmt.Printf("Erro ao enviar resposta: %v\n", err)
	}
}

// ProcessMessage cuida da lógica central ao receber uma mensagem
func ProcessMessage(client *whatsmeow.Client, v *events.Message) {
	// Ignorar mensagens enviadas por nós mesmos
	if v.Info.IsFromMe {
		return
	}

	sender := v.Info.Sender
	pushName := v.Info.PushName
	normalized, _ := NormalizePhone(sender.User)

	fmt.Printf(">>> Nova mensagem de %s (%s)\n", normalized, pushName)

	protocol := fmt.Sprintf("DEM-%d-%06d", 2026, 123) // Simulado: aqui viria do banco

	// 1. TRATAMENTO DE IMAGEM
	img := v.Message.GetImageMessage()
	if img != nil {
		data, err := client.Download(context.Background(), img)
		if err == nil {
			url, _ := storage.UploadToSupabase(data, "imagem.jpg", "image/jpeg")
			fmt.Println("Imagem salva:", url)
			
			msg := fmt.Sprintf("Olá %s! Recebemos sua imagem. Sua demanda foi registrada sob o protocolo: *%s*.", pushName, protocol)
			SendReply(client, sender, msg)
		}
	}

	// 2. TRATAMENTO DE ÁUDIO
	audio := v.Message.GetAudioMessage()
	if audio != nil {
		data, err := client.Download(context.Background(), audio)
		if err == nil {
			url, _ := storage.UploadToSupabase(data, "audio.ogg", "audio/ogg")
			fmt.Println("Áudio salvo:", url)
			
			msg := fmt.Sprintf("Olá %s! Recebemos seu áudio. Ele será transcrito e analisado.\n*Protocolo: %s*", pushName, protocol)
			SendReply(client, sender, msg)
		}
	}

	// 2. TRATAMENTO DE TEXTO
	text := v.Message.GetConversation()
	if text == "" && v.Message.GetExtendedTextMessage() != nil {
		text = v.Message.GetExtendedTextMessage().GetText()
	}

	if text != "" {
		fmt.Println("Texto recebido:", text)
		
		msg := fmt.Sprintf("Olá %s! Recebemos sua mensagem: \"%s\".\n\nSua demanda foi registrada e nossa equipe irá analisar.\n*Protocolo: %s*", pushName, text, protocol)
		SendReply(client, sender, msg)
	}
}
