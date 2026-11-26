import { ArrowLeft, Crown, Eye, Flame } from 'lucide-react'
import type { Duel } from '../types'
import { traderStats } from '../data'
import { clock, money, money2, mult, signedMoney } from '../format'
import { betStatus, betValue, leader, LOCK_AT, netMult, totalPool } from '../market'
import { useMarket } from '../store'
import { Avatar } from './ui'
import { BetPanel } from './BetPanel'
import { LineChart, PhaseBadge, PnlText, PoolBar } from './duel'

interface Props {
  id: string
  needWallet: () => boolean
  notify: (msg: string) => void
}

export function DuelPage({ id, needWallet, notify }: Props) {
  const { duels, bets } = useMarket()
  const d = duels.find((x) => x.id === id)

  if (!d) {
    return (
      <div className="empty">
        <h3>Duel not found</h3>
        <p className="muted">It may have been removed.</p>
        <a className="btn btn-primary" href="#predict">
          Back to market
        </a>
      </div>
    )
  }
  const mine = bets.filter((b) => b.duelId === d.id)
  return (
    <>
      <a className="back" href="#predict">
        <ArrowLeft size={16} aria-hidden="true" /> All duels
      </a>

      <header className="dp-head">
        <div className="dp-title">
          <PhaseBadge d={d} />
          <h1>
            {d.sides[0].name} <span>vs</span> {d.sides[1].name}
          </h1>
          <p className="muted">
            {d.market} / USDC · {Math.round(d.durationSec / 60)} min session ·{' '}
            <span className="inline-eye">
              <Eye size={13} aria-hidden="true" /> <span className="tnum">{d.viewers}</span> watching
            </span>
          </p>
        </div>
        <dl className="dp-pool">
          <div>
            <dt>Prize pool</dt>
            <dd className="tnum">{money(totalPool(d))}</dd>
          </div>
        </dl>
      </header>

      <div className="dp-grid">
        <div className="dp-main">
          {d.phase === 'settled' && <ResultBanner d={d} />}

          <section className="dp-fighters" aria-label="Traders">
            {d.sides.map((t, i) => (
              <Fighter key={t.id} d={d} i={i as 0 | 1} />
            ))}
          </section>

          <section className="card dp-card" aria-labelledby="pnl-h">
            <h2 id="pnl-h" className="dp-h">
              Live PnL
            </h2>
            <LineChart series={d.pnlHist} colors={['var(--c0)', 'var(--c1)']} base={0} total={Math.max(d.pnlHist[0].length - 1, 60)} height={150} />
            <p className="legend">
              <span style={{ ['--k' as string]: 'var(--c0)' }}>{d.sides[0].name}</span>
              <span style={{ ['--k' as string]: 'var(--c1)' }}>{d.sides[1].name}</span>
            </p>
          </section>

          <section className="card dp-card" aria-labelledby="odds-h">
            <h2 id="odds-h" className="dp-h">
              Pool split and odds
            </h2>
            <PoolBar d={d} />
            <LineChart series={[d.probHist]} colors={['var(--c0)']} base={50} min={0} max={100} height={90} />
            <p className="muted small">Share of the pool backing {d.sides[0].name} over time. Odds move every time someone bets.</p>
          </section>

          <Timeline d={d} />

          <section className="card dp-card" aria-labelledby="feed-h">
            <h2 id="feed-h" className="dp-h">
              Recent bets
            </h2>
            {d.feed.length ? (
              <ul className="feed">
                {d.feed.map((f) => (
                  <li key={f.id} className={f.mine ? 'is-mine' : ''}>
                    <span className="feed-who">{f.who}</span>
                    <span>
                      backed <b>{d.sides[f.side].name}</b>
                    </span>
                    <b className="tnum feed-amt">{money(f.amount)}</b>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted">No bets yet. Be the first.</p>
            )}
          </section>
        </div>

        <aside className="dp-side">
          <div className="card dp-card">
            <BetPanel duel={d} needWallet={needWallet} notify={notify} />
          </div>

          {mine.length > 0 && (
            <div className="card dp-card">
              <h2 className="dp-h">Your positions</h2>
              <ul className="mini-pos">
                {mine.map((b) => {
                  const st = betStatus(d, b)
                  const val = betValue(d, b)
                  return (
                    <li key={b.id}>
                      <div>
                        <b>{d.sides[b.side].name}</b>
                        <span className="muted tnum">
                          {money2(b.stake)} at {mult(b.entryMult)}
                        </span>
                      </div>
                      <div className="right">
                        <b className={`tnum ${st === 'lost' ? 'down' : val >= b.stake ? 'up' : ''}`}>{st === 'lost' ? signedMoney(-b.stake) : money2(val)}</b>
                        <span className="muted">{st === 'open' ? 'worth now' : st}</span>
                      </div>
                    </li>
                  )
                })}
              </ul>
              <a className="btn btn-ghost btn-block" href="#positions">
                Open all positions
              </a>
            </div>
          )}

          <div className="card dp-card how">
            <h2 className="dp-h">How payouts work</h2>
            <ul>
              <li>All bets go into one pool per duel.</li>
              <li>If your trader wins you take a share of the whole pool, in proportion to your stake. A 5% fee is taken first.</li>
              <li>Backing the less popular trader pays more, but the odds shift with every bet.</li>
              <li>Betting closes {Math.round(LOCK_AT * 100)}% into the session. Results come from verifiable PnL.</li>
            </ul>
          </div>
        </aside>
      </div>
    </>
  )
}

function Fighter({ d, i }: { d: Duel; i: 0 | 1 }) {
  const t = d.sides[i]
  const s = traderStats[t.id]
  const lead = leader(d) === i && d.phase === 'live'
  const won = d.winner === i
  return (
    <article className={`dp-fighter ${won ? 'is-winner' : ''} ${d.phase === 'settled' && !won ? 'is-lost' : ''}`} data-sign={d.pnl[i] >= 0 ? 'pos' : 'neg'}>
      <header>
        <div className="f-avatar">
          {(lead || won) && <Crown className="crown" size={18} aria-label={won ? 'Winner' : 'Leading'} />}
          <Avatar trader={t} size={46} />
        </div>
        <div>
          <h3>{t.name}</h3>
          <p className="muted">
            Rank #{s.rank} · {s.battles} duels
          </p>
        </div>
        <span className="payout tnum" title="Payout multiplier if this trader wins">
          {mult(netMult(d, i))}
        </span>
      </header>
      <p className="dp-pnl">
        <PnlText v={d.pnl[i]} />
      </p>
      <dl className="dp-stats">
        <div>
          <dt>Win rate</dt>
          <dd className="tnum">{s.winRate}%</dd>
        </div>
        <div>
          <dt>Avg PnL</dt>
          <dd className="tnum up">+{s.avgPnl.toFixed(1)}%</dd>
        </div>
        <div>
          <dt>Streak</dt>
          <dd className="tnum">
            {s.streak > 0 && <Flame size={13} className="hot" aria-hidden="true" />} {s.streak}W
          </dd>
        </div>
      </dl>
    </article>
  )
}

function Timeline({ d }: { d: Duel }) {
  const p = d.phase === 'upcoming' ? 0 : (d.elapsedSec / d.durationSec) * 100
  return (
    <section className="card dp-card" aria-labelledby="tl-h">
      <h2 id="tl-h" className="dp-h">
        Session timeline
      </h2>
      <div className="timeline" role="img" aria-label={`${Math.round(p)}% of the session elapsed`}>
        <i className="tl-fill" style={{ width: `${p}%` }} />
        <i className="tl-lock" style={{ left: `${LOCK_AT * 100}%` }} />
      </div>
      <div className="tl-labels tnum">
        <span>{d.phase === 'upcoming' ? `Starts in ${clock(d.startsInSec)}` : 'Start'}</span>
        <span className="tl-lock-label" style={{ left: `${LOCK_AT * 100}%` }}>
          Betting closes
        </span>
        <span>{clock(d.durationSec)}</span>
      </div>
    </section>
  )
}

function ResultBanner({ d }: { d: Duel }) {
  const w = d.winner ?? 0
  return (
    <div className="result-banner" role="status">
      <Crown size={20} aria-hidden="true" />
      <p>
        <b>{d.sides[w].name}</b> won with <PnlText v={d.pnl[w]} /> against <PnlText v={d.pnl[(1 - w) as 0 | 1]} />. Winners split {money(totalPool(d) * 0.95)}.
      </p>
    </div>
  )
}
