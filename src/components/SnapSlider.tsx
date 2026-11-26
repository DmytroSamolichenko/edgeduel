import { useRef, useState } from 'react'
import './slider.css'

interface Props {
  id: string
  label: string
  stops: number[]
  value: number
  onChange: (v: number) => void
  /** long form for the big readout */
  format: (v: number) => string
  /** short form for the stop labels */
  short?: (v: number) => string
  tone?: 'spark'
}

/**
 * A draggable thumb that snaps to fixed stops. The track up to the thumb is lit,
 * the rest stays dark, and the chosen stop's label glows.
 */
export function SnapSlider({ id, label, stops, value, onChange, format, short = format, tone }: Props) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [drag, setDrag] = useState(false)
  const last = stops.length - 1
  const idx = Math.max(0, stops.indexOf(value))
  const pos = (i: number) => `${(i / last) * 100}%`

  const pick = (clientX: number) => {
    const r = trackRef.current?.getBoundingClientRect()
    if (!r) return
    const f = Math.min(1, Math.max(0, (clientX - r.left) / r.width))
    const next = stops[Math.round(f * last)]
    if (next !== value) onChange(next)
  }

  const onKey = (e: React.KeyboardEvent) => {
    const step = { ArrowLeft: -1, ArrowDown: -1, ArrowRight: 1, ArrowUp: 1 }[e.key]
    if (step) onChange(stops[Math.min(last, Math.max(0, idx + step))])
    else if (e.key === 'Home') onChange(stops[0])
    else if (e.key === 'End') onChange(stops[last])
    else return
    e.preventDefault()
  }

  return (
    <div className="snap" data-tone={tone}>
      <div className="snap-head">
        <span id={`${id}-l`} className="snap-label">
          {label}
        </span>
        <output key={value} className="snap-readout" htmlFor={id}>
          {format(value)}
        </output>
      </div>

      <div
        className={`snap-area ${drag ? 'is-drag' : ''}`}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId)
          setDrag(true)
          pick(e.clientX)
        }}
        onPointerMove={(e) => drag && pick(e.clientX)}
        onPointerUp={() => setDrag(false)}
        onPointerCancel={() => setDrag(false)}
      >
        <div className="snap-track" ref={trackRef}>
          <div className="snap-fill" style={{ width: pos(idx) }} />
          {stops.map((s, i) => (
            <i key={s} className={`snap-tick ${i <= idx ? 'on' : ''}`} style={{ left: pos(i) }} />
          ))}
          <div
            id={id}
            className="snap-thumb"
            style={{ left: pos(idx) }}
            role="slider"
            tabIndex={0}
            aria-labelledby={`${id}-l`}
            aria-valuemin={0}
            aria-valuemax={last}
            aria-valuenow={idx}
            aria-valuetext={format(value)}
            onKeyDown={onKey}
          />
        </div>
        <div className="snap-stops" aria-hidden="true">
          {stops.map((s, i) => (
            <span key={s} className={i === idx ? 'on' : ''} style={{ left: pos(i) }}>
              {short(s)}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
