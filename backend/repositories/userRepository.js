import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getPool, isPostgresEnabled } from '../db/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '..', 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

let jsonWriteQueue = Promise.resolve();

async function ensureJsonFile() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(USERS_FILE);
  } catch {
    await fs.writeFile(USERS_FILE, '[]\n', 'utf-8');
  }
}

async function readJsonUsers() {
  await ensureJsonFile();
  const raw = await fs.readFile(USERS_FILE, 'utf-8');
  if (!raw.trim()) return [];
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) ? parsed : [];
}

function writeJsonUsers(users) {
  jsonWriteQueue = jsonWriteQueue.then(async () => {
    await ensureJsonFile();
    const tempFile = `${USERS_FILE}.tmp`;
    await fs.writeFile(tempFile, `${JSON.stringify(users, null, 2)}\n`, 'utf-8');
    await fs.rename(tempFile, USERS_FILE);
  });
  return jsonWriteQueue;
}

function mapPgRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    username: row.username,
    email: row.email || null,
    passwordHash: row.password_hash,
    role: row.role,
    isBlocked: Boolean(row.is_blocked),
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    lastLoginAt:
      row.last_login_at instanceof Date
        ? row.last_login_at.toISOString()
        : row.last_login_at || null,
    reportCount: row.report_count !== undefined ? Number(row.report_count) : undefined,
  };
}

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(String(password), salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPassword(password, storedHash) {
  if (!storedHash || typeof storedHash !== 'string' || !storedHash.includes(':')) {
    return false;
  }
  const [salt, keyHex] = storedHash.split(':');
  if (!salt || !keyHex) return false;
  const derivedBuf = crypto.scryptSync(String(password), salt, 64);
  const storedBuf = Buffer.from(keyHex, 'hex');
  if (derivedBuf.length !== storedBuf.length) return false;
  return crypto.timingSafeEqual(derivedBuf, storedBuf);
}

export function toPublicUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    email: user.email || null,
    role: user.role,
    isBlocked: Boolean(user.isBlocked),
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt || null,
    ...(user.reportCount !== undefined ? { reportCount: user.reportCount } : {}),
  };
}

export const userRepository = {
  async findById(id) {
    if (isPostgresEnabled()) {
      const db = getPool();
      const { rows } = await db.query('SELECT * FROM users WHERE id = $1 LIMIT 1', [id]);
      return mapPgRow(rows[0]);
    }
    const users = await readJsonUsers();
    return users.find((u) => u.id === id) || null;
  },

  async findByUsername(username) {
    const normalized = String(username || '').trim().toLowerCase();
    if (!normalized) return null;

    if (isPostgresEnabled()) {
      const db = getPool();
      const { rows } = await db.query(
        'SELECT * FROM users WHERE LOWER(username) = $1 LIMIT 1',
        [normalized]
      );
      return mapPgRow(rows[0]);
    }
    const users = await readJsonUsers();
    return users.find((u) => u.username?.toLowerCase() === normalized) || null;
  },

  async findByEmail(email) {
    const normalized = String(email || '').trim().toLowerCase();
    if (!normalized) return null;

    if (isPostgresEnabled()) {
      const db = getPool();
      const { rows } = await db.query(
        'SELECT * FROM users WHERE LOWER(email) = $1 LIMIT 1',
        [normalized]
      );
      return mapPgRow(rows[0]);
    }
    const users = await readJsonUsers();
    return users.find((u) => u.email?.toLowerCase() === normalized) || null;
  },

  async findByUsernameOrEmail(identifier) {
    const normalized = String(identifier || '').trim().toLowerCase();
    if (!normalized) return null;

    if (isPostgresEnabled()) {
      const db = getPool();
      const { rows } = await db.query(
        'SELECT * FROM users WHERE LOWER(username) = $1 OR LOWER(email) = $1 LIMIT 1',
        [normalized]
      );
      return mapPgRow(rows[0]);
    }
    const users = await readJsonUsers();
    return (
      users.find(
        (u) =>
          u.username?.toLowerCase() === normalized ||
          (u.email && u.email.toLowerCase() === normalized)
      ) || null
    );
  },

  async create({ name, username, email = null, password, role = 'user' }) {
    const user = {
      id: crypto.randomUUID(),
      name: name.trim(),
      username: username.trim(),
      email: email?.trim() ? email.trim().toLowerCase() : null,
      passwordHash: hashPassword(password),
      role,
      isBlocked: false,
      createdAt: new Date().toISOString(),
      lastLoginAt: null,
    };

    if (isPostgresEnabled()) {
      const db = getPool();
      const { rows } = await db.query(
        `INSERT INTO users (id, name, username, email, password_hash, role, is_blocked, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          user.id,
          user.name,
          user.username,
          user.email,
          user.passwordHash,
          user.role,
          user.isBlocked,
          user.createdAt,
        ]
      );
      return mapPgRow(rows[0]);
    }

    const users = await readJsonUsers();
    users.push(user);
    await writeJsonUsers(users);
    return user;
  },

  async touchLastLogin(id) {
    const now = new Date().toISOString();
    if (isPostgresEnabled()) {
      const db = getPool();
      await db.query('UPDATE users SET last_login_at = $1 WHERE id = $2', [now, id]);
      return;
    }
    const users = await readJsonUsers();
    const idx = users.findIndex((u) => u.id === id);
    if (idx !== -1) {
      users[idx].lastLoginAt = now;
      await writeJsonUsers(users);
    }
  },

  async setBlocked(id, isBlocked) {
    if (isPostgresEnabled()) {
      const db = getPool();
      const { rows } = await db.query(
        'UPDATE users SET is_blocked = $1 WHERE id = $2 RETURNING *',
        [Boolean(isBlocked), id]
      );
      return mapPgRow(rows[0]);
    }
    const users = await readJsonUsers();
    const idx = users.findIndex((u) => u.id === id);
    if (idx === -1) return null;
    users[idx].isBlocked = Boolean(isBlocked);
    await writeJsonUsers(users);
    return users[idx];
  },

  async deleteById(id) {
    if (isPostgresEnabled()) {
      const db = getPool();
      const { rowCount } = await db.query('DELETE FROM users WHERE id = $1', [id]);
      return rowCount > 0;
    }
    const users = await readJsonUsers();
    const filtered = users.filter((u) => u.id !== id);
    if (filtered.length === users.length) return false;
    await writeJsonUsers(filtered);
    return true;
  },

  async findAllWithStats(reportCountByUserMap = null) {
    if (isPostgresEnabled()) {
      const db = getPool();
      const { rows } = await db.query(`
        SELECT u.*, COUNT(r.id)::int AS report_count
        FROM users u
        LEFT JOIN reports r ON r.user_id = u.id
        GROUP BY u.id
        ORDER BY (CASE WHEN u.role = 'admin' THEN 0 ELSE 1 END), u.created_at DESC
      `);
      return rows.map(mapPgRow);
    }

    const users = await readJsonUsers();
    return users
      .map((u) => ({
        ...u,
        reportCount: reportCountByUserMap ? reportCountByUserMap.get(u.id) || 0 : 0,
      }))
      .sort((a, b) => {
        if (a.role === 'admin' && b.role !== 'admin') return -1;
        if (a.role !== 'admin' && b.role === 'admin') return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  },

  async ensureAdminSeed() {
    const adminUsername = process.env.AUTH_USERNAME?.trim();
    const adminPassword = process.env.AUTH_PASSWORD;
    const adminName = process.env.AUTH_ADMIN_NAME?.trim() || adminUsername || 'Administrador';
    const adminEmail = process.env.AUTH_ADMIN_EMAIL?.trim() || null;

    if (!adminUsername || !adminPassword) {
      return null;
    }

    const existing = await this.findByUsername(adminUsername);
    if (existing) {
      if (existing.role !== 'admin' || existing.isBlocked) {
        if (isPostgresEnabled()) {
          const db = getPool();
          await db.query(
            `UPDATE users SET role = 'admin', is_blocked = FALSE WHERE id = $1`,
            [existing.id]
          );
        } else {
          const users = await readJsonUsers();
          const idx = users.findIndex((u) => u.id === existing.id);
          if (idx !== -1) {
            users[idx].role = 'admin';
            users[idx].isBlocked = false;
            await writeJsonUsers(users);
          }
        }
      }
      return existing;
    }

    return this.create({
      name: adminName,
      username: adminUsername,
      email: adminEmail,
      password: adminPassword,
      role: 'admin',
    });
  },
};
