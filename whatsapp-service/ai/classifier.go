package ai

import (
	"context"
	"encoding/json"
	"fmt"
	"os"

	"github.com/google/generative-ai-go/genai"
	"google.golang.org/api/option"
)

type ClassificationResult struct {
	Resumo                   string `json:"resumo"`
	Categoria                string `json:"categoria"`
	Subcategoria             string `json:"subcategoria"`
	Prioridade               string `json:"prioridade"`
	Sentimento               string `json:"sentimento"`
	BairroDetectado         string `json:"bairro_detectado"`
	EnderecoDetectado       string `json:"endereco_detectado"`
	NomeDetectado           string `json:"nome_detectado"`
	NecessitaRespostaUrgente bool   `json:"necessita_resposta_urgente"`
	SugestaoResposta         string `json:"sugestao_resposta"`
}

// ClassifyDemand usa Gemini para classificar a mensagem (pode ser trocado por Groq/OpenAI)
func ClassifyDemand(message string) (*ClassificationResult, error) {
	ctx := context.Background()
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

	// Extrair o JSON da resposta (simulado para o exemplo)
	// Em produção, deve-se limpar a string para garantir que é um JSON puro
	var result ClassificationResult
	// Erro proposital se não for JSON válido (para tratar depois)
	err = json.Unmarshal([]byte(resp.Candidates[0].Content.Parts[0].(genai.Text)), &result)
	
	return &result, nil
}
