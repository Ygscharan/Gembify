import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Cpu, GitCompare, Layers, Search, Wrench } from 'lucide-react';
import GembifyMark from './GembifyMark.jsx';

const LOADING_STEPS = [
  {
    id: 1,
    label: 'Interpretando observação do chão de fábrica...',
    detail: 'Identificando fluxo produtivo, restrições e pontos críticos',
    icon: Search,
  },
  {
    id: 2,
    label: 'Mapeando desperdícios TIMWOODS...',
    detail: 'Classificando perdas de transporte, movimentação, espera e retrabalho',
    icon: Layers,
  },
  {
    id: 3,
    label: 'Selecionando ferramentas Lean & 5 Porquês...',
    detail: 'Correlacionando MFV, 5S, Kaizen, Poka-Yoke, SMED e Trabalho Padronizado',
    icon: Wrench,
  },
  {
    id: 4,
    label: 'Desenhando fluxograma MFV (Atual vs. Otimizado)...',
    detail: 'Estruturando diagrama visual comparativo em Mermaid.js',
    icon: GitCompare,
  },
  {
    id: 5,
    label: 'Estruturando planos de investimento...',
    detail: 'Consolidando Zero/Baixo Custo, Médio Custo e Alto Custo com prompts visuais',
    icon: Cpu,
  },
];

export default function AnalysisLoader({ problemPreview }) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev < LOADING_STEPS.length - 1 ? prev + 1 : prev));
    }, 2200);
    return () => clearInterval(timer);
  }, []);

  const progressPct = Math.min(94, Math.round(((activeIndex + 1) / LOADING_STEPS.length) * 92));

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="mx-auto max-w-2xl py-6 sm:py-12"
    >
      <div className="saas-card relative overflow-hidden p-6 sm:p-8">
        <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-96 -translate-x-1/2 rounded-full bg-emerald-500/15 blur-3xl" />

        <div className="relative text-center">
          <div className="relative mx-auto flex h-16 w-16 items-center justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}
              className="absolute inset-0 rounded-2xl border-2 border-dashed border-emerald-500/50"
            />
            <GembifyMark size="xl" />
          </div>

          <h2 className="mt-4 text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Gembify IA analisando o chão de fábrica...
          </h2>

          {problemPreview && (
            <p className="mt-1.5 text-xs font-medium text-slate-500 dark:text-zinc-400">
              {problemPreview.segmento} · <span className="text-emerald-600 dark:text-emerald-400">{problemPreview.setor}</span>
            </p>
          )}

          {/* Animated progress bar */}
          <div className="mt-6 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-[#141414]">
            <motion.div
              initial={{ width: '12%' }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400"
            />
          </div>
        </div>

        {/* Dynamic checklist stages */}
        <div className="relative mt-7 space-y-3">
          {LOADING_STEPS.map((step, index) => {
            const Icon = step.icon;
            const isCompleted = index < activeIndex;
            const isActive = index === activeIndex;

            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0.4, x: -6 }}
                animate={{
                  opacity: isCompleted || isActive ? 1 : 0.42,
                  x: 0,
                }}
                transition={{ duration: 0.3 }}
                className={`flex items-start gap-3.5 rounded-xl border p-3.5 transition-colors ${
                  isActive
                    ? 'border-emerald-500/45 bg-emerald-50/70 dark:border-emerald-500/35 dark:bg-emerald-500/10'
                    : isCompleted
                      ? 'border-slate-200/70 bg-slate-50/60 dark:border-[#1F1F1F] dark:bg-[#0D0D0D]'
                      : 'border-transparent bg-transparent'
                }`}
              >
                <div
                  className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                    isCompleted
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                      : isActive
                        ? 'bg-emerald-500 text-black shadow-[0_0_16px_rgba(16,185,129,0.5)]'
                        : 'bg-slate-100 text-slate-400 dark:bg-[#141414] dark:text-zinc-600'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <Icon className={`h-4 w-4 ${isActive ? 'animate-pulse' : ''}`} />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p
                    className={`text-sm font-semibold ${
                      isActive
                        ? 'text-emerald-950 dark:text-emerald-300'
                        : isCompleted
                          ? 'text-slate-700 dark:text-zinc-300'
                          : 'text-slate-500 dark:text-zinc-500'
                    }`}
                  >
                    {step.label}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-500">{step.detail}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
