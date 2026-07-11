# Meu Gabinete

Sistema de gestao de gabinete para receber, protocolar, classificar e acompanhar demandas enviadas por cidadaos via WhatsApp.

## Principais fluxos

- Atendimento WhatsApp em tempo real.
- Cadastro de cidadaos e demandas com protocolo.
- Kanban de triagem, encaminhamento, execucao, resposta e resolucao.
- Tags, prioridade, responsavel interno e tarefas de acompanhamento.
- IA para classificar tema, urgencia, bairro, orgao responsavel e proxima acao.
- Relatorios para acompanhar demandas por status, tema, bairro e prazo.

## Stack

- Frontend: React, Vite, TypeScript e Tailwind.
- Backend: Node.js, Express e Supabase/PostgreSQL.
- WhatsApp: servico Go com WhatsMeow.
- IA: Gemini/Groq/OpenAI conforme configuracao da organizacao.

## Desenvolvimento

```bash
npm install
npm run dev
npm run server
```

Antes de usar em producao, configure as variaveis de ambiente a partir de `.env.production.template` e aplique as migracoes SQL.
