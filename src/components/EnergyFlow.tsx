'use client'

import { useState, useEffect } from 'react'

interface FloatingLineProps {
  path: string
  color: string
  reverse?: boolean
}
interface NodeProps {
  x: number
  y: number
  color: string
  title: string
  value: string
  href: string
}
interface FlowValueProps {
  x: string
  y: string
  value: string
  rotate?: number
}

// CSS-animated flowing dashed line (replaces framer-motion).
// The `energyflow` keyframe lives in globals.css.
const FloatingLine = ({ path, color, reverse = false }: FloatingLineProps) => (
  <path
    d={path}
    stroke={color}
    strokeWidth="3"
    fill="none"
    strokeDasharray="10,15"
    style={{ animation: `energyflow 3s linear infinite${reverse ? ' reverse' : ''}` }}
  />
)

const Node = ({ x, y, color, title, value, href }: NodeProps) => (
  <a href={href}>
    <g transform={`translate(${x},${y})`}>
      <circle r="40" style={{ fill: 'var(--color-surface)' }} stroke={color} strokeWidth="2" />
      <text x="0" y="0" textAnchor="middle" alignmentBaseline="middle" style={{ fill: 'var(--color-ink)' }} className="text-[12px] font-medium">
        {value}
      </text>
      <text x="0" y="30" textAnchor="middle" style={{ fill: 'var(--color-ink-secondary)' }} className="text-[10px]">
        {title}
      </text>
    </g>
  </a>
)

const FlowValue = ({ x, y, value, rotate = 0 }: FlowValueProps) => (
  <text
    x={x}
    y={y}
    textAnchor="middle"
    className="text-[11px] font-medium"
    style={{ fill: 'var(--color-ink-secondary)' }}
    transform={`rotate(${rotate} ${x} ${y})`}
  >
    {value}
  </text>
)

export default function EnergyFlow({ basePath = '/dashboard/am5' }: { basePath?: string } = {}) {
  const [flowData, setFlowData] = useState({
    ph1toPH2: 0,
    ph2toPH3: 0,
    ph3toPH4: 0,
    totalGen: 0,
    ph1Total: 0,
    ph2Total: 0,
    ph3Total: 0,
    ph4Total: 0,
    MAN_KW: 0,
    MAK1_KW: 0,
    MAK2_KW: 0,
    turbinekw: 0,
    engine6kw: 0,
    engine7kw: 0,
  })

  useEffect(() => {
    let cancelled = false
    const fetchFlowData = async () => {
      try {
        const response = await fetch('/api/v1/am5/overview', { cache: 'no-store' })
        if (!response.ok) return
        const data = await response.json()
        const o = data?.data?.overview?.[0] ?? {}
        const d = data?.data?.dashboard?.[0] ?? {}
        const p1 = data?.data?.powerhouse1?.[0] ?? {}
        const p2 = data?.data?.powerhouse2?.[0] ?? {}
        const p3 = data?.data?.powerhouse3?.[0] ?? {}
        if (cancelled) return
        setFlowData({
          ph1toPH2: o.KW_BRIDGE_TRANSFORMER_PH2 ?? 0,
          ph2toPH3: o.KW_AM17_SPINNING_PH2 ?? 0,
          ph3toPH4: o.TOWARDS_PH2_kw ?? 0,
          totalGen: d.totalpowergen ?? 0,
          ph1Total: d.powerhouse1gen ?? 0,
          ph2Total: d.powerhouse2gen ?? 0,
          ph3Total: d.powerhouse3gen ?? 0,
          ph4Total: d.AM17_PH2 ?? 0,
          MAN_KW: p3.MAN_KW ?? 0,
          MAK1_KW: p3.MAK1_KW ?? 0,
          MAK2_KW: p3.MAK2_KW ?? 0,
          turbinekw: p2.turbinekw ?? 0,
          engine6kw: p1.engine6kw ?? 0,
          engine7kw: p1.engine7kw ?? 0,
        })
      } catch (error) {
        console.error('Error fetching flow data:', error)
      }
    }
    fetchFlowData()
    const intervalId = setInterval(fetchFlowData, 1000)
    return () => {
      cancelled = true
      clearInterval(intervalId)
    }
  }, [])

  const paths = {
    ph1toPH2: 'M100,70 L300,70',
    ph2toPH3: 'M300,100 L300,300',
    ph3toPH4: 'M300,270 L100,270',
  }

  return (
    <svg className="w-full max-w-[500px] h-auto mx-auto" viewBox="0 0 400 350" preserveAspectRatio="xMidYMid meet">
      {/* Static paths */}
      <path d={paths.ph1toPH2} style={{ stroke: 'var(--color-line)' }} strokeWidth="2" fill="none" />
      <path d={paths.ph2toPH3} style={{ stroke: 'var(--color-line)' }} strokeWidth="2" fill="none" />
      <path d={paths.ph3toPH4} style={{ stroke: 'var(--color-line)' }} strokeWidth="2" fill="none" />

      {/* Flowing lines */}
      {flowData.ph1toPH2 > 0 ? (
        <FloatingLine path={paths.ph1toPH2} color="#ec4899" reverse />
      ) : (
        <FloatingLine path={paths.ph1toPH2} color="#fbbf24" />
      )}
      {flowData.ph2toPH3 > 0 ? (
        <FloatingLine path={paths.ph2toPH3} color="#ec4899" />
      ) : (
        <FloatingLine path={paths.ph2toPH3} color="#fb1f24" reverse />
      )}
      {flowData.ph3toPH4 > 0 ? (
        <FloatingLine path={paths.ph3toPH4} color="#fb1f24" />
      ) : (
        <FloatingLine path={paths.ph3toPH4} color="#60a5fa" reverse />
      )}

      {/* Flow values */}
      <FlowValue x="200" y="60" value={`${Math.abs(flowData.ph1toPH2)} KW ${flowData.ph1toPH2 > 0 ? '←' : '→'}`} />
      <FlowValue x="320" y="170" value={`${Math.abs(flowData.ph2toPH3)} KW ${flowData.ph2toPH3 > 0 ? '←' : '→'}`} rotate={-90} />
      <FlowValue x="200" y="290" value={`${Math.abs(flowData.ph3toPH4)} KW ${flowData.ph3toPH4 > 0 ? '←' : '→'}`} />

      {/* Total in the middle */}
      <text x="200" y="150" textAnchor="middle" className="text-[18px] font-bold" style={{ fill: 'var(--color-ink-secondary)' }}>
        Total
      </text>
      <text x="200" y="180" textAnchor="middle" className="text-[24px] font-bold" style={{ fill: 'var(--color-ink)' }}>
        {flowData.totalGen} KW
      </text>

      {/* Nodes */}
      <Node x={100} y={70} color="#fbbf24" title="PH1" value={`${(flowData.ph1Total / 1000).toFixed(2)} MW`} href={`${basePath}/powerhouse1`} />
      <Node x={300} y={70} color="#ec4899" title="PH2" value={`${(flowData.ph2Total / 1000).toFixed(2)} MW`} href={`${basePath}/powerhouse2`} />
      <Node x={300} y={270} color="#fb1f24" title="PH3" value={`${(flowData.ph3Total / 1000).toFixed(2)} MW`} href={`${basePath}/powerhouse3`} />
      <Node x={100} y={270} color="#60a5fa" title="PH4" value={`${(flowData.ph4Total / 1000).toFixed(2)} MW`} href={`${basePath}/powerhouse4`} />

      {/* Corner fuel labels */}
      <text x="305" y="325" textAnchor="middle" className="text-[12px] font-bold" style={{ fill: 'var(--color-ink-secondary)' }}>
        {flowData.MAN_KW > 10 || flowData.MAK1_KW > 10 || flowData.MAK2_KW > 10
          ? `HFO → ${(flowData.MAN_KW + flowData.MAK1_KW + flowData.MAK2_KW).toFixed(0)} kW`
          : ' '}
      </text>
      <text x="305" y="25" textAnchor="middle" className="text-[12px] font-bold" style={{ fill: 'var(--color-ink-secondary)' }}>
        {flowData.turbinekw > 10 ? `TURBINE → ${flowData.turbinekw.toFixed(0)} kW` : ' '}
      </text>
      <text x="100" y="25" textAnchor="middle" className="text-[12px] font-bold" style={{ fill: 'var(--color-ink-secondary)' }}>
        {flowData.engine6kw > 10 || flowData.engine7kw > 10
          ? `DIESEL → ${(flowData.engine6kw + flowData.engine7kw).toFixed(0)} kW`
          : ' '}
      </text>
    </svg>
  )
}
