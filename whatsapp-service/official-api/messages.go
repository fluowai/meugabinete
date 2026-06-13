package officialapi

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"time"
)

func (c *WhatsAppCloudClient) SendText(to, text string) error {
	req := SendMessageRequest{
		MessagingProduct: "whatsapp",
		RecipientType:    "individual",
		To:               to,
		Type:             "text",
		Text: &TextContent{
			PreviewURL: false,
			Body:       text,
		},
	}

	data, err := c.callAPI(context.Background(), "messages", req)
	if err != nil {
		return fmt.Errorf("failed to send text message: %w", err)
	}

	var resp SendResponse
	if err := json.Unmarshal(data, &resp); err != nil {
		return fmt.Errorf("failed to parse response: %w", err)
	}

	if len(resp.Messages) == 0 {
		return fmt.Errorf("no message ID returned")
	}

	return nil
}

func (c *WhatsAppCloudClient) SendMedia(to, mediaID, caption, mimeType string) error {
	mediaType := detectMediaType(mimeType)
	if mediaType == "" {
		mediaType = "document"
	}

	req := SendMessageRequest{
		MessagingProduct: "whatsapp",
		RecipientType:    "individual",
		To:               to,
		Type:             mediaType,
	}

	switch mediaType {
	case "image":
		req.Image = &MediaObject{ID: mediaID}
		if caption != "" {
			req.Image = &MediaObject{ID: mediaID}
		}
	case "audio":
		req.Audio = &MediaObject{ID: mediaID}
	case "video":
		req.Video = &MediaObject{ID: mediaID}
		if caption != "" {
			req.Video = &MediaObject{ID: mediaID}
		}
	case "sticker":
		req.Sticker = &MediaObject{ID: mediaID}
	default:
		req.Document = &DocumentObject{
			ID:      mediaID,
			Caption: caption,
		}
	}

	data, err := c.callAPI(context.Background(), "messages", req)
	if err != nil {
		return fmt.Errorf("failed to send media: %w", err)
	}

	var resp SendResponse
	if err := json.Unmarshal(data, &resp); err != nil {
		return fmt.Errorf("failed to parse response: %w", err)
	}

	if len(resp.Messages) == 0 {
		return fmt.Errorf("no message ID returned")
	}

	return nil
}

func (c *WhatsAppCloudClient) SendTemplate(to string, template *TemplateMessage) error {
	req := SendMessageRequest{
		MessagingProduct: "whatsapp",
		RecipientType:    "individual",
		To:               to,
		Type:             "template",
		Template: &TemplateObject{
			Name:       template.Name,
			Language:   template.Language,
			Components: template.Components,
		},
	}

	data, err := c.callAPI(context.Background(), "messages", req)
	if err != nil {
		return fmt.Errorf("failed to send template: %w", err)
	}

	var resp SendResponse
	if err := json.Unmarshal(data, &resp); err != nil {
		return fmt.Errorf("failed to parse response: %w", err)
	}

	if len(resp.Messages) == 0 {
		return fmt.Errorf("no message ID returned")
	}

	return nil
}

func (c *WhatsAppCloudClient) SendInteractiveButtons(to, bodyText string, buttons []ActionButton) error {
	req := SendMessageRequest{
		MessagingProduct: "whatsapp",
		RecipientType:    "individual",
		To:               to,
		Type:             "interactive",
		Interactive: &InteractiveSend{
			Type: "button",
			Body: &InteractiveBody{Text: bodyText},
			Action: &InteractiveAction{
				Buttons: buttons,
			},
		},
	}

	data, err := c.callAPI(context.Background(), "messages", req)
	if err != nil {
		return fmt.Errorf("failed to send interactive buttons: %w", err)
	}

	var resp SendResponse
	if err := json.Unmarshal(data, &resp); err != nil {
		return fmt.Errorf("failed to parse response: %w", err)
	}

	if len(resp.Messages) == 0 {
		return fmt.Errorf("no message ID returned")
	}

	return nil
}

func (c *WhatsAppCloudClient) SendList(to, header, body, footer, buttonText string, sections []ListSection) error {
	req := SendMessageRequest{
		MessagingProduct: "whatsapp",
		RecipientType:    "individual",
		To:               to,
		Type:             "interactive",
		Interactive: &InteractiveSend{
			Type:   "list",
			Header: &InteractiveHeader{Type: "text", Text: header},
			Body:   &InteractiveBody{Text: body},
			Footer: &InteractiveFooter{Text: footer},
			Action: &InteractiveAction{
				Button:   buttonText,
				Sections: sections,
			},
		},
	}

	data, err := c.callAPI(context.Background(), "messages", req)
	if err != nil {
		return fmt.Errorf("failed to send list message: %w", err)
	}

	var resp SendResponse
	if err := json.Unmarshal(data, &resp); err != nil {
		return fmt.Errorf("failed to parse response: %w", err)
	}

	if len(resp.Messages) == 0 {
		return fmt.Errorf("no message ID returned")
	}

	return nil
}

func (c *WhatsAppCloudClient) MarkAsRead(messageID string) error {
	req := SendMessageRequest{
		MessagingProduct: "whatsapp",
		Status:           "read",
		MessageID:        messageID,
	}

	data, err := c.callAPI(context.Background(), "messages", req)
	if err != nil {
		return fmt.Errorf("failed to mark as read: %w", err)
	}

	var dummy map[string]interface{}
	json.Unmarshal(data, &dummy)
	return nil
}

func (c *WhatsAppCloudClient) RevokeMessage(to, messageID string) error {
	req := SendMessageRequest{
		MessagingProduct: "whatsapp",
		RecipientType:    "individual",
		To:               to,
		Type:             "text",
		Text:             &TextContent{Body: ""},
		Context:          &MessageContext{From: to, ID: messageID},
	}

	data, err := c.callAPI(context.Background(), "messages", req)
	if err != nil {
		return fmt.Errorf("failed to revoke message: %w", err)
	}

	var dummy map[string]interface{}
	json.Unmarshal(data, &dummy)
	return nil
}

func (c *WhatsAppCloudClient) GetMessageStatus(messageID string) (string, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	data, err := c.doRequest(ctx, http.MethodGet,
		fmt.Sprintf("%s/%s", c.config.BaseURL, url.PathEscape(messageID)),
		nil,
	)
	if err != nil {
		return "", err
	}

	var statusInfo struct {
		Statuses []StatusUpdate `json:"statuses"`
	}
	if err := json.Unmarshal(data, &statusInfo); err != nil {
		return "", err
	}

	if len(statusInfo.Statuses) > 0 {
		return statusInfo.Statuses[0].Status, nil
	}

	return StatusPending, nil
}

func detectMediaType(mimeType string) string {
	switch {
	case mimeType == "":
		return "document"
	case strings.HasPrefix(mimeType, "image/"):
		if mimeType == "image/webp" {
			return "sticker"
		}
		return "image"
	case strings.HasPrefix(mimeType, "audio/"):
		return "audio"
	case strings.HasPrefix(mimeType, "video/"):
		return "video"
	default:
		return "document"
	}
}
