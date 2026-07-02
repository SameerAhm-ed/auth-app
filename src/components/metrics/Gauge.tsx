// The one capacity-ring gauge used across every live metric card.
// A 96px ring (96 = w-24) showing a clamped percentage with a centred label.
const R = 54
const SW = 12
const C = 2 * Math.PI * R

export function Gauge({ pct, color, ariaLabel }: { pct: number; color: string; ariaLabel?: string }) {
  const v = Math.min(Math.max(pct, 0), 100)
  const dash = (v / 100) * C
  return (
    <div className="relative w-24 h-24 shrink-0">
      <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90" role="img" aria-label={ariaLabel}>
        <circle cx="60" cy="60" r={R} fill="none" stroke="var(--color-surface-subtle)" strokeWidth={SW} />
        <circle
          cx="60"
          cy="60"
          r={R}
          fill="none"
          stroke={color}
          strokeWidth={SW}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${C - dash}`}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-ink tabular-nums">
        {Math.round(v)}%
      </div>
    </div>
  )
}
