export type Market = 'ETH' | 'BTC' | 'SOL'
export type MarketFilter = 'ALL' | Market
export type Tab = 'predict' | 'arena' | 'positions'
export type PredictSort = 'trending' | 'ending' | 'pool'
export type DuelPhase = 'upcoming' | 'live' | 'settled'

export type TraderIcon = 'paw' | 'steps' | 'moon' | 'slash' | 'rocket' | 'dice' | 'target' | 'hammer' | 'waves' | 'atom' | 'user'

export interface Trader {
  id: string
  name: string
  /** flat avatar colour */
  color: string
  /** key into the avatar icon set (see components/ui.tsx) */
  icon: TraderIcon
}

export interface OpenBattle {
  id: string
  trader: Trader
  rank: number
  wins: number
  losses: number
  hot?: boolean
  market: Market
  leverage: number
  entry: number
  durationMin: number
  status: 'open' | 'matched'
  /** created by the current user */
  mine?: boolean
}

export interface ArenaConfig {
  battleId?: string
  challenger: Trader
  opponent: Trader
  market: Market
  leverage: number
  /** stake each trader locks, in USDC */
  entry: number
  durationMin: number
  /** true when the current user threw the challenge */
  userIsChallenger: boolean
}

export interface TraderStats {
  rank: number
  winRate: number
  avgPnl: number
  streak: number
  battles: number
}

export interface FeedItem {
  id: string
  who: string
  side: 0 | 1
  amount: number
  mine?: boolean
}

/** A live prediction market: one trading duel plus the pool people bet into. */
export interface Duel {
  id: string
  market: Market
  durationSec: number
  elapsedSec: number
  startsInSec: number
  phase: DuelPhase
  sides: [Trader, Trader]
  /** USDC bet on each trader */
  pools: [number, number]
  /** live session PnL in percent */
  pnl: [number, number]
  pnlHist: [number[], number[]]
  /** implied win probability of side 0 over time (percent) */
  probHist: number[]
  viewers: number
  winner: 0 | 1 | null
  feed: FeedItem[]
}

export interface Bet {
  id: string
  duelId: string
  side: 0 | 1
  stake: number
  /** net payout multiplier right after the bet was placed */
  entryMult: number
  /** set when the duel settles; 0 for a losing bet */
  payout: number | null
  claimed: boolean
}
