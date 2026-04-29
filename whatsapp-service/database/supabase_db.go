package database

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
)

// SaveToSupabase envia um JSON para qualquer tabela do Supabase
func SaveToSupabase(table string, data interface{}) ([]byte, error) {
	supabaseURL := os.Getenv("SUPABASE_URL")
	supabaseKey := os.Getenv("SUPABASE_SERVICE_ROLE_KEY")

	url := fmt.Sprintf("%s/rest/v1/%s", supabaseURL, table)
	
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
	req.Header.Set("Prefer", "return=representation") // Para retornar o objeto criado (com ID e Protocolo)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 300 {
		return nil, fmt.Errorf("erro no supabase (%d)", resp.StatusCode)
	}

	// Retorna o corpo da resposta (útil para pegar o ID gerado)
	var responseBody []interface{}
	json.NewDecoder(resp.Body).Decode(&responseBody)
	
	if len(responseBody) > 0 {
		return json.Marshal(responseBody[0])
	}

	return nil, nil
}
