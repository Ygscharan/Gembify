import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowRight,
  AtSign,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  User,
  UserPlus,
} from 'lucide-react';
import ThemeToggle from './ThemeToggle.jsx';

export default function LoginScreen({
  isAmoled,
  onToggleTheme,
  onLoginSuccess,
  onRegisterSuccess,
  sessionNotice,
}) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'

  // Login fields
  const [identifier, setIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register fields
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setError(null);
    setShowPassword(false);
  };

  const handleLoginSubmit = async (event) => {
    event.preventDefault();
    if (!identifier.trim() || !loginPassword || isSubmitting) return;

    setError(null);
    setIsSubmitting(true);
    try {
      await onLoginSuccess(identifier.trim(), loginPassword);
    } catch (err) {
      setError(err?.message || 'Não foi possível realizar o login.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting) return;

    if (regPassword.length < 6) {
      setError('A senha precisa ter pelo menos 6 caracteres.');
      return;
    }
    if (regPassword !== confirmPassword) {
      setError('As senhas digitadas não coincidem.');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await onRegisterSuccess({
        name: name.trim(),
        username: username.trim(),
        email: email.trim(),
        password: regPassword,
      });
    } catch (err) {
      setError(err?.message || 'Não foi possível criar sua conta.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeError = error || sessionNotice;

  return (
    <div className="industrial-grid-bg relative flex min-h-screen flex-col items-center justify-center bg-[#F8FAFC] px-4 py-10 text-slate-900 transition-colors duration-200 dark:bg-[#000000] dark:text-zinc-100">
      <div className="pointer-events-none fixed left-1/2 top-1/4 h-72 w-72 -translate-x-1/2 rounded-full bg-emerald-500/10 blur-3xl dark:bg-emerald-500/15" />
      <div className="pointer-events-none fixed bottom-1/4 right-1/3 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl dark:bg-cyan-500/10" />

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
          <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 via-amber-400 to-cyan-500" />

          <div className="p-6 sm:p-8">
            {/* Gembify Brand Header */}
            <div className="flex flex-col items-center text-center">
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-3xl bg-black p-2 ring-1 ring-emerald-500/35 shadow-xl shadow-emerald-500/15 dark:shadow-[0_0_32px_-8px_rgba(16,185,129,0.45)]">
                <img
                  src="/gembify-logo.jpg"
                  alt="Logo Gembify"
                  className="h-full w-full scale-125 object-contain select-none"
                  draggable={false}
                />
              </div>

              <div className="mt-3.5 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                <ShieldCheck className="h-3 w-3" />
                Gembify · Consultoria Lean IA
              </div>

              <h1 className="mt-2.5 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                {mode === 'login' ? 'Entrar no Gembify' : 'Criar conta gratuita'}
              </h1>
              <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
                {mode === 'login'
                  ? 'Acesse seu histórico isolado de consultorias MFV'
                  : 'Cadastre-se para salvar seus diagnósticos Lean na nuvem'}
              </p>
            </div>

            {/* Mode Switcher */}
            <div className="mt-5 grid grid-cols-2 rounded-xl border border-slate-200 bg-slate-100/80 p-1 dark:border-[#1F1F1F] dark:bg-[#050505]">
              <button
                type="button"
                onClick={() => switchMode('login')}
                className={`rounded-lg py-2 text-xs font-bold transition-all ${
                  mode === 'login'
                    ? 'bg-white text-slate-900 shadow-sm dark:bg-[#141414] dark:text-white'
                    : 'text-slate-500 hover:text-slate-800 dark:text-zinc-500 dark:hover:text-zinc-300'
                }`}
              >
                Entrar
              </button>
              <button
                type="button"
                onClick={() => switchMode('register')}
                className={`rounded-lg py-2 text-xs font-bold transition-all ${
                  mode === 'register'
                    ? 'bg-white text-slate-900 shadow-sm dark:bg-[#141414] dark:text-white'
                    : 'text-slate-500 hover:text-slate-800 dark:text-zinc-500 dark:hover:text-zinc-300'
                }`}
              >
                Criar Conta
              </button>
            </div>

            {activeError && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 flex items-start gap-2.5 rounded-xl border border-rose-500/40 bg-rose-50 p-3 text-xs font-medium text-rose-700 dark:bg-rose-500/10 dark:text-rose-300"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{activeError}</span>
              </motion.div>
            )}

            {mode === 'login' ? (
              <form onSubmit={handleLoginSubmit} className="mt-5 space-y-4">
                <div>
                  <label
                    htmlFor="login-identifier"
                    className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-zinc-400"
                  >
                    <User className="h-3.5 w-3.5 text-emerald-500" />
                    Usuário ou E-mail
                  </label>
                  <input
                    id="login-identifier"
                    type="text"
                    autoComplete="username"
                    autoFocus
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="Ex: Yuri ou seu@email.com"
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
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
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
                  disabled={!identifier.trim() || !loginPassword || isSubmitting}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition-all hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-45 dark:from-emerald-500 dark:to-cyan-500 dark:text-black dark:shadow-[0_0_24px_-4px_rgba(16,185,129,0.5)]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Entrando...
                    </>
                  ) : (
                    <>
                      Acessar Plataforma
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="mt-5 space-y-3.5">
                <div>
                  <label
                    htmlFor="reg-name"
                    className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-zinc-400"
                  >
                    <User className="h-3.5 w-3.5 text-emerald-500" />
                    Nome Completo
                  </label>
                  <input
                    id="reg-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Carlos Mendes"
                    className="saas-input py-2.5"
                  />
                </div>

                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="reg-username"
                      className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-zinc-400"
                    >
                      <AtSign className="h-3.5 w-3.5 text-amber-500" />
                      Usuário
                    </label>
                    <input
                      id="reg-username"
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="carlos.mendes"
                      className="saas-input py-2.5"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="reg-email"
                      className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-zinc-400"
                    >
                      <Mail className="h-3.5 w-3.5 text-cyan-500" />
                      E-mail
                    </label>
                    <input
                      id="reg-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="carlos@empresa.com"
                      className="saas-input py-2.5"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="reg-password"
                      className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-zinc-400"
                    >
                      <Lock className="h-3.5 w-3.5 text-violet-500" />
                      Senha
                    </label>
                    <input
                      id="reg-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Mín. 6 caracteres"
                      className="saas-input py-2.5"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="reg-confirm"
                      className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-zinc-400"
                    >
                      <Lock className="h-3.5 w-3.5 text-violet-500" />
                      Confirmar
                    </label>
                    <input
                      id="reg-confirm"
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repita a senha"
                      className="saas-input py-2.5"
                    />
                  </div>
                </div>

                <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-slate-500 dark:text-zinc-400">
                  <input
                    type="checkbox"
                    checked={showPassword}
                    onChange={(e) => setShowPassword(e.target.checked)}
                    className="rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                  />
                  Mostrar senhas
                </label>

                <button
                  type="submit"
                  disabled={
                    !name.trim() ||
                    !username.trim() ||
                    !email.trim() ||
                    !regPassword ||
                    !confirmPassword ||
                    isSubmitting
                  }
                  className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition-all hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-45 dark:from-emerald-500 dark:to-cyan-500 dark:text-black dark:shadow-[0_0_24px_-4px_rgba(16,185,129,0.5)]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Criando conta...
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4" />
                      Criar Conta e Entrar
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>

        <p className="mt-4 text-center font-mono text-[11px] text-slate-400 dark:text-zinc-600">
          Contas isoladas com criptografia de senha · Gembify Industrial SaaS
        </p>
      </motion.div>
    </div>
  );
}
