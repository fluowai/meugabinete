package handler

import (
	"fmt"
	"regexp"
	"strings"

	"github.com/fluowai/meugabinete/whatsapp-service/storage"
	"go.mau.fi/whatsmeow"
	"go.mau.fi/whatsmeow/types/events"
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

// ProcessMessage cuida da lógica central ao receber uma mensagem
func ProcessMessage(client *whatsmeow.Client, v *events.Message) {
	sender := v.Info.Sender.User
	pushName := v.Info.PushName
	normalized, _ := NormalizePhone(sender)

	fmt.Printf(">>> Nova mensagem de %s (%s)\n", normalized, pushName)

	// 1. TRATAMENTO DE IMAGEM
	img := v.Message.GetImageMessage()
	if img != nil {
		fmt.Println("Baixando imagem...")
		data, err := client.Download(img)
		if err == nil {
			url, err := storage.UploadToSupabase(data, "imagem.jpg", "image/jpeg")
			if err == nil {
				fmt.Println("Imagem salva no Supabase:", url)
				// TODO: Salvar URL na tabela demands vinculada ao cidadão
			}
		}
	}

	// 2. TRATAMENTO DE ÁUDIO
	audio := v.Message.GetAudioMessage()
	if audio != nil {
		fmt.Println("Baixando áudio...")
		data, err := client.Download(audio)
		if err == nil {
			url, err := storage.UploadToSupabase(data, "audio.ogg", "audio/ogg")
			if err == nil {
				fmt.Println("Áudio salvo no Supabase:", url)
				// TODO: Salvar para futura transcrição
			}
		}
	}

	// 3. TRATAMENTO DE TEXTO SIMPLES
	text := v.Message.GetConversation()
	if text != "" {
		fmt.Println("Texto recebido:", text)
		// TODO: Chamar ai.ClassifyDemand(text)
	}
}
