import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertOctagon,
  Boxes,
  Brain,
  Building2,
  Calendar,
  ChevronDown,
  ChevronUp,
  Clock,
  Cog,
  Compass,
  Factory,
  Footprints,
  GitBranch,
  Layers,
  MessageSquare,
  Plus,
  Truck,
  Wrench,
} from 'lucide-react';
import MermaidDiagram from './MermaidDiagram.jsx';
import ActionPlansGrid from './ActionPlansGrid.jsx';
import ConsultativeChat from './ConsultativeChat.jsx';

function getWasteMeta(tipo = '') {
  const normalized = tipo.toLowerCase();
  if (normalized.includes('transport')) {
    return { icon: Truck, color: 'text-sky-600 bg-sky-500/10 border-sky-500/25 dark:text-sky-400' };
  }
  if (normalized.includes('invent')) {
    return { icon: Boxes, color: 'text-amber-600 bg-amber-500/10 border-amber-500/25 dark:text-amber-400' };
  }
  if (normalized.includes('moviment')) {
    return { icon: Footprints, color: 'text-orange-600 bg-orange-500/10 border-orange-500/25 dark:text-orange-400' };
  }
  if (normalized.includes('esper')) {
    return { icon: Clock, color: 'text-rose-600 bg-rose-500/10 border-rose-500/25 dark:text-rose-400' };
  }
  if (normalized.includes('superprod')) {
    return { icon: Factory, color: 'text-violet-600 bg-violet-500/10 border-violet-500/25 dark:text-violet-400' };
  }
  if (normalized.includes('superproc')) {
    return { icon: Cog, color: 'text-indigo-600 bg-indigo-500/10 border-indigo-500/25 dark:text-indigo-400' };
  }
  if (normalized.includes('defeit')) {
    return { icon: AlertOctagon, color: 'text-red-600 bg-red-500/10 border-red-500/25 dark:text-red-400' };
  }
  return { icon: Brain, color: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/25 dark:text-emerald-400' };
}

export default function ReportView({
  report,
  isAmoled,
  onNewAnalysis,
  onSendChatMessage,
  isSendingChat,
  chatError,
}) {
  const [showOriginalInput, setShowOriginalInput] = useState(false);

  if (!report) return null;

  const { input, analysis, chatHistory = [], createdAt, id } = report;
  const diagnostico = analysis?.diagnostico_lean || {};
  const desperdicios = diagnostico.desperdicios_timwoods || [];
  const ferramentas = diagnostico.ferramentas_recomendadas || [];

  const formattedDate = createdAt
    ? new Date(createdAt).toLocaleString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  const scrollToChat = () => {
    document.getElementById('consultative-chat')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <motion.div
      key={id}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mx-auto max-w-6xl space-y-6 pb-16"
    >
      {/* Top Report Banner */}
      <header className="saas-card relative overflow-hidden p-5 sm:p-7">
        <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl dark:bg-emerald-500/15" />

        <div className="relative flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-2">
              {input?.empresa && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-500/35 bg-teal-500/10 px-3 py-1 text-xs font-bold text-teal-700 dark:text-teal-300">
                  <Factory className="h-3.5 w-3.5" />
                  {input.empresa}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                <Building2 className="h-3.5 w-3.5" />
                {input?.segmento}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-700 dark:text-cyan-400">
                <Layers className="h-3.5 w-3.5" />
                {input?.setor}
              </span>
              <span className="inline-flex items-center gap-1 font-mono text-[11px] text-slate-400 dark:text-zinc-500">
                <Calendar className="h-3 w-3" />
                {formattedDate}
              </span>
            </div>

            <h1 className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl dark:text-white">
              Diagnóstico Lean Manufacturing &amp; MFV
            </h1>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={scrollToChat}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-[#242424] dark:bg-[#111111] dark:text-zinc-200 dark:hover:border-zinc-700"
            >
              <MessageSquare className="h-3.5 w-3.5 text-emerald-500" />
              Discutir no Chat
            </button>
            <button
              type="button"
              onClick={onNewAnalysis}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 dark:bg-emerald-500 dark:text-black dark:hover:bg-emerald-400"
            >
              <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
              Nova Análise
            </button>
          </div>
        </div>

        {/* Toggle original observation */}
        <div className="relative mt-4 border-t border-slate-100 pt-3.5 dark:border-[#1A1A1A]">
          <button
            type="button"
            onClick={() => setShowOriginalInput((prev) => !prev)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            {showOriginalInput ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
            {showOriginalInput ? 'Ocultar relato original' : 'Ver relato original e restrições informadas'}
          </button>

          {showOriginalInput && (
            <div className="mt-3 grid grid-cols-1 gap-3 rounded-xl border border-slate-200/80 bg-slate-50 p-4 text-xs sm:grid-cols-3 dark:border-[#1F1F1F] dark:bg-[#050505]">
              <div className="sm:col-span-2">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                  Observação Relatada
                </span>
                <p className="mt-1 leading-relaxed text-slate-700 dark:text-zinc-300">
                  {input?.descricao}
                </p>
              </div>
              <div>
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                  Restrições
                </span>
                <p className="mt-1 leading-relaxed text-slate-700 dark:text-zinc-300">
                  {input?.restricoes || 'Nenhuma restrição adicional informada.'}
                </p>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Executive Summary + Root Cause (5 Whys) */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="saas-card p-5 sm:p-6"
        >
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Compass className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 sm:text-base dark:text-white">
                Resumo Técnico do Problema
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-zinc-500">
                Síntese executiva de engenharia industrial
              </p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-slate-600 dark:text-zinc-300">
            {analysis?.resumo_problema}
          </p>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="saas-card p-5 sm:p-6"
        >
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <GitBranch className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 sm:text-base dark:text-white">
                Causa Raiz Provável (5 Porquês)
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-zinc-500">
                Investigação estrutural além do sintoma aparente
              </p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-slate-600 dark:text-zinc-300">
            {diagnostico.causa_raiz_provavel}
          </p>
        </motion.section>
      </div>

      {/* TIMWOODS Wastes Grid */}
      <section className="space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Diagnóstico dos 8 Desperdícios
            </span>
            <h2 className="text-lg font-extrabold tracking-tight text-slate-900 sm:text-xl dark:text-white">
              Desperdícios TIMWOODS Identificados ({desperdicios.length})
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {desperdicios.map((item, idx) => {
            const { icon: WasteIcon, color } = getWasteMeta(item.tipo);
            return (
              <motion.div
                key={`${item.tipo}-${idx}`}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28, delay: idx * 0.05 }}
                whileHover={{ y: -2 }}
                className="saas-card p-5 transition-all hover:border-slate-300 dark:hover:border-zinc-700"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${color}`}
                  >
                    <WasteIcon className="h-4 w-4" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {item.tipo}
                  </h3>
                </div>
                <p className="mt-3 text-xs leading-relaxed text-slate-600 sm:text-sm dark:text-zinc-400">
                  {item.justificativa}
                </p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Recommended Lean Tools */}
      {ferramentas.length > 0 && (
        <section className="saas-card p-5 sm:p-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400">
              <Wrench className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 sm:text-base dark:text-white">
                Ferramentas Lean Recomendadas
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-zinc-500">
                Arsenal metodológico do Sistema Toyota de Produção indicado para este gargalo
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {ferramentas.map((tool, idx) => (
              <motion.span
                key={`${tool}-${idx}`}
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2, delay: idx * 0.04 }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-800 transition hover:border-emerald-500/50 hover:bg-emerald-50/50 dark:border-[#222222] dark:bg-[#111111] dark:text-zinc-200 dark:hover:border-emerald-500/40"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                {tool}
              </motion.span>
            ))}
          </div>
        </section>
      )}

      {/* Mermaid Visual Diagram */}
      <MermaidDiagram code={analysis?.diagrama_mermaid} isAmoled={isAmoled} />

      {/* 3-Tier Action Plans */}
      <ActionPlansGrid planos={analysis?.planos_de_acao} />

      {/* Integrated Consultative Chat */}
      <ConsultativeChat
        reportId={id}
        suggestedQuestions={analysis?.perguntas_para_discussao || []}
        chatHistory={chatHistory}
        onSendMessage={onSendChatMessage}
        isSending={isSendingChat}
        chatError={chatError}
      />
    </motion.div>
  );
}
