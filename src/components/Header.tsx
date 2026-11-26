import { Swords, Ticket, Trophy, Wallet } from 'lucide-react'
import type { Tab } from '../types'
import { Logo } from './ui'
import { useMarket } from '../store'
import { betStatus } from '../market'
import { money } from '../format'

export const DEMO_ADDRESS = '7xKXq3…9fQ2'

interface Props {
  tab: Tab
  onTab: (t: Tab) => void
  connected: boolean
  onToggleWallet: () => void
}

export function Header({ tab, onTab, connected, onToggleWallet }: Props) {
  const { bets, duels, balance } = useMarket()
  const claimable = bets.filter((b) => !b.claimed && b.payout).length
  const open = bets.filter((b) => {
    const d = duels.find((x) => x.id === b.duelId)
    return d && betStatus(d, b) === 'open'
  }).length
  const tabs: { id: Tab; label: string; icon: React.ReactNode; dot?: boolean; badge?: number }[] = [
    { id: 'predict', label: 'Predict', icon: <Trophy size={16} />, dot: true },
    { id: 'arena', label: 'Arena', icon: <Swords size={16} /> },
    { id: 'positions', label: 'Positions', icon: <Ticket size={16} />, badge: claimable || open },
  ]

  return (
    <header className="header">
      <div className="header-in">
        <a className="brand" href="/" aria-label="EdgeDuel home" onClick={(e) => (e.preventDefault(), onTab('predict'))}>
          <Logo />
        </a>

        <nav className="tabs" role="tablist" aria-label="Sections">
          {tabs.map((t) => (
            <button
              key={t.id}
              role="tab"
              id={`tab-${t.id}`}
              aria-selected={tab === t.id}
              aria-controls={`panel-${t.id}`}
              className="tab"
              onClick={() => onTab(t.id)}
            >
              {t.icon}
              <span>{t.label}</span>
              {t.dot && <i className="live-dot" aria-label="live duels" />}
              {!!t.badge && (
                <b className={`tab-badge ${claimable ? 'is-claim' : ''}`} aria-label={claimable ? `${claimable} to claim` : `${open} open bets`}>
                  {t.badge}
                </b>
              )}
            </button>
          ))}
        </nav>

        <div className="header-actions">
          <span className="chip-btn chain" title="EdgeDuel runs on Solana">
            <SolanaMark />
            Solana
          </span>
          {connected && <span className="chip-btn chain balance tnum" title="Demo USDC balance">{money(Math.floor(balance))}</span>}
          <button
            className={`btn btn-primary ${connected ? 'is-connected' : ''}`}
            onClick={onToggleWallet}
            aria-label={connected ? `Wallet ${DEMO_ADDRESS}, click to disconnect` : 'Connect wallet'}
          >
            <Wallet size={16} />
            <span>{connected ? DEMO_ADDRESS : 'Connect wallet'}</span>
          </button>
        </div>
      </div>
    </header>
  )
}

function SolanaMark() {
  return (
    <svg className="sol-mark" width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
      <defs>
        <linearGradient id="sol-g" x1="3" y1="21" x2="21" y2="3" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#9945ff" />
          <stop offset="0.5" stopColor="#5d8bf0" />
          <stop offset="1" stopColor="#14f195" />
        </linearGradient>
      </defs>
      <g fill="url(#sol-g)">
        <path d="M5.2 3.2h16.3l-2.7 3.9H2.5z" />
        <path d="M2.5 10h16.3l2.7 3.9H5.2z" />
        <path d="M5.2 16.9h16.3l-2.7 3.9H2.5z" />
      </g>
    </svg>
  )
}
