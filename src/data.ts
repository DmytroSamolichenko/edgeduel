import type { Duel, OpenBattle, Trader, TraderIcon, TraderStats } from './types'

const t = (id: string, name: string, color: string, icon: TraderIcon): Trader => ({ id, name, color, icon })

export const traders = {
  cipher: t('cipher', 'CipherWolf', '#8b5cf6', 'paw'),
  delta: t('delta', 'DeltaRunner', '#0ea5e9', 'steps'),
  nox: t('nox', 'NoxCapital', '#f59e0b', 'moon'),
  zero: t('zero', 'ZeroSum', '#10b981', 'slash'),
  moon: t('moon', 'MoonRider', '#6366f1', 'rocket'),
  degen: t('degen', 'DeFiDegen', '#ec4899', 'dice'),
  alpha: t('alpha', 'AlphaSeeker', '#ef4444', 'target'),
  block: t('block', 'BlockSmith', '#f97316', 'hammer'),
  surf: t('surf', 'SolSurfer', '#14b8a6', 'waves'),
  naka: t('naka', 'NakamotoX', '#eab308', 'atom'),
}

export const you = t('you', 'ApexAnon', '#65a30d', 'user')

/** Platform fee taken from the winning pool. */
export const FEE = 0.05

export const initialBattles: OpenBattle[] = [
  { id: 'b1', trader: traders.cipher, rank: 184, wins: 18, losses: 7, hot: true, market: 'ETH', leverage: 10, entry: 250, durationMin: 15, status: 'open' },
  { id: 'b2', trader: traders.delta, rank: 392, wins: 12, losses: 4, market: 'BTC', leverage: 5, entry: 100, durationMin: 30, status: 'open' },
  { id: 'b3', trader: traders.nox, rank: 728, wins: 31, losses: 19, market: 'SOL', leverage: 20, entry: 500, durationMin: 10, status: 'open' },
  { id: 'b4', trader: traders.zero, rank: 1102, wins: 8, losses: 3, market: 'ETH', leverage: 3, entry: 50, durationMin: 60, status: 'open' },
]

export const traderStats: Record<string, TraderStats> = {
  cipher: { rank: 184, winRate: 72, avgPnl: 6.8, streak: 4, battles: 25 },
  delta: { rank: 392, winRate: 75, avgPnl: 5.1, streak: 2, battles: 16 },
  nox: { rank: 728, winRate: 62, avgPnl: 3.4, streak: 1, battles: 50 },
  zero: { rank: 1102, winRate: 73, avgPnl: 2.9, streak: 3, battles: 11 },
  moon: { rank: 96, winRate: 68, avgPnl: 7.9, streak: 5, battles: 41 },
  degen: { rank: 241, winRate: 58, avgPnl: 4.6, streak: 0, battles: 33 },
  alpha: { rank: 58, winRate: 71, avgPnl: 8.4, streak: 2, battles: 64 },
  block: { rank: 112, winRate: 66, avgPnl: 6.1, streak: 3, battles: 38 },
  surf: { rank: 310, winRate: 61, avgPnl: 5.7, streak: 1, battles: 29 },
  naka: { rank: 77, winRate: 69, avgPnl: 7.2, streak: 6, battles: 47 },
  you: { rank: 241, winRate: 0, avgPnl: 0, streak: 0, battles: 0 },
}

const flat = (n: number, v: number) => Array.from({ length: n + 1 }, () => v)
const duel = (d: Partial<Duel> & Pick<Duel, 'id' | 'market' | 'durationSec' | 'sides' | 'pools'>): Duel => {
  const pnl = d.pnl ?? [0, 0]
  const total = d.pools[0] + d.pools[1]
  return {
    elapsedSec: 0,
    startsInSec: 0,
    phase: 'live',
    pnl,
    pnlHist: [[0, pnl[0]], [0, pnl[1]]],
    probHist: flat(6, Math.round((d.pools[0] / total) * 1000) / 10),
    viewers: 100,
    winner: null,
    feed: [],
    ...d,
  }
}

export const seedDuels = (): Duel[] => [
  duel({ id: 'd1', market: 'ETH', durationSec: 360, elapsedSec: 40, pools: [2600, 1680], pnl: [2.4, 0.9], viewers: 184, sides: [traders.moon, traders.degen] }),
  duel({ id: 'd2', market: 'BTC', durationSec: 480, elapsedSec: 12, pools: [3400, 5540], pnl: [-0.4, 0.7], viewers: 326, sides: [traders.alpha, traders.block] }),
  duel({ id: 'd3', market: 'SOL', durationSec: 300, phase: 'upcoming', startsInSec: 55, pools: [980, 1140], viewers: 91, sides: [traders.surf, traders.naka] }),
  duel({ id: 'd0', market: 'ETH', durationSec: 300, elapsedSec: 300, phase: 'settled', winner: 0, pools: [1500, 1100], pnl: [6.4, -2.1], viewers: 142, sides: [traders.cipher, traders.zero] }),
]

export const stats = { played: 1284, volume: 482_000, live: 74 }
