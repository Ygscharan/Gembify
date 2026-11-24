import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowLeft,
  Ban,
  Check,
  CheckCircle2,
  Copy,
  Database,
  Eye,
  EyeOff,
  FileBarChart2,
  KeyRound,
  Loader2,
  RefreshCw,
  Save,
  Search,
  Shield,
  Trash2,
  Unlock,
  Users,
  Wand2,
  X,
} from 'lucide-react';
import { api } from '../services/api.js';

function formatDate(iso) {
  if (!iso) return 'Nunca';
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function generateStrongPassword(length = 12) {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnopqrstuvwxyz';
  const digits = '23456789';
  const special = '!@#$%&*?';
  const all = upper + lower + digits + special;

  const pick = (set) => {
    const arr = new Uint32Array(1);
    window.crypto.getRandomValues(arr);
    return set[arr[0] % set.length];
  };

  const chars = [
    pick(upper),
    pick(upper),
    pick(lower),
    pick(lower),
    pick(digits),
    pick(digits),
    pick(special),
    pick(special),
  ];
  while (chars.length < length) chars.push(pick(all));

  for (let i = chars.length - 1; i > 0; i--) {
    const arr = new Uint32Array(1);
    window.crypto.getRandomValues(arr);
    const j = arr[0] % (i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}

export default function AdminPanel({ currentUser, health, onBack }) {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    blockedUsers: 0,
    totalReports: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [search, setSearch] = useState('');
  const [busyUserId, setBusyUserId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  // Controle de visualização e edição de senhas
  const [visiblePasswords, setVisiblePasswords] = useState({});
  const [copiedId, setCopiedId] = useState(null);
  const [editingPasswordId, setEditingPasswordId] = useState(null);
  const [newPasswordValue, setNewPasswordValue] = useState('');

  const loadUsers = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const data = await api.adminListUsers();
      setUsers(Array.isArray(data?.users) ? data.users : []);
      if (data?.stats) setStats(data.stats);
    } catch (err) {
      setError(err?.message || 'Erro ao carregar usuários.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => {
      const hay = `${u.name || ''} ${u.username || ''} ${u.email || ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [users, search]);

  const toggleShowPassword = (userId) => {
    setVisiblePasswords((prev) => ({ ...prev, [userId]: !prev[userId] }));
  };

  const handleCopyPassword = async (userId, pwd) => {
    if (!pwd) return;
    try {
      await navigator.clipboard.writeText(pwd);
      setCopiedId(userId);
      setTimeout(() => setCopiedId(null), 1600);
    } catch {
      // Silencioso
    }
  };

  const startEditPassword = (user) => {
    setError(null);
    setSuccessMsg(null);
    setEditingPasswordId(user.id);
    setNewPasswordValue(user.password || '');
  };

  const cancelEditPassword = () => {
    setEditingPasswordId(null);
    setNewPasswordValue('');
  };

  const handleSavePassword = async (user) => {
    if (!newPasswordValue.trim()) return;
    setBusyUserId(user.id);
    setError(null);
    setSuccessMsg(null);
    try {
      await api.adminUpdateUserPassword(user.id, newPasswordValue);
      setEditingPasswordId(null);
      setNewPasswordValue('');
      setVisiblePasswords((prev) => ({ ...prev, [user.id]: true }));
      setSuccessMsg(`Senha de @${user.username} atualizada com sucesso.`);
      await loadUsers();
    } catch (err) {
      setError(err?.message || 'Não foi possível atualizar a senha.');
    } finally {
      setBusyUserId(null);
    }
  };

  const handleToggleBlock = async (user) => {
    setBusyUserId(user.id);
    setError(null);
    setSuccessMsg(null);
    try {
      await api.adminSetUserBlocked(user.id, !user.isBlocked);
      await loadUsers();
    } catch (err) {
      setError(err?.message || 'Não foi possível alterar o status da conta.');
    } finally {
      setBusyUserId(null);
    }
  };

  const handleDeleteUser = async (userId) => {
    setBusyUserId(userId);
    setError(null);
    setSuccessMsg(null);
    try {
      await api.adminDeleteUser(userId);
      setConfirmDeleteId(null);
      await loadUsers();
    } catch (err) {
      setError(err?.message || 'Não foi possível excluir o usuário.');
    } finally {
      setBusyUserId(null);
    }
  };

  const isPostgres = health?.storage === 'postgresql';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="mx-auto max-w-6xl space-y-6 pb-12"
    >
      {/* Header */}
      <div className="saas-card flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center sm:p-6">
        <div className="flex items-start gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-500/15 text-violet-600 dark:text-violet-400">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Painel Administrativo
              </h1>
              <span
                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase ${
                  isPostgres
                    ? 'border-emerald-500/35 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                    : 'border-amber-500/35 bg-amber-500/10 text-amber-700 dark:text-amber-400'
                }`}
              >
                <Database className="h-3 w-3" />
                {isPostgres ? 'PostgreSQL Conectado' : 'JSON Local (Configure DATABASE_URL)'}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
              Gerencie contas cadastradas, visualize ou redefina senhas e bloqueie acessos em tempo real.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadUsers}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50 dark:border-[#242424] dark:bg-[#111111] dark:text-zinc-300"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 dark:bg-emerald-500 dark:text-black dark:hover:bg-emerald-400"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Voltar às Consultorias
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="saas-card p-4 sm:p-5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-zinc-400">
            <span>Total de Usuários</span>
            <Users className="h-4 w-4 text-cyan-500" />
          </div>
          <p className="mt-2 font-mono text-2xl font-extrabold text-slate-900 dark:text-white">
            {stats.totalUsers}
          </p>
        </div>

        <div className="saas-card p-4 sm:p-5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-zinc-400">
            <span>Contas Ativas</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="mt-2 font-mono text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
            {stats.activeUsers}
          </p>
        </div>

        <div className="saas-card p-4 sm:p-5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-zinc-400">
            <span>Contas Bloqueadas</span>
            <Ban className="h-4 w-4 text-rose-500" />
          </div>
          <p className="mt-2 font-mono text-2xl font-extrabold text-rose-600 dark:text-rose-400">
            {stats.blockedUsers}
          </p>
        </div>

        <div className="saas-card p-4 sm:p-5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-zinc-400">
            <span>Consultorias Geradas</span>
            <FileBarChart2 className="h-4 w-4 text-amber-500" />
          </div>
          <p className="mt-2 font-mono text-2xl font-extrabold text-slate-900 dark:text-white">
            {stats.totalReports}
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-rose-500/40 bg-rose-50 p-4 text-xs font-medium text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-500/40 bg-emerald-50 p-4 text-xs font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Users Table Card */}
      <div className="saas-card overflow-hidden">
        <div className="flex flex-col justify-between gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:px-6 dark:border-[#1F1F1F]">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Contas Cadastradas ({filteredUsers.length})
          </h2>
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome, usuário ou e-mail..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none dark:border-[#1F1F1F] dark:bg-[#050505] dark:text-zinc-200 dark:placeholder-zinc-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-xs text-slate-500 dark:text-zinc-400">
            <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />
            Carregando usuários...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500 dark:text-zinc-500">
            Nenhum usuário encontrado.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-[#1A1A1A]">
            {filteredUsers.map((u) => {
              const isSelf = u.id === currentUser?.id;
              const isBusy = busyUserId === u.id;
              const isConfirmingDelete = confirmDeleteId === u.id;
              const isEditingPwd = editingPasswordId === u.id;
              const isPwdVisible = Boolean(visiblePasswords[u.id]);

              return (
                <div
                  key={u.id}
                  className="space-y-3 px-5 py-4 transition hover:bg-slate-50/70 sm:px-6 dark:hover:bg-[#0E0E0E]"
                >
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div className="min-w-0 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                          {u.name}
                        </span>
                        <span className="font-mono text-xs text-slate-500 dark:text-zinc-400">
                          @{u.username}
                        </span>
                        {u.role === 'admin' && (
                          <span className="rounded-md bg-violet-500/15 px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase text-violet-700 dark:text-violet-400">
                            Admin
                          </span>
                        )}
                        {u.isBlocked ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 px-2 py-0.5 text-[10px] font-bold uppercase text-rose-600 dark:text-rose-400">
                            <Ban className="h-2.5 w-2.5" />
                            Bloqueado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-400">
                            <CheckCircle2 className="h-2.5 w-2.5" />
                            Ativo
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500 dark:text-zinc-500">
                        {u.email && <span>{u.email}</span>}
                        <span>
                          Relatórios:{' '}
                          <strong className="font-mono text-slate-700 dark:text-zinc-300">
                            {u.reportCount || 0}
                          </strong>
                        </span>
                        <span>Criado: {formatDate(u.createdAt)}</span>
                        <span>Último login: {formatDate(u.lastLoginAt)}</span>
                      </div>

                      {/* Senha visível e copiável para o Admin */}
                      <div className="flex flex-wrap items-center gap-2 pt-0.5">
                        <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 font-mono text-[11px] text-slate-700 dark:border-[#222222] dark:bg-[#111111] dark:text-zinc-300">
                          <KeyRound className="h-3 w-3 text-cyan-500" />
                          <span>Senha:</span>
                          <strong className="text-slate-900 dark:text-white">
                            {u.password
                              ? isPwdVisible
                                ? u.password
                                : '••••••••••'
                              : 'Criptografada (edite para definir)'}
                          </strong>
                        </span>

                        {u.password && (
                          <>
                            <button
                              type="button"
                              onClick={() => toggleShowPassword(u.id)}
                              title={isPwdVisible ? 'Ocultar senha' : 'Mostrar senha'}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-600 transition hover:bg-slate-100 dark:border-[#222222] dark:bg-[#111111] dark:text-zinc-300 dark:hover:border-zinc-700"
                            >
                              {isPwdVisible ? (
                                <EyeOff className="h-3 w-3" />
                              ) : (
                                <Eye className="h-3 w-3" />
                              )}
                              {isPwdVisible ? 'Ocultar' : 'Ver'}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleCopyPassword(u.id, u.password)}
                              title="Copiar senha"
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-600 transition hover:bg-slate-100 dark:border-[#222222] dark:bg-[#111111] dark:text-zinc-300 dark:hover:border-zinc-700"
                            >
                              {copiedId === u.id ? (
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
                          </>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() =>
                          isEditingPwd ? cancelEditPassword() : startEditPassword(u)
                        }
                        className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-500/35 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-700 transition hover:bg-cyan-500/20 disabled:opacity-50 dark:text-cyan-400"
                      >
                        <KeyRound className="h-3.5 w-3.5" />
                        {isEditingPwd ? 'Fechar edição' : 'Editar Senha'}
                      </button>

                      {isSelf ? (
                        <span className="rounded-lg border border-slate-200 px-3 py-1.5 font-mono text-[11px] text-slate-400 dark:border-[#1F1F1F] dark:text-zinc-600">
                          Sua conta
                        </span>
                      ) : isConfirmingDelete ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => handleDeleteUser(u.id)}
                            className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-rose-500 disabled:opacity-50"
                          >
                            {isBusy ? 'Excluindo...' : 'Confirmar exclusão'}
                          </button>
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => setConfirmDeleteId(null)}
                            className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 dark:border-[#242424] dark:text-zinc-400"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => handleToggleBlock(u)}
                            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50 ${
                              u.isBlocked
                                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-400'
                                : 'border-amber-500/40 bg-amber-500/10 text-amber-800 hover:bg-amber-500/20 dark:text-amber-400'
                            }`}
                          >
                            {isBusy ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : u.isBlocked ? (
                              <Unlock className="h-3.5 w-3.5" />
                            ) : (
                              <Ban className="h-3.5 w-3.5" />
                            )}
                            {u.isBlocked ? 'Desbloquear' : 'Bloquear'}
                          </button>

                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => setConfirmDeleteId(u.id)}
                            title="Excluir conta e relatórios do usuário"
                            className="inline-flex items-center justify-center rounded-xl border border-slate-200 p-2 text-slate-400 transition hover:border-rose-500/40 hover:bg-rose-500/10 hover:text-rose-500 dark:border-[#242424] dark:text-zinc-500 dark:hover:text-rose-400"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Inline Password Editor */}
                  {isEditingPwd && (
                    <div className="flex flex-col gap-2.5 rounded-xl border border-cyan-500/30 bg-cyan-50/40 p-3.5 sm:flex-row sm:items-center dark:border-cyan-500/25 dark:bg-[#080D0F]">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={newPasswordValue}
                          onChange={(e) => setNewPasswordValue(e.target.value)}
                          placeholder="Nova senha (mín. 6 chars, maiúscula, minúscula e especial)"
                          className="saas-input py-2 font-mono text-xs"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setNewPasswordValue(generateStrongPassword(12))}
                          className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/35 bg-emerald-500/10 px-2.5 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-500/20 dark:text-emerald-400"
                        >
                          <Wand2 className="h-3.5 w-3.5" />
                          Sugerir
                        </button>
                        <button
                          type="button"
                          disabled={isBusy || !newPasswordValue.trim()}
                          onClick={() => handleSavePassword(u)}
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-emerald-500 disabled:opacity-45 dark:bg-emerald-500 dark:text-black dark:hover:bg-emerald-400"
                        >
                          {isBusy ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Save className="h-3.5 w-3.5" />
                          )}
                          Salvar
                        </button>
                        <button
                          type="button"
                          onClick={cancelEditPassword}
                          className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-100 dark:border-[#242424] dark:text-zinc-400 dark:hover:bg-[#161616]"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}
