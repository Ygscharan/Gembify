import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Check,
  Clock,
  Copy,
  Image as ImageIcon,
  Rocket,
  Sparkles,
  TrendingUp,
  Wrench,
  Zap,
} from 'lucide-react';

const TIERS = [
  {
    key: 'zero_baixo_custo',
    label: 'Zero / Baixo Custo',
    subtitle: 'Quick Wins & Padronização',
    icon: Zap,
    borderAccent:
      'border-emerald-500/30 hover:border-emerald-500/65 dark:border-emerald-500/25 dark:hover:border-emerald-500/60 dark:hover:shadow-glow-emerald',
    topBar: 'from-emerald-500 to-teal-400',
    badgeClass:
      'bg-emerald-500/12 text-emerald-700 border-emerald-500/25 dark:bg-emerald-500/15 dark:text-emerald-400',
    iconBg: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
    impactBg:
      'border-emerald-500/20 bg-emerald-50/70 text-emerald-950 dark:border-emerald-500/20 dark:bg-emerald-500/[0.07] dark:text-emerald-200',
  },
  {
    key: 'medio_custo',
    label: 'Médio Custo',
    subtitle: 'Melhoria Estrutural & Ergonomia',
    icon: Wrench,
    borderAccent:
      'border-amber-500/30 hover:border-amber-500/65 dark:border-amber-500/25 dark:hover:border-amber-500/60 dark:hover:shadow-glow-amber',
    topBar: 'from-amber-500 to-orange-500',
    badgeClass:
      'bg-amber-500/12 text-amber-800 border-amber-500/25 dark:bg-amber-500/15 dark:text-amber-400',
    iconBg: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
    impactBg:
      'border-amber-500/20 bg-amber-50/70 text-amber-950 dark:border-amber-500/20 dark:bg-amber-500/[0.07] dark:text-amber-200',
  },
  {
    key: 'alto_custo',
    label: 'Alto Custo',
    subtitle: 'MFV Futuro & Transformação',
    icon: Rocket,
    borderAccent:
      'border-cyan-500/30 hover:border-cyan-500/65 dark:border-cyan-500/25 dark:hover:border-cyan-500/60 dark:hover:shadow-glow-cyan',
    topBar: 'from-cyan-500 to-violet-500',
    badgeClass:
      'bg-cyan-500/12 text-cyan-800 border-cyan-500/25 dark:bg-cyan-500/15 dark:text-cyan-400',
    iconBg: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400',
    impactBg:
      'border-cyan-500/20 bg-cyan-50/70 text-cyan-950 dark:border-cyan-500/20 dark:bg-cyan-500/[0.07] dark:text-cyan-200',
  },
];

export default function ActionPlansGrid({ planos }) {
  const [copiedKey, setCopiedKey] = useState(null);
  const [expandedPromptKey, setExpandedPromptKey] = useState(null);

  if (!planos) return null;

  const handleCopyPrompt = async (key, text) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1800);
    } catch {
      // Silencioso
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            Roadmap de Implantação
          </span>
          <h3 className="text-lg font-extrabold tracking-tight text-slate-900 sm:text-xl dark:text-white">
            Planos de Ação por Faixa de Investimento
          </h3>
        </div>
        <p className="text-xs text-slate-500 dark:text-zinc-400">
          Do Quick Win imediato até o redesenho definitivo do Fluxo de Valor
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {TIERS.map((tier, index) => {
          const plan = planos[tier.key];
          if (!plan) return null;
          const Icon = tier.icon;
          const isPromptOpen = expandedPromptKey === tier.key;

          return (
            <motion.article
              key={tier.key}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: index * 0.08 }}
              className={`saas-card relative flex flex-col overflow-hidden border transition-all duration-200 ${tier.borderAccent}`}
            >
              {/* Top gradient accent bar */}
              <div className={`h-1.5 w-full bg-gradient-to-r ${tier.topBar}`} />

              <div className="flex flex-1 flex-col p-5 sm:p-6">
                {/* Tier header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${tier.iconBg}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="block text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                        {tier.label}
                      </span>
                      <span className="block text-[11px] text-slate-500 dark:text-zinc-500">
                        {tier.subtitle}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Prazo + Ferramenta badges */}
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {plan.prazo_estimado && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 font-mono text-[11px] font-medium text-slate-700 dark:border-[#242424] dark:bg-[#121212] dark:text-zinc-300">
                      <Clock className="h-3 w-3 text-slate-400" />
                      {plan.prazo_estimado}
                    </span>
                  )}
                  {plan.ferramenta_lean_aplicada && (
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${tier.badgeClass}`}
                    >
                      <Sparkles className="h-3 w-3" />
                      {plan.ferramenta_lean_aplicada}
                    </span>
                  )}
                </div>

                {/* Title & Description */}
                <h4 className="mt-4 text-base font-bold leading-snug text-slate-900 dark:text-white">
                  {plan.titulo}
                </h4>

                <p className="mt-2.5 flex-1 text-sm leading-relaxed text-slate-600 dark:text-zinc-400">
                  {plan.descricao}
                </p>

                {/* Expected impact callout */}
                {plan.impacto_esperado && (
                  <div className={`mt-5 rounded-xl border p-3.5 ${tier.impactBg}`}>
                    <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider opacity-80">
                      <TrendingUp className="h-3.5 w-3.5" />
                      Impacto Esperado
                    </div>
                    <p className="mt-1 text-xs leading-relaxed font-medium">
                      {plan.impacto_esperado}
                    </p>
                  </div>
                )}

                {/* Isometric Image Prompt (ready for future image gen) */}
                {plan.prompt_imagem && (
                  <div className="mt-4 border-t border-slate-100 pt-3.5 dark:border-[#1A1A1A]">
                    <div className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedPromptKey(isPromptOpen ? null : tier.key)
                        }
                        className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 transition hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200"
                      >
                        <ImageIcon className="h-3.5 w-3.5" />
                        {isPromptOpen ? 'Ocultar prompt visual' : 'Ver prompt visual (Isométrico)'}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCopyPrompt(tier.key, plan.prompt_imagem)}
                        title="Copiar prompt de imagem em inglês"
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-zinc-400 dark:hover:bg-[#161616] dark:hover:text-white"
                      >
                        {copiedKey === tier.key ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-500" />
                            Copiado
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            Copiar
                          </>
                        )}
                      </button>
                    </div>

                    {isPromptOpen && (
                      <p className="mt-2 rounded-lg border border-slate-200/80 bg-slate-50 p-2.5 font-mono text-[11px] leading-relaxed text-slate-600 dark:border-[#1F1F1F] dark:bg-[#050505] dark:text-zinc-400">
                        {plan.prompt_imagem}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </motion.article>
          );
        })}
      </div>
    </section>
  );
}
