package ai

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
)

type OpenAIProvider struct {
	apiKey string
	model  string
}

func NewOpenAIProvider(apiKey string) *OpenAIProvider {
	return &OpenAIProvider{
		apiKey: apiKey,
		model:  getEnvOrDefault("OPENAI_MODEL", "gpt-4o-mini"),
	}
}

func (o *OpenAIProvider) GetProviderName() string {
	return "openai"
}

func (o *OpenAIProvider) ClassifyDemand(ctx context.Context, message string) (*ClassificationResult, error) {
	prompt := fmt.Sprintf(`Você é um assistente de gabinete de um Vice-Prefeito.
Analise a mensagem do cidadão abaixo e retorne APENAS um JSON válido seguindo este formato:
{
  "resumo": "Resumo curto da mensagem",
  "categoria": "Infraestrutura|Saúde|Educação|Segurança|Assistência Social|Outros",
  "subcategoria": "Detalhe específico",
  "prioridade": "Baixa|Média|Alta|Urgente",
  "sentimento": "Reclamação|Elogio|Sugestão|Dúvida|Outros",
  "bairro_detectado": "Nome do bairro ou vazio",
  "endereco_detectado": "Endereço ou vazio",
  "nome_detectado": "Nome ou vazio",
  "necessita_resposta_urgente": false,
  "sugestao_resposta": "Sugestão de resposta educada"
}

Mensagem: %s`, message)

	messages := []ChatMessage{
		{Role: "system", Content: "Você é um classificador de demandas de gabinete político. Retorne apenas JSON válido."},
		{Role: "user", Content: prompt},
	}

	response, err := o.chatCompletion(ctx, messages)
	if err != nil {
		return nil, err
	}

	return ParseJSONResponse(response)
}

func (o *OpenAIProvider) Chat(ctx context.Context, messages []ChatMessage, systemPrompt string) (string, error) {
	allMessages := []ChatMessage{{Role: "system", Content: systemPrompt}}
	allMessages = append(allMessages, messages...)
	return o.chatCompletion(ctx, allMessages)
}

func (o *OpenAIProvider) Summarize(ctx context.Context, text string) (string, error) {
	messages := []ChatMessage{
		{Role: "system", Content: "Resuma o texto a seguir de forma concisa e objetiva."},
		{Role: "user", Content: text},
	}
	return o.chatCompletion(ctx, messages)
}

func (o *OpenAIProvider) chatCompletion(ctx context.Context, messages []ChatMessage) (string, error) {
	reqBody := map[string]interface{}{
		"model":       o.model,
		"messages":    messages,
		"temperature": 0.3,
		"max_tokens": 1024,
	}

	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		return "", err
	}

	req, err := http.NewRequestWithContext(ctx, "POST", "https://api.openai.com/v1/chat/completions", strings.NewReader(string(jsonData)))
	if err != nil {
		return "", err
	}

	req.Header.Set("Authorization", "Bearer "+o.apiKey)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("openai API error: %d", resp.StatusCode)
	}

	var result struct {
		Choices []struct {
			Message struct {
				Content string `json:"content"`
			} `json:"message"`
		} `json:"choices"`
	}

	err = json.NewDecoder(resp.Body).Decode(&result)
	if err != nil {
		return "", err
	}

	if len(result.Choices) == 0 {
		return "", fmt.Errorf("nenhuma resposta da OpenAI")
	}

	return result.Choices[0].Message.Content, nil
}
