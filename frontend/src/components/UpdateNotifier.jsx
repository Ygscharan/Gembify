import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, RefreshCw, Sparkles, X } from 'lucide-react';

const LAST_SEEN_VERSION_KEY = 'gembify_last_seen_version';
const CHECK_INTERVAL_MS = 2 * 60 * 1000; // Verifica novas atualizações a cada 2 minutos

const CURRENT_VERSION =
  typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'local';
const CURRENT_SUMMARY =
  typeof __APP_UPDATE_SUMMARY__ !== 'undefined'
    ? __APP_UPDATE_SUMMARY__
    : 'Melhorias gerais de desempenho e estabilidade no Gembify.';

export default function UpdateNotifier() {
  const [notice, setNotice] = useState(null); // { type: 'available' | 'updated', version, summary }
  const [isReloading, setIsReloading] = useState(false);

  // 1. Detecta se o app acabou de abrir em uma versão mais nova que a última vista
  useEffect(() => {
    if (typeof window === 'undefined' || CURRENT_VERSION === 'local') return;

    const lastSeen = window.localStorage.getItem(LAST_SEEN_VERSION_KEY);
    if (!lastSeen) {
      window.localStorage.setItem(LAST_SEEN_VERSION_KEY, CURRENT_VERSION);
      return;
    }

    if (lastSeen !== CURRENT_VERSION) {
      window.localStorage.setItem(LAST_SEEN_VERSION_KEY, CURRENT_VERSION);
      setNotice({
        type: 'updated',
        version: CURRENT_VERSION,
        summary: CURRENT_SUMMARY,
      });

      const autoHide = setTimeout(() => {
        setNotice((prev) => (prev?.type === 'updated' ? null : prev));
      }, 11000);

      return () => clearTimeout(autoHide);
    }
  }, []);

  // 2. Monitora silenciosamente /version.json enquanto o app está aberto
  useEffect(() => {
    if (typeof window === 'undefined' || !import.meta.env.PROD) return;

    let cancelled = false;

    async function checkForRemoteUpdate() {
      try {
        const res = await fetch(`/version.json?t=${Date.now()}`, {
          cache: 'no-store',
        });
        if (!res.ok) return;
        const remote = await res.json();
        if (
          !cancelled &&
          remote?.version &&
          remote.version !== CURRENT_VERSION
        ) {
          setNotice({
            type: 'available',
            version: remote.version,
            summary:
              remote.summary ||
              'Melhorias gerais de desempenho, visual e estabilidade no Gembify.',
          });
        }
      } catch {
        // Silencioso se offline
      }
    }

    const timer = setInterval(checkForRemoteUpdate, CHECK_INTERVAL_MS);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkForRemoteUpdate();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      cancelled = true;
      clearInterval(timer);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  const handleApplyUpdate = async () => {
    setIsReloading(true);
    try {
      if ('caches' in window) {
        const keys = await window.caches.keys();
        await Promise.all(keys.map((key) => window.caches.delete(key)));
      }
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.update().catch(() => null)));
      }
    } catch {
      // Continua com reload mesmo se limpeza de cache falhar
    }
    window.location.reload();
  };

  return (
    <AnimatePresence>
      {notice && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 400, damping: 32 }}
          data-spotlight-shield="true"
          style={{ bottom: 'calc(var(--app-safe-bottom, 0px) + 1rem)' }}
          className="fixed right-4 left-4 z-50 mx-auto max-w-sm sm:left-auto sm:right-6 sm:mx-0"
        >
          <div className="overflow-hidden rounded-2xl border border-emerald-500/35 bg-white shadow-2xl shadow-slate-900/15 dark:border-emerald-500/30 dark:bg-[#0B0B0B] dark:shadow-[0_16px_48px_-12px_rgba(16,185,129,0.3)]">
            <div className="h-1 w-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500" />
            <div className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                  {notice.type === 'available' ? (
                    <Sparkles className="h-4 w-4" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs font-extrabold tracking-tight text-slate-900 dark:text-white">
                      {notice.type === 'available'
                        ? 'Nova atualização disponível'
                        : 'Gembify atualizado!'}
                    </h4>
                    <button
                      type="button"
                      onClick={() => setNotice(null)}
                      aria-label="Fechar aviso"
                      className="rounded-md p-0.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:text-zinc-500 dark:hover:bg-[#181818] dark:hover:text-zinc-200"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-zinc-400">
                    {notice.summary}
                  </p>

                  {notice.type === 'available' && (
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        type="button"
                        disabled={isReloading}
                        onClick={handleApplyUpdate}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-emerald-500 disabled:opacity-50 dark:bg-emerald-500 dark:text-black dark:hover:bg-emerald-400"
                      >
                        <RefreshCw
                          className={`h-3.5 w-3.5 ${isReloading ? 'animate-spin' : ''}`}
                        />
                        {isReloading ? 'Atualizando...' : 'Atualizar agora'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setNotice(null)}
                        className="rounded-xl px-2.5 py-1.5 text-xs font-medium text-slate-500 transition hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                      >
                        Depois
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
