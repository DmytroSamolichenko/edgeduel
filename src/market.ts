import type { Bet, Duel } from './types'
import { FEE } from './data'
import { clock } from './format'

/** Betting stays open until this share of the session has elapsed. */
export const LOCK_AT = 0.25
export const MAX_BET = 5000

export const lockSec = (d: Duel) => Math.round(d.durationSec * LOCK_AT)
export const totalPool = (d: Duel) => d.pools[0] + d.pools[1]
export const bettingOpen = (d: Duel) => d.phase === 'upcoming' || (d.phase === 'live' && d.elapsedSec < lockSec(d))
export const sharePct = (d: Duel, s: 0 | 1) => (d.pools[s] / totalPool(d)) * 100

/** Parimutuel: winners split the whole pool minus the fee, in proportion to their stake. */
export const netMult = (d: Duel, s: 0 | 1) => (totalPool(d) * (1 - FEE)) / d.pools[s]

/** Payout if `stake` is added to side `s` and that side wins (the bet itself moves the odds). */
export const projectedPayout = (d: Duel, s: 0 | 1, stake: number) =>
  (stake / (d.pools[s] + stake)) * (totalPool(d) + stake) * (1 - FEE)

export const betStatus = (d: Duel, b: Bet): 'open' | 'won' | 'lost' =>
  d.phase !== 'settled' ? 'open' : d.winner === b.side ? 'won' : 'lost'

/** What the bet is worth now: live share of the pool, or the final payout. */
export const betValue = (d: Duel, b: Bet) =>
  d.phase === 'settled' ? (b.payout ?? 0) : (b.stake / d.pools[b.side]) * totalPool(d) * (1 - FEE)

export const remainingSec = (d: Duel) =>
  d.phase === 'upcoming' ? d.startsInSec + d.durationSec : Math.max(0, d.durationSec - d.elapsedSec)

export const leader = (d: Duel): 0 | 1 | null => (Math.abs(d.pnl[0] - d.pnl[1]) < 0.005 ? null : d.pnl[0] > d.pnl[1] ? 0 : 1)

export function lockInfo(d: Duel): { text: string; open: boolean } {
  if (d.phase === 'settled') return { text: 'Settled', open: false }
  if (d.phase === 'upcoming') return { text: `Starts in ${clock(d.startsInSec)} · betting open`, open: true }
  if (bettingOpen(d)) return { text: `Betting closes in ${clock(lockSec(d) - d.elapsedSec)}`, open: true }
  return { text: `Betting locked · ${clock(d.durationSec - d.elapsedSec)} left`, open: false }
}
