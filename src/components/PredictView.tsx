import { useState } from 'react'
import { ArrowUpRight, Clock, Eye, ShieldCheck, TrendingUp, Zap } from 'lucide-react'
import type { Duel, DuelPhase, PredictSort } from '../types'
import { clock, compactMoney, money, money2 } from '../format'
import { remainingSec, totalPool } from '../market'
import { useMarket } from '../store'
import { AmbientBolt, Avatar, Eyebrow } from './ui'
import { BetPanel } from './BetPanel'
import { PhaseBadge, PnlText, PoolBar } from './duel'
import { traderStats } from '../data'

type StatusFilter = 'active' | DuelPhase
const STATUS: { id: StatusFilter; label: string }[] = [
  { id: 'active', label: 'Open' },
  { id: 'live', label: 'Live' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'settled', label: 'Settled' },
]
const SORTS: { id: PredictSort; label: string }[] = [
  { id: 'trending', label: 'Trending' },
  { id: 'ending', label: 'Ending soon' },
  { id: 'pool', label: 'Pool size' },
]

interface Props {
  needWallet: () => boolean
  notify: (msg: string) => void
}

export function PredictView({ needWallet, notify }: Props) {
  const { duels } = useMarket()
  const [status, setStatus] = useState<StatusFilter>('active')
  const [sort, setSort] = useState<PredictSort>('trending')

  const active = duels.filter((d) => d.phase !== 'settled')
  const live = active.filter((d) => d.phase === 'live').length
  const pool = active.reduce((a, d) => a + totalPool(d), 0)
  const volume = duels.reduce((a, d) => a + totalPool(d), 0)

  const shown = (() => {
    const list = duels.filter((d) => (status === 'active' ? d.phase !== 'settled' : d.phase === status))
    if (status === 'settled') return list.reverse().slice(0, 6)
    const by = {
      trending: (a: Duel, b: Duel) => b.viewers - a.viewers,
      ending: (a: Duel, b: Duel) => remainingSec(a) - remainingSec(b),
      pool: (a: Duel, b: Duel) => totalPool(b) - totalPool(a),
    }[sort]
    return [...list].sort(by)
  })()

  return (
    <>
      <section className="hero hero-predict">
        <AmbientBolt className="alt" delay={2} />
        <div>
          <Eyebrow>Live prediction market</Eyebrow>
          <h1 className="display">
            Read the market.
            <br />
            <span>Back the winner.</span>
          </h1>
          <p className="lede">
            Every duel is a market. Pick the trader you think finishes on top, share the pool with the other winners, and cash out when the session ends.
          </p>
        </div>
        <aside className="pool-card" aria-label="Active prediction pool">
          <i className="pool-bolt" aria-hidden="true">
            <Zap size={16} fill="currentColor" />
          </i>
          <p className="label">Active prediction pool</p>
          <p className="pool-value tnum">{money2(pool)}</p>
          <p className="pool-delta">
            <TrendingUp size={14} aria-hidden="true" /> {live} live · {compactMoney(volume)} total volume
          </p>
        </aside>
      </section>

      <section aria-labelledby="live-h">
        <div className="section-head">
          <div>
            <h2 id="live-h">
              Duels <span className="pill pill-live">{live} live</span>
            </h2>
            <p className="muted">Odds move as money comes in. Betting closes a quarter of the way through each session.</p>
          </div>
        </div>

        <div className="toolbar toolbar-split">
          <div className="segmented" role="group" aria-label="Status">
            {STATUS.map((s) => (
              <button key={s.id} aria-pressed={status === s.id} onClick={() => setStatus(s.id)}>
                {s.label}
              </button>
            ))}
          </div>
          {status !== 'settled' && (
            <div className="segmented" role="group" aria-label="Sort duels">
              {SORTS.map((s) => (
                <button key={s.id} aria-pressed={sort === s.id} onClick={() => setSort(s.id)}>
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {shown.length ? (
          <ul className="grid">
            {shown.map((d, i) => (
              <li key={d.id} style={{ ['--i' as string]: i }}>
                <DuelCard d={d} needWallet={needWallet} notify={notify} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="empty">
            <h3>No {status === 'active' ? 'open' : status} duels right now</h3>
            <p className="muted">New duels open every few minutes.</p>
          </div>
        )}

        <p className="notice">
          <ShieldCheck size={16} aria-hidden="true" />
          <span>
            <strong>Transparent by design.</strong> Pools are settled on Solana from verifiable PnL data. Winners split the pool, minus a 5% fee.
          </span>
        </p>
      </section>
    </>
  )
}

function DuelCard({ d, needWallet, notify }: { d: Duel; needWallet: () => boolean; notify: (m: string) => void }) {
  return (
    <article className="card duel">
      <header className="duel-top">
        <PhaseBadge d={d} />
        <span className="live-stat">
          <Eye size={14} aria-hidden="true" /> <span className="sr-only">Viewers:</span>
          <span className="tnum">{d.viewers}</span>
        </span>
        <span className="live-stat">
          <Clock size={14} aria-hidden="true" /> <span className="sr-only">Time left:</span>
          <time className="tnum">{clock(remainingSec(d))}</time>
        </span>
        <a className="duel-link" href={`#duel/${d.id}`} aria-label={`Open duel ${d.sides[0].name} vs ${d.sides[1].name}`}>
          Details <ArrowUpRight size={14} aria-hidden="true" />
        </a>
      </header>

      <div className="duel-vs">
        {d.sides.map((t, i) => (
          <div key={t.id} className={`duel-side ${d.winner === i ? 'is-winner' : ''}`}>
            <Avatar trader={t} size={40} />
            <div>
              <strong>{t.name}</strong>
              <span className="muted">Rank #{traderStats[t.id].rank}</span>
            </div>
            <PnlText v={d.pnl[i]} className="duel-pnl" />
          </div>
        ))}
      </div>

      <PoolBar d={d} />

      <dl className="meta meta-2">
        <div>
          <dt>Market</dt>
          <dd>{d.market} / USDC</dd>
        </div>
        <div className="right">
          <dt>Prize pool</dt>
          <dd className="tnum">{money(totalPool(d))}</dd>
        </div>
      </dl>

      <BetPanel duel={d} needWallet={needWallet} notify={notify} />
    </article>
  )
}
