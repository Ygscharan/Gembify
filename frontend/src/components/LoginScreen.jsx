import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  ShieldCheck,
  User,
} from 'lucide-react';
import ThemeToggle from './ThemeToggle.jsx';

export default function LoginScreen({ isAmoled, onToggleTheme, onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!username.trim() || !password || isSubmitting) return;

    setError(null);
    setIsSubmitting(true);
    try {
      await onLoginSuccess(username.trim(), password);
    } catch (err) {
      setError(err?.message || 'Não foi possível realizar o login.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="industrial-grid-bg relative flex min-h-screen flex-col items-center justify-center bg-[#F8FAFC] px-4 py-10 text-slate-900 transition-colors duration-200 dark:bg-[#000000] dark:text-zinc-100">
      {/* Subtle AMOLED ambient glows */}
      <div className="pointer-events-none fixed left-1/2 top-1/4 h-72 w-72 -translate-x-1/2 rounded-full bg-emerald-500/10 blur-3xl dark:bg-emerald-500/15" />
      <div className="pointer-events-none fixed bottom-1/4 right-1/3 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl dark:bg-cyan-500/10" />

      {/* Top right theme switcher */}
      <div className="fixed right-4 top-4 z-20 sm:right-6 sm:top-6">
        <ThemeToggle isAmoled={isAmoled} onToggle={onToggleTheme} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="saas-card overflow-hidden border border-slate-200/90 dark:border-[#1F1F1F]">
          {/* Gradient top accent */}
          <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 via-amber-400 to-cyan-500" />

          <div className="p-7 sm:p-8">
            {/* Gembify Brand Showcase */}
            <div className="flex flex-col items-center text-center">
              <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-3xl bg-black p-2 ring-1 ring-emerald-500/35 shadow-xl shadow-emerald-500/15 dark:shadow-[0_0_32px_-8px_rgba(16,185,129,0.45)]">
                <img
                  src="/gembify-logo.jpg"
                  alt="Logo Gembify"
                  className="h-full w-full scale-125 object-contain select-none"
                  draggable={false}
                />
              </div>

              <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                <ShieldCheck className="h-3 w-3" />
                Acesso Restrito · Lean IA
              </div>

              <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Entrar no Gembify
              </h1>
              <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
                Consultoria Lean Manufacturing &amp; MFV com Inteligência Artificial
              </p>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-5 flex items-start gap-2.5 rounded-xl border border-rose-500/40 bg-rose-50 p-3 text-xs font-medium text-rose-700 dark:bg-rose-500/10 dark:text-rose-300"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label
                  htmlFor="login-username"
                  className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-zinc-400"
                >
                  <User className="h-3.5 w-3.5 text-emerald-500" />
                  Usuário
                </label>
                <input
                  id="login-username"
                  type="text"
                  autoComplete="username"
                  autoFocus
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Digite seu usuário"
                  className="saas-input"
                />
              </div>

              <div>
                <label
                  htmlFor="login-password"
                  className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-zinc-400"
                >
                  <Lock className="h-3.5 w-3.5 text-cyan-500" />
                  Senha
                </label>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Digite sua senha"
                    className="saas-input pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition hover:text-slate-700 dark:text-zinc-500 dark:hover:text-zinc-200"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={!username.trim() || !password || isSubmitting}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition-all hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-45 dark:from-emerald-500 dark:to-cyan-500 dark:text-black dark:shadow-[0_0_24px_-4px_rgba(16,185,129,0.5)]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Verificando acesso...
                  </>
                ) : (
                  <>
                    Acessar Plataforma
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        <p className="mt-4 text-center font-mono text-[11px] text-slate-400 dark:text-zinc-600">
          Sessão protegida por token assinado · Gembify Industrial SaaS
        </p>
      </motion.div>
    </div>
  );
}
