import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { Bet, Duel, FeedItem, Trader } from './types'
import { FEE, seedDuels, traders } from './data'
import { bettingOpen, leader, MAX_BET, netMult, totalPool } from './market'

interface State {
  duels: Duel[]
  bets: Bet[]
  balance: number
  nextId: number
}

type Result = { ok: true; mult: number } | { ok: false; error: string }

interface Ctx {
  duels: Duel[]
  bets: Bet[]
  balance: number
  placeBet: (duelId: string, side: 0 | 1, stake: number) => Result
  claim: (betId: string) => void
  claimAll: () => void
}

const MarketCtx = createContext<Ctx | null>(null)

const rnd = Math.random
const CHARS = 'abcdefghjkmnpqrstuvwxyz23456789'
const piece = () => Array.from({ length: 3 }, () => CHARS[Math.floor(rnd() * CHARS.length)]).join('')
const wallet = () => `${piece()}…${piece()}`
const BOT_AMOUNTS = [5, 10, 10, 25, 25, 50, 100, 250]
const POOL = [traders.cipher, traders.delta, traders.nox, traders.zero, traders.moon, traders.degen, traders.alpha, traders.block, traders.surf, traders.naka]
const MARKETS = ['ETH', 'BTC', 'SOL'] as const

const prob = (d: Duel) => Math.round((d.pools[0] / totalPool(d)) * 1000) / 10
const cap = <T,>(a: T[], n = 400) => (a.length > n ? a.slice(a.length - n) : a)

function newDuel(id: string): Duel {
  const a = POOL[Math.floor(rnd() * POOL.length)]
  let b: Trader = a
  while (b === a) b = POOL[Math.floor(rnd() * POOL.length)]
  const pools: [number, number] = [Math.round(300 + rnd() * 1200), Math.round(300 + rnd() * 1200)]
  return {
    id,
    market: MARKETS[Math.floor(rnd() * 3)],
    durationSec: 240 + Math.floor(rnd() * 4) * 60,
    elapsedSec: 0,
    startsInSec: 45,
    phase: 'upcoming',
    sides: [a, b],
    pools,
    pnl: [0, 0],
    pnlHist: [[0], [0]],
    probHist: [Math.round((pools[0] / (pools[0] + pools[1])) * 1000) / 10],
    viewers: 40 + Math.floor(rnd() * 80),
    winner: null,
    feed: [],
  }
}

/** One second of the simulated world: sessions progress, bots bet, finished duels settle. */
function advance(s: State): State {
  let nextId = s.nextId
  const bets = [...s.bets]
  const spawned: Duel[] = []

  const duels = s.duels.map((d0) => {
    const d: Duel = { ...d0 }
    if (d.phase === 'upcoming') {
      d.startsInSec = Math.max(0, d.startsInSec - 1)
      if (d.startsInSec === 0) d.phase = 'live'
    } else if (d.phase === 'live') {
      d.elapsedSec += 1
      d.pnl = [d.pnl[0] + (rnd() - 0.5) * 0.8, d.pnl[1] + (rnd() - 0.5) * 0.8]
      d.pnlHist = [cap([...d.pnlHist[0], d.pnl[0]]), cap([...d.pnlHist[1], d.pnl[1]])]
      if (d.elapsedSec >= d.durationSec) {
        d.phase = 'settled'
        d.winner = d.pnl[0] >= d.pnl[1] ? 0 : 1
        const total = totalPool(d)
        bets.forEach((b, i) => {
          if (b.duelId === d.id) bets[i] = { ...b, payout: b.side === d.winner ? (b.stake / d.pools[b.side]) * total * (1 - FEE) : 0 }
        })
        spawned.push(newDuel(`d${nextId++}`))
      }
    }

    if (d.phase !== 'settled') d.viewers = Math.max(20, d.viewers + Math.round((rnd() - 0.45) * 6))

    if (bettingOpen(d) && rnd() < 0.6) {
      const lead = leader(d)
      const side: 0 | 1 = d.phase === 'live' && lead !== null && rnd() < 0.62 ? lead : rnd() < 0.5 ? 0 : 1
      const amount = BOT_AMOUNTS[Math.floor(rnd() * BOT_AMOUNTS.length)]
      d.pools = side === 0 ? [d.pools[0] + amount, d.pools[1]] : [d.pools[0], d.pools[1] + amount]
      const item: FeedItem = { id: `${d.id}-${nextId++}`, who: wallet(), side, amount }
      d.feed = [item, ...d.feed].slice(0, 14)
    }
    if (d.phase !== 'settled') d.probHist = cap([...d.probHist, prob(d)])
    return d
  })

  return { ...s, duels: [...duels, ...spawned], bets, nextId }
}

export function MarketProvider({ children }: { children: React.ReactNode }) {
  const initial = useMemo<State>(() => ({ duels: seedDuels(), bets: [], balance: 1000, nextId: 10 }), [])
  const [state, setState] = useState(initial)
  const ref = useRef(initial)

  const commit = useCallback((fn: (s: State) => State) => {
    ref.current = fn(ref.current)
    setState(ref.current)
  }, [])

  useEffect(() => {
    // ?fast=N runs the simulated market N times faster (handy for demos)
    const speed = Math.min(60, Number(new URLSearchParams(location.search).get('fast')) || 1)
    const id = window.setInterval(() => {
      for (let i = 0; i < speed; i++) commit(advance)
    }, 1000)
    return () => window.clearInterval(id)
  }, [commit])

  const placeBet = useCallback(
    (duelId: string, side: 0 | 1, stake: number): Result => {
      const s = ref.current
      const d = s.duels.find((x) => x.id === duelId)
      if (!d) return { ok: false, error: 'This duel no longer exists' }
      if (!bettingOpen(d)) return { ok: false, error: 'Betting is closed for this duel' }
      if (!(stake >= 1)) return { ok: false, error: 'Minimum bet is $1' }
      if (stake > MAX_BET) return { ok: false, error: `Maximum bet is $${MAX_BET.toLocaleString('en-US')}` }
      if (stake > s.balance) return { ok: false, error: 'Not enough USDC in your balance' }
      const pools: [number, number] = side === 0 ? [d.pools[0] + stake, d.pools[1]] : [d.pools[0], d.pools[1] + stake]
      const after: Duel = { ...d, pools }
      const mult = netMult(after, side)
      const betId = `bet-${s.nextId}`
      commit((cur) => ({
        ...cur,
        nextId: cur.nextId + 1,
        balance: cur.balance - stake,
        bets: [{ id: betId, duelId, side, stake, entryMult: mult, payout: null, claimed: false }, ...cur.bets],
        duels: cur.duels.map((x) =>
          x.id === duelId
            ? { ...after, probHist: cap([...x.probHist, prob(after)]), feed: [{ id: betId, who: 'You', side, amount: stake, mine: true }, ...x.feed].slice(0, 14) }
            : x,
        ),
      }))
      return { ok: true, mult }
    },
    [commit],
  )

  const claim = useCallback(
    (betId: string) =>
      commit((cur) => {
        const b = cur.bets.find((x) => x.id === betId)
        if (!b || b.claimed || !b.payout) return cur
        return { ...cur, balance: cur.balance + b.payout, bets: cur.bets.map((x) => (x.id === betId ? { ...x, claimed: true } : x)) }
      }),
    [commit],
  )

  const claimAll = useCallback(
    () =>
      commit((cur) => {
        const due = cur.bets.filter((b) => !b.claimed && b.payout)
        if (!due.length) return cur
        const sum = due.reduce((a, b) => a + (b.payout ?? 0), 0)
        return { ...cur, balance: cur.balance + sum, bets: cur.bets.map((b) => (!b.claimed && b.payout ? { ...b, claimed: true } : b)) }
      }),
    [commit],
  )

  const value = useMemo<Ctx>(
    () => ({ duels: state.duels, bets: state.bets, balance: state.balance, placeBet, claim, claimAll }),
    [state, placeBet, claim, claimAll],
  )
  return <MarketCtx.Provider value={value}>{children}</MarketCtx.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useMarket() {
  const c = useContext(MarketCtx)
  if (!c) throw new Error('useMarket must be used inside MarketProvider')
  return c
}
