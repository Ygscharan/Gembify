import { Router } from 'express';
import { createAuthToken, requireAuth } from '../middleware/authMiddleware.js';
import {
  toPublicUser,
  userRepository,
  verifyPassword,
} from '../repositories/userRepository.js';

const router = Router();

// Proteção contra força bruta (máx. 12 tentativas falhas por IP a cada 15 min)
const failedAttempts = new Map();
const MAX_ATTEMPTS = 12;
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

function validatePasswordPolicy(password) {
  const value = String(password || '');
  const hasMinLength = value.length >= 6;
  const hasUpper = /[A-Z]/.test(value);
  const hasLower = /[a-z]/.test(value);
  const hasSpecial = /[^A-Za-z0-9\s]/.test(value);

  if (!hasMinLength || !hasUpper || !hasLower || !hasSpecial) {
    return {
      valid: false,
      message:
        'A senha deve ter no mínimo 6 caracteres, incluindo pelo menos 1 letra maiúscula, letras minúsculas e 1 caractere especial (ex: !@#$%&*).',
    };
  }
  return { valid: true };
}

router.get('/check-username', async (req, res, next) => {
  try {
    const raw = String(req.query.username || '').trim();
    if (!/^[a-zA-Z0-9._-]{3,30}$/.test(raw)) {
      return res.json({
        available: false,
        reason: 'Use de 3 a 30 caracteres (letras, números, ponto, _ ou -).',
      });
    }

    const existing = await userRepository.findByUsername(raw);
    return res.json({
      available: !existing,
      reason: existing ? 'Este nome de usuário já está em uso.' : null,
    });
  } catch (err) {
    return next(err);
  }
});

router.post('/register', async (req, res, next) => {
  try {
    const { name = '', username = '', email = '', password = '' } = req.body || {};

    const cleanName = String(name).trim();
    const cleanUsername = String(username).trim();
    const cleanEmail = String(email).trim().toLowerCase();
    const cleanPassword = String(password);

    if (cleanName.length < 2 || cleanName.length > 80) {
      return res.status(400).json({
        error: 'Informe seu nome completo (mínimo 2 caracteres).',
      });
    }

    if (!/^[a-zA-Z0-9._-]{3,30}$/.test(cleanUsername)) {
      return res.status(400).json({
        error: 'O usuário deve ter entre 3 e 30 caracteres (apenas letras, números, ponto, _ ou -).',
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({
        error: 'Informe um e-mail válido.',
      });
    }

    const passwordCheck = validatePasswordPolicy(cleanPassword);
    if (!passwordCheck.valid) {
      return res.status(400).json({
        error: passwordCheck.message,
      });
    }

    const existingUser = await userRepository.findByUsername(cleanUsername);
    if (existingUser) {
      return res.status(409).json({
        error: 'Este nome de usuário já está em uso. Escolha outro.',
      });
    }

    const existingEmail = await userRepository.findByEmail(cleanEmail);
    if (existingEmail) {
      return res.status(409).json({
        error: 'Este e-mail já possui uma conta cadastrada.',
      });
    }

    const newUser = await userRepository.create({
      name: cleanName,
      username: cleanUsername,
      email: cleanEmail,
      password: cleanPassword,
      role: 'user',
    });

    await userRepository.touchLastLogin(newUser.id);
    const token = createAuthToken(newUser);

    return res.status(201).json({
      token,
      user: toPublicUser(newUser),
    });
  } catch (err) {
    if (err?.code === '23505') {
      return res.status(409).json({
        error: 'Usuário ou e-mail já cadastrado.',
      });
    }
    return next(err);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const ip = getClientIp(req);
    const limit = checkRateLimit(ip);
    if (limit.blocked) {
      return res.status(429).json({
        error: `Muitas tentativas incorretas. Tente novamente em ${limit.remainingMin} minuto(s).`,
        code: 'TOO_MANY_ATTEMPTS',
      });
    }

    const { identifier, username, password = '' } = req.body || {};
    const loginId = String(identifier ?? username ?? '').trim();
    const inputPass = String(password);

    if (!loginId || !inputPass) {
      return res.status(400).json({
        error: 'Informe usuário (ou e-mail) e senha para entrar.',
        code: 'MISSING_CREDENTIALS',
      });
    }

    const user = await userRepository.findByUsernameOrEmail(loginId);
    if (!user || !verifyPassword(inputPass, user.passwordHash)) {
      registerFailure(ip);
      return res.status(401).json({
        error: 'Usuário ou senha incorretos.',
        code: 'INVALID_CREDENTIALS',
      });
    }

    if (user.isBlocked) {
      return res.status(403).json({
        error: 'Sua conta foi bloqueada pelo administrador. Entre em contato para reativação.',
        code: 'ACCOUNT_BLOCKED',
      });
    }

    failedAttempts.delete(ip);
    await userRepository.touchLastLogin(user.id);
    const token = createAuthToken(user);

    return res.json({
      token,
      user: toPublicUser(user),
    });
  } catch (err) {
    return next(err);
  }
});

router.get('/me', requireAuth, (req, res) => {
  return res.json({
    user: req.user,
  });
});

export default router;
