import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getPool, isPostgresEnabled } from '../db/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '..', 'data');
const REPORTS_FILE = path.join(DATA_DIR, 'reports.json');

let writeQueue = Promise.resolve();

async function ensureStorageExists() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(REPORTS_FILE);
  } catch {
    await fs.writeFile(REPORTS_FILE, '[]\n', 'utf-8');
  }
}

async function readReportsFile() {
  await ensureStorageExists();
  const raw = await fs.readFile(REPORTS_FILE, 'utf-8');
  if (!raw.trim()) return [];
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) ? parsed : [];
}

function writeReportsFile(reports) {
  writeQueue = writeQueue.then(async () => {
    await ensureStorageExists();
    const tempFile = `${REPORTS_FILE}.tmp`;
    await fs.writeFile(tempFile, `${JSON.stringify(reports, null, 2)}\n`, 'utf-8');
    await fs.rename(tempFile, REPORTS_FILE);
  });
  return writeQueue;
}

function mapPgReport(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : row.updated_at,
    input: row.input,
    analysis: row.analysis,
    chatHistory: Array.isArray(row.chat_history) ? row.chat_history : [],
  };
}

/**
 * Repositório isolado de relatórios.
 * Usa PostgreSQL automaticamente quando DATABASE_URL está definida (Supabase / Neon / Render),
 * com fallback transparente para JSON local em desenvolvimento offline.
 */
export const reportRepository = {
  async findAllByUser(userId) {
    if (isPostgresEnabled()) {
      const db = getPool();
      const { rows } = await db.query(
        'SELECT * FROM reports WHERE user_id = $1 ORDER BY created_at DESC',
        [userId]
      );
      return rows.map(mapPgReport);
    }

    const reports = await readReportsFile();
    return reports
      .filter((r) => r.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async findByIdForUser(id, userId) {
    if (isPostgresEnabled()) {
      const db = getPool();
      const { rows } = await db.query(
        'SELECT * FROM reports WHERE id = $1 AND user_id = $2 LIMIT 1',
        [id, userId]
      );
      return mapPgReport(rows[0]);
    }

    const reports = await readReportsFile();
    return reports.find((r) => r.id === id && r.userId === userId) || null;
  },

  async create(report) {
    if (isPostgresEnabled()) {
      const db = getPool();
      const { rows } = await db.query(
        `INSERT INTO reports (id, user_id, input, analysis, chat_history, created_at, updated_at)
         VALUES ($1, $2, $3::jsonb, $4::jsonb, $5::jsonb, $6, $7)
         RETURNING *`,
        [
          report.id,
          report.userId,
          JSON.stringify(report.input),
          JSON.stringify(report.analysis),
          JSON.stringify(report.chatHistory || []),
          report.createdAt,
          report.updatedAt,
        ]
      );
      return mapPgReport(rows[0]);
    }

    const reports = await readReportsFile();
    reports.unshift(report);
    await writeReportsFile(reports);
    return report;
  },

  async appendChatMessagesForUser(id, userId, newMessages) {
    const existing = await this.findByIdForUser(id, userId);
    if (!existing) return null;

    const updatedHistory = [...(existing.chatHistory || []), ...newMessages];
    const updatedAt = new Date().toISOString();

    if (isPostgresEnabled()) {
      const db = getPool();
      const { rows } = await db.query(
        `UPDATE reports
         SET chat_history = $1::jsonb, updated_at = $2
         WHERE id = $3 AND user_id = $4
         RETURNING *`,
        [JSON.stringify(updatedHistory), updatedAt, id, userId]
      );
      return mapPgReport(rows[0]);
    }

    const reports = await readReportsFile();
    const index = reports.findIndex((r) => r.id === id && r.userId === userId);
    if (index === -1) return null;

    reports[index] = {
      ...reports[index],
      updatedAt,
      chatHistory: updatedHistory,
    };
    await writeReportsFile(reports);
    return reports[index];
  },

  async deleteByIdForUser(id, userId) {
    if (isPostgresEnabled()) {
      const db = getPool();
      const { rowCount } = await db.query(
        'DELETE FROM reports WHERE id = $1 AND user_id = $2',
        [id, userId]
      );
      return rowCount > 0;
    }

    const reports = await readReportsFile();
    const filtered = reports.filter((r) => !(r.id === id && r.userId === userId));
    if (filtered.length === reports.length) return false;
    await writeReportsFile(filtered);
    return true;
  },

  async deleteAllByUser(userId) {
    if (isPostgresEnabled()) {
      // ON DELETE CASCADE já remove no Postgres, mas mantemos suporte explícito
      const db = getPool();
      await db.query('DELETE FROM reports WHERE user_id = $1', [userId]);
      return;
    }

    const reports = await readReportsFile();
    const filtered = reports.filter((r) => r.userId !== userId);
    if (filtered.length !== reports.length) {
      await writeReportsFile(filtered);
    }
  },

  async countByUserMap() {
    const map = new Map();
    if (isPostgresEnabled()) {
      const db = getPool();
      const { rows } = await db.query(
        'SELECT user_id, COUNT(*)::int AS total FROM reports GROUP BY user_id'
      );
      for (const row of rows) {
        map.set(row.user_id, Number(row.total));
      }
      return map;
    }

    const reports = await readReportsFile();
    for (const report of reports) {
      if (!report.userId) continue;
      map.set(report.userId, (map.get(report.userId) || 0) + 1);
    }
    return map;
  },
};
