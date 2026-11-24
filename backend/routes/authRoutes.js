import { Router } from 'express';
import {
  createAuthToken,
  requireAuth,
  safeCompare,
} from '../middleware/authMiddleware.js';

const router = Router();

// Proteção simples contra força bruta (máx. 10 tentativas falhas por IP a cada 15 min)
const failedAttempts = new Map();
const MAX_ATTEMPTS = 10;
const WINDOW_MS = 15 * 60 * 1000;

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || 'unknown';
}

function checkRateLimit(ip) {
  const record = failedAttempts.get(ip);
  if (!record) return { blocked: false };
  if (Date.now() - record.firstAttemptAt > WINDOW_MS) {
    failedAttempts.delete(ip);
    return { blocked: false };
  }
  if (record.count >= MAX_ATTEMPTS) {
    const remainingMin = Math.ceil((WINDOW_MS - (Date.now() - record.firstAttemptAt)) / 60000);
    return { blocked: true, remainingMin };
  }
  return { blocked: false };
}

function registerFailure(ip) {
  const now = Date.now();
  const record = failedAttempts.get(ip);
  if (!record || now - record.firstAttemptAt > WINDOW_MS) {
    failedAttempts.set(ip, { count: 1, firstAttemptAt: now });
  } else {
    record.count += 1;
  }
}

router.post('/login', (req, res) => {
  const ip = getClientIp(req);
  const limit = checkRateLimit(ip);
  if (limit.blocked) {
    return res.status(429).json({
      error: `Muitas tentativas de login incorretas. Tente novamente em ${limit.remainingMin} minuto(s).`,
      code: 'TOO_MANY_ATTEMPTS',
    });
  }

  const expectedUser = process.env.AUTH_USERNAME?.trim();
  const expectedPass = process.env.AUTH_PASSWORD;

  if (!expectedUser || !expectedPass) {
    return res.status(500).json({
      error:
        'Autenticação não configurada no servidor. Defina AUTH_USERNAME e AUTH_PASSWORD nas variáveis de ambiente.',
      code: 'AUTH_NOT_CONFIGURED',
    });
  }

  const { username = '', password = '' } = req.body || {};
  const inputUser = String(username).trim();
  const inputPass = String(password);

  if (!inputUser || !inputPass) {
    return res.status(400).json({
      error: 'Informe usuário e senha para entrar.',
      code: 'MISSING_CREDENTIALS',
    });
  }

  const userOk = safeCompare(inputUser, expectedUser);
  const passOk = safeCompare(inputPass, expectedPass);

  if (!userOk || !passOk) {
    registerFailure(ip);
    return res.status(401).json({
      error: 'Usuário ou senha incorretos.',
      code: 'INVALID_CREDENTIALS',
    });
  }

  failedAttempts.delete(ip);
  const token = createAuthToken(expectedUser);

  return res.json({
    token,
    user: { username: expectedUser },
  });
});

router.get('/me', requireAuth, (req, res) => {
  return res.json({
    user: req.user,
  });
});

export default router;
