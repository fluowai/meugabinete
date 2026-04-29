package handler

import (
	"context"
	"encoding/json"
	"fmt"
	"regexp"
	"strings"

	"github.com/fluowai/meugabinete/whatsapp-service/ai"
	"github.com/fluowai/meugabinete/whatsapp-service/database"
	"github.com/fluowai/meugabinete/whatsapp-service/storage"
	"go.mau.fi/whatsmeow"
	"go.mau.fi/whatsmeow/proto/waE2E"
	"go.mau.fi/whatsmeow/types"
	"go.mau.fi/whatsmeow/types/events"
	"google.golang.org/protobuf/proto"
)

func NormalizePhone(phone string) (normalized string, digits string) {
	re := regexp.MustCompile(`[^\d]`)
	digits = re.ReplaceAllString(phone, "")
	if !strings.HasPrefix(digits, "55") && len(digits) >= 10 {
		digits = "55" + digits
	}
	normalized = "+" + digits
	return
}

func SendReply(client *whatsmeow.Client, jid types.JID, text string) {
	_, err := client.SendMessage(context.Background(), jid, &waE2E.Message{
		Conversation: proto.String(text),
	})
	if err != nil {
		fmt.Printf("Erro ao enviar resposta: %v\n", err)
	}
}

func ProcessMessage(client *whatsmeow.Client, v *events.Message) {
	if v.Info.IsFromMe {
		return
	}

	sender := v.Info.Sender
	pushName := v.Info.PushName
	normalized, digits := NormalizePhone(sender.User)

	fmt.Printf(">>> Processando demanda de %s\n", pushName)

	// 1. GARANTIR CIDADÃO NO BANCO (Opcional: Log no console para evitar erro de unused)
	citizenData := map[string]interface{}{
		"name":         pushName,
		"phone":        normalized,
		"phone_digits": digits,
		"whatsapp_jid": sender.String(),
		"push_name":    pushName,
	}
	// Tenta salvar o cidadão (ignora erro se já existir)
	database.SaveToSupabase("citizens", citizenData)

	// 2. CAPTURAR CONTEÚDO E MÍDIA
	var content string
	var mediaURL string

	text := v.Message.GetConversation()
	if text == "" && v.Message.GetExtendedTextMessage() != nil {
		text = v.Message.GetExtendedTextMessage().GetText()
	}
	content = text

	img := v.Message.GetImageMessage()
	if img != nil {
		data, err := client.Download(context.Background(), img)
		if err == nil {
			mediaURL, _ = storage.UploadToSupabase(data, "imagem.jpg", "image/jpeg")
			if content == "" {
				content = "[Imagem recebida]"
			}
		}
	}

	// 3. CLASSIFICAÇÃO POR IA
	classification, _ := ai.ClassifyDemand(content)
	
	// 4. CRIAR DEMANDA NO BANCO
	demandData := map[string]interface{}{
		"original_message": content,
		"summary_ai":       classification.Resumo,
		"category":         classification.Categoria,
		"subcategory":      classification.Subcategoria,
		"priority":         classification.Prioridade,
		"sentiment":        classification.Sentimento,
		"status":           "Nova",
		"channel":          "whatsapp",
		"media_url":        mediaURL, // Agora a variável é utilizada
	}

	resp, err := database.SaveToSupabase("demands", demandData)
	
	var finalProtocol string = "DEM-2026-AUTO"
	if err == nil {
		var createdDemand struct {
			Protocol string `json:"protocol"`
		}
		json.Unmarshal(resp, &createdDemand)
		if createdDemand.Protocol != "" {
			finalProtocol = createdDemand.Protocol
		}
	}

	// 5. RESPOSTA AO CIDADÃO
	reply := fmt.Sprintf("Olá *%s*! Recebemos sua mensagem.\n\n*Resumo IA:* %s\n*Categoria:* %s\n\nSua demanda foi registrada com sucesso!\n*Protocolo:* %s", 
		pushName, classification.Resumo, classification.Categoria, finalProtocol)
	
	if classification.SugestaoResposta != "" {
		reply += "\n\n" + classification.SugestaoResposta
	}

	SendReply(client, sender, reply)
}
