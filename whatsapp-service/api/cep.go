package api

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"regexp"
	"strings"
	"time"
)

type CEPAddress struct {
	CEP          string `json:"cep"`
	Address      string `json:"address"`
	Complement   string `json:"complement"`
	Neighborhood string `json:"neighborhood"`
	City         string `json:"city"`
	State        string `json:"state"`
	IBGE         string `json:"ibge,omitempty"`
	DDD          string `json:"ddd,omitempty"`
	Source       string `json:"source"`
}

func (s *APIServer) handleCEPLookup(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	cep := strings.Trim(strings.TrimPrefix(r.URL.Path, "/api/cep/"), "/")
	address, err := lookupCEP(r.Context(), cep)
	if err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}
	respondJSON(w, address)
}

func lookupCEP(ctx context.Context, input string) (*CEPAddress, error) {
	cep := onlyDigits(input)
	if len(cep) != 8 {
		return nil, fmt.Errorf("CEP deve conter 8 digitos")
	}

	provider := strings.ToLower(strings.TrimSpace(os.Getenv("CEP_FREE_PROVIDER")))
	if provider == "" {
		provider = "viacep"
	}

	var providers []func(context.Context, string) (*CEPAddress, error)
	if provider == "brasilapi" {
		providers = []func(context.Context, string) (*CEPAddress, error){lookupBrasilAPICEP, lookupViaCEP}
	} else {
		providers = []func(context.Context, string) (*CEPAddress, error){lookupViaCEP, lookupBrasilAPICEP}
	}

	var lastErr error
	for _, lookup := range providers {
		address, err := lookup(ctx, cep)
		if err == nil {
			return address, nil
		}
		lastErr = err
	}
	if lastErr != nil {
		return nil, lastErr
	}
	return nil, fmt.Errorf("CEP nao encontrado")
}

func lookupViaCEP(ctx context.Context, cep string) (*CEPAddress, error) {
	var payload struct {
		CEP         string `json:"cep"`
		Logradouro  string `json:"logradouro"`
		Complemento string `json:"complemento"`
		Bairro      string `json:"bairro"`
		Localidade  string `json:"localidade"`
		UF          string `json:"uf"`
		IBGE        string `json:"ibge"`
		DDD         string `json:"ddd"`
		Erro        bool   `json:"erro"`
	}
	if err := fetchJSON(ctx, "https://viacep.com.br/ws/"+cep+"/json/", &payload); err != nil {
		return nil, err
	}
	if payload.Erro || strings.TrimSpace(payload.CEP) == "" {
		return nil, fmt.Errorf("CEP nao encontrado")
	}
	return &CEPAddress{
		CEP:          payload.CEP,
		Address:      payload.Logradouro,
		Complement:   payload.Complemento,
		Neighborhood: payload.Bairro,
		City:         payload.Localidade,
		State:        payload.UF,
		IBGE:         payload.IBGE,
		DDD:          payload.DDD,
		Source:       "viacep",
	}, nil
}

func lookupBrasilAPICEP(ctx context.Context, cep string) (*CEPAddress, error) {
	var payload struct {
		CEP          string `json:"cep"`
		State        string `json:"state"`
		City         string `json:"city"`
		Neighborhood string `json:"neighborhood"`
		Street       string `json:"street"`
		Service      string `json:"service"`
	}
	if err := fetchJSON(ctx, "https://brasilapi.com.br/api/cep/v2/"+cep, &payload); err != nil {
		return nil, err
	}
	if strings.TrimSpace(payload.CEP) == "" {
		return nil, fmt.Errorf("CEP nao encontrado")
	}
	source := payload.Service
	if source == "" {
		source = "brasilapi"
	}
	return &CEPAddress{
		CEP:          payload.CEP,
		Address:      payload.Street,
		Neighborhood: payload.Neighborhood,
		City:         payload.City,
		State:        payload.State,
		Source:       source,
	}, nil
}

func fetchJSON(ctx context.Context, endpoint string, target interface{}) error {
	ctx, cancel := context.WithTimeout(ctx, 8*time.Second)
	defer cancel()

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint, nil)
	if err != nil {
		return err
	}
	req.Header.Set("Accept", "application/json")
	req.Header.Set("User-Agent", "meugabinete-whatsapp-service/1.0")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode == http.StatusNotFound {
		return fmt.Errorf("CEP nao encontrado")
	}
	if resp.StatusCode >= 300 {
		return fmt.Errorf("servico de CEP retornou status %d", resp.StatusCode)
	}
	return json.NewDecoder(resp.Body).Decode(target)
}

func onlyDigits(input string) string {
	re := regexp.MustCompile(`[^\d]`)
	return re.ReplaceAllString(input, "")
}
