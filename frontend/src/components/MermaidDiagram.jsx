import React, { useEffect, useId, useState } from 'react';
import mermaid from 'mermaid';
import {
  AlertTriangle,
  Check,
  Code2,
  Copy,
  Eye,
  GitCompare,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from 'lucide-react';

function normalizeMermaidSource(code) {
  if (!code || typeof code !== 'string') return '';
  return code
    .replace(/^```(?:mermaid)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
}

export default function MermaidDiagram({ code, isAmoled }) {
  const uniqueId = useId().replace(/[:]/g, '');
  const [svgContent, setSvgContent] = useState('');
  const [renderError, setRenderError] = useState(null);
  const [showCode, setShowCode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [zoom, setZoom] = useState(1);

  const normalizedCode = normalizeMermaidSource(code);

  useEffect(() => {
    let cancelled = false;

    async function renderDiagram() {
      if (!normalizedCode) {
        setSvgContent('');
        setRenderError('Nenhum código de diagrama Mermaid foi retornado para este relatório.');
        return;
      }

      try {
        setRenderError(null);

        mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'loose',
          flowchart: {
            useMaxWidth: false,
            htmlLabels: true,
            curve: 'basis',
            padding: 16,
          },
          theme: 'base',
          themeVariables: isAmoled
            ? {
                darkMode: true,
                background: '#050505',
                primaryColor: '#0F172A',
                primaryTextColor: '#F4F4F5',
                primaryBorderColor: '#10B981',
                lineColor: '#52525B',
                secondaryColor: '#111111',
                tertiaryColor: '#0A0A0A',
                clusterBkg: '#0D0D0D',
                clusterBorder: '#27272A',
                edgeLabelBackground: '#0A0A0A',
                fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: '13px',
              }
            : {
                darkMode: false,
                background: '#F8FAFC',
                primaryColor: '#FFFFFF',
                primaryTextColor: '#0F172A',
                primaryBorderColor: '#059669',
                lineColor: '#64748B',
                secondaryColor: '#F1F5F9',
                tertiaryColor: '#ECFDF5',
                clusterBkg: '#F8FAFC',
                clusterBorder: '#CBD5E1',
                edgeLabelBackground: '#FFFFFF',
                fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: '13px',
              },
        });

        const renderId = `mfv-mermaid-${uniqueId}-${Date.now()}`;
        const { svg } = await mermaid.render(renderId, normalizedCode);

        if (!cancelled) {
          setSvgContent(svg);
          setRenderError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setSvgContent('');
          setRenderError(
            err?.message || 'A sintaxe Mermaid retornada pela IA não pôde ser renderizada.'
          );
        }
      }
    }

    renderDiagram();

    return () => {
      cancelled = true;
    };
  }, [normalizedCode, isAmoled, uniqueId]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(normalizedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Fallback silencioso se clipboard não estiver disponível
    }
  };

  return (
    <section className="saas-card overflow-hidden">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6 dark:border-[#1F1F1F]">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
            <GitCompare className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 sm:text-base dark:text-white">
              Fluxograma Comparativo MFV (Atual vs. Otimizado)
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Visualização automática do fluxo com gargalo versus estado futuro Lean
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {!showCode && !renderError && (
            <div className="mr-1 hidden items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5 sm:flex dark:border-[#1F1F1F] dark:bg-[#111111]">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(0.65, Number((z - 0.15).toFixed(2))))}
                title="Reduzir zoom"
                className="rounded-md p-1.5 text-slate-500 transition hover:bg-white hover:text-slate-900 dark:text-zinc-400 dark:hover:bg-[#1B1B1B] dark:hover:text-white"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setZoom(1)}
                title="Resetar zoom"
                className="rounded-md px-1.5 py-1 font-mono text-[11px] font-medium text-slate-600 transition hover:bg-white dark:text-zinc-400 dark:hover:bg-[#1B1B1B]"
              >
                {Math.round(zoom * 100)}%
              </button>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(1.6, Number((z + 0.15).toFixed(2))))}
                title="Ampliar zoom"
                className="rounded-md p-1.5 text-slate-500 transition hover:bg-white hover:text-slate-900 dark:text-zinc-400 dark:hover:bg-[#1B1B1B] dark:hover:text-white"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </button>
              {zoom !== 1 && (
                <button
                  type="button"
                  onClick={() => setZoom(1)}
                  title="Restaurar escala"
                  className="rounded-md p-1.5 text-slate-500 transition hover:bg-white hover:text-slate-900 dark:text-zinc-400 dark:hover:bg-[#1B1B1B]"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowCode((prev) => !prev)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-[#1F1F1F] dark:bg-[#111111] dark:text-zinc-300 dark:hover:border-zinc-700"
          >
            {showCode ? <Eye className="h-3.5 w-3.5" /> : <Code2 className="h-3.5 w-3.5" />}
            {showCode ? 'Visual' : 'Código'}
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-[#1F1F1F] dark:bg-[#111111] dark:text-zinc-300 dark:hover:border-zinc-700"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-500" />
                Copiado
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                Copiar
              </>
            )}
          </button>
        </div>
      </div>

      {/* Canvas or Fallback */}
      <div className="bg-slate-50/70 p-4 sm:p-6 dark:bg-[#050505]">
        {renderError ? (
          <div className="space-y-3">
            <div className="flex items-start gap-3 rounded-xl border border-amber-500/35 bg-amber-50 p-3.5 text-xs text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
              <div>
                <p className="font-semibold">
                  Não foi possível renderizar o fluxograma visualmente (fallback de segurança ativado)
                </p>
                <p className="mt-1 opacity-85">
                  O código Mermaid original está disponível abaixo para inspeção ou cópia.
                </p>
              </div>
            </div>
            <pre className="overflow-x-auto rounded-xl border border-slate-200 bg-white p-4 font-mono text-xs leading-relaxed text-slate-700 dark:border-[#1F1F1F] dark:bg-[#0A0A0A] dark:text-zinc-300">
              {normalizedCode}
            </pre>
          </div>
        ) : showCode ? (
          <pre className="overflow-x-auto rounded-xl border border-slate-200 bg-white p-4 font-mono text-xs leading-relaxed text-slate-700 dark:border-[#1F1F1F] dark:bg-[#0A0A0A] dark:text-zinc-300">
            {normalizedCode}
          </pre>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200/80 bg-white p-4 sm:p-6 dark:border-[#1A1A1A] dark:bg-[#080808]">
            <div
              className="mermaid-canvas flex min-h-[160px] items-center justify-center transition-transform duration-200 origin-left"
              style={{ transform: `scale(${zoom})` }}
              dangerouslySetInnerHTML={{ __html: svgContent }}
            />
          </div>
        )}
      </div>
    </section>
  );
}
