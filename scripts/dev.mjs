import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const services = [
  {
    name: 'BACKEND ',
    color: '\x1b[32m',
    cwd: path.join(ROOT_DIR, 'backend'),
    args: ['run', 'dev'],
  },
  {
    name: 'FRONTEND',
    color: '\x1b[36m',
    cwd: path.join(ROOT_DIR, 'frontend'),
    args: ['run', 'dev'],
  },
];

const RESET = '\x1b[0m';
const children = [];

function prefixLines(label, color, chunk, targetStream) {
  const text = chunk.toString();
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (i === lines.length - 1 && line === '') continue;
    targetStream.write(`${color}[${label}]${RESET} ${line}\n`);
  }
}

console.log('\n🏭 Iniciando Gembify — Backend (porta 3001) + Frontend (porta 5173)...\n');

for (const svc of services) {
  const child = spawn(`npm ${svc.args.join(' ')}`, {
    cwd: svc.cwd,
    shell: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  child.stdout.on('data', (chunk) => prefixLines(svc.name, svc.color, chunk, process.stdout));
  child.stderr.on('data', (chunk) => prefixLines(svc.name, svc.color, chunk, process.stderr));

  child.on('exit', (code) => {
    if (code !== null && code !== 0) {
      console.error(`${svc.color}[${svc.name}]${RESET} encerrado com código ${code}`);
    }
  });

  children.push(child);
}

function shutdown() {
  console.log('\nEncerrando Backend e Frontend...');
  for (const child of children) {
    if (!child.killed && child.pid) {
      if (process.platform === 'win32') {
        spawn('taskkill', ['/pid', String(child.pid), '/f', '/t'], { shell: true });
      } else {
        child.kill('SIGTERM');
      }
    }
  }
  setTimeout(() => process.exit(0), 400);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
