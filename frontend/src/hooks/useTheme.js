import { useEffect, useState } from 'react';

const STORAGE_KEY = 'mfv_lean_theme';

export function useTheme() {
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'amoled';
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === 'light' || saved === 'amoled') return saved;
    return 'amoled';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'amoled') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'amoled' ? 'light' : 'amoled'));
  };

  return {
    theme,
    isAmoled: theme === 'amoled',
    toggleTheme,
    setTheme,
  };
}
