import { useEffect, useId, useRef, useState } from 'react'
import { Check, Crown, Skull, Swords, X, Zap } from 'lucide-react'
import type { ArenaConfig, Trader } from '../types'
import { FEE, you } from '../data'
import { clock, duration, money, money2 } from '../format'
import { useCountUp } from '../hooks'
import { useDuelSim } from '../useDuelSim'
import { Avatar } from './ui'
import './arena.css'

type Phase = 'invite' | 'locking' | 'countdown' | 'live' | 'done'

interface Props {
  cfg: ArenaConfig
  onAccepted: () => void
  onClose: (accepted: boolean) => void
  onRematch: () => void
}

const signed = (n: number) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${money2(Math.abs(n))}`

export function Arena({ cfg, onAccepted, onClose, onRematch }: Props) {
  const other = cfg.userIsChallenger ? cfg.opponent : cfg.challenger
  const players: [Trader, Trader] = [you, other]

  const [phase, setPhase] = useState<Phase>('invite')
  const [view, setView] = useState<0 | 1>(0) // whose screen we are looking at
  const [count, setCount] = useState(3)
  const [confirmExit, setConfirmExit] = useState(false)
  const accepted = phase !== 'invite'
  const titleRef = useRef<HTMLHeadingElement>(null)

  const sim = useDuelSim(phase === 'live', cfg)
  const shown: Phase = phase === 'live' && sim.done ? 'done' : phase

  const accept = () => {
    setPhase('locking')
    onAccepted()
  }

  // the challenger's own challenge is accepted by the opponent after a moment
  useEffect(() => {
    if (phase !== 'invite' || !cfg.userIsChallenger) return
    const t = window.setTimeout(accept, 2800)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, cfg.userIsChallenger])

  useEffect(() => {
    if (phase !== 'locking') return
    const t = window.setTimeout(() => setPhase('countdown'), 1500)
    return () => window.clearTimeout(t)
  }, [phase])

  useEffect(() => {
    if (phase !== 'countdown') return
    const t = window.setTimeout(() => (count > 0 ? setCount(count - 1) : setPhase('live')), count === 0 ? 800 : 900)
    return () => window.clearTimeout(t)
  }, [phase, count])

  useEffect(() => {
    titleRef.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && shown !== 'live' && onClose(accepted)
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [shown, accepted, onClose])

  const viewer = view
  const nameFor = (i: 0 | 1) => (i === viewer ? 'You' : players[i].name)
  const challengerIdx: 0 | 1 = cfg.userIsChallenger ? 0 : 1
  const pool = cfg.entry * 2
  const prize = pool * (1 - FEE)
  const winner: 0 | 1 = sim.liquidated !== null ? ((1 - sim.liquidated) as 0 | 1) : sim.pnl[0] >= sim.pnl[1] ? 0 : 1
  const left = viewer
  const right = (1 - viewer) as 0 | 1

  return (
    <div className="arena" role="dialog" aria-modal="true" aria-labelledby="arena-title">
      <div className="arena-bg" aria-hidden="true" />

      <header className="arena-bar">
        <span className="arena-tag">
          <Swords size={14} /> {cfg.market} / USDC · {cfg.leverage}x · {duration(cfg.durationMin)}
        </span>
        <div className="segmented" role="group" aria-label="Preview screen">
          <button aria-pressed={view === 0} onClick={() => setView(0)}>
            Your screen
          </button>
          <button aria-pressed={view === 1} onClick={() => setView(1)}>
            {other.name}'s screen
          </button>
        </div>
        {shown === 'live' ? (
          <button className="btn btn-ghost btn-sm" onClick={() => (confirmExit ? onClose(true) : setConfirmExit(true))} onBlur={() => setConfirmExit(false)}>
            <X size={15} /> {confirmExit ? 'Confirm forfeit' : 'Forfeit'}
          </button>
        ) : (
          <button className="btn btn-ghost btn-sm" onClick={() => onClose(accepted)}>
            <X size={15} /> Leave
          </button>
        )}
      </header>

      <div className="arena-stage">
        {(shown === 'invite' || shown === 'locking') && (
          <section className="invite">
            <div className="clash" aria-hidden="true">
              <div className="clash-l">
                <Avatar trader={players[left]} size={92} />
                <b>{nameFor(left)}</b>
              </div>
              <div className="clash-vs">VS</div>
              <div className="clash-r">
                <Avatar trader={players[right]} size={92} />
                <b>{nameFor(right)}</b>
              </div>
            </div>

            <h1 id="arena-title" tabIndex={-1} ref={titleRef} className="invite-title">
              {nameFor(challengerIdx)} challenged {(1 - challengerIdx === viewer ? 'you' : players[1 - challengerIdx].name)}
            </h1>
            <p className="muted">
              {cfg.market} / USDC · {cfg.leverage}x leverage · {duration(cfg.durationMin)} · live PnL decides the winner
            </p>

            <dl className="summary invite-sum">
              <div>
                <dt>Each stakes</dt>
                <dd>{money(cfg.entry)}</dd>
              </div>
              <div>
                <dt>Prize pool</dt>
                <dd>{money(pool)}</dd>
              </div>
              <div>
                <dt>Winner takes</dt>
                <dd className="up">{money(prize)}</dd>
              </div>
            </dl>

            {shown === 'invite' && !cfg.userIsChallenger && view === 0 ? (
              <div className="invite-actions">
                <button className="btn btn-ghost" onClick={() => onClose(false)}>
                  Decline
                </button>
                <button className="btn btn-primary" onClick={accept}>
                  <Zap size={16} /> Accept · lock {money(cfg.entry)}
                </button>
              </div>
            ) : shown === 'invite' ? (
              <p className="waiting" role="status">
                Waiting for {view === 0 ? other.name : 'you'} to accept<span className="dots" aria-hidden="true" />
              </p>
            ) : (
              <div className="locking" role="status">
                <div className="lock-bar">
                  <i />
                </div>
                <p>
                  <Check size={15} /> Accepted. Locking {money(cfg.entry)} USDC each…
                </p>
              </div>
            )}
          </section>
        )}

        {shown === 'countdown' && (
          <section className="countdown" aria-live="assertive">
            <span key={count} className={`count ${count === 0 ? 'go' : ''}`}>
              {count === 0 ? 'FIGHT' : count}
            </span>
            <i className="burst" key={`b${count}`} aria-hidden="true" />
            {count === 0 && (
              <svg className="go-bolt" viewBox="0 0 60 120" aria-hidden="true">
                <path d="M38 2 10 66h18L20 118 54 48H34z" fill="#ffb347" />
              </svg>
            )}
          </section>
        )}

        {(shown === 'live' || shown === 'done') && (
          <section className={`live-arena ${shown === 'done' ? 'is-done' : ''}`}>
            <h1 id="arena-title" tabIndex={-1} ref={titleRef} className="sr-only">
              Live battle
            </h1>
            <div className="timer-wrap">
              <Ring progress={sim.progress} label={clock(sim.remainingSec)} urgent={sim.progress > 0.85 && shown === 'live'} />
              <p className="pool-line">
                Pool <b>{money(pool)}</b> · winner takes <b className="up">{money(prize)}</b>
              </p>
            </div>

            <div className="fighters">
              {[left, right].map((i, k) => (
                <Fighter
                  key={i}
                  side={k === 0 ? 'l' : 'r'}
                  trader={players[i]}
                  name={nameFor(i)}
                  isYou={i === viewer}
                  pnl={sim.pnl[i]}
                  entry={cfg.entry}
                  hist={sim.hist[i]}
                  totalTicks={sim.totalTicks}
                  tick={sim.tick}
                  delta={sim.delta[i]}
                  leading={sim.leader === i}
                  result={shown === 'done' ? (winner === i ? 'win' : 'lose') : null}
                />
              ))}
              <span className="fighters-vs" aria-hidden="true">
                VS
              </span>
            </div>

            <Tug pnl={[sim.pnl[left], sim.pnl[right]]} entry={cfg.entry} />

            {shown === 'live' && sim.tick - sim.lastLeadChangeTick < 7 && (
              <p key={sim.lastLeadChangeTick} className="lead-banner" role="status">
                <Zap size={15} /> Lead change · {sim.leader !== null ? nameFor(sim.leader) : ''} takes the lead
              </p>
            )}
          </section>
        )}

        {shown === 'done' && (
          <Result
            won={winner === viewer}
            liquidated={sim.liquidated !== null}
            loserName={nameFor((1 - winner) as 0 | 1)}
            winnerName={nameFor(winner)}
            prize={prize}
            entry={cfg.entry}
            onLeave={() => onClose(true)}
            onRematch={onRematch}
          />
        )}
      </div>
    </div>
  )
}

function Ring({ progress, label, urgent }: { progress: number; label: string; urgent: boolean }) {
  const r = 46
  const c = 2 * Math.PI * r
  return (
    <div className={`ring ${urgent ? 'urgent' : ''}`} role="timer" aria-label={`Time left ${label}`}>
      <svg viewBox="0 0 108 108" aria-hidden="true">
        <circle cx="54" cy="54" r={r} className="ring-bg" />
        <circle cx="54" cy="54" r={r} className="ring-fg" strokeDasharray={c} strokeDashoffset={c * progress} transform="rotate(-90 54 54)" />
      </svg>
      <span className="tnum">{label}</span>
    </div>
  )
}

interface FighterProps {
  side: 'l' | 'r'
  trader: Trader
  name: string
  isYou: boolean
  pnl: number
  entry: number
  hist: number[]
  totalTicks: number
  tick: number
  delta: number
  leading: boolean
  result: 'win' | 'lose' | null
}

function Fighter({ side, trader, name, isYou, pnl, entry, hist, totalTicks, tick, delta, leading, result }: FighterProps) {
  const sign = pnl > 0.004 ? 'pos' : pnl < -0.004 ? 'neg' : 'flat'
  const pct = (pnl / entry) * 100
  return (
    <article className={`fighter side-${side} ${result ?? ''}`} data-sign={sign} data-you={isYou}>
      <header className="f-head">
        <div className="f-avatar">
          {leading && <Crown className="crown" size={18} aria-label="Leading" />}
          <Avatar trader={trader} size={46} />
        </div>
        <div>
          <h2>{name}</h2>
          <p className="muted">{isYou ? 'Your position' : 'Opponent'}</p>
        </div>
      </header>

      <p className="f-pnl" aria-label={`PnL ${signed(pnl)}`}>
        <span key={tick} className={`num ${delta > 0 ? 'tick-up' : delta < 0 ? 'tick-down' : ''}`}>
          {signed(pnl)}
        </span>
      </p>
      <p className="f-pct tnum">
        {pct > 0 ? '+' : pct < 0 ? '−' : ''}
        {Math.abs(pct).toFixed(2)}% <span>of {money(entry)} stake</span>
      </p>
      <Spark data={hist} total={totalTicks} entry={entry} />
    </article>
  )
}

function Spark({ data, total, entry }: { data: number[]; total: number; entry: number }) {
  const id = useId()
  const w = 260
  const h = 70
  const max = Math.max(entry * 0.06, ...data.map(Math.abs))
  const x = (i: number) => (i / total) * w
  const y = (v: number) => h / 2 - (v / max) * (h / 2 - 5)
  const line = data.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ')
  const area = `${line} L${x(data.length - 1).toFixed(1)} ${h / 2} L0 ${h / 2} Z`
  return (
    <svg className="spark" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="currentColor" stopOpacity="0.35" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <line x1="0" x2={w} y1={h / 2} y2={h / 2} className="spark-zero" />
      <path d={area} fill={`url(#${id})`} />
      <path d={line} className="spark-line" />
    </svg>
  )
}

function Tug({ pnl, entry }: { pnl: [number, number]; entry: number }) {
  const lead = Math.max(-45, Math.min(45, ((pnl[0] - pnl[1]) / (entry * 0.4)) * 45))
  const l = 50 + lead
  const tone = (v: number) => (v > 0.004 ? 'pos' : v < -0.004 ? 'neg' : 'flat')
  return (
    <div className="tug" aria-hidden="true">
      <div className={`tug-seg ${tone(pnl[0])}`} style={{ width: `${l}%` }} />
      <div className={`tug-seg ${tone(pnl[1])}`} style={{ width: `${100 - l}%` }} />
      <i className="tug-mark" style={{ left: `${l}%` }} />
    </div>
  )
}

interface ResultProps {
  won: boolean
  liquidated: boolean
  winnerName: string
  loserName: string
  prize: number
  entry: number
  onLeave: () => void
  onRematch: () => void
}

function Result({ won, liquidated, winnerName, loserName, prize, entry, onLeave, onRematch }: ResultProps) {
  const amount = useCountUp(won ? prize - entry : entry, 1100)
  return (
    <div className={`result ${won ? 'win' : 'lose'}`} role="alertdialog" aria-labelledby="res-t">
      {won && (
        <div className="confetti" aria-hidden="true">
          {Array.from({ length: 28 }, (_, i) => (
            <i key={i} style={{ ['--x' as string]: `${(i * 37) % 100}%`, ['--d' as string]: `${(i % 7) * 0.12}s`, ['--r' as string]: `${(i * 53) % 360}deg` }} />
          ))}
        </div>
      )}
      {won ? <Crown size={34} className="res-icon" /> : <Skull size={34} className="res-icon" />}
      <h2 id="res-t">{won ? 'Victory' : 'Defeat'}</h2>
      <p className="muted">
        {liquidated ? `${loserName} got liquidated. ` : ''}
        {winnerName === 'You' ? 'You take the pool.' : `${winnerName} takes the pool.`}
      </p>
      <p className="res-amount tnum">
        {won ? '+' : '−'}
        {money2(amount)}
      </p>
      <div className="invite-actions">
        <button className="btn btn-ghost" onClick={onLeave}>
          Back to battles
        </button>
        <button className="btn btn-primary" onClick={onRematch}>
          <Swords size={16} /> Rematch
        </button>
      </div>
    </div>
  )
}
