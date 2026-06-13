package officialapi

import (
	"context"
	"encoding/json"
	"fmt"
	"net/url"
	"time"
)

type TemplateManager struct {
	client *WhatsAppCloudClient
}

func NewTemplateManager(client *WhatsAppCloudClient) *TemplateManager {
	return &TemplateManager{client: client}
}

func (m *TemplateManager) ListTemplates() ([]TemplateInfo, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	data, err := m.client.callBusinessAPI(ctx, "message_templates")
	if err != nil {
		return nil, fmt.Errorf("failed to list templates: %w", err)
	}

	var resp TemplateListResponse
	if err := json.Unmarshal(data, &resp); err != nil {
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	return resp.Data, nil
}

func (m *TemplateManager) GetTemplateByName(name string) (*TemplateInfo, error) {
	templates, err := m.ListTemplates()
	if err != nil {
		return nil, err
	}

	for _, t := range templates {
		if t.Name == name {
			return &t, nil
		}
	}

	return nil, fmt.Errorf("template '%s' not found", name)
}

func (m *TemplateManager) CreateTemplate(name, language, category, body string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	payload := map[string]interface{}{
		"name":     name,
		"language": language,
		"category": category,
		"components": []map[string]interface{}{
			{
				"type": "BODY",
				"text": body,
			},
		},
	}

	_, err := m.client.callBusinessAPI(ctx, "message_templates")
	if err != nil {
		return fmt.Errorf("failed to create template: %w", err)
	}

	data, err := m.client.doRequest(ctx, "POST",
		m.client.businessURL("message_templates"),
		payload,
	)
	if err != nil {
		return fmt.Errorf("failed to create template: %w", err)
	}

	var result struct {
		ID string `json:"id"`
	}
	if err := json.Unmarshal(data, &result); err != nil {
		return fmt.Errorf("failed to parse response: %w", err)
	}

	fmt.Printf("[Templates] Created template '%s' (ID: %s)\n", name, result.ID)
	return nil
}

func (m *TemplateManager) DeleteTemplate(name string) error {
	template, err := m.GetTemplateByName(name)
	if err != nil {
		return err
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	_, err = m.client.doRequest(ctx, "DELETE",
		m.client.graphURL(url.PathEscape(template.ID)),
		nil,
	)
	if err != nil {
		return fmt.Errorf("failed to delete template: %w", err)
	}

	fmt.Printf("[Templates] Deleted template '%s'\n", name)
	return nil
}

func (m *TemplateManager) UpdateTemplate(name, newBody string) error {
	template, err := m.GetTemplateByName(name)
	if err != nil {
		return err
	}

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	payload := map[string]interface{}{
		"components": []map[string]interface{}{
			{
				"type": "BODY",
				"text": newBody,
			},
		},
	}

	_, err = m.client.doRequest(ctx, "POST",
		m.client.graphURL(url.PathEscape(template.ID)),
		payload,
	)
	if err != nil {
		return fmt.Errorf("failed to update template: %w", err)
	}

	fmt.Printf("[Templates] Updated template '%s'\n", name)
	return nil
}

func (m *TemplateManager) TemplateExists(name string) bool {
	_, err := m.GetTemplateByName(name)
	return err == nil
}
