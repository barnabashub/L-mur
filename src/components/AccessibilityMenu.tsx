'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Szabványos akadálymentességi gomb (♿) és panel.
 * A beállítások osztályokként kerülnek a <html> elemre, és a
 * localStorage-ban maradnak meg; betöltéskor a layout init-scriptje
 * villanás nélkül visszaállítja őket.
 */
const OPTIONS = [
  { key: 'a11y-betu', label: 'Nagyobb betűméret', hint: 'kb. 25%-kal nagyobb szöveg mindenhol' },
  { key: 'a11y-kontraszt', label: 'Magas kontraszt', hint: 'erős színkontraszt, aláhúzott linkek' },
  { key: 'a11y-nyugodt', label: 'Kevesebb mozgás', hint: 'animációk és áttűnések kikapcsolása' },
] as const;

const STORAGE_KEY = 'lmur-a11y';

export function AccessibilityMenu() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setActive(OPTIONS.map((o) => o.key).filter((k) => document.documentElement.classList.contains(k)));
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    const onClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
    };
  }, [open]);

  const toggle = (key: string) => {
    const on = !document.documentElement.classList.contains(key);
    document.documentElement.classList.toggle(key, on);
    const next = on ? [...active, key] : active.filter((k) => k !== key);
    setActive(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {}
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen(!open)}
        className={`rounded-2xl p-2 text-lg transition hover:bg-soft ${active.length ? 'bg-brand-soft text-brand-strong' : 'text-mute'}`}
        title="Akadálymentességi beállítások"
        aria-label="Akadálymentességi beállítások"
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
          <circle cx="12" cy="3.5" r="2.2" />
          <path d="M12 6.5c-.9 0-1.6.7-1.6 1.6v4.6l-3.9 6.2a1.3 1.3 0 1 0 2.2 1.4l3.3-5.3 3.3 5.3a1.3 1.3 0 1 0 2.2-1.4l-3.9-6.2V10l3.8-.9a1.2 1.2 0 1 0-.5-2.3l-4 .9c-.3.1-.6.1-.9 0z" />
        </svg>
      </button>
      {open && (
        <div
          role="dialog"
          aria-label="Akadálymentességi beállítások"
          className="absolute right-0 top-12 z-20 w-72 rounded-blob border border-edge bg-card p-4 shadow-xl"
        >
          <h2 className="mb-3 text-sm font-bold text-ink">Akadálymentesség</h2>
          <div className="space-y-3">
            {OPTIONS.map((o) => (
              <label key={o.key} className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={active.includes(o.key)}
                  onChange={() => toggle(o.key)}
                  className="mt-1 h-4 w-4 accent-violet-500"
                />
                <span>
                  <span className="block text-sm font-semibold text-ink">{o.label}</span>
                  <span className="block text-xs text-mute">{o.hint}</span>
                </span>
              </label>
            ))}
          </div>
          <p className="mt-3 border-t border-edge pt-2 text-xs text-faint">
            A beállításokat a böngésző megjegyzi.
          </p>
        </div>
      )}
    </div>
  );
}
