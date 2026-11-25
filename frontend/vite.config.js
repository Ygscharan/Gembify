import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

function summarizeCommitForUsers(rawMessage = '') {
  const msg = String(rawMessage || '').toLowerCase();

  if (/(login|senha|cadastro|admin|conta|bloque|auth)/.test(msg)) {
    return 'Melhorias no acesso, segurança e gerenciamento de contas.';
  }
  if (/(android|apk|celular|mobile|barra|status|insets|safe-area)/.test(msg)) {
    return 'Ajustes visuais e melhorias de compatibilidade no aplicativo móvel.';
  }
  if (/(mermaid|fluxograma|diagrama|relatorio|lean|timwoods|chat|ia|gemini)/.test(msg)) {
    return 'Aprimoramentos nos diagnósticos Lean, fluxogramas e respostas da IA.';
  }
  if (/(logo|tema|lanterna|spotlight|bordao|visual|design|layout|sidebar|estilo)/.test(msg)) {
    return 'Melhorias visuais e refinamentos na interface do Gembify.';
  }
  if (/(atualiz|update|versao|release|notific)/.test(msg)) {
    return 'Sistema de atualizações automáticas e melhorias gerais de estabilidade.';
  }
  if (/(fix|corrig|erro|bug|ajuste)/.test(msg)) {
    return 'Correções gerais e melhorias de estabilidade no aplicativo.';
  }
  return 'Melhorias gerais de desempenho, visual e estabilidade no Gembify.';
}

function getBuildVersionMeta() {
  let commitSha =
    process.env.VERCEL_GIT_COMMIT_SHA ||
    process.env.GITHUB_SHA ||
    '';
  let commitMsg =
    process.env.VERCEL_GIT_COMMIT_MESSAGE ||
    '';

  if (!commitSha) {
    try {
      commitSha = execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
        .toString()
        .trim();
    } catch {
      commitSha = `dev-${Date.now().toString(36)}`;
    }
  } else {
    commitSha = commitSha.slice(0, 7);
  }

  if (!commitMsg) {
    try {
      commitMsg = execSync('git log -1 --pretty=%s', { stdio: ['ignore', 'pipe', 'ignore'] })
        .toString()
        .trim();
    } catch {
      commitMsg = '';
    }
  }

  return {
    version: commitSha,
    builtAt: new Date().toISOString(),
    summary: summarizeCommitForUsers(commitMsg),
  };
}

const buildMeta = getBuildVersionMeta();

function emitVersionJsonPlugin(meta) {
  return {
    name: 'gembify-version-manifest',
    closeBundle() {
      const distDir = path.resolve(process.cwd(), 'dist');
      if (!fs.existsSync(distDir)) return;
      fs.writeFileSync(
        path.join(distDir, 'version.json'),
        `${JSON.stringify(meta, null, 2)}\n`,
        'utf-8'
      );
    },
  };
}

export default defineConfig({
  plugins: [react(), emitVersionJsonPlugin(buildMeta)],
  define: {
    __APP_VERSION__: JSON.stringify(buildMeta.version),
    __APP_UPDATE_SUMMARY__: JSON.stringify(buildMeta.summary),
    __APP_BUILT_AT__: JSON.stringify(buildMeta.builtAt),
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
