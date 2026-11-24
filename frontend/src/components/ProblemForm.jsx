import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowRight,
  Briefcase,
  Building2,
  ClipboardList,
  Layers,
  ShieldAlert,
  Sparkles,
  Zap,
} from 'lucide-react';
import { QUICK_EXAMPLES } from '../data/quickExamples.js';

export default function ProblemForm({ onSubmit, error, health, draftSession }) {
  const [formData, setFormData] = useState({
    empresa: draftSession?.empresa || '',
    segmento: draftSession?.segmento || '',
    setor: '',
    descricao: '',
    restricoes: '',
  });
  const [selectedExampleId, setSelectedExampleId] = useState(null);
  const formRef = useRef(null);
  const segmentoRef = useRef(null);
  const setorRef = useRef(null);

  useEffect(() => {
    if (!draftSession?.sessionKey) return;
    setSelectedExampleId(null);
    setFormData({
      empresa: draftSession.empresa || '',
      segmento: draftSession.segmento || '',
      setor: '',
      descricao: '',
      restricoes: '',
    });
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (draftSession.segmento) {
        setorRef.current?.focus();
      } else {
        segmentoRef.current?.focus();
      }
    }, 100);
  }, [draftSession]);

  const handleChange = (field) => (event) => {
    setSelectedExampleId(null);
    setFormData((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleFillExample = (example) => {
    setSelectedExampleId(example.id);
    setFormData({ ...example.payload });
  };

  const handleQuickAnalyze = (example) => {
    setSelectedExampleId(example.id);
    setFormData({ ...example.payload });
    onSubmit(example.payload);
  };

  const handleFormSubmit = (event) => {
    event.preventDefault();
    if (!formData.segmento.trim() || !formData.setor.trim() || !formData.descricao.trim()) {
      return;
    }
    onSubmit(formData);
  };

  const isValid =
    formData.segmento.trim().length > 1 &&
    formData.setor.trim().length > 1 &&
    formData.descricao.trim().length > 10;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="mx-auto max-w-4xl space-y-6 pb-12"
    >
      {/* Hero section */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-6 shadow-soft-card sm:p-8 dark:border-[#1F1F1F] dark:bg-[#0A0A0A] dark:shadow-none">
        {/* Subtle top accent glow in AMOLED */}
        <div className="pointer-events-none absolute -top-24 right-0 h-56 w-56 rounded-full bg-emerald-500/10 blur-3xl dark:bg-emerald-500/15" />
        <div className="pointer-events-none absolute -bottom-24 left-12 h-48 w-48 rounded-full bg-cyan-500/10 blur-3xl dark:bg-cyan-500/10" />

        <div className="relative flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              <Sparkles className="h-3.5 w-3.5" />
              Gembify · Engenharia de Processos &amp; Lean Manufacturing com IA
            </div>

            <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
              Seu copiloto de{' '}
              <span className="bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
                Lean Manufacturing
              </span>{' '}
              no chão de fábrica
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base dark:text-zinc-400">
              Relate uma observação, parada, retrabalho ou problema ergonômico. O consultor IA do{' '}
              <strong className="font-semibold text-slate-800 dark:text-zinc-200">Gembify</strong>{' '}
              mapeia os 8 desperdícios{' '}
              <strong className="font-semibold text-slate-800 dark:text-zinc-200">TIMWOODS</strong>,
              desenha o fluxo atual vs. otimizado (MFV) e estrutura soluções em{' '}
              <strong className="font-semibold text-slate-800 dark:text-zinc-200">3 faixas de investimento</strong>.
            </p>
          </div>

          {/* Harmonic Gembify Brand Showcase */}
          <div className="hidden shrink-0 md:flex md:flex-col md:items-center">
            <div className="relative flex h-32 w-32 items-center justify-center overflow-hidden rounded-3xl bg-black p-3 ring-1 ring-emerald-500/30 shadow-xl shadow-emerald-500/10 dark:ring-[#242424] dark:shadow-[0_0_40px_-10px_rgba(16,185,129,0.35)]">
              <img
                src="/gembify-logo.jpg"
                alt="Gembify"
                className="h-full w-full scale-125 object-contain select-none"
                draggable={false}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Warning if GEMINI_API_KEY is not configured yet */}
      {health && !health.aiConfigured && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-500/40 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
          <div>
            <p className="font-semibold">Chave da API Gemini ainda não configurada no backend</p>
            <p className="mt-1 text-xs opacity-90">
              Copie <code className="rounded bg-black/10 px-1.5 py-0.5 font-mono dark:bg-white/10">backend/.env.example</code> para{' '}
              <code className="rounded bg-black/10 px-1.5 py-0.5 font-mono dark:bg-white/10">backend/.env</code>, insira sua{' '}
              <code className="rounded bg-black/10 px-1.5 py-0.5 font-mono dark:bg-white/10">GEMINI_API_KEY</code> e reinicie o servidor backend.
            </p>
          </div>
        </div>
      )}

      {/* Quick Examples */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-500" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
              Exemplos Rápidos — Teste em 1 Clique
            </h2>
          </div>
          <span className="hidden text-xs text-slate-400 sm:inline dark:text-zinc-500">
            Clique para preencher ou analisar imediatamente
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
          {QUICK_EXAMPLES.map((example) => {
            const isSelected = selectedExampleId === example.id;
            const accentStyles =
              example.accent === 'emerald'
                ? 'border-emerald-500/25 hover:border-emerald-500/60 dark:hover:shadow-glow-emerald'
                : 'border-amber-500/25 hover:border-amber-500/60 dark:hover:shadow-glow-amber';

            const badgeStyles =
              example.accent === 'emerald'
                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                : 'bg-amber-500/10 text-amber-700 dark:text-amber-400';

            return (
              <motion.div
                key={example.id}
                whileHover={{ y: -2 }}
                className={`saas-card flex flex-col justify-between p-4 transition-all ${accentStyles} ${
                  isSelected ? 'ring-2 ring-emerald-500/40' : ''
                }`}
              >
                <div>
                  <span
                    className={`inline-block rounded-md px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide ${badgeStyles}`}
                  >
                    {example.badge}
                  </span>
                  <h3 className="mt-2 text-sm font-bold text-slate-900 dark:text-white">
                    {example.title}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-zinc-400">
                    {example.summary}
                  </p>
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleFillExample(example)}
                    className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-[#1F1F1F] dark:bg-[#111111] dark:text-zinc-300 dark:hover:border-zinc-700"
                  >
                    Preencher formulário
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickAnalyze(example)}
                    className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-800 dark:bg-emerald-500 dark:text-black dark:hover:bg-emerald-400"
                  >
                    Analisar agora
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Main guided form */}
      <form ref={formRef} onSubmit={handleFormSubmit} className="saas-card p-6 sm:p-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4 dark:border-[#1F1F1F]">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Relato de Observação no Chão de Fábrica
              </h2>
              {formData.empresa?.trim() && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/35 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  <Briefcase className="h-3 w-3" />
                  {formData.empresa.trim()}
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">
              Quanto mais detalhes práticos do fluxo você informar, mais preciso será o diagnóstico MFV.
            </p>
          </div>
          <span className="hidden rounded-lg bg-slate-100 px-2.5 py-1 font-mono text-[11px] font-medium text-slate-600 sm:inline-block dark:bg-[#141414] dark:text-zinc-400">
            TIMWOODS + 5 Porquês
          </span>
        </div>

        {error && (
          <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-rose-500/40 bg-rose-50 p-3.5 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="mb-5">
          <label
            htmlFor="empresa"
            className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-zinc-400"
          >
            <Briefcase className="h-3.5 w-3.5 text-teal-500" />
            Nome da Empresa <span className="font-normal lowercase text-slate-400">(opcional)</span>
          </label>
          <input
            id="empresa"
            type="text"
            value={formData.empresa}
            onChange={handleChange('empresa')}
            placeholder="Ex: PlastiPack Embalagens Ltda"
            className="saas-input"
          />
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label
              htmlFor="segmento"
              className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-zinc-400"
            >
              <Building2 className="h-3.5 w-3.5 text-emerald-500" />
              Segmento da Empresa *
            </label>
            <input
              ref={segmentoRef}
              id="segmento"
              type="text"
              required
              value={formData.segmento}
              onChange={handleChange('segmento')}
              placeholder="Ex: Fábrica de sacolas plásticas, Metalúrgica, Alimentos..."
              className="saas-input"
            />
          </div>

          <div>
            <label
              htmlFor="setor"
              className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-zinc-400"
            >
              <Layers className="h-3.5 w-3.5 text-cyan-500" />
              Setor / Área Afetada *
            </label>
            <input
              ref={setorRef}
              id="setor"
              type="text"
              required
              value={formData.setor}
              onChange={handleChange('setor')}
              placeholder="Ex: Depósito e expedição, Linha de corte, Embalagem..."
              className="saas-input"
            />
          </div>
        </div>

        <div className="mt-5">
          <label
            htmlFor="descricao"
            className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-zinc-400"
          >
            <ClipboardList className="h-3.5 w-3.5 text-amber-500" />
            Observação / Problema no Chão de Fábrica *
          </label>
          <textarea
            id="descricao"
            required
            rows={5}
            value={formData.descricao}
            onChange={handleChange('descricao')}
            placeholder="Descreva o que acontece na rotina: onde ocorre o gargalo, retrabalho, fila, deslocamento desnecessário ou esforço físico dos operadores..."
            className="saas-input resize-y leading-relaxed"
          />
        </div>

        <div className="mt-5">
          <label
            htmlFor="restricoes"
            className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-zinc-400"
          >
            <ShieldAlert className="h-3.5 w-3.5 text-violet-500" />
            Restrições Conhecidas <span className="font-normal lowercase text-slate-400">(opcional)</span>
          </label>
          <input
            id="restricoes"
            type="text"
            value={formData.restricoes}
            onChange={handleChange('restricoes')}
            placeholder="Ex: Sem espaço para rampa longa, turno 24h, orçamento limitado para obra civil..."
            className="saas-input"
          />
        </div>

        <div className="mt-6 flex flex-col items-stretch justify-between gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center dark:border-[#1F1F1F]">
          <p className="text-xs text-slate-500 dark:text-zinc-500">
            O relatório será salvo automaticamente no seu histórico para discussão contínua.
          </p>
          <button
            type="submit"
            disabled={!isValid}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition-all hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40 dark:from-emerald-500 dark:to-cyan-500 dark:text-black dark:shadow-[0_0_24px_-4px_rgba(16,185,129,0.5)]"
          >
            <Sparkles className="h-4 w-4" />
            Gerar Consultoria Lean IA
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </form>
    </motion.div>
  );
}
