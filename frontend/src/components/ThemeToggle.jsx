import React from 'react';
import { motion } from 'framer-motion';
import { Moon, Sun } from 'lucide-react';

export default function ThemeToggle({ isAmoled, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={isAmoled ? 'Ativar Modo Claro' : 'Ativar Modo Preto Absoluto AMOLED'}
      title={isAmoled ? 'Alternar para Modo Claro' : 'Alternar para Modo Preto Absoluto (AMOLED)'}
      className="group relative inline-flex h-10 items-center gap-2 rounded-full border border-slate-200 bg-white px-2 pr-3.5 text-xs font-semibold text-slate-700 shadow-sm transition-all hover:border-slate-300 dark:border-[#1F1F1F] dark:bg-[#0A0A0A] dark:text-zinc-200 dark:hover:border-zinc-700"
    >
      <div className="relative flex h-6 w-12 items-center rounded-full bg-slate-100 p-0.5 transition-colors dark:bg-[#141414]">
        <motion.div
          layout
          transition={{ type: 'spring', stiffness: 520, damping: 32 }}
          className={`flex h-5 w-5 items-center justify-center rounded-full shadow-sm ${
            isAmoled
              ? 'ml-auto bg-emerald-500 text-black shadow-[0_0_12px_rgba(16,185,129,0.7)]'
              : 'mr-auto bg-amber-400 text-slate-900 shadow-[0_0_10px_rgba(251,191,36,0.5)]'
          }`}
        >
          {isAmoled ? <Moon className="h-3 w-3" /> : <Sun className="h-3 w-3" />}
        </motion.div>
      </div>
      <span className="hidden sm:inline tracking-tight">
        {isAmoled ? 'AMOLED' : 'Claro'}
      </span>
    </button>
  );
}
