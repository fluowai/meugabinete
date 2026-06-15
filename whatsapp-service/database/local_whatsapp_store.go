package database

import (
	"context"
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/url"
	"os"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
	"sync"
	"time"

	_ "modernc.org/sqlite"
)

var localWhatsAppStore = struct {
	sync.Mutex
	db *sql.DB
}{}

func supportsLocalWhatsAppFallback(table string) bool {
	return strings.HasPrefix(table, "whatsapp_")
}

func saveLocalWhatsAppRecord(table, conflictTarget string, data interface{}) ([]byte, error) {
	db, err := getLocalWhatsAppDB()
	if err != nil {
		return nil, err
	}
	payload, err := toRecordMap(data)
	if err != nil {
		return nil, err
	}
	if strings.TrimSpace(stringValue(payload["id"])) == "" {
		payload["id"] = newLocalID()
	}

	recordKey := localRecordKey(payload, conflictTarget)
	if recordKey == "" {
		recordKey = stringValue(payload["id"])
	}

	var existingJSON string
	err = db.QueryRowContext(context.Background(), `SELECT data FROM whatsapp_local_records WHERE table_name = ? AND record_key = ?`, table, recordKey).Scan(&existingJSON)
	if err == nil {
		var existing map[string]interface{}
		if json.Unmarshal([]byte(existingJSON), &existing) == nil {
			for key, value := range payload {
				existing[key] = value
			}
			payload = existing
		}
	} else if err != sql.ErrNoRows {
		return nil, err
	}

	encoded, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}
	_, err = db.ExecContext(context.Background(), `
		INSERT INTO whatsapp_local_records (table_name, record_key, data, updated_at)
		VALUES (?, ?, ?, ?)
		ON CONFLICT(table_name, record_key) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at
	`, table, recordKey, string(encoded), time.Now().UTC().Format(time.RFC3339Nano))
	if err != nil {
		return nil, err
	}
	return encoded, nil
}

func fetchLocalWhatsAppRecords(table, rawQuery string) ([]byte, error) {
	db, err := getLocalWhatsAppDB()
	if err != nil {
		return nil, err
	}
	rows, err := db.QueryContext(context.Background(), `SELECT data FROM whatsapp_local_records WHERE table_name = ?`, table)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	records := make([]map[string]interface{}, 0)
	for rows.Next() {
		var encoded string
		if err := rows.Scan(&encoded); err != nil {
			return nil, err
		}
		var record map[string]interface{}
		if json.Unmarshal([]byte(encoded), &record) == nil {
			records = append(records, record)
		}
	}
	query, _ := url.ParseQuery(rawQuery)
	records = filterLocalRecords(records, query)
	sortLocalRecords(records, query.Get("order"))
	if limit, err := strconv.Atoi(query.Get("limit")); err == nil && limit >= 0 && len(records) > limit {
		records = records[:limit]
	}
	return json.Marshal(records)
}

func getLocalWhatsAppDB() (*sql.DB, error) {
	localWhatsAppStore.Lock()
	defer localWhatsAppStore.Unlock()
	if localWhatsAppStore.db != nil {
		return localWhatsAppStore.db, nil
	}
	path := strings.TrimSpace(os.Getenv("WHATSAPP_FALLBACK_DB"))
	if path == "" {
		if info, err := os.Stat("/app/data"); err == nil && info.IsDir() {
			path = "/app/data/whatsapp_fallback.db"
		} else {
			path = filepath.Join(os.TempDir(), "meugabinete-whatsapp-fallback.db")
		}
	}
	db, err := sql.Open("sqlite", "file:"+filepath.ToSlash(path)+"?_pragma=busy_timeout(5000)&_pragma=journal_mode(WAL)")
	if err != nil {
		return nil, err
	}
	if _, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS whatsapp_local_records (
			table_name TEXT NOT NULL,
			record_key TEXT NOT NULL,
			data TEXT NOT NULL,
			updated_at TEXT NOT NULL,
			PRIMARY KEY (table_name, record_key)
		)
	`); err != nil {
		db.Close()
		return nil, err
	}
	localWhatsAppStore.db = db
	return db, nil
}

func toRecordMap(data interface{}) (map[string]interface{}, error) {
	encoded, err := json.Marshal(data)
	if err != nil {
		return nil, err
	}
	var record map[string]interface{}
	if err := json.Unmarshal(encoded, &record); err != nil {
		return nil, err
	}
	return record, nil
}

func localRecordKey(record map[string]interface{}, conflictTarget string) string {
	fields := strings.Split(strings.TrimSpace(conflictTarget), ",")
	if len(fields) == 0 || fields[0] == "" {
		fields = []string{"id"}
	}
	parts := make([]string, 0, len(fields))
	for _, field := range fields {
		value := stringValue(record[strings.TrimSpace(field)])
		if value == "" {
			return ""
		}
		parts = append(parts, value)
	}
	return strings.Join(parts, "|")
}

func filterLocalRecords(records []map[string]interface{}, query url.Values) []map[string]interface{} {
	filtered := records[:0]
	for _, record := range records {
		matches := true
		for field, values := range query {
			if field == "select" || field == "order" || field == "limit" || len(values) == 0 {
				continue
			}
			expected := strings.TrimPrefix(values[0], "eq.")
			if stringValue(record[field]) != expected {
				matches = false
				break
			}
		}
		if matches {
			filtered = append(filtered, record)
		}
	}
	return filtered
}

func sortLocalRecords(records []map[string]interface{}, order string) {
	if order == "" {
		return
	}
	parts := strings.Split(order, ".")
	field := parts[0]
	descending := len(parts) > 1 && parts[1] == "desc"
	sort.SliceStable(records, func(i, j int) bool {
		left := stringValue(records[i][field])
		right := stringValue(records[j][field])
		if descending {
			return left > right
		}
		return left < right
	})
}

func stringValue(value interface{}) string {
	switch typed := value.(type) {
	case nil:
		return ""
	case string:
		return typed
	case bool:
		return strconv.FormatBool(typed)
	case float64:
		return strconv.FormatFloat(typed, 'f', -1, 64)
	default:
		return fmt.Sprint(typed)
	}
}

func newLocalID() string {
	buffer := make([]byte, 16)
	if _, err := rand.Read(buffer); err != nil {
		return fmt.Sprintf("local-%d", time.Now().UnixNano())
	}
	return hex.EncodeToString(buffer)
}
