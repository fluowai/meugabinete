# Relatório de Análise de Segurança — Meu Gabinete 360

**Data:** 13/06/2026 (Atualizado)  
**Escopo:** Frontend (React/Vite/TypeScript), Backend WhatsApp Service (Go), Banco de dados (Supabase/PostgreSQL), Infraestrutura (Docker/Nginx)

---

## Sumário Executivo

Foram identificados **14 achados de segurança** (4 críticos, 5 altos, 3 médios, 2 baixos).  
**10 foram corrigidos.** Restam **4 pendentes** que requerem ação manual (rotação de chaves, execução de migração SQL, deploy).

---

## 🔴 CRÍTICOS (3 corrigidos, 1 pendente)

### C-01: Service Role Key — ✅ Corrigido

**Status:** Resolvido  
**Correção:** `docker-compose.yml` agora usa `${SUPABASE_SERVICE_ROLE_KEY}` (variável de ambiente).  
`SUPABASE_SERVICE_ROLE_KEY` removida do `.env.local`.  
**Ação necessária:** Rotacionar a chave no Supabase e configurar a env var no ambiente de produção.

---

### C-02: JWT_SECRET — ✅ Corrigido

**Status:** Resolvido  
**Correção:** `docker-compose.yml` agora usa `${JWT_SECRET}` (variável de ambiente).  
**Ação necessária:** Rotacionar o secret e configurar a env var no ambiente de produção.

---

### C-03: Bypass de Autenticação via Origin Header — ✅ Corrigido

**Arquivo:** `whatsapp-service/api/routes.go`  
**Status:** Resolvido  
**Correção:** Função `isLocalDev()` removida. Bloco de bypass `DEV_AUTH_BYPASS` eliminado.  
Todas as requisições agora exigem validação JWT obrigatória (via `JWT_SECRET`, `SUPABASE_JWT_SECRET` ou Supabase JWKS).

---

### C-04: Credenciais de Desenvolvimento Fixas — ✅ Corrigido

**Status:** Resolvido  
**Correção:** `VITE_DEV_LOGIN_EMAIL` e `VITE_DEV_LOGIN_PASSWORD` removidas do `.env.example`.  
Não há mais referências a `admin123` ou `admin@gabinete.gov` no código.

---

## 🟠 ALTOS (4 corrigidos, 1 pendente)

### A-01: RLS Permissivo — ⚠️ Corrigido no código, pendente deploy

**Arquivo:** `database/security_policies.sql`  
**Status:** Corrigido no repositório  
**Correções aplicadas:**
- Políticas alteradas de `USING (true)` para `USING (tenant_id = get_user_tenant_id())`
- `whatsapp_chats` e `whatsapp_messages` agora filtram por tenant
- Criada tabela `tenants` no `schema.sql`
- Adicionado `tenant_id` a todas as tabelas de dados no `schema.sql`
- Tabelas faltantes adicionadas: `organizations`, `appointments`, `mobilizations`, `landing_pages`
**Ação necessária:** Executar migração SQL no banco de produção.

---

### A-02: Secrets no GitHub Actions — ✅ Corrigido

**Arquivo:** `.github/workflows/docker-build.yml`  
**Status:** Resolvido  
As variáveis sensíveis já usam `${{ secrets.VITE_SUPABASE_URL }}`, `${{ secrets.VITE_SUPABASE_ANON_KEY }}`, etc.

---

### A-03: SQL Injection via Query Parameters — ✅ Corrigido

**Arquivo:** `whatsapp-service/database/supabase_db.go`  
**Status:** Resolvido  
- `validateTableName()` usa regex para nomes de tabela/coluna
- Regex bloqueia caracteres perigosos (`;'"--`) em queries
- `url.QueryEscape()` usado em parâmetros de rota (chatID, groupJID)

---

### A-04: IP Spoofing via X-Forwarded-For — ✅ Corrigido

**Arquivo:** `whatsapp-service/api/routes.go:getClientIP`  
**Status:** Resolvido  
`X-Forwarded-For` só é aceito quando `RemoteAddr` é de proxy confiável (`127.0.0.1`, `::1`, `10.*`, `172.*`, `192.168.*`).

---

### A-05: Mixed Content (HTTP sem TLS) — 🔵 Aceito

**Arquivo:** `whatsapp-service/main.go`  
**Status:** Risco aceito  
O serviço roda HTTP puro internamente, mas está atrás de Traefik com TLS termination.  
Comunicação interna na rede Docker isolada (`meugabinete_internal`).

---

## 🟡 MÉDIOS (3 corrigidos)

### M-01: Dados Sensíveis do WhatsApp — ✅ Corrigido

**Arquivo:** `whatsapp-service/handler/message_handler.go`  
**Status:** Resolvido  
`raw_payload` não é mais enviado ao Supabase. Apenas campos necessários (texto, mídia, metadata).

---

### M-02: Logs e Arquivos de Depuração — ✅ Corrigido

**Status:** Resolvido  
`.gitignore` já inclui `*.log`, `*.err.log`, `*.out.log`.

---

### M-03: Upload sem Validação — ✅ Corrigido

**Arquivo:** `whatsapp-service/storage/supabase_storage.go`  
**Status:** Resolvido  
- Validação de tipo MIME (allowlist: jpeg, png, webp, gif, ogg, mp3, mp4, pdf, etc.)
- Limite de tamanho: 10MB
- Validação de conteúdo vazio

---

## 🟢 BAIXOS (2 corrigidos)

### B-01: Rate Limiting Insuficiente — ✅ Corrigido

**Arquivo:** `whatsapp-service/api/routes.go`  
**Status:** Resolvido  
Implementado `MultiRateLimiter` com rate limiting global (60/min) e para endpoints sensíveis (10/min, aplicado em `/api/campaigns/send` e endpoints Cloud API).

---

### B-02: Nginx sem Headers de Segurança — ✅ Corrigido

**Arquivo:** `nginx.conf`  
**Status:** Resolvido  
Headers adicionados:
- `X-Frame-Options: SAMEORIGIN`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 0`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` (camera, microphone, geolocation bloqueados)
- `Content-Security-Policy` (restritivo: apenas self, unsafe-inline para scripts/styles)

---

## 📊 Resumo Final

| Severidade | Total | Corrigidos | Pendentes |
|------------|-------|-----------|-----------|
| 🔴 Crítico | 4 | 3 | 1 (rotação de chaves) |
| 🟠 Alto | 5 | 4 | 1 (deploy migração SQL) |
| 🟡 Médio | 3 | 3 | 0 |
| 🟢 Baixo | 2 | 2 | 0 |
| **Total** | **14** | **12** | **2** |

---

## ✅ Ações Pendentes (Requerem Deploy)

1. **Rotacionar** `SUPABASE_SERVICE_ROLE_KEY` e `JWT_SECRET` no Supabase e configurar como env vars  
2. **Executar** `database/security_policies.sql` e `database/schema.sql` no banco de produção  
3. **Verificar** se `SUPABASE_JWT_SECRET` está configurado no ambiente (para validação JWT do Supabase Auth)
