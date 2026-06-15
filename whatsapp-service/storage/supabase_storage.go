package storage

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

var allowedMimeTypes = map[string]bool{
	"image/jpeg":         true,
	"image/png":          true,
	"image/webp":         true,
	"image/gif":          true,
	"audio/ogg":          true,
	"audio/mpeg":         true,
	"audio/mp4":          true,
	"audio/aac":          true,
	"audio/wav":          true,
	"audio/webm":         true,
	"video/mp4":          true,
	"video/ogg":          true,
	"video/webm":         true,
	"application/pdf":    true,
	"application/msword": true,
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document": true,
	"application/vnd.ms-excel": true,
	"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": true,
	"text/plain":       true,
	"application/json": true,
}

const maxFileSize int64 = 50 * 1024 * 1024 // 50MB

func validateFile(content []byte, contentType string) error {
	if len(content) == 0 {
		return fmt.Errorf("arquivo vazio")
	}
	if int64(len(content)) > maxFileSize {
		return fmt.Errorf("arquivo excede o tamanho maximo de 50MB")
	}
	if !allowedMimeTypes[contentType] {
		return fmt.Errorf("tipo de arquivo não permitido: %s", contentType)
	}
	return nil
}

// UploadToSupabase envia um arquivo para o bucket meugabinete
func UploadToSupabase(fileContent []byte, fileName string, contentType string) (string, error) {
	if isMinIOConfigured() {
		return uploadToMinIO(fileContent, fileName, contentType)
	}
	return uploadToSupabaseStorage(fileContent, fileName, contentType)
}

func isMinIOConfigured() bool {
	return strings.TrimSpace(os.Getenv("MINIO_ENDPOINT")) != "" &&
		strings.TrimSpace(os.Getenv("MINIO_ACCESS_KEY")) != "" &&
		strings.TrimSpace(os.Getenv("MINIO_SECRET_KEY")) != "" &&
		strings.TrimSpace(os.Getenv("MINIO_BUCKET")) != ""
}

func uploadToMinIO(fileContent []byte, fileName string, contentType string) (string, error) {
	if err := validateFile(fileContent, contentType); err != nil {
		return "", err
	}

	endpoint := normalizeMinIOEndpoint(os.Getenv("MINIO_ENDPOINT"))
	accessKey := strings.TrimSpace(os.Getenv("MINIO_ACCESS_KEY"))
	secretKey := strings.TrimSpace(os.Getenv("MINIO_SECRET_KEY"))
	bucketName := strings.TrimSpace(os.Getenv("MINIO_BUCKET"))
	useSSL := strings.ToLower(strings.TrimSpace(os.Getenv("MINIO_USE_SSL"))) != "false"

	client, err := minio.New(endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(accessKey, secretKey, ""),
		Secure: useSSL,
	})
	if err != nil {
		return "", err
	}

	now := time.Now()
	remotePath := fmt.Sprintf("whatsapp/%d/%02d/%02d/%d_%s",
		now.Year(), now.Month(), now.Day(), now.Unix(), fileName)

	ctx, cancel := context.WithTimeout(context.Background(), 45*time.Second)
	defer cancel()

	exists, err := client.BucketExists(ctx, bucketName)
	if err != nil {
		return "", fmt.Errorf("erro ao verificar bucket MinIO: %w", err)
	}
	if !exists {
		return "", fmt.Errorf("bucket MinIO nao encontrado: %s", bucketName)
	}

	_, err = client.PutObject(ctx, bucketName, remotePath, bytes.NewReader(fileContent), int64(len(fileContent)), minio.PutObjectOptions{
		ContentType: contentType,
	})
	if err != nil {
		return "", fmt.Errorf("erro no upload MinIO: %w", err)
	}

	return minIOPublicURL(endpoint, bucketName, remotePath, useSSL), nil
}

func normalizeMinIOEndpoint(endpoint string) string {
	endpoint = strings.TrimSpace(endpoint)
	endpoint = strings.TrimPrefix(endpoint, "https://")
	endpoint = strings.TrimPrefix(endpoint, "http://")
	return strings.TrimRight(endpoint, "/")
}

func minIOPublicURL(endpoint string, bucketName string, remotePath string, useSSL bool) string {
	if publicBase := strings.TrimSpace(os.Getenv("MINIO_PUBLIC_URL")); publicBase != "" {
		return strings.TrimRight(publicBase, "/") + "/" + remotePath
	}
	scheme := "https"
	if !useSSL {
		scheme = "http"
	}
	return fmt.Sprintf("%s://%s/%s/%s", scheme, endpoint, bucketName, remotePath)
}

func uploadToSupabaseStorage(fileContent []byte, fileName string, contentType string) (string, error) {
	supabaseURL := os.Getenv("SUPABASE_URL")
	supabaseKey := os.Getenv("SUPABASE_SERVICE_ROLE_KEY")
	bucketName := os.Getenv("SUPABASE_BUCKET")

	if supabaseURL == "" || supabaseKey == "" {
		return "", fmt.Errorf("configurações do Supabase ausentes")
	}

	if err := validateFile(fileContent, contentType); err != nil {
		return "", err
	}

	// Estrutura de pasta: whatsapp/tipo/ano/mes/dia_timestamp_arquivo
	now := time.Now()
	remotePath := fmt.Sprintf("whatsapp/%d/%02d/%d_%s",
		now.Year(), now.Month(), now.Unix(), fileName)

	url := fmt.Sprintf("%s/storage/v1/object/%s/%s", supabaseURL, bucketName, remotePath)

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(fileContent))
	if err != nil {
		return "", err
	}

	req.Header.Set("Authorization", "Bearer "+supabaseKey)
	req.Header.Set("Content-Type", contentType)
	req.Header.Set("x-upsert", "true")

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 && resp.StatusCode != 201 {
		body, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("erro no upload (status %d): %s", resp.StatusCode, string(body))
	}

	// Retorna a URL pública (ajuste conforme a configuração do seu bucket)
	publicURL := fmt.Sprintf("%s/storage/v1/object/public/%s/%s", supabaseURL, bucketName, remotePath)
	return publicURL, nil
}
