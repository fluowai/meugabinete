package officialapi

import "time"

// WhatsAppProvider defines the interface for sending messages
// used by both whatsmeow (unofficial) and Cloud API (official)
type WhatsAppProvider interface {
	SendText(to, text string) error
	SendMedia(to, url, caption, mimeType string) error
	SendTemplate(to string, template *TemplateMessage) error
	MarkAsRead(messageID string) error
	IsConnected() bool
	Disconnect()
	GetProviderName() string
}

// Config holds all configuration for the WhatsApp Cloud API client
type Config struct {
	APIVersion       string
	PhoneNumberID    string
	BusinessAcctID   string
	AccessToken      string
	WebhookToken     string
	WebhookSecret    string
	AppSecret        string
	BaseURL          string
	WebhookPort      string
}

// --- Webhook Types ---

type WebhookPayload struct {
	Object string         `json:"object"`
	Entry  []WebhookEntry `json:"entry"`
}

type WebhookEntry struct {
	ID      string           `json:"id"`
	Changes []WebhookChange  `json:"changes"`
}

type WebhookChange struct {
	Field string      `json:"field"`
	Value ChangeValue `json:"value"`
}

type ChangeValue struct {
	MessagingProduct string           `json:"messaging_product"`
	Metadata         Metadata         `json:"metadata"`
	Contacts         []ContactProfile `json:"contacts"`
	Messages         []IncomingMessage `json:"messages"`
	Errors           []APIError       `json:"errors"`
	Statuses         []StatusUpdate   `json:"statuses"`
}

type Metadata struct {
	DisplayPhoneNumber string `json:"display_phone_number"`
	PhoneNumberID      string `json:"phone_number_id"`
}

type ContactProfile struct {
	Profile Profile `json:"profile"`
	WaID    string  `json:"wa_id"`
}

type Profile struct {
	Name string `json:"name"`
}

// --- Incoming Message Types ---

type IncomingMessage struct {
	ID          string         `json:"id"`
	From        string         `json:"from"`
	Timestamp   string         `json:"timestamp"`
	Type        string         `json:"type"`
	Text        *TextMessage   `json:"text,omitempty"`
	Image       *MediaContent  `json:"image,omitempty"`
	Audio       *MediaContent  `json:"audio,omitempty"`
	Video       *MediaContent  `json:"video,omitempty"`
	Document    *MediaContent  `json:"document,omitempty"`
	Sticker     *MediaContent  `json:"sticker,omitempty"`
	Button      *ButtonContent `json:"button,omitempty"`
	Interactive *Interactive   `json:"interactive,omitempty"`
	Order       *OrderContent  `json:"order,omitempty"`
	System      *SystemContent `json:"system,omitempty"`
	Context     *MessageContext `json:"context,omitempty"`
	Referral    *Referral      `json:"referral,omitempty"`
	Identity    *Identity      `json:"identity,omitempty"`
}

type TextMessage struct {
	Body string `json:"body"`
}

type MediaContent struct {
	ID       string `json:"id"`
	MimeType string `json:"mime_type"`
	SHA256   string `json:"sha256"`
	Caption  string `json:"caption,omitempty"`
	Filename string `json:"filename,omitempty"`
}

type ButtonContent struct {
	Text    string `json:"text"`
	Payload string `json:"payload"`
}

type Interactive struct {
	Type   string        `json:"type"`
	Button *ReplyButton  `json:"button_reply,omitempty"`
	List   *ListReply    `json:"list_reply,omitempty"`
}

type ReplyButton struct {
	ID      string `json:"id"`
	Title   string `json:"title"`
}

type ListReply struct {
	ID          string `json:"id"`
	Title       string `json:"title"`
	Description string `json:"description"`
}

type OrderContent struct {
	CatalogID string        `json:"catalog_id"`
	Text      string        `json:"text"`
	Products  []OrderProduct `json:"product_items"`
}

type OrderProduct struct {
	ProductID      string `json:"product_retailer_id"`
	Quantity       string `json:"quantity"`
	ItemPrice      string `json:"item_price"`
	Currency       string `json:"currency"`
}

type SystemContent struct {
	Body string `json:"body"`
	Type string `json:"type"`
}

type MessageContext struct {
	From           string `json:"from"`
	ID             string `json:"id"`
	ReferredProduct *ReferredProduct `json:"referred_product,omitempty"`
}

type ReferredProduct struct {
	CatalogID string `json:"catalog_id"`
	ProductID string `json:"product_retailer_id"`
}

type Referral struct {
	SourceURL    string `json:"source_url"`
	SourceType   string `json:"source_type"`
	Headline     string `json:"headline"`
	Body         string `json:"body"`
	MediaType    string `json:"media_type"`
	ImageURL     string `json:"image_url"`
	VideoURL     string `json:"video_url"`
	ThumbnailURL string `json:"thumbnail_url"`
	CTA          string `json:"cta_url"`
}

type Identity struct {
	IdentityID    string `json:"identity_id"`
	Created       string `json:"created_timestamp"`
	IdentityType  string `json:"identity_type"`
}

// --- Status Types ---

type StatusUpdate struct {
	ID           string        `json:"id"`
	RecipientID  string        `json:"recipient_id"`
	Status       string        `json:"status"`
	Timestamp    string        `json:"timestamp"`
	Type         string        `json:"type"`
	Conversation *Conversation `json:"conversation,omitempty"`
	Pricing      *Pricing      `json:"pricing,omitempty"`
	Errors       []APIError    `json:"errors,omitempty"`
}

type Conversation struct {
	ID        string `json:"id"`
	ExpiresAt string `json:"expiration_timestamp"`
	Origin    *Origin `json:"origin,omitempty"`
}

type Origin struct {
	Type string `json:"type"`
}

type Pricing struct {
	Billable     bool   `json:"billable"`
	PricingModel string `json:"pricing_model"`
	Category     string `json:"category"`
}

// --- Send Request Types ---

type SendMessageRequest struct {
	MessagingProduct string           `json:"messaging_product"`
	RecipientType    string           `json:"recipient_type,omitempty"`
	To               string           `json:"to,omitempty"`
	Type             string           `json:"type"`
	Text             *TextContent     `json:"text,omitempty"`
	Image            *MediaObject     `json:"image,omitempty"`
	Audio            *MediaObject     `json:"audio,omitempty"`
	Video            *MediaObject     `json:"video,omitempty"`
	Document         *DocumentObject  `json:"document,omitempty"`
	Sticker          *MediaObject     `json:"sticker,omitempty"`
	Template         *TemplateObject  `json:"template,omitempty"`
	Interactive      *InteractiveSend `json:"interactive,omitempty"`
	Status           string           `json:"status,omitempty"`
	Context          *MessageContext  `json:"context,omitempty"`
	MessageID        string           `json:"message_id,omitempty"`
	Bulk             bool             `json:"-"`
}

type TextContent struct {
	PreviewURL bool   `json:"preview_url"`
	Body       string `json:"body"`
}

type MediaObject struct {
	ID string `json:"id"`
}

type DocumentObject struct {
	ID       string `json:"id"`
	Caption  string `json:"caption,omitempty"`
	Filename string `json:"filename,omitempty"`
}

// --- Template Types ---

type TemplateMessage struct {
	Name       string               `json:"name"`
	Language   TemplateLanguage      `json:"language"`
	Components []TemplateComponent   `json:"components,omitempty"`
}

type TemplateLanguage struct {
	Code string `json:"code"`
}

type TemplateComponent struct {
	Type       string               `json:"type"`
	SubType    string               `json:"sub_type,omitempty"`
	Parameters []TemplateParameter  `json:"parameters,omitempty"`
	Index      int                  `json:"index,omitempty"`
}

type TemplateParameter struct {
	Type        string           `json:"type"`
	Text        string           `json:"text,omitempty"`
	Image       *MediaObject     `json:"image,omitempty"`
	Video       *MediaObject     `json:"video,omitempty"`
	Document    *DocumentObject  `json:"document,omitempty"`
	Currency    *CurrencyParam   `json:"currency,omitempty"`
	DateTime    *DateTimeParam   `json:"date_time,omitempty"`
	Payload     string           `json:"payload,omitempty"`
}

type CurrencyParam struct {
	FallbackValue string `json:"fallback_value"`
	Code          string `json:"code"`
	Amount1000    int    `json:"amount_1000"`
}

type DateTimeParam struct {
	FallbackValue string `json:"fallback_value"`
}

type TemplateObject struct {
	Name           string              `json:"name"`
	Language       TemplateLanguage     `json:"language"`
	Components     []TemplateComponent  `json:"components"`
}

// --- Interactive Types ---

type InteractiveSend struct {
	Type   string              `json:"type"`
	Header *InteractiveHeader  `json:"header,omitempty"`
	Body   *InteractiveBody    `json:"body,omitempty"`
	Footer *InteractiveFooter  `json:"footer,omitempty"`
	Action *InteractiveAction  `json:"action"`
}

type InteractiveHeader struct {
	Type     string       `json:"type"`
	Text     string       `json:"text,omitempty"`
	Image    *MediaObject `json:"image,omitempty"`
	Video    *MediaObject `json:"video,omitempty"`
	Document *MediaObject `json:"document,omitempty"`
}

type InteractiveBody struct {
	Text string `json:"text"`
}

type InteractiveFooter struct {
	Text string `json:"text"`
}

type InteractiveAction struct {
	Button     string          `json:"button,omitempty"`
	Buttons    []ActionButton  `json:"buttons,omitempty"`
	Sections   []ListSection   `json:"sections,omitempty"`
	CatalogID  string          `json:"catalog_id,omitempty"`
	ProductID  string          `json:"product_retailer_id,omitempty"`
}

type ActionButton struct {
	Type    string        `json:"type"`
	Reply   *ReplyConfig  `json:"reply,omitempty"`
}

type ReplyConfig struct {
	ID     string `json:"id"`
	Title  string `json:"title"`
}

type ListSection struct {
	Title    string          `json:"title"`
	Rows     []ListRow       `json:"rows"`
}

type ListRow struct {
	ID          string `json:"id"`
	Title       string `json:"title"`
	Description string `json:"description,omitempty"`
}

// --- Business Profile ---

type BusinessProfile struct {
	About           string   `json:"about,omitempty"`
	Address         string   `json:"address,omitempty"`
	Description     string   `json:"description,omitempty"`
	Email           string   `json:"email,omitempty"`
	ProfilePicURL   string   `json:"profile_picture_url,omitempty"`
	Vertical        string   `json:"vertical,omitempty"`
	Websites        []string `json:"websites,omitempty"`
}

// --- Response Types ---

type SendResponse struct {
	MessagingProduct string  `json:"messaging_product"`
	Contacts         []struct {
		Input string `json:"input"`
		WaID  string `json:"wa_id"`
	} `json:"contacts"`
	Messages []struct {
		ID string `json:"id"`
	} `json:"messages"`
}

type MediaUploadResponse struct {
	ID string `json:"id"`
}

type MediaInfoResponse struct {
	ID         string `json:"id"`
	MimeType   string `json:"mime_type"`
	SHA256     string `json:"sha256"`
	FileSize   int    `json:"file_size"`
	URL        string `json:"url"`
	MessagingProduct string `json:"messaging_product"`
}

type TemplateListResponse struct {
	Data   []TemplateInfo `json:"data"`
	Paging *PagingInfo    `json:"paging,omitempty"`
}

type TemplateInfo struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Status      string `json:"status"`
	Category    string `json:"category"`
	Language    string `json:"language"`
	Components  []map[string]interface{} `json:"components"`
}

type PagingInfo struct {
	Cursors  *PagingCursors `json:"cursors,omitempty"`
	Next     string         `json:"next,omitempty"`
	Previous string         `json:"previous,omitempty"`
}

type PagingCursors struct {
	Before string `json:"before"`
	After  string `json:"after"`
}

type APIError struct {
	Code    int    `json:"code"`
	Title   string `json:"title"`
	Message string `json:"message"`
	Details string `json:"details,omitempty"`
	HRef    string `json:"href,omitempty"`
}

// --- Internal Types ---

type WhatsAppMessage struct {
	ID             string
	From           string
	To             string
	Timestamp      time.Time
	Type           string
	TextBody       string
	MediaID        string
	MediaMimeType  string
	MediaCaption   string
	MediaFilename  string
	SenderName     string
	ContextFrom    string
	ContextMsgID   string
	IsFromMe       bool
}

type IncomingProcessor struct {
	Message *WhatsAppMessage
	Raw     *IncomingMessage
}

// MessageStatus constants
const (
	StatusSent       = "sent"
	StatusDelivered  = "delivered"
	StatusRead       = "read"
	StatusFailed     = "failed"
	StatusPending    = "pending"
	StatusWarning    = "warning"
)

// MessageType constants
const (
	MsgTypeText       = "text"
	MsgTypeImage      = "image"
	MsgTypeAudio      = "audio"
	MsgTypeVideo      = "video"
	MsgTypeDocument   = "document"
	MsgTypeSticker    = "sticker"
	MsgTypeButton     = "button"
	MsgTypeInteractive = "interactive"
	MsgTypeOrder      = "order"
	MsgTypeSystem     = "system"
	MsgTypeUnknown    = "unknown"
)

func messageTypeFromCloud(incomingType string) string {
	switch incomingType {
	case "text":
		return "text"
	case "image":
		return "image"
	case "audio":
		return "audio"
	case "video":
		return "video"
	case "document":
		return "document"
	case "sticker":
		return "sticker"
	case "button":
		return "button"
	case "interactive":
		return "interactive"
	case "order":
		return "order"
	case "system":
		return "system"
	default:
		return "unknown"
	}
}
