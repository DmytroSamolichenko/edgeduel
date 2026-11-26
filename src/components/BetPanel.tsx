import { useState } from 'react'
import { Zap } from 'lucide-react'
import type { Duel } from '../types'
import { money, money2, mult } from '../format'
import { bettingOpen, MAX_BET, netMult, projectedPayout, sharePct } from '../market'
import { useMarket } from '../store'
import { Avatar } from './ui'
import { LockChip } from './duel'

const QUICK = [10, 25, 100, 250]

interface Props {
  duel: Duel
  needWallet: () => boolean
  notify: (msg: string) => void
}

export function BetPanel({ duel, needWallet, notify }: Props) {
  const { placeBet, balance } = useMarket()
  const [pick, setPick] = useState<0 | 1>(0)
  const [stake, setStake] = useState('25')
  const [error, setError] = useState('')
  const open = bettingOpen(duel)
  const amount = Number(stake)
  const invalid = !(amount >= 1)
  const trader = duel.sides[pick]
  const payout = invalid ? 0 : projectedPayout(duel, pick, amount)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!open || invalid || !needWallet()) return
    const r = placeBet(duel.id, pick, amount)
    if (!r.ok) return setError(r.error)
    setError('')
    notify(`Backed ${trader.name} for ${money2(amount)} at ${mult(r.mult)}`)
  }

  return (
    <form className="bet" onSubmit={submit}>
      <div className="row-between">
        <p className="label" id={`pick-${duel.id}`}>
          Your prediction
        </p>
        <LockChip d={duel} />
      </div>

      <div className="pick" role="radiogroup" aria-labelledby={`pick-${duel.id}`}>
        {duel.sides.map((t, i) => (
          <label key={t.id} className={`pick-opt ${pick === i ? 'is-picked' : ''}`}>
            <input type="radio" name={`side-${duel.id}`} checked={pick === i} disabled={!open} onChange={() => setPick(i as 0 | 1)} />
            <Avatar trader={t} size={30} />
            <span className="pick-info">
              <strong>{t.name}</strong>
              <span className="tnum">
                {mult(netMult(duel, i as 0 | 1))} · {sharePct(duel, i as 0 | 1).toFixed(0)}% of pool
              </span>
            </span>
          </label>
        ))}
      </div>

      <div className="stake-line">
        <div className={`input-wrap ${(invalid && open) || error ? 'is-invalid' : ''}`}>
          <span aria-hidden="true">$</span>
          <input
            inputMode="decimal"
            aria-label="Stake in USDC"
            value={stake}
            disabled={!open}
            aria-invalid={invalid}
            onChange={(e) => (setStake(e.target.value.replace(/[^\d.]/g, '')), setError(''))}
          />
          <em>USDC</em>
        </div>
        <div className="quick" role="group" aria-label="Quick amounts">
          {QUICK.map((q) => (
            <button key={q} type="button" disabled={!open} onClick={() => (setStake(String(q)), setError(''))}>
              {q}
            </button>
          ))}
          <button type="button" disabled={!open} onClick={() => setStake(String(Math.floor(Math.min(balance, MAX_BET))))}>
            Max
          </button>
        </div>
      </div>

      <p className="return" aria-live="polite">
        Potential return <strong className="tnum">{money2(payout)}</strong>
        {!invalid && payout > 0 && <span className="tnum"> · {money2(payout - amount)} profit</span>}
      </p>
      <p className="muted small">Your bet shifts the odds. The final payout depends on the pool when the duel ends. Max {money(MAX_BET)} per bet.</p>
      {error && (
        <p className="error small" role="alert">
          {error}
        </p>
      )}

      <button className="btn btn-primary btn-block" type="submit" disabled={!open || invalid}>
        <Zap size={16} fill="currentColor" aria-hidden="true" />
        <span>{open ? `Back ${trader.name}` : duel.phase === 'settled' ? 'Duel settled' : 'Betting closed'}</span>
        {open && <span className="odds tnum">{mult(invalid ? netMult(duel, pick) : payout / amount)}</span>}
      </button>
    </form>
  )
}
