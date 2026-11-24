/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        amoled: {
          bg: '#000000',
          surface: '#0A0A0A',
          elevated: '#111111',
          border: '#1F1F1F',
          borderHover: '#2E2E2E',
        },
        light: {
          bg: '#F8FAFC',
          surface: '#FFFFFF',
          border: '#E2E8F0',
        },
      },
      boxShadow: {
        'soft-card': '0 1px 2px rgba(15, 23, 42, 0.04), 0 8px 24px -12px rgba(15, 23, 42, 0.08)',
        'glow-emerald': '0 0 0 1px rgba(16, 185, 129, 0.28), 0 12px 32px -12px rgba(16, 185, 129, 0.22)',
        'glow-amber': '0 0 0 1px rgba(245, 158, 11, 0.28), 0 12px 32px -12px rgba(245, 158, 11, 0.22)',
        'glow-cyan': '0 0 0 1px rgba(6, 182, 212, 0.28), 0 12px 32px -12px rgba(6, 182, 212, 0.22)',
      },
    },
  },
  plugins: [],
};
