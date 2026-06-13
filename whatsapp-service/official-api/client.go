package officialapi

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"
)

type WhatsAppCloudClient struct {
	httpClient  *http.Client
	config      *Config
	mu          sync.RWMutex
	connected   bool
	lastHealth  time.Time
}

var globalClient *WhatsAppCloudClient
var clientMu sync.Mutex

func GetClient() *WhatsAppCloudClient {
	clientMu.Lock()
	defer clientMu.Unlock()

	if globalClient != nil {
		return globalClient
	}

	config := &Config{
		APIVersion:     getEnv("WHATSAPP_API_VERSION", "v22.0"),
		PhoneNumberID:  os.Getenv("WHATSAPP_PHONE_NUMBER_ID"),
		BusinessAcctID: os.Getenv("WHATSAPP_BUSINESS_ACCOUNT_ID"),
		AccessToken:    os.Getenv("WHATSAPP_ACCESS_TOKEN"),
		WebhookToken:   os.Getenv("WHATSAPP_WEBHOOK_VERIFY_TOKEN"),
		WebhookSecret:  os.Getenv("WHATSAPP_WEBHOOK_SECRET"),
		AppSecret:      os.Getenv("WHATSAPP_APP_SECRET"),
		BaseURL:        "https://graph.facebook.com",
	}

	globalClient = &WhatsAppCloudClient{
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
			Transport: &http.Transport{
				MaxIdleConns:        50,
				MaxIdleConnsPerHost: 50,
				IdleConnTimeout:     90 * time.Second,
			},
		},
		config:    config,
		connected: config.AccessToken != "" && config.PhoneNumberID != "",
	}
	return globalClient
}

func (c *WhatsAppCloudClient) apiURL(path string) string {
	return fmt.Sprintf("%s/%s/%s/%s",
		c.config.BaseURL,
		c.config.APIVersion,
		c.config.PhoneNumberID,
		strings.TrimPrefix(path, "/"),
	)
}

func (c *WhatsAppCloudClient) businessURL(path string) string {
	return fmt.Sprintf("%s/%s/%s/%s",
		c.config.BaseURL,
		c.config.APIVersion,
		c.config.BusinessAcctID,
		strings.TrimPrefix(path, "/"),
	)
}

func (c *WhatsAppCloudClient) graphURL(path string) string {
	return fmt.Sprintf("%s/%s/%s",
		c.config.BaseURL,
		c.config.APIVersion,
		strings.TrimPrefix(path, "/"),
	)
}

func (c *WhatsAppCloudClient) doRequest(ctx context.Context, method, url string, body interface{}) ([]byte, error) {
	var reqBody io.Reader

	if body != nil {
		data, err := json.Marshal(body)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal request body: %w", err)
		}
		reqBody = bytes.NewReader(data)
	}

	req, err := http.NewRequestWithContext(ctx, method, url, reqBody)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+c.config.AccessToken)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("request failed: %w", err)
	}
	defer resp.Body.Close()

	respData, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	if resp.StatusCode >= 400 {
		var apiErr struct {
			Error APIError `json:"error"`
		}
		if json.Unmarshal(respData, &apiErr) == nil && apiErr.Error.Code != 0 {
			return nil, fmt.Errorf("API error %d: %s - %s", apiErr.Error.Code, apiErr.Error.Title, apiErr.Error.Message)
		}
		return nil, fmt.Errorf("HTTP %d: %s", resp.StatusCode, string(respData))
	}

	return respData, nil
}

func (c *WhatsAppCloudClient) callAPI(ctx context.Context, path string, body interface{}) ([]byte, error) {
	return c.doRequest(ctx, http.MethodPost, c.apiURL(path), body)
}

func (c *WhatsAppCloudClient) callGetAPI(ctx context.Context, path string) ([]byte, error) {
	return c.doRequest(ctx, http.MethodGet, c.apiURL(path), nil)
}

func (c *WhatsAppCloudClient) callBusinessAPI(ctx context.Context, path string) ([]byte, error) {
	return c.doRequest(ctx, http.MethodGet, c.businessURL(path), nil)
}

func (c *WhatsAppCloudClient) callGraphAPI(ctx context.Context, path string) ([]byte, error) {
	return c.doRequest(ctx, http.MethodGet, c.graphURL(path), nil)
}

func (c *WhatsAppCloudClient) GetProviderName() string {
	return "cloud_api"
}

func (c *WhatsAppCloudClient) IsConnected() bool {
	c.mu.RLock()
	defer c.mu.RUnlock()

	if !c.connected {
		return false
	}

	if time.Since(c.lastHealth) < 5*time.Minute {
		return true
	}

	go c.checkHealth()
	return c.connected
}

func (c *WhatsAppCloudClient) checkHealth() {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	data, err := c.callGetAPI(ctx, "")
	if err != nil {
		c.mu.Lock()
		c.connected = false
		c.mu.Unlock()
		return
	}

	var resp SendResponse
	if json.Unmarshal(data, &resp) == nil {
		c.mu.Lock()
		c.connected = resp.MessagingProduct == "whatsapp"
		c.lastHealth = time.Now()
		c.mu.Unlock()
	}
}

func (c *WhatsAppCloudClient) Disconnect() {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.connected = false
}

func (c *WhatsAppCloudClient) GetPhoneNumberID() string {
	return c.config.PhoneNumberID
}

func (c *WhatsAppCloudClient) GetBusinessAcctID() string {
	return c.config.BusinessAcctID
}

func (c *WhatsAppCloudClient) GetConfig() *Config {
	return c.config
}

func getEnv(key, fallback string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return fallback
}
