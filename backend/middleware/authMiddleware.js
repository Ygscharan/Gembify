import crypto from 'node:crypto';
import { toPublicUser, userRepository } from '../repositories/userRepository.js';

const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 dias
const FALLBACK_SECRET = crypto.randomBytes(32).toString('hex');

function getAuthSecret() {
  return process.env.AUTH_SECRET?.trim() || process.env.GEMINI_API_KEY?.trim() || FALLBACK_SECRET;
}

function toBase64Url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function fromBase64Url(input) {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/');
  const padLen = (4 - (padded.length % 4)) % 4;
  return Buffer.from(padded + '='.repeat(padLen), 'base64').toString('utf-8');
}

function signData(data) {
  return crypto
    .createHmac('sha256', getAuthSecret())
    .update(data)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

export function safeCompare(a, b) {
  const hashA = crypto.createHash('sha256').update(String(a)).digest();
  const hashB = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

export function createAuthToken(user) {
  const payload = {
    sub: user.id,
    username: user.username,
    role: user.role,
    iat: Date.now(),
    exp: Date.now() + TOKEN_TTL_MS,
  };
  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signature = signData(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export function verifyAuthToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [encodedPayload, signature] = parts;
  const expectedSig = signData(encodedPayload);

  if (!safeCompare(signature, expectedSig)) {
    return null;
  }

  try {
    const payload = JSON.parse(fromBase64Url(encodedPayload));
    if (!payload?.sub || typeof payload.exp !== 'number') {
      return null;
    }
    if (Date.now() > payload.exp) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    const token = match?.[1]?.trim();

    const payload = verifyAuthToken(token);
    if (!payload) {
      return res.status(401).json({
        error: 'Sessão inválida ou expirada. Faça login para continuar.',
        code: 'UNAUTHORIZED',
      });
    }

    const user = await userRepository.findById(payload.sub);
    if (!user) {
      return res.status(401).json({
        error: 'Conta não encontrada ou removida. Faça login novamente.',
        code: 'UNAUTHORIZED',
      });
    }

    if (user.isBlocked) {
      return res.status(403).json({
        error: 'Sua conta foi bloqueada pelo administrador.',
        code: 'ACCOUNT_BLOCKED',
      });
    }

    req.user = toPublicUser(user);
    return next();
  } catch (err) {
    return next(err);
  }
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({
      error: 'Acesso restrito ao administrador da plataforma.',
      code: 'FORBIDDEN',
    });
  }
  return next();
}
