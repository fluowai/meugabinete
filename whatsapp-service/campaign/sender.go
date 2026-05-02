package campaign

import (
	"context"
	"fmt"
	"strings"
	"time"

	"go.mau.fi/whatsmeow"
	"go.mau.fi/whatsmeow/types"
	"go.mau.fi/whatsmeow/proto/waE2E"
	"google.golang.org/protobuf/proto"
)

func SendBulk(ctx context.Context, client *whatsmeow.Client, targets []string, message string) (sent, failed int) {
	for _, target := range targets {
		phone := normalizePhone(target)
		jid, err := types.ParseJID(phone)
		if err != nil {
			failed++
			continue
		}

		_, err = client.SendMessage(ctx, jid, &waE2E.Message{
			Conversation: proto.String(message),
		})

		if err != nil {
			fmt.Printf("Erro ao enviar para %s: %v\n", phone, err)
			failed++
		} else {
			sent++
		}

		time.Sleep(500 * time.Millisecond)
	}
	return
}

func normalizePhone(phone string) string {
	clean := strings.TrimPrefix(phone, "+")
	if !strings.HasPrefix(clean, "55") {
		clean = "55" + clean
	}
	return clean + "@s.whatsapp.net"
}
