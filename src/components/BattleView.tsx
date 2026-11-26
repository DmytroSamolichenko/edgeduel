import { useMemo, useState } from 'react'
import { ChevronDown, Flame, Plus, Search, SearchX, Swords, Timer, Zap } from 'lucide-react'
import type { MarketFilter, OpenBattle } from '../types'
import { stats } from '../data'
import { compactMoney, duration, money } from '../format'
import { useCountUp } from '../hooks'
import { AmbientBolt, Avatar, Eyebrow } from './ui'
import { CreateBattleDialog } from './CreateBattleDialog'

const MARKETS: MarketFilter[] = ['ALL', 'ETH', 'BTC', 'SOL']
const ENTRY_OPTIONS = [
  { label: 'Any', max: Infinity },
  { label: '≤ $100', max: 100 },
  { label: '≤ $250', max: 250 },
  { label: '≤ $500', max: 500 },
]

interface Props {
  battles: OpenBattle[]
  onCreate: (b: Pick<OpenBattle, 'market' | 'leverage' | 'entry' | 'durationMin'>) => void
  onChallenge: (b: OpenBattle) => void
}

export function BattleView({ battles, onCreate, onChallenge }: Props) {
  const [market, setMarket] = useState<MarketFilter>('ALL')
  const [query, setQuery] = useState('')
  const [entry, setEntry] = useState(0)
  const [creating, setCreating] = useState(false)

  const played = useCountUp(stats.played)
  const volume = useCountUp(stats.volume)
  const live = useCountUp(stats.live)

  const shown = useMemo(
    () =>
      battles.filter(
        (b) =>
          (market === 'ALL' || b.market === market) &&
          b.entry <= ENTRY_OPTIONS[entry].max &&
          b.trader.name.toLowerCase().includes(query.trim().toLowerCase()),
      ),
    [battles, market, entry, query],
  )

  const reset = () => (setMarket('ALL'), setEntry(0), setQuery(''))

  return (
    <>
      <div className="cta-wrap">
        <button className="btn-battlefield" onClick={() => setCreating(true)}>
          <Swords size={20} aria-hidden="true" />
          <span>
            Make a Battlefield
            <small>Set time, stake and market</small>
          </span>
        </button>
      </div>

      <section className="hero">
        <AmbientBolt />
        <AmbientBolt className="alt" delay={6} />
        <Eyebrow>The trading arena</Eyebrow>
        <h1 className="display">
          Trade head-to-head.
          <br />
          <span>Prove your edge.</span>
        </h1>
        <p className="lede">Challenge another trader. Same market, same time. Highest return takes the pool.</p>

        <dl className="stats">
          <div>
            <dd>{Math.round(played).toLocaleString('en-US')}</dd>
            <dt>Battles played</dt>
          </div>
          <div>
            <dd>{compactMoney(volume)}</dd>
            <dt>Volume</dt>
          </div>
          <div className="stat-live">
            <dd>{Math.round(live)}</dd>
            <dt>Live now</dt>
          </div>
        </dl>
      </section>

      <section aria-labelledby="open-h">
        <div className="section-head">
          <div>
            <h2 id="open-h">Open battles</h2>
            <p className="muted">Find your match and enter the arena</p>
          </div>
        </div>

        <div className="toolbar">
          <label className="search">
            <Search size={16} aria-hidden="true" />
            <input type="search" placeholder="Search traders" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search traders" />
          </label>
          <div className="segmented" role="group" aria-label="Market">
            {MARKETS.map((m) => (
              <button key={m} aria-pressed={market === m} onClick={() => setMarket(m)}>
                {m === 'ALL' ? 'All markets' : m}
              </button>
            ))}
          </div>
          <label className="select">
            <span>Entry:</span>
            <select value={entry} onChange={(e) => setEntry(Number(e.target.value))} aria-label="Entry size">
              {ENTRY_OPTIONS.map((o, i) => (
                <option key={o.label} value={i}>
                  {o.label}
                </option>
              ))}
            </select>
            <ChevronDown size={14} aria-hidden="true" />
          </label>
        </div>

        {shown.length ? (
          <ul className="grid">
            {shown.map((b, i) => (
              <li key={b.id} style={{ ['--i' as string]: i }}>
                <BattleCard b={b} onChallenge={() => onChallenge(b)} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="empty">
            <SearchX size={28} aria-hidden="true" />
            <h3>No battles match</h3>
            <p className="muted">Try a different market or entry size, or open your own battle.</p>
            <div className="empty-actions">
              <button className="btn btn-ghost" onClick={reset}>
                Clear filters
              </button>
              <button className="btn btn-primary" onClick={() => setCreating(true)}>
                <Plus size={16} /> Create battle
              </button>
            </div>
          </div>
        )}
      </section>

      <CreateBattleDialog
        open={creating}
        onClose={() => setCreating(false)}
        onSubmit={(v) => {
          onCreate(v)
          setCreating(false)
        }}
      />
    </>
  )
}

function BattleCard({ b, onChallenge }: { b: OpenBattle; onChallenge: () => void }) {
  const matched = b.status === 'matched'
  return (
    <article className={`card battle ${b.hot ? 'is-hot' : ''}`}>
      <header className="battle-top">
        <Avatar trader={b.trader} size={46} />
        <div className="who">
          <h3>
            {b.trader.name}
            {b.hot && <Flame size={14} className="hot" aria-label="On a win streak" />}
          </h3>
          <p className="muted">
            Rank #{b.rank.toLocaleString('en-US')} · {b.wins}–{b.losses} W/L
          </p>
        </div>
        <span className={`pill ${matched ? 'pill-warn' : 'pill-open'}`}>{matched ? 'Matched' : b.mine ? 'Yours' : 'Open'}</span>
      </header>

      <dl className="meta">
        <div>
          <dt>Market</dt>
          <dd>{b.market} / USDC</dd>
        </div>
        <div>
          <dt>Leverage</dt>
          <dd className="lev">
            <Zap size={13} fill="currentColor" aria-hidden="true" /> {b.leverage}x
          </dd>
        </div>
        <div>
          <dt>Entry</dt>
          <dd>{money(b.entry)} USDC</dd>
        </div>
        <div>
          <dt>Duration</dt>
          <dd>
            <Timer size={13} aria-hidden="true" /> {duration(b.durationMin)}
          </dd>
        </div>
      </dl>

      <button className="btn btn-block" disabled={matched || b.mine} onClick={onChallenge}>
        {matched ? 'Battle locked in' : b.mine ? 'Waiting for a challenger…' : `Challenge · stake ${money(b.entry)}`}
      </button>
    </article>
  )
}
