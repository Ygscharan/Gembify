import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  LogOut,
  MessageSquare,
  PanelLeftClose,
  Plus,
  Search,
  Shield,
  Trash2,
  User,
  X,
} from 'lucide-react';
import GembifyMark from './GembifyMark.jsx';

function formatRelativeDate(isoDate) {
  if (!isoDate) return '';
  const date = new Date(isoDate);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'agora';
  if (diffMin < 60) return `há ${diffMin} min`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `há ${diffHours}h`;
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

function SidebarContent({
  reports,
  selectedReportId,
  onSelectReport,
  onNewAnalysis,
  onGoHome,
  onOpenAdmin,
  isAdminView,
  onDeleteReport,
  onCloseMobile,
  onCollapseDesktop,
  health,
  user,
  onLogout,
}) {
  const [query, setQuery] = useState('');

  const filteredReports = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return reports;
    return reports.filter((r) => {
      const hay = `${r.input?.empresa || ''} ${r.input?.segmento || ''} ${r.input?.setor || ''} ${r.resumo_problema || ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [reports, query]);

  return (
    <div className="flex h-full flex-col bg-white dark:bg-[#050505]">
      {/* Brand header */}
      <div className="flex items-center justify-between border-b border-slate-200/80 px-4 py-4 dark:border-[#1F1F1F]">
        <button
          type="button"
          onClick={() => {
            (onGoHome || onNewAnalysis)();
            onCloseMobile?.();
          }}
          className="group flex items-center gap-2.5 text-left"
        >
          <GembifyMark
            size="md"
            className="transition-transform duration-200 group-hover:scale-105"
          />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white">
                Gembify
              </span>
              <span className="rounded-md bg-emerald-500/15 px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase text-emerald-700 dark:text-emerald-400">
                Lean IA
              </span>
            </div>
            <p className="text-[11px] font-medium text-slate-500 dark:text-zinc-500">
              Consultoria MFV
            </p>
          </div>
        </button>

        <div className="flex items-center gap-1">
          {onCollapseDesktop && (
            <button
              type="button"
              onClick={onCollapseDesktop}
              title="Recolher barra lateral"
              className="hidden rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 lg:inline-flex dark:text-zinc-500 dark:hover:bg-[#141414] dark:hover:text-zinc-200"
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
          )}
          {onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              title="Fechar menu"
              className="inline-flex rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 lg:hidden dark:text-zinc-500 dark:hover:bg-[#141414] dark:hover:text-zinc-200"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Primary New Consultation CTA */}
      <div className="p-3.5">
        <button
          type="button"
          onClick={() => {
            onNewAnalysis();
            onCloseMobile?.();
          }}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-slate-800 active:scale-[0.99] dark:bg-emerald-500 dark:text-black dark:shadow-[0_0_20px_-4px_rgba(16,185,129,0.55)] dark:hover:bg-emerald-400"
        >
          <Plus className="h-4 w-4 stroke-[2.5]" />
          Nova Consultoria
        </button>

        {user?.role === 'admin' && (
          <button
            type="button"
            onClick={() => {
              onOpenAdmin?.();
              onCloseMobile?.();
            }}
            className={`mt-2 flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-2 text-xs font-bold transition-all ${
              isAdminView
                ? 'border-violet-500/50 bg-violet-500/15 text-violet-700 dark:text-violet-300'
                : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-violet-500/40 hover:bg-violet-50/70 dark:border-[#1F1F1F] dark:bg-[#0D0D0D] dark:text-zinc-300 dark:hover:border-violet-500/40'
            }`}
          >
            <Shield className="h-3.5 w-3.5 text-violet-500" />
            Painel Admin (Usuários)
          </button>
        )}

        {/* Search box */}
        {reports.length > 0 && (
          <div className="relative mt-3">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filtrar histórico..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-8 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none dark:border-[#1F1F1F] dark:bg-[#0A0A0A] dark:text-zinc-200 dark:placeholder-zinc-500"
            />
          </div>
        )}
      </div>

      {/* Reports history list */}
      <div className="flex-1 overflow-y-auto px-3 pb-3">
        <div className="mb-2 flex items-center justify-between px-1.5">
          <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
            Histórico ({reports.length})
          </span>
        </div>

        {filteredReports.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center dark:border-[#1F1F1F]">
            <p className="text-xs font-medium text-slate-500 dark:text-zinc-500">
              {reports.length === 0
                ? 'Nenhuma consultoria gerada ainda. Comece relatando um gargalo.'
                : 'Nenhum relatório corresponde à busca.'}
            </p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {filteredReports.map((report) => {
              const isSelected = report.id === selectedReportId;
              return (
                <div
                  key={report.id}
                  onClick={() => {
                    onSelectReport(report.id);
                    onCloseMobile?.();
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectReport(report.id);
                      onCloseMobile?.();
                    }
                  }}
                  className={`group relative cursor-pointer rounded-xl border p-3 transition-all ${
                    isSelected
                      ? 'border-emerald-500/50 bg-emerald-50/70 dark:border-emerald-500/40 dark:bg-emerald-500/10'
                      : 'border-transparent bg-transparent hover:border-slate-200 hover:bg-slate-50 dark:hover:border-[#1F1F1F] dark:hover:bg-[#0D0D0D]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p
                      className={`line-clamp-1 text-xs font-semibold ${
                        isSelected
                          ? 'text-emerald-950 dark:text-emerald-300'
                          : 'text-slate-800 dark:text-zinc-200'
                      }`}
                    >
                      {report.input?.empresa || report.input?.segmento || 'Consultoria Lean'}
                    </p>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteReport(report.id);
                      }}
                      title="Excluir relatório"
                      className="rounded-md p-1 text-slate-400 opacity-0 transition hover:bg-rose-500/10 hover:text-rose-500 group-hover:opacity-100 dark:text-zinc-600 dark:hover:text-rose-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <p className="mt-0.5 line-clamp-1 text-[11px] font-medium text-slate-500 dark:text-zinc-400">
                    {report.input?.empresa
                      ? `${report.input?.segmento} · ${report.input?.setor}`
                      : report.input?.setor}
                  </p>

                  <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 dark:text-zinc-500">
                    <span>{formatRelativeDate(report.createdAt)}</span>
                    <div className="flex items-center gap-2 font-mono">
                      {report.totalDesperdicios > 0 && (
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-600 dark:bg-[#141414] dark:text-zinc-400">
                          {report.totalDesperdicios} TIMWOODS
                        </span>
                      )}
                      {report.totalMensagensChat > 0 && (
                        <span className="inline-flex items-center gap-0.5 text-cyan-600 dark:text-cyan-400">
                          <MessageSquare className="h-2.5 w-2.5" />
                          {Math.floor(report.totalMensagensChat / 2)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* User & API Health footer */}
      <div className="space-y-3 border-t border-slate-200/80 px-4 py-3 dark:border-[#1F1F1F]">
        {user && (
          <div className="flex items-center justify-between gap-2 rounded-xl border border-slate-200/80 bg-slate-50 px-3 py-2 dark:border-[#1A1A1A] dark:bg-[#0B0B0B]">
            <div className="flex min-w-0 items-center gap-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                <User className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="truncate text-xs font-bold text-slate-800 dark:text-zinc-200">
                    {user.name || user.username}
                  </p>
                  {user.role === 'admin' && (
                    <span className="rounded bg-violet-500/15 px-1 py-0.5 font-mono text-[9px] font-bold uppercase text-violet-600 dark:text-violet-400">
                      Admin
                    </span>
                  )}
                </div>
                <p className="truncate font-mono text-[10px] text-slate-400 dark:text-zinc-500">
                  @{user.username}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onLogout}
              title="Sair da conta"
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-semibold text-slate-500 transition hover:bg-rose-500/10 hover:text-rose-600 dark:text-zinc-400 dark:hover:text-rose-400"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sair
            </button>
          </div>
        )}

        <div className="flex items-center justify-between gap-2 text-[11px]">
          <div className="flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${
                !health
                  ? 'bg-rose-500'
                  : health.aiConfigured
                    ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]'
                    : 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]'
              }`}
            />
            <span className="font-medium text-slate-600 dark:text-zinc-400">
              {!health
                ? 'API Offline'
                : health.aiConfigured
                  ? 'Motor IA Online'
                  : 'Chave IA Pendente'}
            </span>
          </div>
          {health?.aiModel && (
            <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-500 dark:bg-[#111111] dark:text-zinc-500">
              <Activity className="h-2.5 w-2.5 text-emerald-500" />
              {health.aiModel}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Sidebar({
  desktopOpen,
  mobileOpen,
  onCloseMobile,
  onCollapseDesktop,
  reports,
  selectedReportId,
  onSelectReport,
  onNewAnalysis,
  onGoHome,
  onOpenAdmin,
  isAdminView,
  onDeleteReport,
  health,
  user,
  onLogout,
}) {
  return (
    <>
      {/* Desktop collapsible sidebar — sticky diretamente no aside para fixar o rodapé do usuário */}
      <motion.aside
        initial={false}
        animate={{ width: desktopOpen ? 288 : 0, opacity: desktopOpen ? 1 : 0 }}
        transition={{ duration: 0.22, ease: 'easeInOut' }}
        className="sticky top-0 z-20 hidden h-screen shrink-0 self-start overflow-hidden border-r border-slate-200/90 bg-white lg:block dark:border-[#1F1F1F] dark:bg-[#050505]"
      >
        <div className="h-full w-72">
          <SidebarContent
            reports={reports}
            selectedReportId={selectedReportId}
            onSelectReport={onSelectReport}
            onNewAnalysis={onNewAnalysis}
            onGoHome={onGoHome}
            onOpenAdmin={onOpenAdmin}
            isAdminView={isAdminView}
            onDeleteReport={onDeleteReport}
            onCollapseDesktop={onCollapseDesktop}
            health={health}
            user={user}
            onLogout={onLogout}
          />
        </div>
      </motion.aside>

      {/* Mobile slide-over drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onCloseMobile}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', stiffness: 360, damping: 34 }}
              style={{
                paddingTop: 'var(--app-safe-top, 0px)',
                paddingBottom: 'var(--app-safe-bottom, 0px)',
              }}
              className="relative z-10 h-full w-80 max-w-[85vw] border-r border-slate-200 bg-white shadow-2xl dark:border-[#1F1F1F] dark:bg-[#050505]"
            >
              <SidebarContent
                reports={reports}
                selectedReportId={selectedReportId}
                onSelectReport={onSelectReport}
                onNewAnalysis={onNewAnalysis}
                onGoHome={onGoHome}
                onOpenAdmin={onOpenAdmin}
                isAdminView={isAdminView}
                onDeleteReport={onDeleteReport}
                onCloseMobile={onCloseMobile}
                health={health}
                user={user}
                onLogout={onLogout}
              />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
