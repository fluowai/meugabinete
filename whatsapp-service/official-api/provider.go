package officialapi

import "fmt"

// CloudAPIAdapter wraps WhatsAppCloudClient to satisfy WhatsAppProvider interface
type CloudAPIAdapter struct {
	client *WhatsAppCloudClient
}

func NewCloudAPIAdapter(client *WhatsAppCloudClient) *CloudAPIAdapter {
	return &CloudAPIAdapter{client: client}
}

func (a *CloudAPIAdapter) SendText(to, text string) error {
	return a.client.SendText(to, text)
}

func (a *CloudAPIAdapter) SendMedia(to, mediaID, caption, mimeType string) error {
	return a.client.SendMedia(to, mediaID, caption, mimeType)
}

func (a *CloudAPIAdapter) SendTemplate(to string, template *TemplateMessage) error {
	return a.client.SendTemplate(to, template)
}

func (a *CloudAPIAdapter) MarkAsRead(messageID string) error {
	return a.client.MarkAsRead(messageID)
}

func (a *CloudAPIAdapter) IsConnected() bool {
	return a.client.IsConnected()
}

func (a *CloudAPIAdapter) Disconnect() {
	a.client.Disconnect()
}

func (a *CloudAPIAdapter) GetProviderName() string {
	return "cloud_api"
}

// CloudAPIProvider checks if Cloud API is configured
func IsCloudAPIConfigured() bool {
	client := GetClient()
	return client.GetPhoneNumberID() != "" && client.GetConfig().AccessToken != ""
}

// GetActiveProvider returns the appropriate provider instance
func GetActiveProvider() (WhatsAppProvider, error) {
	if IsCloudAPIConfigured() {
		return NewCloudAPIAdapter(GetClient()), nil
	}
	return nil, fmt.Errorf("no WhatsApp provider configured: set WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID")
}
