// Reusable multi-segment SVG donut with a centered hero label.
const R = 80
const SW = 40 // ~60% cutout
const C = 2 * Math.PI * R
const GAP = 8

export interface DonutSegment {
  value: number
  color: string
}

export function Donut({ segments, hero, sublabel }: { segments: DonutSegment[]; hero: string; sublabel: string }) {
  const total = segments.reduce((acc, s) => acc + s.value, 0)
  const arcFor = (v: number) => (total > 0 ? (v / total) * C : 0)
  const segs = segments.map((s, i) => {
    const prior = segments.slice(0, i).reduce((acc, p) => acc + arcFor(p.value), 0)
    const dash = Math.max(arcFor(s.value) - GAP, 0)
    return { color: s.color, dash, rest: C - dash, offset: -prior }
  })

  return (
    <div className="relative mx-auto w-full max-w-[220px] aspect-square">
      <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90" role="img" aria-label={`${hero} ${sublabel}`}>
        <circle cx="100" cy="100" r={R} fill="none" stroke="var(--color-surface-subtle)" strokeWidth={SW} />
        {segs.map((seg, i) => (
          <circle
            key={i}
            cx="100"
            cy="100"
            r={R}
            fill="none"
            stroke={seg.color}
            strokeWidth={SW}
            strokeDasharray={`${seg.dash} ${seg.rest}`}
            strokeDashoffset={seg.offset}
          />
        ))}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-ink tabular-nums leading-none">{hero}</span>
        <span className="mt-1 text-xs font-medium text-ink-secondary">{sublabel}</span>
      </div>
    </div>
  )
}
