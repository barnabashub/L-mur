'use client';

import { useEffect, useState } from 'react';

/** Világos/sötét téma váltó — a beállítás a localStorage-ban marad meg. */
export function ThemeToggle() {
  const [dark, setDark] = useState<boolean | null>(null);

  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'));
  }, []);

  const toggle = () => {
    const next = !document.documentElement.classList.contains('dark');
    document.documentElement.classList.toggle('dark', next);
    try {
      localStorage.setItem('kettesben-theme', next ? 'dark' : 'light');
    } catch {}
    setDark(next);
  };

  return (
    <button
      onClick={toggle}
      className="rounded-2xl p-2 text-lg text-mute transition hover:bg-soft"
      title="Téma váltása"
      aria-label="Világos/sötét téma váltása"
    >
      {dark === null ? '◐' : dark ? '☀️' : '🌙'}
    </button>
  );
}
