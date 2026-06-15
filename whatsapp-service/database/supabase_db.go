package database

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"regexp"
	"strings"
	"time"
)

var validTableName = regexp.MustCompile(`^[a-zA-Z_][a-zA-Z0-9_]*$`)
var validColumnName = regexp.MustCompile(`^[a-zA-Z_][a-zA-Z0-9_]*$`)

func validateTableName(name string) error {
	if !validTableName.MatchString(name) {
		return fmt.Errorf("nome de tabela inválido: %s", name)
	}
	return nil
}

// SaveToSupabase envia um JSON para qualquer tabela do Supabase
func SaveToSupabase(table string, data interface{}) ([]byte, error) {
	return saveToSupabase(table, "", data)
}

func UpsertToSupabase(table string, conflictTarget string, data interface{}) ([]byte, error) {
	return saveToSupabase(table, conflictTarget, data)
}

func saveToSupabase(table string, conflictTarget string, data interface{}) ([]byte, error) {
	if err := validateTableName(table); err != nil {
		return nil, err
	}
	supabaseURL := os.Getenv("SUPABASE_URL")
	supabaseKey := os.Getenv("SUPABASE_SERVICE_ROLE_KEY")
	if supabaseURL == "" || supabaseKey == "" {
		return nil, fmt.Errorf("SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios")
	}

	url := fmt.Sprintf("%s/rest/v1/%s", supabaseURL, table)
	if conflictTarget != "" {
		url = fmt.Sprintf("%s?on_conflict=%s", url, conflictTarget)
	}

	jsonData, err := json.Marshal(data)
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, err
	}

	req.Header.Set("Authorization", "Bearer "+supabaseKey)
	req.Header.Set("apikey", supabaseKey)
	req.Header.Set("Content-Type", "application/json")
	if conflictTarget != "" {
		req.Header.Set("Prefer", "resolution=merge-duplicates,return=representation")
	} else {
		req.Header.Set("Prefer", "return=representation")
	}

	client := &http.Client{Timeout: 15 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 300 {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("erro no supabase (%d): %s", resp.StatusCode, string(body))
	}

	// Retorna o corpo da resposta (útil para pegar o ID gerado)
	var responseBody []interface{}
	json.NewDecoder(resp.Body).Decode(&responseBody)

	if len(responseBody) > 0 {
		return json.Marshal(responseBody[0])
	}

	return nil, nil
}

func FetchFromSupabase(table string, query string) ([]byte, error) {
	if err := validateTableName(table); err != nil {
		return nil, err
	}
	supabaseURL := os.Getenv("SUPABASE_URL")
	supabaseKey := os.Getenv("SUPABASE_SERVICE_ROLE_KEY")
	if supabaseURL == "" || supabaseKey == "" {
		return nil, fmt.Errorf("SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios")
	}

	url := fmt.Sprintf("%s/rest/v1/%s", supabaseURL, table)
	if strings.TrimSpace(query) != "" {
		// Rejeita queries com caracteres potencialmente perigosos
		disallowed := regexp.MustCompile(`[;'"\-\-]`)
		if disallowed.MatchString(query) {
			return nil, fmt.Errorf("query contém caracteres não permitidos")
		}
		url += "?" + query
	}

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Authorization", "Bearer "+supabaseKey)
	req.Header.Set("apikey", supabaseKey)
	req.Header.Set("Accept", "application/json")

	client := &http.Client{Timeout: 15 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode >= 300 {
		return nil, fmt.Errorf("erro no supabase (%d): %s", resp.StatusCode, string(body))
	}

	return body, nil
}
