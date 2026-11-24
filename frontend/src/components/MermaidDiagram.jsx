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

function cleanLabelText(text) {
  return String(text || '')
    .replace(/["'`]/g, '')
    .replace(/[()[\]{}<>;]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function sanitizeMermaidForV11(rawCode) {
  if (!rawCode || typeof rawCode !== 'string') return '';

  let text = rawCode
    .replace(/^```(?:mermaid)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .replace(/\\n/g, '\n')
    .replace(/\r\n/g, '\n')
    .trim();

  const rawLines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  if (rawLines.length === 0) return '';

  const output = [];
  let hasHeader = false;

  for (let i = 0; i < rawLines.length; i++) {
    let line = rawLines[i];

    // Header
    if (/^(?:graph|flowchart)\s+(?:LR|RL|TD|TB|BT)\b/i.test(line)) {
      if (!hasHeader) {
        const dir = line.match(/\b(LR|RL|TD|TB|BT)\b/i)?.[1]?.toUpperCase() || 'LR';
        output.push(`flowchart ${dir}`);
        hasHeader = true;
      }
      continue;
    }

    if (!hasHeader) {
      output.push('flowchart LR');
      hasHeader = true;
    }

    // Remove trailing semicolons that sometimes break Mermaid v11
    line = line.replace(/;+\s*$/, '');

    // Subgraph normalization: subgraph ID[Title] -> subgraph ID ["Title"]
    const subWithBracket = line.match(/^subgraph\s+([A-Za-z0-9_-]+)\s*\[(.+)\]\s*$/i);
    if (subWithBracket) {
      const subId = subWithBracket[1];
      const subTitle = cleanLabelText(subWithBracket[2]) || subId;
      output.push(`  subgraph ${subId} ["${subTitle}"]`);
      continue;
    }

    const subWithQuoted = line.match(/^subgraph\s+([A-Za-z0-9_-]+)\s*\["(.+)"\]\s*$/i);
    if (subWithQuoted) {
      const subId = subWithQuoted[1];
      const subTitle = cleanLabelText(subWithQuoted[2]) || subId;
      output.push(`  subgraph ${subId} ["${subTitle}"]`);
      continue;
    }

    const subPlain = line.match(/^subgraph\s+(.+)$/i);
    if (subPlain) {
      const rawTitle = cleanLabelText(subPlain[1]);
      const safeId =
        rawTitle
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^A-Za-z0-9]+/g, '_')
          .replace(/^_|_$/g, '') || `Grupo_${i}`;
      output.push(`  subgraph ${safeId} ["${rawTitle || safeId}"]`);
      continue;
    }

    if (/^end$/i.test(line)) {
      output.push('  end');
      continue;
    }

    // Quote node labels safely: ID[label], ID(label), ID{label} -> ID["clean label"]
    // Avoid touching arrow edge labels |...|
    line = line.replace(
      /\b([A-Za-z][A-Za-z0-9_-]*)\s*\[\s*"?([^\]"]+)"?\s*\]/g,
      (_match, id, label) => `${id}["${cleanLabelText(label) || id}"]`
    );

    line = line.replace(
      /\b([A-Za-z][A-Za-z0-9_-]*)\s*\(\s*"?([^)"]+)"?\s*\)/g,
      (_match, id, label) => `${id}["${cleanLabelText(label) || id}"]`
    );

    line = line.replace(
      /\b([A-Za-z][A-Za-z0-9_-]*)\s*\{\s*"?([^}"]+)"?\s*\}/g,
      (_match, id, label) => `${id}["${cleanLabelText(label) || id}"]`
    );

    // Clean edge labels -->|text|
    line = line.replace(
      /-->\s*\|([^|]+)\|/g,
      (_match, edgeLabel) => `-->|"${cleanLabelText(edgeLabel)}"|`
    );

    output.push(`  ${line}`);
  }

  return output.join('\n');
}

function buildEmergencyDiagramFromRaw(rawCode) {
  // Extrai pares de nós se mesmo o código sanitizado tiver alguma sintaxe exótica
  const nodes = [];
  const regex = /\[([^\]]+)\]/g;
  let match;
  while ((match = regex.exec(rawCode || '')) !== null) {
    const cleaned = cleanLabelText(match[1]);
    if (cleaned && !nodes.includes(cleaned)) {
      nodes.push(cleaned);
    }
  }

  if (nodes.length < 2) return null;

  const half = Math.ceil(nodes.length / 2);
  const atual = nodes.slice(0, half);
  const otimizado = nodes.slice(half);

  const lines = ['flowchart LR', '  subgraph Atual ["Fluxo Atual com Gargalo"]'];
  atual.forEach((label, idx) => {
    lines.push(`    A${idx + 1}["${label}"]`);
    if (idx > 0) lines.push(`    A${idx} --> A${idx + 1}`);
  });
  lines.push('  end');

  if (otimizado.length > 0) {
    lines.push('  subgraph Otimizado ["Fluxo Otimizado Lean"]');
    otimizado.forEach((label, idx) => {
      lines.push(`    O${idx + 1}["${label}"]`);
      if (idx > 0) lines.push(`    O${idx} --> O${idx + 1}`);
    });
    lines.push('  end');
  }

  return lines.join('\n');
}

function cleanupMermaidErrorElements(renderId) {
  if (typeof document === 'undefined') return;
  const ids = [renderId, `d${renderId}`];
  for (const id of ids) {
    const el = document.getElementById(id);
    if (el) el.remove();
  }
  // Remove qualquer SVG de erro órfão inserido pelo Mermaid diretamente no body
  document.querySelectorAll('body > [id^="dmfv-mermaid-"], body > [id^="mfv-mermaid-"]').forEach(
    (node) => node.remove()
  );
}

export default function MermaidDiagram({ code, isAmoled }) {
  const uniqueId = useId().replace(/[^a-zA-Z0-9]/g, '');
  const [svgContent, setSvgContent] = useState('');
  const [renderError, setRenderError] = useState(null);
  const [showCode, setShowCode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [zoom, setZoom] = useState(1);

  const sanitizedCode = sanitizeMermaidForV11(code);

  useEffect(() => {
    let cancelled = false;

    async function tryRender(diagramSource, suffix) {
      const renderId = `mfv-mermaid-${uniqueId}-${suffix}-${Date.now()}`;
      try {
        const { svg } = await mermaid.render(renderId, diagramSource);
        cleanupMermaidErrorElements(renderId);
        return svg;
      } catch (err) {
        cleanupMermaidErrorElements(renderId);
        throw err;
      }
    }

    async function renderDiagram() {
      if (!sanitizedCode) {
        setSvgContent('');
        setRenderError('Nenhum código de diagrama Mermaid foi retornado para este relatório.');
        return;
      }

      mermaid.initialize({
        startOnLoad: false,
        securityLevel: 'loose',
        suppressErrorRendering: true,
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

      try {
        setRenderError(null);
        const svg = await tryRender(sanitizedCode, 'p1');
        if (!cancelled) {
          setSvgContent(svg);
          setRenderError(null);
        }
      } catch (firstErr) {
        // Segunda tentativa com reconstrução limpa dos nós extraídos
        const emergencySource = buildEmergencyDiagramFromRaw(code);
        if (emergencySource) {
          try {
            const svg = await tryRender(emergencySource, 'p2');
            if (!cancelled) {
              setSvgContent(svg);
              setRenderError(null);
              return;
            }
          } catch {
            // Segue para fallback controlado sem sujar o DOM
          }
        }

        if (!cancelled) {
          setSvgContent('');
          setRenderError(
            firstErr?.message || 'A sintaxe Mermaid retornada pela IA não pôde ser renderizada.'
          );
        }
      }
    }

    renderDiagram();

    return () => {
      cancelled = true;
    };
  }, [code, sanitizedCode, isAmoled, uniqueId]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(sanitizedCode || code || '');
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Silencioso
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
              {sanitizedCode || code}
            </pre>
          </div>
        ) : showCode ? (
          <pre className="overflow-x-auto rounded-xl border border-slate-200 bg-white p-4 font-mono text-xs leading-relaxed text-slate-700 dark:border-[#1F1F1F] dark:bg-[#0A0A0A] dark:text-zinc-300">
            {sanitizedCode}
          </pre>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200/80 bg-white p-4 sm:p-6 dark:border-[#1A1A1A] dark:bg-[#080808]">
            <div
              className="mermaid-canvas flex min-h-[160px] items-center justify-center origin-left transition-transform duration-200"
              style={{ transform: `scale(${zoom})` }}
              dangerouslySetInnerHTML={{ __html: svgContent }}
            />
          </div>
        )}
      </div>
    </section>
  );
}
