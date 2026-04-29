package storage

import (
	"bytes"
	"fmt"
	"io"
	"net/http"
	"os"
	"time"
)

// UploadToSupabase envia um arquivo para o bucket meugabinete
func UploadToSupabase(fileContent []byte, fileName string, contentType string) (string, error) {
	supabaseURL := os.Getenv("SUPABASE_URL")
	supabaseKey := os.Getenv("SUPABASE_SERVICE_ROLE_KEY")
	bucketName := os.Getenv("SUPABASE_BUCKET")

	if supabaseURL == "" || supabaseKey == "" {
		return "", fmt.Errorf("configurações do Supabase ausentes")
	}

	// Estrutura de pasta: whatsapp/tipo/ano/mes/dia_timestamp_arquivo
	now := time.Now()
	remotePath := fmt.Sprintf("whatsapp/%d/%02d/%d_%s", 
		now.Year(), now.Month(), now.Unix(), fileName)

	url := fmt.Sprintf("%s/storage/v1/object/meugabinete/%s", supabaseURL, remotePath)

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(fileContent))
	if err != nil {
		return "", err
	}

	req.Header.Set("Authorization", "Bearer "+supabaseKey)
	req.Header.Set("Content-Type", contentType)
	req.Header.Set("x-upsert", "true")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		body, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("erro no upload (status %d): %s", resp.StatusCode, string(body))
	}

	// Retorna a URL pública (ajuste conforme a configuração do seu bucket)
	publicURL := fmt.Sprintf("%s/storage/v1/object/public/%s/%s", supabaseURL, bucketName, remotePath)
	return publicURL, nil
}
