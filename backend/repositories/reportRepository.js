import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '..', 'data');
const REPORTS_FILE = path.join(DATA_DIR, 'reports.json');

// Serializa escritas no JSON local para evitar condições de corrida em requisições simultâneas
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
  if (!raw.trim()) {
    return [];
  }
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

/**
 * Repositório isolado de relatórios (MVP em JSON local).
 * Para migrar para PostgreSQL, MongoDB ou Prisma no futuro,
 * basta substituir apenas a implementação deste módulo mantendo a mesma interface.
 */
export const reportRepository = {
  async findAll() {
    const reports = await readReportsFile();
    return reports.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  async findById(id) {
    const reports = await readReportsFile();
    return reports.find((report) => report.id === id) || null;
  },

  async create(report) {
    const reports = await readReportsFile();
    reports.unshift(report);
    await writeReportsFile(reports);
    return report;
  },

  async appendChatMessages(id, newMessages) {
    const reports = await readReportsFile();
    const index = reports.findIndex((report) => report.id === id);
    if (index === -1) {
      return null;
    }

    const currentHistory = Array.isArray(reports[index].chatHistory)
      ? reports[index].chatHistory
      : [];

    reports[index] = {
      ...reports[index],
      updatedAt: new Date().toISOString(),
      chatHistory: [...currentHistory, ...newMessages],
    };

    await writeReportsFile(reports);
    return reports[index];
  },

  async deleteById(id) {
    const reports = await readReportsFile();
    const filtered = reports.filter((report) => report.id !== id);
    if (filtered.length === reports.length) {
      return false;
    }
    await writeReportsFile(filtered);
    return true;
  },
};
