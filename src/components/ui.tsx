import { Atom, Crosshair, Dices, Footprints, Hammer, Moon, PawPrint, Rocket, User, Waves, CircleSlash, type LucideIcon } from 'lucide-react'
import type { Trader, TraderIcon } from '../types'

const ICONS: Record<TraderIcon, LucideIcon> = {
  paw: PawPrint,
  steps: Footprints,
  moon: Moon,
  slash: CircleSlash,
  rocket: Rocket,
  dice: Dices,
  target: Crosshair,
  hammer: Hammer,
  waves: Waves,
  atom: Atom,
  user: User,
}

export function Logo({ className = '' }: { className?: string }) {
  return <img className={`logo ${className}`} src="/logo-white.png" alt="EdgeDuel" width={549} height={52} />
}

export function Avatar({ trader, size = 40 }: { trader: Trader; size?: number }) {
  const Icon = ICONS[trader.icon]
  return (
    <span className="avatar" aria-hidden="true" style={{ width: size, height: size, background: trader.color }}>
      <Icon size={Math.round(size * 0.52)} strokeWidth={2.2} />
    </span>
  )
}

/**
 * Decorative lightning that flashes now and then (see .ambient-bolt in index.css).
 * Purely visual; hidden from assistive tech and from pointer events.
 */
export function AmbientBolt({ className = '', delay = 0 }: { className?: string; delay?: number }) {
  return (
    <svg className={`ambient-bolt ${className}`} style={{ animationDelay: `${delay}s` }} viewBox="0 0 60 120" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="bolt-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffd45a" />
          <stop offset="1" stopColor="#ff7a1a" />
        </linearGradient>
      </defs>
      <path d="M38 2 10 66h18L20 118 54 48H34z" fill="url(#bolt-g)" />
    </svg>
  )
}

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="eyebrow">{children}</p>
}

export function Toast({ message }: { message: string }) {
  return (
    <div className="toast-region" role="status" aria-live="polite">
      {message && <div className="toast">{message}</div>}
    </div>
  )
}
