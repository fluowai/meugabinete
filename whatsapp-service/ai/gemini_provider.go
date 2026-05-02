package ai

import (
	"context"
	"fmt"

	"github.com/google/generative-ai-go/genai"
	"google.golang.org/api/option"
)

type GeminiProvider struct {
	apiKey string
	model  string
}

func NewGeminiProvider(apiKey string) *GeminiProvider {
	return &GeminiProvider{
		apiKey: apiKey,
		model:  getEnvOrDefault("GEMINI_MODEL", "gemini-pro"),
	}
}

func (g *GeminiProvider) GetProviderName() string {
	return "gemini"
}

func (g *GeminiProvider) ClassifyDemand(ctx context.Context, message string) (*ClassificationResult, error) {
	client, err := genai.NewClient(ctx, option.WithAPIKey(g.apiKey))
	if err != nil {
		return nil, err
	}
	defer client.Close()

	model := client.GenerativeModel(g.model)

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

	resp, err := model.GenerateContent(ctx, genai.Text(prompt))
	if err != nil {
		return nil, err
	}

	if len(resp.Candidates) == 0 {
		return nil, fmt.Errorf("nenhum resultado da IA")
	}

	rawText := resp.Candidates[0].Content.Parts[0].(genai.Text)
	return ParseJSONResponse(string(rawText))
}

func (g *GeminiProvider) Chat(ctx context.Context, messages []ChatMessage, systemPrompt string) (string, error) {
	client, err := genai.NewClient(ctx, option.WithAPIKey(g.apiKey))
	if err != nil {
		return "", err
	}
	defer client.Close()

	model := client.GenerativeModel(g.model)
	
	fullPrompt := systemPrompt + "\n\n"
	for _, msg := range messages {
		fullPrompt += fmt.Sprintf("%s: %s\n", msg.Role, msg.Content)
	}

	resp, err := model.GenerateContent(ctx, genai.Text(fullPrompt))
	if err != nil {
		return "", err
	}

	if len(resp.Candidates) == 0 {
		return "", fmt.Errorf("nenhuma resposta do Gemini")
	}

	return string(resp.Candidates[0].Content.Parts[0].(genai.Text)), nil
}

func (g *GeminiProvider) Summarize(ctx context.Context, text string) (string, error) {
	client, err := genai.NewClient(ctx, option.WithAPIKey(g.apiKey))
	if err != nil {
		return "", err
	}
	defer client.Close()

	model := client.GenerativeModel(g.model)
	prompt := fmt.Sprintf("Resuma o texto a seguir de forma concisa e objetiva:\n\n%s", text)

	resp, err := model.GenerateContent(ctx, genai.Text(prompt))
	if err != nil {
		return "", err
	}

	if len(resp.Candidates) == 0 {
		return "", fmt.Errorf("nenhuma resposta do Gemini")
	}

	return string(resp.Candidates[0].Content.Parts[0].(genai.Text)), nil
}
