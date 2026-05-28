package handler

import "testing"

func TestNormalizePhoneAddsBrazilPrefix(t *testing.T) {
	normalized, digits := NormalizePhone("(11) 99999-9999")

	if normalized != "5511999999999" {
		t.Fatalf("normalized = %q, want %q", normalized, "5511999999999")
	}
	if digits != "5511999999999" {
		t.Fatalf("digits = %q, want %q", digits, "5511999999999")
	}
}

func TestMapPriority(t *testing.T) {
	cases := map[string]string{
		"Alta":    "high",
		"Urgente": "urgent",
		"Baixa":   "low",
		"Média":   "medium",
		"":        "medium",
	}

	for input, want := range cases {
		if got := mapPriority(input); got != want {
			t.Fatalf("mapPriority(%q) = %q, want %q", input, got, want)
		}
	}
}
