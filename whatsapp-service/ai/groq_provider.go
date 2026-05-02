package ai

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"os"
)

type GroqProvider struct {
	apiKey string
	model  string
}

func NewGroqProvider(apiKey string) *GroqProvider {
	return &GroqProvider{
		apiKey: apiKey,
		model:  getEnvOrDefault("GROQ_MODEL", "llama3-70b-8192"),
	}
}

func (g *GroqProvider) GetProviderName() string {
	return "groq"
}

func (g *GroqProvider) ClassifyDemand(ctx context.Context, message string) (*ClassificationResult, error) {
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

	response, err := g.chatCompletion(ctx, messages)
	if err != nil {
		return nil, err
	}

	return ParseJSONResponse(response)
}

func (g *GroqProvider) Chat(ctx context.Context, messages []ChatMessage, systemPrompt string) (string, error) {
	allMessages := []ChatMessage{{Role: "system", Content: systemPrompt}}
	allMessages = append(allMessages, messages...)
	return g.chatCompletion(ctx, allMessages)
}

func (g *GroqProvider) Summarize(ctx context.Context, text string) (string, error) {
	messages := []ChatMessage{
		{Role: "system", Content: "Resuma o texto a seguir de forma concisa e objetiva."},
		{Role: "user", Content: text},
	}
	return g.chatCompletion(ctx, messages)
}

func (g *GroqProvider) chatCompletion(ctx context.Context, messages []ChatMessage) (string, error) {
	reqBody := map[string]interface{}{
		"model":    g.model,
		"messages": messages,
		"temperature": 0.3,
		"max_tokens": 1024,
	}

	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		return "", err
	}

	req, err := http.NewRequestWithContext(ctx, "POST", "https://api.groq.com/openai/v1/chat/completions", strings.NewReader(string(jsonData)))
	if err != nil {
		return "", err
	}

	req.Header.Set("Authorization", "Bearer "+g.apiKey)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("groq API error: %d", resp.StatusCode)
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
		return "", fmt.Errorf("nenhuma resposta do Groq")
	}

	return result.Choices[0].Message.Content, nil
}

func getEnvOrDefault(key, defaultVal string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return defaultVal
}
