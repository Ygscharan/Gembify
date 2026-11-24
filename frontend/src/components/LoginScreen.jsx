import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowRight,
  AtSign,
  Check,
  CheckCircle2,
  Copy,
  Download,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  Smartphone,
  User,
  UserPlus,
  Wand2,
  X,
  XCircle,
} from 'lucide-react';
import { api } from '../services/api.js';
import ThemeToggle from './ThemeToggle.jsx';
import CursorSpotlight from './CursorSpotlight.jsx';

const SPECIAL_CHARS = '!@#$%&*?';
const UPPER_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const LOWER_CHARS = 'abcdefghijkmnopqrstuvwxyz';
const DIGIT_CHARS = '23456789';

function randomChar(charset) {
  const arr = new Uint32Array(1);
  window.crypto.getRandomValues(arr);
  return charset[arr[0] % charset.length];
}

function generateStrongPassword(length = 12) {
  const required = [
    randomChar(UPPER_CHARS),
    randomChar(UPPER_CHARS),
    randomChar(LOWER_CHARS),
    randomChar(LOWER_CHARS),
    randomChar(DIGIT_CHARS),
    randomChar(DIGIT_CHARS),
    randomChar(SPECIAL_CHARS),
    randomChar(SPECIAL_CHARS),
  ];

  const all = UPPER_CHARS + LOWER_CHARS + DIGIT_CHARS + SPECIAL_CHARS;
  while (required.length < length) {
    required.push(randomChar(all));
  }

  // Fisher-Yates shuffle com entropia criptográfica
  for (let i = required.length - 1; i > 0; i--) {
    const arr = new Uint32Array(1);
    window.crypto.getRandomValues(arr);
    const j = arr[0] % (i + 1);
    [required[i], required[j]] = [required[j], required[i]];
  }

  return required.join('');
}

function evaluatePassword(password) {
  const value = String(password || '');
  const checks = {
    minLength: value.length >= 6,
    hasUpper: /[A-Z]/.test(value),
    hasLower: /[a-z]/.test(value),
    hasSpecial: /[^A-Za-z0-9\s]/.test(value),
    hasNumber: /[0-9]/.test(value),
    goodLength: value.length >= 10,
  };

  const meetsRequired =
    checks.minLength && checks.hasUpper && checks.hasLower && checks.hasSpecial;

  if (!value) {
    return { checks, meetsRequired: false, level: 0, label: '', color: '' };
  }

  if (!meetsRequired) {
    return {
      checks,
      meetsRequired: false,
      level: 1,
      label: 'Fraca',
      color: 'rose',
    };
  }

  const bonusScore =
    (value.length >= 8 ? 1 : 0) +
    (checks.goodLength ? 1 : 0) +
    (checks.hasNumber ? 1 : 0);

  if (bonusScore >= 2) {
    return {
      checks,
      meetsRequired: true,
      level: 3,
      label: 'Forte',
      color: 'emerald',
    };
  }

  return {
    checks,
    meetsRequired: true,
    level: 2,
    label: 'Média',
    color: 'amber',
  };
}

const DEFAULT_ANDROID_APK_URL =
  'https://github.com/Ygscharan/Gembify/releases/latest/download/Gembify.apk';
const ANDROID_APK_URL = import.meta.env.VITE_ANDROID_APK_URL?.trim() || DEFAULT_ANDROID_APK_URL;

function isRunningInsideNativeApp() {
  if (typeof window === 'undefined') return false;
  return Boolean(window.Capacitor?.isNativePlatform?.());
}

export default function LoginScreen({
  isAmoled,
  onToggleTheme,
  onLoginSuccess,
  onRegisterSuccess,
  sessionNotice,
  canInstallApp = false,
  onInstallApp,
}) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [androidModalOpen, setAndroidModalOpen] = useState(false);

  // Login fields
  const [identifier, setIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register fields
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [suggestedCopied, setSuggestedCopied] = useState(false);

  // Live username availability check
  const [usernameStatus, setUsernameStatus] = useState({
    state: 'idle', // 'idle' | 'checking' | 'available' | 'taken' | 'invalid'
    message: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const passwordAnalysis = useMemo(() => evaluatePassword(regPassword), [regPassword]);

  // Debounced live username availability check during registration
  useEffect(() => {
    if (mode !== 'register') return;
    const trimmed = username.trim();

    if (!trimmed) {
      setUsernameStatus({ state: 'idle', message: '' });
      return;
    }

    if (!/^[a-zA-Z0-9._-]{3,30}$/.test(trimmed)) {
      setUsernameStatus({
        state: 'invalid',
        message: 'Use 3 a 30 caracteres (letras, números, . _ -).',
      });
      return;
    }

    let cancelled = false;
    setUsernameStatus({ state: 'checking', message: 'Verificando disponibilidade...' });

    const timer = setTimeout(async () => {
      try {
        const res = await api.checkUsername(trimmed);
        if (cancelled) return;
        if (res?.available) {
          setUsernameStatus({ state: 'available', message: 'Usuário disponível' });
        } else {
          setUsernameStatus({
            state: 'taken',
            message: res?.reason || 'Este nome de usuário já está em uso.',
          });
        }
      } catch {
        if (!cancelled) {
          setUsernameStatus({ state: 'idle', message: '' });
        }
      }
    }, 380);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [username, mode]);

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setError(null);
    setShowPassword(false);
    setSuggestedCopied(false);
  };

  const handleSuggestPassword = () => {
    const generated = generateStrongPassword(12);
    setRegPassword(generated);
    setConfirmPassword(generated);
    setShowPassword(true);
    setSuggestedCopied(false);
    setError(null);
  };

  const handleCopySuggested = async () => {
    if (!regPassword) return;
    try {
      await navigator.clipboard.writeText(regPassword);
      setSuggestedCopied(true);
      setTimeout(() => setSuggestedCopied(false), 1800);
    } catch {
      // Silencioso
    }
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

    if (usernameStatus.state === 'taken' || usernameStatus.state === 'invalid') {
      setError(usernameStatus.message || 'Escolha um nome de usuário válido e disponível.');
      return;
    }

    if (!passwordAnalysis.meetsRequired) {
      setError(
        'A senha precisa ter no mínimo 6 caracteres, 1 letra maiúscula, letras minúsculas e 1 caractere especial (ex: !@#$%&*).'
      );
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

  const canSubmitRegister =
    Boolean(name.trim()) &&
    Boolean(username.trim()) &&
    Boolean(email.trim()) &&
    passwordAnalysis.meetsRequired &&
    regPassword === confirmPassword &&
    usernameStatus.state !== 'taken' &&
    usernameStatus.state !== 'invalid' &&
    !isSubmitting;

  return (
    <div className="industrial-grid-bg relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#F8FAFC] px-4 py-10 text-slate-900 transition-colors duration-200 dark:bg-[#000000] dark:text-zinc-100">
      <CursorSpotlight isAmoled={isAmoled} />

      {/* Top right theme switcher */}
      <div className="fixed right-4 top-4 z-20 sm:right-6 sm:top-6">
        <ThemeToggle isAmoled={isAmoled} onToggle={onToggleTheme} />
      </div>

      {/* Main Login Card (strictly opaque z-10 + spotlight shield) */}
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35 }}
        data-spotlight-shield="true"
        className="relative z-10 w-full max-w-md"
      >
        <div className="overflow-hidden rounded-3xl border border-slate-200/95 bg-white shadow-2xl shadow-slate-900/10 dark:border-[#1F1F1F] dark:bg-[#0A0A0A] dark:shadow-[0_24px_80px_-20px_rgba(0,0,0,0.95)]">
          <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 via-amber-400 to-cyan-500" />

          <div className="p-6 sm:p-8">
            {/* Large, Harmonic Gembify Logo Showcase */}
            <div className="flex flex-col items-center text-center">
              <div className="flex h-36 w-36 items-center justify-center overflow-hidden rounded-[2rem] bg-black p-2.5 ring-1 ring-emerald-500/40 shadow-2xl shadow-emerald-500/20 sm:h-44 sm:w-44 dark:ring-emerald-500/35 dark:shadow-[0_0_48px_-10px_rgba(16,185,129,0.45)]">
                <img
                  src="/gembify-logo.jpg"
                  alt="Logo Gembify"
                  className="h-full w-full scale-110 object-contain select-none"
                  draggable={false}
                />
              </div>

              <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                <ShieldCheck className="h-3 w-3" />
                Gembify · Lean IA Industrial
              </div>

              <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                {mode === 'login' ? 'Entrar no Gembify' : 'Criar conta no Gembify'}
              </h1>

              {/* Bordão / Frase de efeito */}
              <p className="mt-1.5 max-w-sm text-xs font-medium leading-relaxed text-slate-500 dark:text-zinc-400">
                Seu copiloto avançado para{' '}
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  decisões complexas.
                </span>
              </p>
            </div>

            {/* Mode Switcher */}
            <div className="mt-5 grid grid-cols-2 rounded-xl border border-slate-200 bg-slate-100/90 p-1 dark:border-[#1F1F1F] dark:bg-[#050505]">
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
                      Usuário único
                    </label>
                    <input
                      id="reg-username"
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="carlos.mendes"
                      className={`saas-input py-2.5 ${
                        usernameStatus.state === 'taken' || usernameStatus.state === 'invalid'
                          ? 'border-rose-500/70 focus:border-rose-500 focus:ring-rose-500/20'
                          : usernameStatus.state === 'available'
                            ? 'border-emerald-500/60'
                            : ''
                      }`}
                    />
                    {usernameStatus.state !== 'idle' && (
                      <p
                        className={`mt-1 flex items-center gap-1 text-[11px] font-medium ${
                          usernameStatus.state === 'available'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : usernameStatus.state === 'checking'
                              ? 'text-slate-400 dark:text-zinc-500'
                              : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {usernameStatus.state === 'checking' && (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        )}
                        {usernameStatus.state === 'available' && (
                          <CheckCircle2 className="h-3 w-3" />
                        )}
                        {(usernameStatus.state === 'taken' ||
                          usernameStatus.state === 'invalid') && <XCircle className="h-3 w-3" />}
                        <span>{usernameStatus.message}</span>
                      </p>
                    )}
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

                {/* Password + Suggest Strong Password */}
                <div className="space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label
                      htmlFor="reg-password"
                      className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-zinc-400"
                    >
                      <Lock className="h-3.5 w-3.5 text-violet-500" />
                      Senha
                    </label>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handleSuggestPassword}
                        className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/35 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 transition hover:bg-emerald-500/20 dark:text-emerald-400"
                      >
                        <Wand2 className="h-3 w-3" />
                        Sugerir senha forte
                      </button>

                      {regPassword && (
                        <button
                          type="button"
                          onClick={handleCopySuggested}
                          title="Copiar senha"
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-600 transition hover:bg-slate-100 dark:border-[#242424] dark:bg-[#141414] dark:text-zinc-300"
                        >
                          {suggestedCopied ? (
                            <>
                              <Check className="h-3 w-3 text-emerald-500" />
                              Copiada
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3" />
                              Copiar
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="relative">
                      <input
                        id="reg-password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="Crie uma senha"
                        className="saas-input py-2.5 pr-9"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:text-zinc-500 dark:hover:text-zinc-200"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>

                    <input
                      id="reg-confirm"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirmar senha"
                      className={`saas-input py-2.5 ${
                        confirmPassword && confirmPassword !== regPassword
                          ? 'border-rose-500/70 focus:border-rose-500'
                          : ''
                      }`}
                    />
                  </div>

                  {/* Password Strength Meter (Fraca / Média / Forte) */}
                  {regPassword && (
                    <div className="space-y-1.5 pt-0.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-medium text-slate-500 dark:text-zinc-400">
                          Força da senha
                        </span>
                        <span
                          className={`font-mono font-bold uppercase ${
                            passwordAnalysis.color === 'emerald'
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : passwordAnalysis.color === 'amber'
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {passwordAnalysis.label}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-1.5">
                        {[1, 2, 3].map((segment) => {
                          const active = passwordAnalysis.level >= segment;
                          const segColor =
                            passwordAnalysis.color === 'emerald'
                              ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                              : passwordAnalysis.color === 'amber'
                                ? 'bg-amber-500'
                                : 'bg-rose-500';
                          return (
                            <div
                              key={segment}
                              className={`h-1.5 rounded-full transition-all duration-300 ${
                                active ? segColor : 'bg-slate-200 dark:bg-[#1E1E1E]'
                              }`}
                            />
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Explicit Password Rules Notice & Live Checklist */}
                  <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-3 dark:border-[#1E1E1E] dark:bg-[#050505]">
                    <p className="text-[11px] font-semibold text-slate-600 dark:text-zinc-400">
                      Requisitos obrigatórios da senha:
                    </p>
                    <div className="mt-1.5 grid grid-cols-2 gap-x-2 gap-y-1 text-[11px]">
                      {[
                        { ok: passwordAnalysis.checks.hasUpper, label: '1 letra maiúscula (A-Z)' },
                        { ok: passwordAnalysis.checks.hasLower, label: 'Letras minúsculas (a-z)' },
                        { ok: passwordAnalysis.checks.hasSpecial, label: '1 especial (!@#$%&*)' },
                        { ok: passwordAnalysis.checks.minLength, label: 'Mínimo 6 caracteres' },
                      ].map((rule) => (
                        <div
                          key={rule.label}
                          className={`flex items-center gap-1.5 transition-colors ${
                            rule.ok
                              ? 'font-medium text-emerald-700 dark:text-emerald-400'
                              : 'text-slate-500 dark:text-zinc-500'
                          }`}
                        >
                          {rule.ok ? (
                            <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-500" />
                          ) : (
                            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300 dark:bg-zinc-700" />
                          )}
                          <span>{rule.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!canSubmitRegister}
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

        {/* Botão para baixar o arquivo APK nativo do Android (oculto se já estiver dentro do app) */}
        <div className="mt-4 flex flex-col items-center gap-3">
          {!isRunningInsideNativeApp() && (
            <a
              href={ANDROID_APK_URL}
              download="Gembify.apk"
              data-spotlight-shield="true"
              className="group inline-flex w-full items-center justify-center gap-2.5 rounded-2xl border border-emerald-500/40 bg-white px-5 py-3 text-xs font-bold text-slate-800 shadow-sm transition-all hover:border-emerald-500/75 hover:bg-emerald-50/70 dark:border-[#242424] dark:bg-[#0A0A0A] dark:text-zinc-100 dark:hover:border-emerald-500/55 dark:hover:bg-[#101010]"
            >
              <Smartphone className="h-4 w-4 text-emerald-500" />
              <span>Baixar App para Android (.APK)</span>
              <Download className="h-3.5 w-3.5 text-emerald-500 transition-transform group-hover:translate-y-0.5" />
            </a>
          )}

          <p className="text-center font-mono text-[11px] text-slate-400 dark:text-zinc-600">
            Contas isoladas com criptografia de senha · Gembify Industrial SaaS
          </p>
        </div>
      </motion.div>

      {/* Modal de instalação rápida no Android */}
      <AnimatePresence>
        {androidModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAndroidModalOpen(false)}
              className="fixed inset-0 bg-black/75 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 12 }}
              role="dialog"
              aria-modal="true"
              data-spotlight-shield="true"
              className="relative z-10 w-full max-w-sm overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-[#242424] dark:bg-[#0A0A0A]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                    <Smartphone className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                      Instalar Gembify no Android
                    </h2>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                      Acesso direto em tela cheia como app nativo
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAndroidModalOpen(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-[#161616] dark:hover:text-zinc-200"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <ol className="mt-5 space-y-3 text-xs leading-relaxed text-slate-600 dark:text-zinc-300">
                <li className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 font-mono text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                    1
                  </span>
                  <span>
                    Abra <strong>gembify.vercel.app</strong> no navegador{' '}
                    <strong>Google Chrome</strong> do seu celular Android.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 font-mono text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                    2
                  </span>
                  <span>
                    Toque no menu <strong>⋮</strong> (canto superior direito) e selecione{' '}
                    <strong>&ldquo;Instalar aplicativo&rdquo;</strong> ou{' '}
                    <strong>&ldquo;Adicionar à tela inicial&rdquo;</strong>.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 font-mono text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                    3
                  </span>
                  <span>
                    Confirme em <strong>Instalar</strong> — o ícone do <strong>Gembify</strong>{' '}
                    aparecerá na sua tela inicial em modo tela cheia!
                  </span>
                </li>
              </ol>

              <button
                type="button"
                onClick={() => setAndroidModalOpen(false)}
                className="mt-6 w-full rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white transition hover:bg-slate-800 dark:bg-emerald-500 dark:text-black dark:hover:bg-emerald-400"
              >
                Entendi
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
