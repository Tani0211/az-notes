'use client';
import { Moon, Sun } from 'lucide-react';
import { useSyncExternalStore } from 'react';
function subscribe(callback: () => void) {
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  });
  return () => observer.disconnect();
}
function getTheme() {
  return document.documentElement.dataset.theme === 'dark';
}
export function ThemeToggle() {
  const dark = useSyncExternalStore(subscribe, getTheme, () => false);
  function toggle() {
    const next = !dark;
    document.documentElement.dataset.theme = next ? 'dark' : 'light';
    try {
      localStorage.setItem('b15-theme', next ? 'dark' : 'light');
    } catch {}
  }
  return (
    <button
      className="icon-button"
      onClick={toggle}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={dark ? 'Light mode' : 'Dark mode'}
    >
      {dark ? <Sun size={19} /> : <Moon size={19} />}
    </button>
  );
}
