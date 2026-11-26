import { useEffect, useRef, useState } from 'react'

const TICK_MS = 250

export interface DuelState {
  tick: number
  /** live PnL in USDC for [player 0, player 1] */
  pnl: [number, number]
  hist: [number[], number[]]
  /** last tick-to-tick change, used for flash direction */
  delta: [number, number]
  leader: 0 | 1 | null
  leadChanges: number
  lastLeadChangeTick: number
  liquidated: 0 | 1 | null
  done: boolean
}

interface Cfg {
  durationMin: number
  leverage: number
  entry: number
}

const fresh = (): DuelState => ({
  tick: 0,
  pnl: [0, 0],
  hist: [[0], [0]],
  delta: [0, 0],
  leader: null,
  leadChanges: 0,
  lastLeadChangeTick: -99,
  liquidated: null,
  done: false,
})

/**
 * Simulated head-to-head PnL feed. Demo time is compressed: a 10 minute battle
 * plays in ~25s and a 1 hour battle in ~50s, while the shown clock stays in
 * battle time. Replace with a websocket/price feed later.
 */
export function useDuelSim(running: boolean, cfg: Cfg) {
  const realSeconds = Math.min(50, 20 + cfg.durationMin * 0.5)
  const totalTicks = Math.round((realSeconds * 1000) / TICK_MS)
  const [state, setState] = useState<DuelState>(fresh)
  const ref = useRef(state)
  const [bias] = useState<[number, number]>(() => [Math.random() - 0.5, Math.random() - 0.5])

  useEffect(() => {
    if (!running) return
    // amplitude chosen so a full run ends around +/-16% of entry at 10x
    const target = cfg.entry * 0.16 * Math.sqrt(cfg.leverage / 10)
    const amp = target / (0.2887 * Math.sqrt(totalTicks))

    const id = window.setInterval(() => {
      const s = ref.current
      if (s.done) return
      const tick = s.tick + 1
      const pnl: [number, number] = [s.pnl[0], s.pnl[1]]
      const delta: [number, number] = [0, 0]
      let liquidated: 0 | 1 | null = null
      for (const i of [0, 1] as const) {
        const inc = (Math.random() - 0.5) * amp + bias[i] * amp * 0.15
        const next = Math.max(-cfg.entry, pnl[i] + inc)
        delta[i] = next - pnl[i]
        pnl[i] = next
        if (next <= -cfg.entry) liquidated = i
      }
      const diff = pnl[0] - pnl[1]
      const leader: 0 | 1 | null = Math.abs(diff) < 0.005 ? s.leader : diff > 0 ? 0 : 1
      const flipped = s.leader !== null && leader !== null && leader !== s.leader
      const next: DuelState = {
        tick,
        pnl,
        hist: [[...s.hist[0], pnl[0]], [...s.hist[1], pnl[1]]],
        delta,
        leader,
        leadChanges: s.leadChanges + (flipped ? 1 : 0),
        lastLeadChangeTick: flipped ? tick : s.lastLeadChangeTick,
        liquidated,
        done: tick >= totalTicks || liquidated !== null,
      }
      ref.current = next
      setState(next)
    }, TICK_MS)
    return () => window.clearInterval(id)
  }, [running, cfg.entry, cfg.leverage, totalTicks, bias])

  const progress = Math.min(1, state.tick / totalTicks)
  const remainingSec = Math.round(cfg.durationMin * 60 * (1 - progress))
  return { ...state, totalTicks, progress, remainingSec }
}
