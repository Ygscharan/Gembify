import React, { useEffect } from 'react';
import { motion } from 'framer-motion';

export default function SplashIntro({ onFinish }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish?.();
    }, 1650);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <motion.div
      key="gembify-splash"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.04 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-[#F8FAFC] px-6 dark:bg-[#000000]"
    >
      {/* Aura radial suave ao redor da logo */}
      <motion.div
        aria-hidden="true"
        initial={{ opacity: 0, scale: 0.65 }}
        animate={{ opacity: 1, scale: 1.15 }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        className="pointer-events-none absolute h-80 w-80 rounded-full bg-gradient-to-tr from-emerald-500/20 via-amber-400/10 to-cyan-500/20 blur-3xl dark:from-emerald-500/25 dark:via-amber-400/10 dark:to-cyan-500/25"
      />

      <div className="relative flex flex-col items-center text-center">
        {/* Logotipo Gembify com entrada fluida */}
        <motion.div
          initial={{ opacity: 0, scale: 0.78, y: 12, filter: 'blur(8px)' }}
          animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
          className="relative flex h-44 w-44 items-center justify-center overflow-hidden rounded-[2.25rem] bg-black p-3 ring-1 ring-emerald-500/40 shadow-2xl shadow-emerald-500/20 sm:h-52 sm:w-52 dark:ring-emerald-500/35 dark:shadow-[0_0_64px_-12px_rgba(16,185,129,0.5)]"
        >
          <img
            src="/gembify-logo.jpg"
            alt="Gembify"
            className="h-full w-full scale-110 object-contain select-none"
            draggable={false}
          />
        </motion.div>

        {/* Bordão surgindo suavemente */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.38, ease: [0.22, 1, 0.36, 1] }}
          className="mt-6 max-w-xs text-sm font-medium tracking-tight text-slate-600 dark:text-zinc-400"
        >
          Seu copiloto avançado para{' '}
          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
            decisões complexas.
          </span>
        </motion.p>

        {/* Barra de carregamento minimalista e contínua */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45, duration: 0.3 }}
          className="mt-6 h-1 w-36 overflow-hidden rounded-full bg-slate-200 dark:bg-[#161616]"
        >
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: '0%' }}
            transition={{ duration: 1.1, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="h-full w-full rounded-full bg-gradient-to-r from-emerald-500 via-amber-400 to-cyan-500"
          />
        </motion.div>
      </div>
    </motion.div>
  );
}
