import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { initDatabase, isPostgresEnabled } from './db/database.js';
import { userRepository } from './repositories/userRepository.js';
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import { requireAdmin, requireAuth } from './middleware/authMiddleware.js';

const app = express();
const PORT = Number(process.env.PORT) || 3001;

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim())
  : ['*'];

app.use(
  cors({
    origin: allowedOrigins.includes('*') ? true : allowedOrigins,
  })
);
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (_req, res) => {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  res.json({
    status: 'ok',
    service: 'Gembify — Consultoria Lean Manufacturing API',
    storage: isPostgresEnabled() ? 'postgresql' : 'json-local',
    aiConfigured: Boolean(apiKey && apiKey !== 'sua_chave_gemini_aqui'),
    aiModel: process.env.AI_MODEL?.trim() || 'gemini-2.5-flash',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/reports', requireAuth, reportRoutes);
app.use('/api/admin', requireAuth, requireAdmin, adminRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: 'Rota não encontrada.' });
});

app.use((err, _req, res, _next) => {
  console.error('[MFV API Error]', err);

  const statusCode = err.statusCode || err.status || 500;
  const message =
    err.code === 'AI_KEY_MISSING'
      ? err.message
      : err.message || 'Erro interno ao processar a solicitação na API.';

  res.status(statusCode).json({
    error: message,
    code: err.code || 'INTERNAL_ERROR',
  });
});

async function startServer() {
  await initDatabase();
  const admin = await userRepository.ensureAdminSeed();

  app.listen(PORT, () => {
    const configured = Boolean(
      process.env.GEMINI_API_KEY?.trim() &&
        process.env.GEMINI_API_KEY.trim() !== 'sua_chave_gemini_aqui'
    );
    const storageMode = isPostgresEnabled() ? 'PostgreSQL (Nuvem)' : 'JSON Local (Fallback)';
    console.log(`\n🏭 Gembify Lean API rodando em http://localhost:${PORT}`);
    console.log(`🗄️  Persistência: ${storageMode} | Admin: ${admin ? admin.username : 'não configurado'}`);
    console.log(`🤖 Modelo IA: ${process.env.AI_MODEL || 'gemini-2.5-flash'} | Chave configurada: ${configured ? 'SIM' : 'NÃO (verifique backend/.env)'}\n`);
  });
}

startServer().catch((err) => {
  console.error('[Gembify Startup Fatal Error]', err);
  process.exit(1);
});
