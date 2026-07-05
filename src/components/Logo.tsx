/**
 * Kettesben logó: két gyűrűsfarkú lemur farka, amelyek egy szándékosan
 * pontatlan szív alakot formálnak. A gyűrűket a farok-útvonalra húzott
 * szaggatott második vonal adja.
 */
export function Logo({ className = 'h-8 w-8' }: { className?: string }) {
  // Bal farok: alul indul, a szív bal íve, a hegye befelé kunkorodik.
  const left = 'M60 103 C 30 82, 10 56, 17 36 C 22 21, 41 17, 47 30 C 51 39, 45 46, 38 45';
  // Jobb farok: kicsit másképp ível — ettől "pontatlan" a szív.
  const right = 'M61 102 C 92 83, 112 55, 104 34 C 98 18, 79 17, 74 31 C 70 41, 77 48, 84 46';
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="lemur-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8b5cf6" />
          <stop offset="1" stopColor="#ec4899" />
        </linearGradient>
      </defs>
      {[left, right].map((d, i) => (
        <g key={i}>
          <path d={d} fill="none" stroke="url(#lemur-grad)" strokeWidth="11.5" strokeLinecap="round" />
          <path
            d={d}
            fill="none"
            stroke="#1e1033"
            strokeOpacity="0.55"
            strokeWidth="11.5"
            strokeDasharray="5.5 11"
            strokeDashoffset={i === 0 ? 3 : 9}
          />
        </g>
      ))}
    </svg>
  );
}
