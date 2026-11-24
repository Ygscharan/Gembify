import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Building2, Sparkles, X } from 'lucide-react';
import GembifyMark from './GembifyMark.jsx';

export default function NewConsultationModal({ isOpen, onClose, onConfirm }) {
  const [empresa, setEmpresa] = useState('');
  const [segmento, setSegmento] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setEmpresa('');
      setSegmento('');
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 80);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!empresa.trim()) return;
    onConfirm({
      empresa: empresa.trim(),
      segmento: segmento.trim(),
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/75 backdrop-blur-sm"
          />

          {/* Modal Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 12 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-consultation-title"
            className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-[#242424] dark:bg-[#0A0A0A]"
          >
            {/* Accent bar */}
            <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500" />

            <div className="p-6">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <GembifyMark size="lg" />
                  <div>
                    <h2
                      id="new-consultation-title"
                      className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white"
                    >
                      Nova Consultoria Gembify
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-zinc-400">
                      Identifique a empresa para iniciar o diagnóstico MFV
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Fechar"
                  className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:text-zinc-500 dark:hover:bg-[#161616] dark:hover:text-zinc-200"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div>
                  <label
                    htmlFor="modal-empresa"
                    className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-zinc-400"
                  >
                    <Building2 className="h-3.5 w-3.5 text-emerald-500" />
                    Nome da Empresa *
                  </label>
                  <input
                    ref={inputRef}
                    id="modal-empresa"
                    type="text"
                    required
                    value={empresa}
                    onChange={(e) => setEmpresa(e.target.value)}
                    placeholder="Ex: PlastiPack Embalagens Ltda"
                    className="saas-input"
                  />
                </div>

                <div>
                  <label
                    htmlFor="modal-segmento"
                    className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-zinc-400"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-cyan-500" />
                    Segmento{' '}
                    <span className="font-normal lowercase text-slate-400">(opcional agora)</span>
                  </label>
                  <input
                    id="modal-segmento"
                    type="text"
                    value={segmento}
                    onChange={(e) => setSegmento(e.target.value)}
                    placeholder="Ex: Indústria de sacolas plásticas, Metalúrgica..."
                    className="saas-input"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-[#242424] dark:bg-[#111111] dark:text-zinc-300 dark:hover:border-zinc-700"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={!empresa.trim()}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-600/20 transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-emerald-500 dark:text-black dark:hover:bg-emerald-400"
                  >
                    Iniciar Consultoria
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
