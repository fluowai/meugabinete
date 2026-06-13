package handler

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"path/filepath"
	"regexp"
	"strings"
	"time"

	"github.com/fluowai/meugabinete/whatsapp-service/ai"
	"github.com/fluowai/meugabinete/whatsapp-service/database"
	"github.com/fluowai/meugabinete/whatsapp-service/storage"
	"go.mau.fi/whatsmeow"
	waE2E "go.mau.fi/whatsmeow/proto/waE2E"
	"go.mau.fi/whatsmeow/types"
	"go.mau.fi/whatsmeow/types/events"
	"google.golang.org/protobuf/proto"
)

type MediaInfo struct {
	Type     string
	MimeType string
	Filename string
	URL      string
}

type ContactInfo struct {
	JID             types.JID
	AltJID          types.JID
	Phone           string
	CountryCode     string
	ProfilePhotoURL string
}

func NormalizePhone(phone string) (normalized string, digits string) {
	re := regexp.MustCompile(`[^\d]`)
	digits = re.ReplaceAllString(phone, "")
	if strings.HasPrefix(digits, "00") {
		digits = strings.TrimPrefix(digits, "00")
	}
	if !strings.HasPrefix(digits, "55") && (len(digits) == 10 || len(digits) == 11) {
		digits = "55" + digits
	}
	normalized = digits
	return
}

func InferCountryCode(phone string) string {
	_, digits := NormalizePhone(phone)
	switch {
	case strings.HasPrefix(digits, "55"):
		return "55"
	case strings.HasPrefix(digits, "1"):
		return "1"
	case len(digits) >= 2:
		return digits[:2]
	default:
		return ""
	}
}

func SendReply(client *whatsmeow.Client, jid types.JID, text string) {
	_, err := client.SendMessage(context.Background(), jid, &waE2E.Message{
		Conversation: proto.String(text),
	})
	if err != nil {
		fmt.Printf("Erro ao enviar resposta: %v\n", err)
	}
}

func ProcessMessage(client *whatsmeow.Client, v *events.Message) {
	if v.Info.IsFromMe {
		return
	}

	if v.Info.Chat.Server != types.DefaultUserServer && v.Info.Chat.Server != types.LegacyUserServer && v.Info.Chat.Server != types.GroupServer {
		return
	}

	chatJID := v.Info.Chat.String()
	isGroup := v.Info.IsGroup || v.Info.Chat.Server == types.GroupServer
	senderInfo := resolveSenderInfo(client, v.Info, isGroup)
	senderJID := senderInfo.JID.String()
	if senderJID == "" || senderInfo.JID.IsEmpty() {
		senderJID = senderInfo.AltJID.String()
	}
	senderPhone := senderInfo.Phone
	pushName := strings.TrimSpace(v.Info.PushName)
	senderDisplayName := displayName(pushName, senderPhone)
	groupInfo := resolveGroupInfo(client, v.Info.Chat, isGroup)
	groupName := ""
	participantCount := 0
	if groupInfo != nil {
		groupName = strings.TrimSpace(groupInfo.Name)
		participantCount = groupInfo.ParticipantCount
		if participantCount == 0 {
			participantCount = len(groupInfo.Participants)
		}
	}
	if groupName == "" {
		groupName = resolveGroupName(client, v.Info.Chat, isGroup)
	}
	chatDisplayName := senderDisplayName
	chatType := "direct"
	chatPhone := senderPhone
	chatCountryCode := senderInfo.CountryCode
	chatPhotoURL := senderInfo.ProfilePhotoURL
	if isGroup {
		chatType = "group"
		chatPhone = ""
		chatCountryCode = ""
		chatDisplayName = groupName
		chatPhotoURL = fetchProfilePicture(client, v.Info.Chat, v.Info.ID+"_group")
	}

	textContent := extractText(v.Message)
	media := extractMedia(client, v.Message, v.Info.ID)
	if textContent == "" && media.Type != "" {
		textContent = fmt.Sprintf("[%s recebida]", media.Type)
	}

	receivedAt := v.Info.Timestamp
	if receivedAt.IsZero() {
		receivedAt = time.Now()
	}

	chatID := upsertChat(chatJID, chatType, chatDisplayName, chatPhone, chatCountryCode, groupName, chatPhotoURL, participantCount, textContent, receivedAt)
	if isGroup {
		upsertGroupParticipant(chatJID, senderJID, senderPhone, senderInfo.CountryCode, pushName, senderDisplayName, senderInfo.ProfilePhotoURL, false, false, receivedAt)
		if groupInfo != nil {
			upsertGroupParticipantsFromInfo(client, chatJID, groupInfo, false, receivedAt)
		}
	}

	messageRecordID := saveMessage(chatID, chatJID, senderJID, senderPhone, senderInfo.CountryCode, senderInfo.ProfilePhotoURL, pushName, senderDisplayName, isGroup, groupName, v, textContent, media, receivedAt)

	if shouldCreateDemand(textContent, media) {
		requestID := createRequestFromMessage(pushName, senderPhone, textContent, media, messageRecordID)
		if requestID != "" && messageRecordID != "" {
			_, _ = database.UpsertToSupabase("whatsapp_messages", "id", map[string]interface{}{
				"id":                 messageRecordID,
				"created_request_id": requestID,
			})
		}
	}
}

func displayName(pushName string, phone string) string {
	if strings.TrimSpace(pushName) != "" {
		return strings.TrimSpace(pushName)
	}
	return phone
}

func resolveGroupName(client *whatsmeow.Client, jid types.JID, isGroup bool) string {
	info := resolveGroupInfo(client, jid, isGroup)
	if info != nil && strings.TrimSpace(info.Name) != "" {
		return strings.TrimSpace(info.Name)
	}
	return jid.String()
}

func resolveGroupInfo(client *whatsmeow.Client, jid types.JID, isGroup bool) *types.GroupInfo {
	if !isGroup {
		return nil
	}
	ctx, cancel := context.WithTimeout(context.Background(), 8*time.Second)
	defer cancel()
	info, err := client.GetGroupInfo(ctx, jid)
	if err != nil {
		return nil
	}
	return info
}

func upsertChat(chatJID string, chatType string, displayName string, phone string, countryCode string, groupName string, profilePhotoURL string, participantCount int, lastMessage string, receivedAt time.Time) string {
	payload := map[string]interface{}{
		"chat_jid":            chatJID,
		"chat_type":           chatType,
		"display_name":        displayName,
		"normalized_phone":    nilIfEmpty(phone),
		"country_code":        nilIfEmpty(countryCode),
		"group_name":          nilIfEmpty(groupName),
		"profile_picture_url": nilIfEmpty(profilePhotoURL),
		"participant_count":   participantCount,
		"last_message":        lastMessage,
		"last_message_at":     receivedAt.Format(time.RFC3339),
	}
	resp, err := database.UpsertToSupabase("whatsapp_chats", "chat_jid", payload)
	if err != nil {
		fmt.Printf("Erro ao salvar conversa: %v\n", err)
		return ""
	}
	return extractID(resp)
}

func upsertGroupParticipant(groupJID string, participantJID string, phone string, countryCode string, pushName string, displayName string, profilePhotoURL string, isAdmin bool, isSuperAdmin bool, seenAt time.Time) {
	_, err := database.UpsertToSupabase("whatsapp_group_participants", "group_jid,participant_jid", map[string]interface{}{
		"group_jid":           groupJID,
		"participant_jid":     participantJID,
		"normalized_phone":    phone,
		"country_code":        nilIfEmpty(countryCode),
		"push_name":           nilIfEmpty(pushName),
		"display_name":        displayName,
		"profile_picture_url": nilIfEmpty(profilePhotoURL),
		"is_admin":            isAdmin,
		"is_super_admin":      isSuperAdmin,
		"last_seen_at":        seenAt.Format(time.RFC3339),
		"last_synced_at":      seenAt.Format(time.RFC3339),
	})
	if err != nil {
		fmt.Printf("Erro ao salvar participante de grupo: %v\n", err)
	}
}

func saveMessage(chatID string, chatJID string, senderJID string, senderPhone string, senderCountryCode string, senderProfilePhotoURL string, pushName string, senderDisplayName string, isGroup bool, groupName string, v *events.Message, textContent string, media MediaInfo, receivedAt time.Time) string {
	payload := map[string]interface{}{
		"chat_id":                    nilIfEmpty(chatID),
		"message_id":                 v.Info.ID,
		"chat_jid":                   chatJID,
		"sender_jid":                 senderJID,
		"sender_push_name":           nilIfEmpty(pushName),
		"sender_phone":               senderPhone,
		"sender_country_code":        nilIfEmpty(senderCountryCode),
		"sender_profile_picture_url": nilIfEmpty(senderProfilePhotoURL),
		"sender_display_name":        senderDisplayName,
		"is_group":                   isGroup,
		"group_name":                 nilIfEmpty(groupName),
		"message_type":               messageType(textContent, media),
		"text_content":               nilIfEmpty(textContent),
		"media_url":                  nilIfEmpty(media.URL),
		"media_mime_type":            nilIfEmpty(media.MimeType),
		"media_filename":             nilIfEmpty(media.Filename),
		"quoted_message_id":          nilIfEmpty(quotedMessageID(v.Message)),
		"mentioned_phones":           mentionedPhones(v.Message),
		"received_at":                receivedAt.Format(time.RFC3339),
	}
	resp, err := database.UpsertToSupabase("whatsapp_messages", "message_id", payload)
	if err != nil {
		fmt.Printf("Erro ao salvar mensagem: %v\n", err)
		return ""
	}
	return extractID(resp)
}

func shouldCreateDemand(textContent string, media MediaInfo) bool {
	return strings.TrimSpace(textContent) != "" || media.URL != ""
}

func createRequestFromMessage(pushName string, senderPhone string, content string, media MediaInfo, messageRecordID string) string {
	classification, err := ai.ClassifyDemand(content)
	if err != nil {
		fmt.Printf("Erro na classificacao IA: %v\n", err)
		classification = &ai.ClassificationResult{
			Resumo:     fallbackSummary(content, media),
			Categoria:  "Outros",
			Prioridade: "Media",
			Sentimento: "Outros",
		}
	}
	description := content
	if media.URL != "" {
		description = strings.TrimSpace(description + "\n\nMidia: " + media.URL)
	}
	resp, err := database.SaveToSupabase("requests", map[string]interface{}{
		"title":             fallbackSummary(classification.Resumo, media),
		"description":       description,
		"subject":           classification.Categoria,
		"neighborhood":      nilIfEmpty(classification.BairroDetectado),
		"category":          mapCategory(classification.Categoria),
		"priority":          mapPriority(classification.Prioridade),
		"status":            "open",
		"requester_name":    displayName(pushName, senderPhone),
		"requester_phone":   senderPhone,
		"ai_summary":        classification.Resumo,
		"ai_classification": classification,
		"resolution":        nilIfEmpty("Mensagem WhatsApp: " + messageRecordID),
	})
	if err != nil {
		fmt.Printf("Erro ao criar demanda: %v\n", err)
		return ""
	}
	return extractID(resp)
}

func extractText(msg *waE2E.Message) string {
	if msg == nil {
		return ""
	}
	if text := msg.GetConversation(); text != "" {
		return text
	}
	if extended := msg.GetExtendedTextMessage(); extended != nil {
		return extended.GetText()
	}
	if img := msg.GetImageMessage(); img != nil {
		return img.GetCaption()
	}
	if video := msg.GetVideoMessage(); video != nil {
		return video.GetCaption()
	}
	if doc := msg.GetDocumentMessage(); doc != nil {
		return doc.GetCaption()
	}
	return ""
}

func extractMedia(client *whatsmeow.Client, msg *waE2E.Message, messageID string) MediaInfo {
	if msg == nil {
		return MediaInfo{}
	}
	var mediaType, mimeType, filename string
	var downloadable whatsmeow.DownloadableMessage
	switch {
	case msg.GetImageMessage() != nil:
		m := msg.GetImageMessage()
		mediaType, mimeType, filename, downloadable = "image", m.GetMimetype(), "image.jpg", m
	case msg.GetAudioMessage() != nil:
		m := msg.GetAudioMessage()
		mediaType, mimeType, filename, downloadable = "audio", m.GetMimetype(), "audio.ogg", m
	case msg.GetVideoMessage() != nil:
		m := msg.GetVideoMessage()
		mediaType, mimeType, filename, downloadable = "video", m.GetMimetype(), "video.mp4", m
	case msg.GetDocumentMessage() != nil:
		m := msg.GetDocumentMessage()
		mediaType, mimeType, filename, downloadable = documentType(m.GetMimetype()), m.GetMimetype(), m.GetFileName(), m
	case msg.GetStickerMessage() != nil:
		m := msg.GetStickerMessage()
		mediaType, mimeType, filename, downloadable = "sticker", m.GetMimetype(), "sticker.webp", m
	default:
		return MediaInfo{}
	}
	if strings.TrimSpace(filename) == "" {
		filename = mediaType
	}
	safeName := safeMediaName(messageID, filename)
	data, err := client.Download(context.Background(), downloadable)
	if err != nil {
		fmt.Printf("Erro ao baixar midia: %v\n", err)
		return MediaInfo{Type: mediaType, MimeType: mimeType, Filename: safeName}
	}
	url, err := storage.UploadToSupabase(data, safeName, mimeType)
	if err != nil {
		fmt.Printf("Erro ao subir midia: %v\n", err)
		return MediaInfo{Type: mediaType, MimeType: mimeType, Filename: safeName}
	}
	return MediaInfo{Type: mediaType, MimeType: mimeType, Filename: safeName, URL: url}
}

func documentType(mimeType string) string {
	if strings.Contains(strings.ToLower(mimeType), "pdf") {
		return "pdf"
	}
	return "document"
}

func safeMediaName(messageID string, filename string) string {
	base := filepath.Base(filename)
	re := regexp.MustCompile(`[^a-zA-Z0-9._-]`)
	base = re.ReplaceAllString(base, "_")
	if base == "." || base == "" {
		base = "media"
	}
	return fmt.Sprintf("%s_%s", messageID, base)
}

func messageType(textContent string, media MediaInfo) string {
	if media.Type != "" {
		return media.Type
	}
	if strings.TrimSpace(textContent) != "" {
		return "text"
	}
	return "unknown"
}

func quotedMessageID(msg *waE2E.Message) string {
	if ctx := contextInfo(msg); ctx != nil {
		return ctx.GetStanzaID()
	}
	return ""
}

func mentionedPhones(msg *waE2E.Message) []string {
	if ctx := contextInfo(msg); ctx != nil {
		phones := make([]string, 0, len(ctx.GetMentionedJID()))
		for _, jid := range ctx.GetMentionedJID() {
			_, phone := NormalizePhone(strings.Split(jid, "@")[0])
			if phone != "" {
				phones = append(phones, phone)
			}
		}
		return phones
	}
	return []string{}
}

func resolveSenderInfo(client *whatsmeow.Client, info types.MessageInfo, isGroup bool) ContactInfo {
	jid := info.Sender.ToNonAD()
	altJID := info.SenderAlt.ToNonAD()
	if !isGroup {
		if jid.IsEmpty() || jid.Server == types.GroupServer {
			jid = info.Chat.ToNonAD()
		}
		if altJID.IsEmpty() {
			altJID = info.RecipientAlt.ToNonAD()
		}
	}
	phoneJID := jid
	if phoneJID.Server != types.DefaultUserServer && phoneJID.Server != types.LegacyUserServer && !altJID.IsEmpty() {
		phoneJID = altJID
	}
	_, phone := NormalizePhone(phoneJID.User)
	if phone == "" && !altJID.IsEmpty() {
		_, phone = NormalizePhone(altJID.User)
	}
	return ContactInfo{
		JID:             jid,
		AltJID:          altJID,
		Phone:           phone,
		CountryCode:     InferCountryCode(phone),
		ProfilePhotoURL: fetchProfilePicture(client, firstNonEmptyJID(phoneJID, jid, altJID), info.ID+"_sender"),
	}
}

func firstNonEmptyJID(jids ...types.JID) types.JID {
	for _, jid := range jids {
		if !jid.IsEmpty() {
			return jid
		}
	}
	return types.EmptyJID
}

func fetchProfilePicture(client *whatsmeow.Client, jid types.JID, nameHint string) string {
	if client == nil || jid.IsEmpty() {
		return ""
	}
	ctx, cancel := context.WithTimeout(context.Background(), 8*time.Second)
	defer cancel()
	info, err := client.GetProfilePictureInfo(ctx, jid, &whatsmeow.GetProfilePictureParams{Preview: true})
	if err != nil || info == nil || strings.TrimSpace(info.URL) == "" {
		return ""
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, info.URL, nil)
	if err != nil {
		return info.URL
	}
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return info.URL
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 300 {
		return info.URL
	}
	contentType := resp.Header.Get("Content-Type")
	if contentType == "" {
		contentType = "image/jpeg"
	}
	data, err := io.ReadAll(io.LimitReader(resp.Body, 2*1024*1024))
	if err != nil || len(data) == 0 {
		return info.URL
	}
	fileName := safeMediaName(nameHint, "profile.jpg")
	url, err := storage.UploadToSupabase(data, fileName, contentType)
	if err != nil {
		return info.URL
	}
	return url
}

func upsertGroupParticipantsFromInfo(client *whatsmeow.Client, groupJID string, info *types.GroupInfo, includePictures bool, seenAt time.Time) int {
	if info == nil {
		return 0
	}
	count := 0
	for _, participant := range info.Participants {
		jid := participant.JID.ToNonAD()
		if participant.PhoneNumber.User != "" {
			jid = participant.PhoneNumber.ToNonAD()
		}
		_, phone := NormalizePhone(jid.User)
		if phone == "" && participant.PhoneNumber.User != "" {
			_, phone = NormalizePhone(participant.PhoneNumber.User)
		}
		displayName := strings.TrimSpace(participant.DisplayName)
		if displayName == "" {
			displayName = phone
		}
		photoURL := ""
		if includePictures {
			photoURL = fetchProfilePicture(client, jid, info.JID.User+"_"+jid.User)
		}
		upsertGroupParticipant(groupJID, jid.String(), phone, InferCountryCode(phone), displayName, displayName, photoURL, participant.IsAdmin, participant.IsSuperAdmin, seenAt)
		count++
	}
	return count
}

func SyncGroupParticipants(client *whatsmeow.Client, groupJID types.JID, includePictures bool) (int, error) {
	if client == nil {
		return 0, fmt.Errorf("WhatsApp client not initialized")
	}
	ctx, cancel := context.WithTimeout(context.Background(), 12*time.Second)
	defer cancel()
	info, err := client.GetGroupInfo(ctx, groupJID)
	if err != nil {
		return 0, err
	}
	return upsertGroupParticipantsFromInfo(client, groupJID.String(), info, includePictures, time.Now()), nil
}

func SyncJoinedGroups(client *whatsmeow.Client) (int, int, error) {
	if client == nil {
		return 0, 0, fmt.Errorf("WhatsApp client not initialized")
	}
	ctx, cancel := context.WithTimeout(context.Background(), 20*time.Second)
	defer cancel()
	groups, err := client.GetJoinedGroups(ctx)
	if err != nil {
		return 0, 0, err
	}
	groupCount := 0
	participantCount := 0
	now := time.Now()
	for _, group := range groups {
		if group == nil || group.JID.Server != types.GroupServer {
			continue
		}
		photoURL := fetchProfilePicture(client, group.JID, group.JID.User+"_group")
		count := group.ParticipantCount
		if count == 0 {
			count = len(group.Participants)
		}
		upsertChat(group.JID.String(), "group", displayName(group.Name, group.JID.String()), "", "", group.Name, photoURL, count, "", now)
		participantCount += upsertGroupParticipantsFromInfo(client, group.JID.String(), group, false, now)
		groupCount++
	}
	return groupCount, participantCount, nil
}

func contextInfo(msg *waE2E.Message) *waE2E.ContextInfo {
	if msg == nil {
		return nil
	}
	switch {
	case msg.GetExtendedTextMessage() != nil:
		return msg.GetExtendedTextMessage().GetContextInfo()
	case msg.GetImageMessage() != nil:
		return msg.GetImageMessage().GetContextInfo()
	case msg.GetVideoMessage() != nil:
		return msg.GetVideoMessage().GetContextInfo()
	case msg.GetAudioMessage() != nil:
		return msg.GetAudioMessage().GetContextInfo()
	case msg.GetDocumentMessage() != nil:
		return msg.GetDocumentMessage().GetContextInfo()
	case msg.GetStickerMessage() != nil:
		return msg.GetStickerMessage().GetContextInfo()
	default:
		return nil
	}
}

func fallbackSummary(content string, media MediaInfo) string {
	if strings.TrimSpace(content) != "" {
		runes := []rune(strings.TrimSpace(content))
		if len(runes) > 120 {
			return string(runes[:120])
		}
		return string(runes)
	}
	if media.Type != "" {
		return fmt.Sprintf("Mensagem com %s", media.Type)
	}
	return "Mensagem recebida"
}

func mapPriority(priority string) string {
	switch strings.ToLower(priority) {
	case "alta", "high":
		return "high"
	case "urgente", "urgent":
		return "urgent"
	case "baixa", "low":
		return "low"
	default:
		return "medium"
	}
}

func mapCategory(category string) string {
	switch strings.ToLower(category) {
	case "reclamacao", "reclamação", "complaint":
		return "complaint"
	case "sugestao", "sugestão", "suggestion":
		return "suggestion"
	case "informacao", "informação", "information":
		return "information"
	case "elogio", "compliment":
		return "compliment"
	default:
		return "request"
	}
}

func extractID(resp []byte) string {
	var created struct {
		ID string `json:"id"`
	}
	if err := json.Unmarshal(resp, &created); err == nil {
		return created.ID
	}
	return ""
}

func nilIfEmpty(value string) interface{} {
	if strings.TrimSpace(value) == "" {
		return nil
	}
	return value
}
