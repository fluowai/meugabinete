package ai

import (
	"context"
	"fmt"
	"os"

	"github.com/google/generative-ai-go/genai"
	"google.golang.org/api/option"
)

// ClassifyWithGemini usa Gemini diretamente (usado pelo GeminiProvider)
func ClassifyWithGemini(ctx context.Context, message string) (*ClassificationResult, error) {
	apiKey := os.Getenv("GEMINI_API_KEY")
	if apiKey == "" {
		return nil, fmt.Errorf("GEMINI_API_KEY não configurada")
	}

	client, err := genai.NewClient(ctx, option.WithAPIKey(apiKey))
	if err != nil {
		return nil, err
	}
	defer client.Close()

	model := client.GenerativeModel("gemini-pro")
	
	prompt := fmt.Sprintf(`
		Você é um assistente de gabinete de um Vice-Prefeito.
		Analise a mensagem do cidadão abaixo e retorne um JSON válido seguindo este formato:
		{
		  "resumo": "Resumo curto",
		  "categoria": "Infraestrutura",
		  "subcategoria": "Buraco",
		  "prioridade": "Alta",
		  "sentimento": "Reclamação",
		  "bairro_detectado": "Centro",
		  "endereco_detectado": "Rua X, 100",
		  "nome_detectado": "João",
		  "necessita_resposta_urgente": false,
		  "sugestao_resposta": "Olá João, recebemos..."
		}

		Mensagem: %s
	`, message)

	resp, err := model.GenerateContent(ctx, genai.Text(prompt))
	if err != nil {
		return nil, err
	}

	if len(resp.Candidates) == 0 {
		return nil, fmt.Errorf("nenhum resultado da IA")
	}

	part := resp.Candidates[0].Content.Parts[0]
	text, ok := part.(genai.Text)
	if !ok {
		return nil, fmt.Errorf("unexpected response type from AI: %T", part)
	}
	return ParseJSONResponse(string(text))
}
