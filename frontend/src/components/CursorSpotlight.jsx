import React, { useEffect, useRef } from 'react';

const SHIELD_SELECTOR =
  '.saas-card, [data-spotlight-shield="true"], aside, header, [role="dialog"], form';

export default function CursorSpotlight({ isAmoled }) {
  const spotlightRef = useRef(null);
  const gridHighlightRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (event) => {
      const target = event.target instanceof Element ? event.target : null;
      const isOverProtectedBox = Boolean(target && target.closest(SHIELD_SELECTOR));
      const x = `${event.clientX}px`;
      const y = `${event.clientY}px`;

      if (spotlightRef.current) {
        spotlightRef.current.style.setProperty('--mx', x);
        spotlightRef.current.style.setProperty('--my', y);
        spotlightRef.current.style.opacity = isOverProtectedBox ? '0' : '1';
      }

      if (gridHighlightRef.current) {
        gridHighlightRef.current.style.setProperty('--mx', x);
        gridHighlightRef.current.style.setProperty('--my', y);
        gridHighlightRef.current.style.opacity = isOverProtectedBox ? '0' : '1';
      }
    };

    const handleMouseLeave = () => {
      if (spotlightRef.current) spotlightRef.current.style.opacity = '0';
      if (gridHighlightRef.current) gridHighlightRef.current.style.opacity = '0';
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <>
      {/* Lanterna suave reduzida pela metade (220px), restrita apenas ao fundo */}
      <div
        ref={spotlightRef}
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 opacity-0 transition-opacity duration-200"
        style={{
          background: isAmoled
            ? 'radial-gradient(220px circle at var(--mx, 50%) var(--my, 50%), rgba(255, 255, 255, 0.085), rgba(16, 185, 129, 0.07) 40%, rgba(6, 182, 212, 0.035) 62%, transparent 78%)'
            : 'radial-gradient(220px circle at var(--mx, 50%) var(--my, 50%), rgba(255, 255, 255, 0.92), rgba(16, 185, 129, 0.12) 42%, rgba(6, 182, 212, 0.05) 65%, transparent 78%)',
        }}
      />

      {/* Realce sutil da grade pontilhada sob o cursor (135px) */}
      <div
        ref={gridHighlightRef}
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 opacity-0 transition-opacity duration-200"
        style={{
          backgroundImage: isAmoled
            ? 'radial-gradient(rgba(16, 185, 129, 0.42) 1px, transparent 1px)'
            : 'radial-gradient(rgba(16, 185, 129, 0.38) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          WebkitMaskImage:
            'radial-gradient(135px circle at var(--mx, 50%) var(--my, 50%), black 0%, transparent 76%)',
          maskImage:
            'radial-gradient(135px circle at var(--mx, 50%) var(--my, 50%), black 0%, transparent 76%)',
        }}
      />
    </>
  );
}
