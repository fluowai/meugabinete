package handler

import (
	"fmt"
	"regexp"
	"strings"

	"go.mau.fi/whatsmeow/types/events"
)

// NormalizePhone limpa o número e garante o formato +55...
func NormalizePhone(phone string) (normalized string, digits string) {
	// Remove tudo que não é número
	re := regexp.MustCompile(`[^\d]`)
	digits = re.ReplaceAllString(phone, "")

	// Se não tiver o prefixo 55, adiciona (regra Brasil)
	if !strings.HasPrefix(digits, "55") && len(digits) >= 10 {
		digits = "55" + digits
	}

	normalized = "+" + digits
	return
}

// ProcessMessage cuida da lógica central ao receber uma mensagem
func ProcessMessage(v *events.Message) {
	sender := v.Info.Sender.User
	pushName := v.Info.PushName
	
	normalized, digits := NormalizePhone(sender)
	
	fmt.Printf("Processando mensagem de: %s (%s)\n", normalized, pushName)
	
	// TODO: 
	// 1. Verificar se o cidadão existe no Supabase (usando digits ou normalized)
	// 2. Se não existir, criar com o pushName
	// 3. Salvar a mensagem na tabela whatsapp_messages
	// 4. Se tiver mídia, fazer upload para o bucket 'meugabinete'
	// 5. Criar a demanda e chamar a IA
}
