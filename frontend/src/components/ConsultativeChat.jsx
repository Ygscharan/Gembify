import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  Bot,
  Loader2,
  MessageSquareText,
  Send,
  Sparkles,
  User,
} from 'lucide-react';

function FormattedMessage({ content }) {
  const lines = (content || '').split('\n');

  const renderInlineBold = (text) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
        return (
          <strong key={idx} className="font-semibold text-slate-900 dark:text-white">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return <React.Fragment key={idx}>{part}</React.Fragment>;
    });
  };

  return (
    <div className="space-y-1.5 text-sm leading-relaxed">
      {lines.map((line, index) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={index} className="h-1" />;

        if (/^[-*•]\s+/.test(trimmed)) {
          return (
            <div key={index} className="flex items-start gap-2 pl-1">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
              <span>{renderInlineBold(trimmed.replace(/^[-*•]\s+/, ''))}</span>
            </div>
          );
        }

        if (/^\d+\.\s+/.test(trimmed)) {
          const match = trimmed.match(/^(\d+\.)\s+(.*)$/);
          return (
            <div key={index} className="flex items-start gap-2 pl-1">
              <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                {match?.[1]}
              </span>
              <span>{renderInlineBold(match?.[2] || trimmed)}</span>
            </div>
          );
        }

        return <p key={index}>{renderInlineBold(trimmed)}</p>;
      })}
    </div>
  );
}

export default function ConsultativeChat({
  reportId,
  suggestedQuestions = [],
  chatHistory = [],
  onSendMessage,
  isSending,
  chatError,
}) {
  const [inputValue, setInputValue] = useState('');
  const endRef = useRef(null);

  useEffect(() => {
    if (chatHistory.length > 0 || isSending) {
      endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [chatHistory.length, isSending]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const trimmed = inputValue.trim();
    if (!trimmed || isSending) return;
    setInputValue('');
    await onSendMessage(reportId, trimmed);
  };

  const handleSuggestionClick = async (question) => {
    if (isSending) return;
    await onSendMessage(reportId, question);
  };

  return (
    <section
      id="consultative-chat"
      className="saas-card overflow-hidden border-emerald-500/20 dark:border-[#1F1F1F]"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/70 px-5 py-4 sm:px-6 dark:border-[#1F1F1F] dark:bg-[#0D0D0D]">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 text-black shadow-md shadow-emerald-500/20">
            <MessageSquareText className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 sm:text-base dark:text-white">
              Mesa de Discussão com o Consultor Lean IA
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Traga novas restrições de espaço, verba ou segurança (NR) para refinar este diagnóstico
            </p>
          </div>
        </div>

        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 font-mono text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
          Contexto do relatório ativo
        </span>
      </div>

      {/* Suggested questions from consultant */}
      {suggestedQuestions.length > 0 && (
        <div className="border-b border-slate-100 bg-white px-5 py-4 sm:px-6 dark:border-[#1A1A1A] dark:bg-[#080808]">
          <div className="mb-2.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
            <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
            Perguntas estratégicas do consultor — clique para debater:
          </div>
          <div className="flex flex-wrap gap-2">
            {suggestedQuestions.map((question, idx) => (
              <button
                key={idx}
                type="button"
                disabled={isSending}
                onClick={() => handleSuggestionClick(question)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-left text-xs font-medium text-slate-700 transition-all hover:border-emerald-500/60 hover:bg-emerald-50/70 hover:text-emerald-950 disabled:opacity-50 dark:border-[#222222] dark:bg-[#111111] dark:text-zinc-300 dark:hover:border-emerald-500/50 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-200"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages area */}
      <div className="max-h-[460px] space-y-4 overflow-y-auto bg-slate-50/40 p-5 sm:p-6 dark:bg-[#040404]">
        {chatHistory.length === 0 && !isSending ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-6 text-center dark:border-[#1F1F1F] dark:bg-[#0A0A0A]">
            <Bot className="mx-auto h-8 w-8 text-emerald-500/80" />
            <p className="mt-2.5 text-sm font-semibold text-slate-800 dark:text-zinc-200">
              Pronto para aprofundar a implantação na sua fábrica
            </p>
            <p className="mx-auto mt-1 max-w-md text-xs text-slate-500 dark:text-zinc-400">
              Clique em uma das perguntas sugeridas acima ou envie uma restrição real, como{' '}
              <span className="italic text-slate-700 dark:text-zinc-300">
                &ldquo;não tenho espaço para rampa longa, qual alternativa segura para paleteira?&rdquo;
              </span>
            </p>
          </div>
        ) : (
          chatHistory.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                    isUser
                      ? 'bg-slate-900 text-white dark:bg-zinc-800 dark:text-zinc-200'
                      : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </div>

                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                    isUser
                      ? 'bg-slate-900 text-white dark:bg-emerald-500/15 dark:border dark:border-emerald-500/30 dark:text-zinc-100'
                      : 'border border-slate-200/90 bg-white text-slate-700 shadow-sm dark:border-[#1F1F1F] dark:bg-[#0B0B0B] dark:text-zinc-300'
                  }`}
                >
                  {isUser ? (
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                  ) : (
                    <FormattedMessage content={msg.content} />
                  )}
                </div>
              </motion.div>
            );
          })
        )}

        {isSending && (
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <Bot className="h-4 w-4" />
            </div>
            <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-medium text-slate-500 dark:border-[#1F1F1F] dark:bg-[#0B0B0B] dark:text-zinc-400">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-500" />
              Consultor analisando sua restrição...
            </div>
          </div>
        )}

        <div ref={endRef} />
      </div>

      {/* Chat error */}
      {chatError && (
        <div className="flex items-center gap-2 border-t border-rose-500/20 bg-rose-50 px-5 py-2.5 text-xs text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{chatError}</span>
        </div>
      )}

      {/* Input form */}
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2.5 border-t border-slate-100 bg-white p-4 sm:px-6 dark:border-[#1F1F1F] dark:bg-[#0A0A0A]"
      >
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          disabled={isSending}
          placeholder="Ex: Não tenho espaço para rampa longa ou meu teto de verba é R$ 3.000..."
          className="saas-input flex-1 py-2.5"
        />
        <button
          type="submit"
          disabled={!inputValue.trim() || isSending}
          className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-emerald-500 dark:text-black dark:hover:bg-emerald-400"
        >
          {isSending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          <span className="hidden sm:inline">Enviar</span>
        </button>
      </form>
    </section>
  );
}
