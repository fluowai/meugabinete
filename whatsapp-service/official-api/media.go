package officialapi

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"
)

type MediaManager struct {
	client *WhatsAppCloudClient
}

func NewMediaManager(client *WhatsAppCloudClient) *MediaManager {
	return &MediaManager{client: client}
}

func (m *MediaManager) UploadMedia(filePath string) (string, error) {
	file, err := os.Open(filePath)
	if err != nil {
		return "", fmt.Errorf("failed to open file: %w", err)
	}
	defer file.Close()

	mimeType := detectMimeType(filePath)

	var buf bytes.Buffer
	writer := multipart.NewWriter(&buf)

	if err := writer.WriteField("messaging_product", "whatsapp"); err != nil {
		return "", fmt.Errorf("failed to write field: %w", err)
	}

	part, err := writer.CreateFormFile("file", filepath.Base(filePath))
	if err != nil {
		return "", fmt.Errorf("failed to create form file: %w", err)
	}

	if _, err := io.Copy(part, file); err != nil {
		return "", fmt.Errorf("failed to copy file: %w", err)
	}

	if err := writer.WriteField("type", mimeType); err != nil {
		return "", fmt.Errorf("failed to write type: %w", err)
	}

	if err := writer.Close(); err != nil {
		return "", fmt.Errorf("failed to close writer: %w", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()

	url := m.client.apiURL("media")
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, &buf)
	if err != nil {
		return "", fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+m.client.config.AccessToken)
	req.Header.Set("Content-Type", writer.FormDataContentType())

	resp, err := m.client.httpClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("upload request failed: %w", err)
	}
	defer resp.Body.Close()

	respData, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to read response: %w", err)
	}

	if resp.StatusCode >= 400 {
		return "", fmt.Errorf("upload failed (HTTP %d): %s", resp.StatusCode, string(respData))
	}

	var uploadResp MediaUploadResponse
	if err := json.Unmarshal(respData, &uploadResp); err != nil {
		return "", fmt.Errorf("failed to parse response: %w", err)
	}

	if uploadResp.ID == "" {
		return "", fmt.Errorf("no media ID returned")
	}

	return uploadResp.ID, nil
}

func (m *MediaManager) UploadMediaFromURL(fileURL string, mimeType string) (string, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, fileURL, nil)
	if err != nil {
		return "", fmt.Errorf("failed to create download request: %w", err)
	}

	resp, err := m.client.httpClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("failed to download file: %w", err)
	}
	defer resp.Body.Close()

	data, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to read downloaded file: %w", err)
	}

	return m.UploadMediaBytes(data, filepath.Base(fileURL), mimeType)
}

func (m *MediaManager) UploadMediaBytes(data []byte, filename, mimeType string) (string, error) {
	var buf bytes.Buffer
	writer := multipart.NewWriter(&buf)

	if err := writer.WriteField("messaging_product", "whatsapp"); err != nil {
		return "", fmt.Errorf("failed to write field: %w", err)
	}

	part, err := writer.CreateFormFile("file", filename)
	if err != nil {
		return "", fmt.Errorf("failed to create form file: %w", err)
	}

	if _, err := part.Write(data); err != nil {
		return "", fmt.Errorf("failed to write file data: %w", err)
	}

	if err := writer.WriteField("type", mimeType); err != nil {
		return "", fmt.Errorf("failed to write type: %w", err)
	}

	if err := writer.Close(); err != nil {
		return "", fmt.Errorf("failed to close writer: %w", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()

	url := m.client.apiURL("media")
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, &buf)
	if err != nil {
		return "", fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+m.client.config.AccessToken)
	req.Header.Set("Content-Type", writer.FormDataContentType())

	resp, err := m.client.httpClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("upload request failed: %w", err)
	}
	defer resp.Body.Close()

	respData, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to read response: %w", err)
	}

	if resp.StatusCode >= 400 {
		return "", fmt.Errorf("upload failed (HTTP %d): %s", resp.StatusCode, string(respData))
	}

	var uploadResp MediaUploadResponse
	if err := json.Unmarshal(respData, &uploadResp); err != nil {
		return "", fmt.Errorf("failed to parse response: %w", err)
	}

	if uploadResp.ID == "" {
		return "", fmt.Errorf("no media ID returned")
	}

	return uploadResp.ID, nil
}

func (m *MediaManager) DownloadMedia(mediaID string) ([]byte, string, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	infoURL := m.client.graphURL(mediaID)
	data, err := m.client.doRequest(ctx, http.MethodGet, infoURL, nil)
	if err != nil {
		return nil, "", fmt.Errorf("failed to get media info: %w", err)
	}

	var info MediaInfoResponse
	if err := json.Unmarshal(data, &info); err != nil {
		return nil, "", fmt.Errorf("failed to parse media info: %w", err)
	}

	if info.URL == "" {
		return nil, "", fmt.Errorf("media download URL not available")
	}

	downloadReq, err := http.NewRequestWithContext(ctx, http.MethodGet, info.URL, nil)
	if err != nil {
		return nil, "", fmt.Errorf("failed to create download request: %w", err)
	}

	downloadReq.Header.Set("Authorization", "Bearer "+m.client.config.AccessToken)

	resp, err := m.client.httpClient.Do(downloadReq)
	if err != nil {
		return nil, "", fmt.Errorf("download request failed: %w", err)
	}
	defer resp.Body.Close()

	fileData, err := io.ReadAll(io.LimitReader(resp.Body, 100*1024*1024))
	if err != nil {
		return nil, "", fmt.Errorf("failed to read download data: %w", err)
	}

	return fileData, info.MimeType, nil
}

func (m *MediaManager) DeleteMedia(mediaID string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	url := m.client.graphURL(mediaID)
	req, err := http.NewRequestWithContext(ctx, http.MethodDelete, url, nil)
	if err != nil {
		return fmt.Errorf("failed to create delete request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+m.client.config.AccessToken)

	resp, err := m.client.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("delete request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("delete failed (HTTP %d): %s", resp.StatusCode, string(body))
	}

	return nil
}

func detectMimeType(filePath string) string {
	ext := strings.ToLower(filepath.Ext(filePath))
	switch ext {
	case ".jpg", ".jpeg":
		return "image/jpeg"
	case ".png":
		return "image/png"
	case ".gif":
		return "image/gif"
	case ".webp":
		return "image/webp"
	case ".mp4":
		return "video/mp4"
	case ".mp3":
		return "audio/mp3"
	case ".ogg":
		return "audio/ogg"
	case ".pdf":
		return "application/pdf"
	case ".doc", ".docx":
		return "application/msword"
	case ".xls", ".xlsx":
		return "application/vnd.ms-excel"
	case ".csv":
		return "text/csv"
	case ".txt":
		return "text/plain"
	default:
		return "application/octet-stream"
	}
}
