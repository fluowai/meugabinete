import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';

import { getSupabaseServer } from './lib/supabase-server.js';
import { verifyAuth } from './middleware/auth.js';
import { requireTenant } from './middleware/tenant.js';

import aiRoutes from './api/ai/index.js';
import crmRoutes from './api/crm/index.js';
import { setupWhatsAppProxy } from './api/whatsapp/index.js';
import tenantHandler from './api/tenant/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

const REQUIRED_ENV_VARS = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
];
const missingVars = REQUIRED_ENV_VARS.filter((v) => !process.env[v]?.trim());

console.log('\n--- WhatsApp Check ---');
console.log(`WhatsMeow URL: ${process.env.WHATSAPP_API_URL ? '✅ Configurada' : '❌ AUSENTE'}`);
console.log('-------------------------\n');

if (missingVars.length > 0) {
  console.error('\n❌ ERRO CRÍTICO: Variáveis de ambiente obrigatórias não encontradas:');
  missingVars.forEach((v) => console.error(`   ❗ ${v}`));
  console.error('\n → Em produção Docker: adicione no stack/env do serviço');
  console.error(' → Em desenvolvimento: verifique o arquivo .env na raiz\n');
}

const app = express();
app.set('trust proxy', 1);
const isProduction = process.env.NODE_ENV === 'production';

// ── Performance Timing Middleware ────────────────────────────────────────────
app.use((req, res, next) => {
  const startedAt = process.hrtime.bigint();
  const originalJson = res.json.bind(res);
  const originalEnd = res.end.bind(res);
  let timingRecorded = false;

  const recordTimingHeaders = () => {
    if (timingRecorded || res.headersSent) return;
    timingRecorded = true;
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    const currentTiming = res.getHeader('Server-Timing');
    const appTiming = `app;dur=${durationMs.toFixed(1)}`;
    res.setHeader('Server-Timing', currentTiming ? `${currentTiming}, ${appTiming}` : appTiming);
    res.setHeader('X-Response-Time', `${durationMs.toFixed(1)}ms`);
    res.setHeader('X-Process-Memory-Rss', String(process.memoryUsage().rss));
  };

  res.json = (body) => {
    if (!res.headersSent) {
      res.setHeader('X-Response-Bytes', Buffer.byteLength(JSON.stringify(body), 'utf8'));
      recordTimingHeaders();
    }
    return originalJson(body);
  };

  res.end = (...args) => {
    recordTimingHeaders();
    return originalEnd(...args);
  };

  next();
});

app.use(compression({ threshold: 1024 }));

// ── Security ────────────────────────────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: isProduction
      ? {
          useDefaults: true,
          directives: {
            "default-src": ["'self'"],
            "script-src": ["'self'", "'unsafe-inline'"],
            "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            "img-src": ["'self'", "data:", "blob:", "https:"],
            "media-src": ["'self'", "data:", "blob:", "https:"],
            "font-src": ["'self'", "data:", "https://fonts.gstatic.com"],
            "connect-src": ["'self'", "https://*.supabase.co", "wss://*.supabase.co"],
            "frame-ancestors": ["'self'"],
          },
        }
      : false,
    crossOriginEmbedderPolicy: false,
  })
);

// ── Debug Logger ────────────────────────────────────────────────────────────
app.use((req, res, next) => {
  if (!isProduction && !req.originalUrl.includes('/ws')) {
    console.log("━━━━━━━━━━━━━━━━━━━━━━");
    console.log("METHOD:", req.method);
    console.log("URL:", req.originalUrl);
    console.log("ORIGIN:", req.headers.origin || 'No Origin');
    console.log("IP:", req.ip);
    console.log("━━━━━━━━━━━━━━━━━━━━━━");
  }
  next();
});

// ── CORS ────────────────────────────────────────────────────────────────────
const envAllowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
  : [];
const devOrigins = [
  "http://localhost:3006",
  "http://localhost:3000",
  "http://127.0.0.1:3006",
];
const productionOrigins = [
  "https://meugabinete.com.br",
  "https://www.meugabinete.com.br",
  "https://app.meugabinete.com.br",
];
const allowedOrigins = new Set([
  ...envAllowedOrigins,
  ...productionOrigins,
  ...(!isProduction ? devOrigins : []),
]);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.has(origin)) return callback(null, true);
    if (!isProduction && (origin.startsWith("http://localhost") || origin.startsWith("http://127.0.0.1"))) {
      return callback(null, true);
    }
    console.error("CORS BLOCKED:", origin);
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
};

app.use(cors(corsOptions));
app.options(/(.*)/, cors(corsOptions));

// ── Rate Limiting ───────────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { error: 'Muitas requisições. Tente novamente em 15 minutos.' },
});
app.use(globalLimiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── API Routes ──────────────────────────────────────────────────────────────
app.use('/api/ai', aiRoutes);
app.use('/api/crm', crmRoutes);
app.use('/api/storage', verifyAuth, requireTenant, (await import('./api/storage/index.js')).default);

app.post('/api/onboarding', async (req, res, next) => {
  try {
    const { name, email, password, agencyName, officeName, plan = 'pro' } = req.body || {};
    const ownerEmail = String(email || '').toLowerCase().trim();
    const ownerName = String(name || '').trim();
    const organizationName = String(officeName || agencyName || '').trim();

    if (!ownerName || !ownerEmail || !password || !organizationName) {
      return res.status(400).json({
        success: false,
        error: 'Informe nome, e-mail, senha e nome do gabinete.',
      });
    }

    if (String(password).length < 6) {
      return res.status(400).json({
        success: false,
        error: 'A senha deve ter pelo menos 6 caracteres.',
      });
    }

    const supabase = getSupabaseServer();
    const slugBase = slugify(organizationName) || slugify(ownerEmail.split('@')[0]) || 'gabinete';
    const slug = `${slugBase}-${Date.now().toString(36)}`.slice(0, 64);

    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: ownerEmail,
      password,
      email_confirm: true,
      user_metadata: {
        name: ownerName,
        full_name: ownerName,
      },
    });

    if (authError || !authUser?.user?.id) {
      return res.status(400).json({
        success: false,
        error: authError?.message || 'Nao foi possivel criar o usuario.',
      });
    }

    const { data: selectedPlan } = await supabase
      .from('plans')
      .select('id')
      .eq('slug', plan)
      .maybeSingle();

    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: organizationName,
        slug,
        owner_name: ownerName,
        owner_email: ownerEmail,
        status: 'active',
        subscription_status: 'trial',
        plan_id: selectedPlan?.id || null,
        niche: 'traditional',
        trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select('id, name, slug')
      .single();

    if (orgError || !organization?.id) {
      await supabase.auth.admin.deleteUser(authUser.user.id);
      return res.status(400).json({
        success: false,
        error: orgError?.message || 'Nao foi possivel criar o gabinete.',
      });
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert(
        {
          id: authUser.user.id,
          email: ownerEmail,
          name: ownerName,
          role: 'admin',
          organization_id: organization.id,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );

    if (profileError) {
      console.warn('[Onboarding] Perfil nao criado automaticamente:', profileError.message);
    }

    return res.status(201).json({
      success: true,
      organization,
      panelUrl: '/gabinete',
    });
  } catch (error) {
    next(error);
  }
});

app.get('/api/tenant/resolve', (req, res) => tenantHandler(req, res));
app.get('/api/tenant/current', (req, res) => tenantHandler(req, res));

// ── Health & Status ─────────────────────────────────────────────────────────
app.get('/api/system-status', async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      status: "online",
      service: "meu-gabinete-backend",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
    });
  } catch (error) {
    console.error("SYSTEM STATUS ERROR:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/health', (req, res) =>
  res.json({ status: 'ok', uptime: process.uptime() })
);
app.get('/', (req, res) => res.send('Meu Gabinete API Online'));

// ── Server Startup ──────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3002;

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Meu Gabinete API active on port ${PORT}`);
});

setupWhatsAppProxy(app, server, verifyAuth, requireTenant);

// ── Fallback 404 ───────────────────────────────────────────────────────────
app.all(/(.*)/, (req, res) => {
  res.status(404).json({ success: false, error: "Route not found" });
});

// ── Global Error Handler ────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  const isDev = process.env.NODE_ENV !== 'production';
  console.error("GLOBAL ERROR:", isDev ? err : err.message);

  if (err.message && err.message.includes("CORS")) {
    return res.status(403).json({ success: false, error: err.message, code: 'CORS_BLOCKED' });
  }
  if (err.code === '23505') {
    return res.status(409).json({ success: false, error: 'Registro duplicado.', code: 'DUPLICATE_ENTRY' });
  }
  if (err.code === '23503') {
    return res.status(409).json({ success: false, error: 'Operação não permitida: registro possui vínculos.', code: 'FOREIGN_KEY_VIOLATION' });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ success: false, error: 'Arquivo muito grande. Limite: 10MB.', code: 'PAYLOAD_TOO_LARGE' });
  }

  const statusCode = err.statusCode || err.status || 500;
  res.status(statusCode).json({
    success: false,
    error: isDev ? err.message : 'Erro interno do servidor',
    ...(isDev && { stack: err.stack?.split('\n').slice(0, 5).join('\n') }),
    code: err.code || 'INTERNAL_ERROR',
  });
});

server.timeout = 0;
server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;

export default app;

function slugify(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
