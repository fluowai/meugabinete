package database

import (
	"encoding/json"
	"path/filepath"
	"testing"
)

func TestWhatsAppFallbackStoresAndFiltersMessages(t *testing.T) {
	localWhatsAppStore.Lock()
	if localWhatsAppStore.db != nil {
		_ = localWhatsAppStore.db.Close()
		localWhatsAppStore.db = nil
	}
	localWhatsAppStore.Unlock()

	t.Setenv("SUPABASE_URL", "")
	t.Setenv("SUPABASE_SERVICE_ROLE_KEY", "")
	t.Setenv("WHATSAPP_FALLBACK_DB", filepath.Join(t.TempDir(), "whatsapp.db"))
	t.Cleanup(func() {
		localWhatsAppStore.Lock()
		defer localWhatsAppStore.Unlock()
		if localWhatsAppStore.db != nil {
			_ = localWhatsAppStore.db.Close()
			localWhatsAppStore.db = nil
		}
	})

	chatResponse, err := UpsertToSupabase("whatsapp_chats", "chat_jid", map[string]interface{}{
		"chat_jid":        "5511999999999@s.whatsapp.net",
		"chat_type":       "direct",
		"display_name":    "Cidadao Teste",
		"last_message":    "Ola",
		"last_message_at": "2026-06-15T10:00:00Z",
	})
	if err != nil {
		t.Fatalf("failed to store chat locally: %v", err)
	}
	var chat map[string]interface{}
	if err := json.Unmarshal(chatResponse, &chat); err != nil {
		t.Fatalf("failed to decode stored chat: %v", err)
	}

	_, err = UpsertToSupabase("whatsapp_messages", "message_id", map[string]interface{}{
		"chat_id":             chat["id"],
		"message_id":          "message-1",
		"chat_jid":            "5511999999999@s.whatsapp.net",
		"sender_display_name": "Cidadao Teste",
		"is_group":            false,
		"text_content":        "Ola",
		"received_at":         "2026-06-15T10:00:00Z",
	})
	if err != nil {
		t.Fatalf("failed to store message locally: %v", err)
	}

	body, err := FetchFromSupabase("whatsapp_messages", "select=*&chat_id=eq."+stringValue(chat["id"])+"&order=received_at.asc&limit=10")
	if err != nil {
		t.Fatalf("failed to fetch messages locally: %v", err)
	}
	var messages []map[string]interface{}
	if err := json.Unmarshal(body, &messages); err != nil {
		t.Fatalf("failed to decode fetched messages: %v", err)
	}
	if len(messages) != 1 || messages[0]["message_id"] != "message-1" {
		t.Fatalf("unexpected messages: %#v", messages)
	}
}
