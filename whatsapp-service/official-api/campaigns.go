package officialapi

import (
	"log"
	"strings"
	"sync"
	"time"
)

type CampaignSender struct {
	client       *WhatsAppCloudClient
	concurrency  int
	rateLimitPerMinute int
	mu           sync.Mutex
	sentCount    int
	failedCount  int
}

type CampaignResult struct {
	Total      int            `json:"total"`
	Sent       int            `json:"sent"`
	Failed     int            `json:"failed"`
	Errors     []CampaignError `json:"errors,omitempty"`
	DurationMs int64          `json:"duration_ms"`
}

type CampaignError struct {
	Phone string `json:"phone"`
	Error string `json:"error"`
}

func NewCampaignSender(client *WhatsAppCloudClient) *CampaignSender {
	return &CampaignSender{
		client:             client,
		concurrency:        5,
		rateLimitPerMinute: 60,
	}
}

func (s *CampaignSender) SetConcurrency(n int) {
	if n < 1 {
		n = 1
	}
	if n > 20 {
		n = 20
	}
	s.concurrency = n
}

func (s *CampaignSender) SetRateLimit(perMinute int) {
	if perMinute < 1 {
		perMinute = 1
	}
	s.rateLimitPerMinute = perMinute
}

func (s *CampaignSender) SendTextToMany(targets []string, text string) *CampaignResult {
	return s.sendBatch(targets, func(phone string) error {
		return s.client.SendText(phone, text)
	})
}

func (s *CampaignSender) SendTemplateToMany(targets []string, template *TemplateMessage) *CampaignResult {
	return s.sendBatch(targets, func(phone string) error {
		return s.client.SendTemplate(phone, template)
	})
}

func (s *CampaignSender) sendBatch(targets []string, sendFn func(string) error) *CampaignResult {
	start := time.Now()
	result := &CampaignResult{Total: len(targets)}

	if len(targets) == 0 {
		return result
	}

	sem := make(chan struct{}, s.concurrency)
	rateLimiter := time.NewTicker(time.Minute / time.Duration(s.rateLimitPerMinute))
	defer rateLimiter.Stop()

	var mu sync.Mutex
	var wg sync.WaitGroup

	for _, phone := range targets {
		<-rateLimiter.C
		sem <- struct{}{}
		wg.Add(1)

		go func(p string) {
			defer wg.Done()
			defer func() { <-sem }()

			if err := sendFn(p); err != nil {
				log.Printf("[Campaign] Failed to send to %s: %v", p, err)
				mu.Lock()
				result.Failed++
				result.Errors = append(result.Errors, CampaignError{Phone: p, Error: err.Error()})
				mu.Unlock()
			} else {
				mu.Lock()
				result.Sent++
				mu.Unlock()
			}
		}(phone)
	}

	wg.Wait()
	result.DurationMs = time.Since(start).Milliseconds()

	log.Printf("[Campaign] Finished: %d sent, %d failed, %d total in %dms",
		result.Sent, result.Failed, result.Total, result.DurationMs)

	return result
}

func (s *CampaignSender) SendWithTracking(targets []string, template *TemplateMessage, statusCallback func(phone, status string)) *CampaignResult {
	start := time.Now()
	result := &CampaignResult{Total: len(targets)}

	if len(targets) == 0 {
		return result
	}

	sem := make(chan struct{}, s.concurrency)
	rateLimiter := time.NewTicker(time.Minute / time.Duration(s.rateLimitPerMinute))
	defer rateLimiter.Stop()

	var mu sync.Mutex
	var wg sync.WaitGroup

	for _, phone := range targets {
		<-rateLimiter.C
		sem <- struct{}{}
		wg.Add(1)

		go func(p string) {
			defer wg.Done()
			defer func() { <-sem }()

			err := s.client.SendTemplate(p, template)
			if err != nil {
				log.Printf("[Campaign] Failed to send to %s: %v", p, err)
				mu.Lock()
				result.Failed++
				result.Errors = append(result.Errors, CampaignError{Phone: p, Error: err.Error()})
				mu.Unlock()
				if statusCallback != nil {
					statusCallback(p, "failed")
				}
			} else {
				mu.Lock()
				result.Sent++
				mu.Unlock()
				if statusCallback != nil {
					callbackPhone := p
					callbackStatus := "sent"
					go func() {
						time.Sleep(5 * time.Second)
						statusCallback(callbackPhone, callbackStatus)
					}()
				}
			}
		}(phone)
	}

	wg.Wait()
	result.DurationMs = time.Since(start).Milliseconds()

	return result
}

type QueueManager struct {
	client   *WhatsAppCloudClient
	queue    chan QueueItem
	mu       sync.Mutex
	running  bool
	stopChan chan struct{}
}

type QueueItem struct {
	Phone    string
	Template *TemplateMessage
	Callback func(error)
}

func NewQueueManager(client *WhatsAppCloudClient, bufferSize int) *QueueManager {
	if bufferSize <= 0 {
		bufferSize = 1000
	}
	return &QueueManager{
		client:   client,
		queue:    make(chan QueueItem, bufferSize),
		stopChan: make(chan struct{}),
	}
}

func (qm *QueueManager) Start(workers int) {
	qm.mu.Lock()
	if qm.running {
		qm.mu.Unlock()
		return
	}
	qm.running = true
	qm.mu.Unlock()

	for i := 0; i < workers; i++ {
		go qm.worker(i)
	}

	log.Printf("[QueueManager] Started with %d workers", workers)
}

func (qm *QueueManager) Stop() {
	qm.mu.Lock()
	defer qm.mu.Unlock()

	if !qm.running {
		return
	}

	close(qm.stopChan)
	qm.running = false
	log.Println("[QueueManager] Stopped")
}

func (qm *QueueManager) Enqueue(phone string, template *TemplateMessage, callback func(error)) {
	qm.queue <- QueueItem{
		Phone:    phone,
		Template: template,
		Callback: callback,
	}
}

func (qm *QueueManager) worker(id int) {
	for {
		select {
		case <-qm.stopChan:
			return
		case item := <-qm.queue:
			err := qm.client.SendTemplate(item.Phone, item.Template)
			if err != nil {
				log.Printf("[QueueManager/Worker-%d] Failed to send to %s: %v", id, item.Phone, err)
			}
			if item.Callback != nil {
				item.Callback(err)
			}
			time.Sleep(500 * time.Millisecond)
		}
	}
}

func (s *CampaignSender) PrepareTemplate(name, langCode string, params map[string]string) *TemplateMessage {
	tm := &TemplateMessage{
		Name:     name,
		Language: TemplateLanguage{Code: langCode},
	}

	if len(params) > 0 {
		var bodyParams []TemplateParameter
		for _, val := range params {
			bodyParams = append(bodyParams, TemplateParameter{
				Type: "text",
				Text: val,
			})
		}

		tm.Components = []TemplateComponent{
			{
				Type:       "body",
				Parameters: bodyParams,
			},
		}
	}

	return tm
}

func FormatPhoneWithCountryCode(phone string) string {
	clean := phone
	for _, c := range []string{"+", " ", "-", "(", ")"} {
		clean = strings.ReplaceAll(clean, c, "")
	}

	if !strings.HasPrefix(clean, "55") && len(clean) >= 10 {
		clean = "55" + clean
	}

	return clean
}
