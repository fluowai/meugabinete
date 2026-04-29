# Build stage
FROM golang:1.21-alpine AS builder

# Instalar dependências para compilação (se necessário)
RUN apk add --no-cache git gcc musl-dev

WORKDIR /app

# Copiar arquivos de dependência
COPY go.mod go.sum ./
RUN go mod download

# Copiar o restante do código
COPY . .

# Compilar o binário (estático para rodar no Alpine)
RUN CGO_ENABLED=0 GOOS=linux go build -o whatsapp-service main.go

# Final stage
FROM alpine:latest

RUN apk add --no-cache ca-certificates tzdata

WORKDIR /app

# Copiar o binário do builder
COPY --from=builder /app/whatsapp-service .
# Copiar o .env apenas para garantir, mas o Railway usará variáveis de ambiente
COPY .env . 

CMD ["./whatsapp-service"]
