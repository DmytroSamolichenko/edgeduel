import { useRef, useState } from 'react'
import { Swords, X } from 'lucide-react'
import type { Market } from '../types'
import { useLockedDialog } from '../hooks'
import { FEE } from '../data'
import { duration, money } from '../format'
import { SnapSlider } from './SnapSlider'

type Values = { market: Market; leverage: number; entry: number; durationMin: number }

const LEVERAGE = [3, 5, 10, 20]
const DURATIONS = [5, 10, 15, 30, 45, 60]
const ENTRIES = [10, 25, 50, 100, 250, 500, 1000, 2500]
const shortMoney = (n: number) => (n >= 1000 ? `$${n / 1000}K` : `$${n}`)

interface Props {
  open: boolean
  onClose: () => void
  onSubmit: (v: Values) => void
}

export function CreateBattleDialog({ open, onClose, onSubmit }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const [market, setMarket] = useState<Market>('ETH')
  const [leverage, setLeverage] = useState(10)
  const [durationMin, setDuration] = useState(15)
  const [entry, setEntry] = useState(100)

  useLockedDialog(open, ref)

  const pool = entry * 2
  const prize = pool * (1 - FEE)

  return (
    <dialog
      ref={ref}
      className="dialog dialog-wide"
      aria-labelledby="cb-title"
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
    >
      <form
        method="dialog"
        onSubmit={(e) => {
          e.preventDefault()
          onSubmit({ market, leverage, entry, durationMin })
        }}
      >
        <header className="dialog-head">
          <div>
            <h2 id="cb-title">Make a Battlefield</h2>
            <p className="muted">Set the rules. Any trader who matches your stake can challenge you.</p>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </header>

        <fieldset>
          <legend>Market</legend>
          <div className="segmented segmented-full">
            {(['ETH', 'BTC', 'SOL'] as Market[]).map((m) => (
              <button key={m} type="button" aria-pressed={market === m} onClick={() => setMarket(m)}>
                {m} / USDC
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend>Leverage</legend>
          <div className="segmented segmented-full">
            {LEVERAGE.map((l) => (
              <button key={l} type="button" aria-pressed={leverage === l} onClick={() => setLeverage(l)}>
                {l}x
              </button>
            ))}
          </div>
        </fieldset>

        <SnapSlider id="cb-time" tone="spark" label="Battle time" stops={DURATIONS} value={durationMin} onChange={setDuration} format={duration} short={(m) => (m >= 60 ? '1h' : `${m}m`)} />

        <SnapSlider id="cb-entry" label="Entry stake (each trader)" stops={ENTRIES} value={entry} onChange={setEntry} format={(n) => `${money(n)} USDC`} short={shortMoney} />

        <dl className="summary">
          <div>
            <dt>Prize pool</dt>
            <dd>{money(pool)}</dd>
          </div>
          <div>
            <dt>Winner takes</dt>
            <dd className="up">{money(prize)}</dd>
          </div>
          <div>
            <dt>Platform fee</dt>
            <dd>{Math.round(FEE * 100)}%</dd>
          </div>
        </dl>
        <p className="muted small">
          Challengers must lock {money(entry)} USDC to enter. Highest PnL after {duration(durationMin)} wins.
        </p>

        <footer className="dialog-foot">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            <Swords size={16} /> Open battlefield
          </button>
        </footer>
      </form>
    </dialog>
  )
}
