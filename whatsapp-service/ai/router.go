package ai

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"
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

type LLMProviderRecord struct {
	Provider     string `json:"provider"`
	ApiKey       string `json:"api_key"`
	DefaultModel string `json:"default_model"`
	IsActive     bool   `json:"is_active"`
}

func (r *AIRouter) registerProviders() {
	// First load from environment variables as default
	if groqKey := os.Getenv("GROQ_API_KEY"); groqKey != "" && groqKey != "SUA_GROQ_KEY_AQUI" {
		r.providers[ProviderGroq] = NewGroqProvider(groqKey)
	}
	if geminiKey := os.Getenv("GEMINI_API_KEY"); geminiKey != "" && geminiKey != "SUA_GEMINI_KEY_AQUI" {
		r.providers[ProviderGemini] = NewGeminiProvider(geminiKey)
	}
	if openaiKey := os.Getenv("OPENAI_API_KEY"); openaiKey != "" && openaiKey != "SUA_OPENAI_KEY_AQUI" {
		r.providers[ProviderOpenAI] = NewOpenAIProvider(openaiKey)
	}

	// Dynamic override from Supabase table "llm_providers"
	// Import is handled dynamically via lazy initialization or direct import
	// To prevent import cycles, we can invoke FetchFromSupabase via a helper
	// or perform a standard HTTP request to Supabase rest interface
	supabaseURL := os.Getenv("SUPABASE_URL")
	supabaseKey := os.Getenv("SUPABASE_SERVICE_ROLE_KEY")
	if supabaseURL != "" && supabaseKey != "" {
		url := fmt.Sprintf("%s/rest/v1/llm_providers", supabaseURL)
		req, err := http.NewRequest("GET", url, nil)
		if err == nil {
			req.Header.Set("Authorization", "Bearer "+supabaseKey)
			req.Header.Set("apikey", supabaseKey)
			req.Header.Set("Accept", "application/json")
			
			client := &http.Client{Timeout: 10 * time.Second}
			resp, err := client.Do(req)
			if err == nil && resp.StatusCode < 300 {
				defer resp.Body.Close()
				var records []LLMProviderRecord
				if err := json.NewDecoder(resp.Body).Decode(&records); err == nil {
					for _, rec := range records {
						if rec.ApiKey != "" {
							switch AIProvider(rec.Provider) {
							case ProviderGroq:
								r.providers[ProviderGroq] = NewGroqProvider(rec.ApiKey)
							case ProviderGemini:
								r.providers[ProviderGemini] = NewGeminiProvider(rec.ApiKey)
							case ProviderOpenAI:
								r.providers[ProviderOpenAI] = NewOpenAIProvider(rec.ApiKey)
							}
							if rec.IsActive {
								r.active = AIProvider(rec.Provider)
							}
						}
					}
				}
			}
		}
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

type AgentDocRecord struct {
	Title   string `json:"title"`
	Content string `json:"content"`
}

func (r *AIRouter) Chat(messages []ChatMessage, systemPrompt string) (string, error) {
	provider, err := r.GetProvider(r.active)
	if err != nil {
		return "", err
	}

	// Dynamic RAG Injection
	ragContext := ""
	supabaseURL := os.Getenv("SUPABASE_URL")
	supabaseKey := os.Getenv("SUPABASE_SERVICE_ROLE_KEY")
	if supabaseURL != "" && supabaseKey != "" {
		url := fmt.Sprintf("%s/rest/v1/agent_documents?select=title,content", supabaseURL)
		req, err := http.NewRequest("GET", url, nil)
		if err == nil {
			req.Header.Set("Authorization", "Bearer "+supabaseKey)
			req.Header.Set("apikey", supabaseKey)
			req.Header.Set("Accept", "application/json")
			
			client := &http.Client{Timeout: 8 * time.Second}
			resp, err := client.Do(req)
			if err == nil && resp.StatusCode < 300 {
				defer resp.Body.Close()
				var records []AgentDocRecord
				if err := json.NewDecoder(resp.Body).Decode(&records); err == nil && len(records) > 0 {
					var docsText []string
					for _, rec := range records {
						docsText = append(docsText, fmt.Sprintf("Documento de Estudo [%s]:\n%s", rec.Title, rec.Content))
					}
					ragContext = strings.Join(docsText, "\n\n")
				}
			}
		}
	}

	if ragContext != "" {
		systemPrompt = fmt.Sprintf("%s\n\nBase de Conhecimento RAG (Use estritamente as regras/manuais abaixo se relevantes para responder):\n%s", systemPrompt, ragContext)
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
