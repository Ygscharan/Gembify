import React from 'react';

const SIZE_CLASSES = {
  sm: 'h-8 w-8 rounded-lg p-1',
  md: 'h-9 w-9 rounded-xl p-1',
  lg: 'h-11 w-11 rounded-2xl p-1.5',
  xl: 'h-14 w-14 rounded-2xl p-1.5',
};

export default function GembifyMark({ size = 'md', className = '' }) {
  const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.md;

  return (
    <div
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden bg-black ring-1 ring-emerald-500/35 shadow-md shadow-emerald-500/15 dark:ring-emerald-500/30 dark:shadow-[0_0_20px_-6px_rgba(16,185,129,0.45)] ${sizeClass} ${className}`}
    >
      <img
        src="/gembify-icon.png"
        alt="Logo Gembify"
        className="h-full w-full object-contain select-none"
        draggable={false}
      />
    </div>
  );
}
