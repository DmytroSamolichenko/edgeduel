import { useState } from 'react'
import { ArrowUpRight, Ticket } from 'lucide-react'
import { money2, mult, signedMoney } from '../format'
import { betStatus, betValue } from '../market'
import { useMarket } from '../store'
import { Eyebrow } from './ui'

type Filter = 'all' | 'open' | 'settled'

export function PositionsView({ notify }: { notify: (m: string) => void }) {
  const { bets, duels, balance, claim, claimAll } = useMarket()
  const [filter, setFilter] = useState<Filter>('all')

  const rows = bets
    .map((b) => ({ b, d: duels.find((x) => x.id === b.duelId)! }))
    .filter((r) => r.d)
    .map((r) => ({ ...r, st: betStatus(r.d, r.b), val: betValue(r.d, r.b) }))

  const open = rows.filter((r) => r.st === 'open')
  const claimable = rows.filter((r) => r.st === 'won' && !r.b.claimed)
  const claimSum = claimable.reduce((a, r) => a + r.val, 0)
  const openStake = open.reduce((a, r) => a + r.b.stake, 0)
  const openValue = open.reduce((a, r) => a + r.val, 0)
  const realized = rows.filter((r) => r.st !== 'open').reduce((a, r) => a + r.val - r.b.stake, 0)

  const shown = rows.filter((r) => (filter === 'all' ? true : filter === 'open' ? r.st === 'open' : r.st !== 'open'))

  return (
    <>
      <section className="hero hero-compact">
        <Eyebrow>Your portfolio</Eyebrow>
        <h1 className="display display-sm">
          My positions<span className="dot">.</span>
        </h1>
      </section>

      <dl className="stats stats-4">
        <div>
          <dd className="tnum">{money2(balance)}</dd>
          <dt>Balance (USDC)</dt>
        </div>
        <div>
          <dd className="tnum">{money2(openStake)}</dd>
          <dt>In open bets</dt>
        </div>
        <div>
          <dd className={`tnum ${openValue >= openStake ? 'up' : 'down'}`}>{money2(openValue)}</dd>
          <dt>Worth now</dt>
        </div>
        <div>
          <dd className={`tnum ${realized >= 0 ? 'up' : 'down'}`}>{signedMoney(realized)}</dd>
          <dt>Realized PnL</dt>
        </div>
      </dl>

      {claimable.length > 0 && (
        <div className="claim-bar" role="status">
          <p>
            <b className="tnum">{money2(claimSum)}</b> ready to claim from {claimable.length} winning {claimable.length === 1 ? 'bet' : 'bets'}
          </p>
          <button
            className="btn btn-primary"
            onClick={() => {
              claimAll()
              notify(`Claimed ${money2(claimSum)} to your wallet`)
            }}
          >
            Claim all
          </button>
        </div>
      )}

      <div className="section-head section-head-sm">
        <h2>Bets</h2>
        <div className="segmented" role="group" aria-label="Filter positions">
          {(['all', 'open', 'settled'] as Filter[]).map((f) => (
            <button key={f} aria-pressed={filter === f} onClick={() => setFilter(f)}>
              {f === 'all' ? 'All' : f === 'open' ? 'Open' : 'Settled'}
            </button>
          ))}
        </div>
      </div>

      {shown.length ? (
        <ul className="pos-list">
          {shown.map(({ b, d, st, val }) => (
            <li key={b.id} className={`pos st-${st}`}>
              <div className="pos-main">
                <p className="pos-title">
                  {d.sides[0].name} <span>vs</span> {d.sides[1].name}
                </p>
                <p className="muted">
                  Backed <b>{d.sides[b.side].name}</b> · {d.market} / USDC
                </p>
              </div>
              <dl className="pos-nums">
                <div>
                  <dt>Stake</dt>
                  <dd className="tnum">{money2(b.stake)}</dd>
                </div>
                <div>
                  <dt>Entry</dt>
                  <dd className="tnum">{mult(b.entryMult)}</dd>
                </div>
                <div>
                  <dt>{st === 'open' ? 'Worth now' : st === 'won' ? 'Payout' : 'Payout'}</dt>
                  <dd className={`tnum ${st === 'lost' ? 'down' : val >= b.stake ? 'up' : ''}`}>{money2(val)}</dd>
                </div>
              </dl>
              <div className="pos-end">
                <span className={`pill pill-${st}`}>{st === 'open' ? 'Open' : st === 'won' ? 'Won' : 'Lost'}</span>
                {st === 'won' && !b.claimed && (
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => {
                      claim(b.id)
                      notify(`Claimed ${money2(val)} to your wallet`)
                    }}
                  >
                    Claim
                  </button>
                )}
                {st === 'won' && b.claimed && <span className="muted small">Claimed</span>}
                <a className="duel-link" href={`#duel/${d.id}`} aria-label={`Open duel ${d.sides[0].name} vs ${d.sides[1].name}`}>
                  Duel <ArrowUpRight size={14} aria-hidden="true" />
                </a>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="empty">
          <Ticket size={28} aria-hidden="true" />
          <h3>{rows.length ? 'Nothing in this view' : 'No positions yet'}</h3>
          <p className="muted">Back a trader on any duel and your bet shows up here with its live value.</p>
          <a className="btn btn-primary" href="#predict">
            Browse duels
          </a>
        </div>
      )}
    </>
  )
}
