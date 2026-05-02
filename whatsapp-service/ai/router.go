package ai

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
)

type AIProvider string

const (
	ProviderGroq   AIProvider = "groq"
	ProviderGemini AIProvider = "gemini"
	ProviderOpenAI AIProvider = "openai"
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

type ChatMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type AIInterface interface {
	ClassifyDemand(ctx context.Context, message string) (*ClassificationResult, error)
	Chat(ctx context.Context, messages []ChatMessage, systemPrompt string) (string, error)
	Summarize(ctx context.Context, text string) (string, error)
	GetProviderName() string
}

type AIRouter struct {
	providers map[AIProvider]AIInterface
	active    AIProvider
}

func NewAIRouter() *AIRouter {
	router := &AIRouter{
		providers: make(map[AIProvider]AIInterface),
		active:    AIProvider(os.Getenv("AI_PROVIDER")),
	}

	if router.active == "" {
		router.active = ProviderGemini
	}

	router.registerProviders()
	return router
}

func (r *AIRouter) registerProviders() {
	if groqKey := os.Getenv("GROQ_API_KEY"); groqKey != "" && groqKey != "SUA_GROQ_KEY_AQUI" {
		r.providers[ProviderGroq] = NewGroqProvider(groqKey)
	}
	if geminiKey := os.Getenv("GEMINI_API_KEY"); geminiKey != "" && geminiKey != "SUA_GEMINI_KEY_AQUI" {
		r.providers[ProviderGemini] = NewGeminiProvider(geminiKey)
	}
	if openaiKey := os.Getenv("OPENAI_API_KEY"); openaiKey != "" && openaiKey != "SUA_OPENAI_KEY_AQUI" {
		r.providers[ProviderOpenAI] = NewOpenAIProvider(openaiKey)
	}
}

func (r *AIRouter) SetActiveProvider(p AIProvider) {
	r.active = p
}

func (r *AIRouter) GetActiveProvider() AIProvider {
	return r.active
}

func (r *AIRouter) GetProvider(p AIProvider) (AIInterface, error) {
	provider, ok := r.providers[p]
	if !ok {
		return nil, fmt.Errorf("provedor %s não configurado", p)
	}
	return provider, nil
}

func (r *AIRouter) ClassifyDemand(message string) (*ClassificationResult, error) {
	provider, err := r.GetProvider(r.active)
	if err != nil {
		return r.fallbackClassify(message)
	}

	ctx := context.Background()
	result, err := provider.ClassifyDemand(ctx, message)
	if err != nil {
		return r.fallbackClassify(message)
	}
	return result, nil
}

func (r *AIRouter) Chat(messages []ChatMessage, systemPrompt string) (string, error) {
	provider, err := r.GetProvider(r.active)
	if err != nil {
		return "", err
	}
	return provider.Chat(context.Background(), messages, systemPrompt)
}

func (r *AIRouter) Summarize(text string) (string, error) {
	provider, err := r.GetProvider(r.active)
	if err != nil {
		return "", err
	}
	return provider.Summarize(context.Background(), text)
}

func (r *AIRouter) fallbackClassify(message string) (*ClassificationResult, error) {
	for p, provider := range r.providers {
		if p == r.active {
			continue
		}
		ctx := context.Background()
		result, err := provider.ClassifyDemand(ctx, message)
		if err == nil {
			r.active = p
			return result, nil
		}
	}
	return nil, fmt.Errorf("nenhum provedor de IA disponível")
}

func (r *AIRouter) GetAvailableProviders() []AIProvider {
	var available []AIProvider
	for p := range r.providers {
		available = append(available, p)
	}
	return available
}

var globalRouter *AIRouter

func GetRouter() *AIRouter {
	if globalRouter == nil {
		globalRouter = NewAIRouter()
	}
	return globalRouter
}

func ClassifyDemand(message string) (*ClassificationResult, error) {
	return GetRouter().ClassifyDemand(message)
}

func ParseJSONResponse(raw string) (*ClassificationResult, error) {
	cleaned := extractJSON(raw)
	var result ClassificationResult
	err := json.Unmarshal([]byte(cleaned), &result)
	return &result, err
}

func extractJSON(s string) string {
	start := -1
	end := -1
	braceCount := 0
	
	for i, c := range s {
		if c == '{' {
			if braceCount == 0 {
				start = i
			}
			braceCount++
		} else if c == '}' {
			braceCount--
			if braceCount == 0 {
				end = i + 1
				break
			}
		}
	}
	
	if start >= 0 && end > start {
		return s[start:end]
	}
	return s
}
