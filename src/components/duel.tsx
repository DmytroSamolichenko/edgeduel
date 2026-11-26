import { useId } from 'react'
import { Lock } from 'lucide-react'
import type { Duel } from '../types'
import { mult, pct } from '../format'
import { lockInfo, netMult, sharePct } from '../market'

export function PnlText({ v, className = '' }: { v: number; className?: string }) {
  return <span className={`tnum ${v >= 0 ? 'up' : 'down'} ${className}`}>{pct(v)}</span>
}

export function PhaseBadge({ d }: { d: Duel }) {
  if (d.phase === 'settled') return <span className="pill pill-done">Settled</span>
  if (d.phase === 'upcoming') return <span className="pill pill-warn">Upcoming</span>
  return (
    <span className="live-tag">
      <i className="live-dot" /> Live
    </span>
  )
}

export function LockChip({ d }: { d: Duel }) {
  const { text, open } = lockInfo(d)
  return (
    <p className={`lock-chip ${open ? 'is-open' : ''}`} role="status">
      {!open && d.phase !== 'settled' && <Lock size={12} aria-hidden="true" />}
      <span className="tnum">{text}</span>
    </p>
  )
}

/** Split bar showing where the money is, with the live payout multiplier for each side. */
export function PoolBar({ d }: { d: Duel }) {
  const l = sharePct(d, 0)
  return (
    <div className="poolbar">
      <div className="poolbar-track" role="img" aria-label={`${d.sides[0].name} ${l.toFixed(0)}% of pool, ${d.sides[1].name} ${(100 - l).toFixed(0)}%`}>
        <i className="poolbar-l" style={{ width: `${l}%` }} />
        <i className="poolbar-r" />
      </div>
      <div className="poolbar-labels">
        <span>
          <b className="tnum">{l.toFixed(0)}%</b> <em className="tnum">{mult(netMult(d, 0))}</em>
        </span>
        <span>
          <em className="tnum">{mult(netMult(d, 1))}</em> <b className="tnum">{(100 - l).toFixed(0)}%</b>
        </span>
      </div>
    </div>
  )
}

interface ChartProps {
  series: number[][]
  colors: string[]
  /** horizontal reference line value */
  base: number
  height?: number
  /** fixed x extent so the line grows as time passes */
  total?: number
  min?: number
  max?: number
}

export function LineChart({ series, colors, base, height = 120, total, min, max }: ChartProps) {
  const id = useId()
  const w = 600
  const all = series.flat()
  const lo = min ?? Math.min(base, ...all)
  const hi = max ?? Math.max(base, ...all)
  const span = hi - lo || 1
  const n = total ?? Math.max(...series.map((s) => s.length - 1), 1)
  const x = (i: number) => (i / n) * w
  const y = (v: number) => height - 6 - ((v - lo) / span) * (height - 12)
  const path = (s: number[]) => s.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ')
  return (
    <svg className="linechart" viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none" style={{ height }} aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={colors[0]} stopOpacity="0.22" />
          <stop offset="1" stopColor={colors[0]} stopOpacity="0" />
        </linearGradient>
      </defs>
      <line x1="0" x2={w} y1={y(base)} y2={y(base)} className="spark-zero" />
      {series.length === 1 && <path d={`${path(series[0])} L${x(series[0].length - 1).toFixed(1)} ${height} L0 ${height} Z`} fill={`url(#${id})`} />}
      {series.map((s, i) => (
        <path key={i} d={path(s)} fill="none" stroke={colors[i]} strokeWidth="2" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      ))}
    </svg>
  )
}
