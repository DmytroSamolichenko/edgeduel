import { useCallback, useEffect, useRef, useState } from 'react'
import type { ArenaConfig, OpenBattle, Tab } from './types'
import { initialBattles, traders, you } from './data'
import { Header } from './components/Header'
import { BattleView } from './components/BattleView'
import { PredictView } from './components/PredictView'
import { DuelPage } from './components/DuelPage'
import { PositionsView } from './components/PositionsView'
import { Arena } from './components/Arena'
import { Toast } from './components/ui'
import './market.css'

const CHALLENGERS = [traders.cipher, traders.delta, traders.nox, traders.zero, traders.alpha, traders.block]

interface Route {
  tab: Tab
  duelId?: string
}

const parse = (hash: string): Route => {
  const h = hash.replace(/^#/, '')
  if (h.startsWith('duel/')) return { tab: 'predict', duelId: h.slice(5) }
  if (h === 'arena' || h === 'positions') return { tab: h }
  return { tab: 'predict' }
}

export default function App() {
  const [route, setRoute] = useState<Route>(() => parse(location.hash))
  const [battles, setBattles] = useState(initialBattles)
  const [connected, setConnected] = useState(false)
  const [toast, setToast] = useState('')
  const [arena, setArena] = useState<{ cfg: ArenaConfig; run: number } | null>(null)
  const timer = useRef(0)
  const incoming = useRef(0)
  const arenaOpen = useRef(false)
  useEffect(() => {
    arenaOpen.current = arena !== null
  }, [arena])

  const notify = useCallback((msg: string) => {
    setToast(msg)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setToast(''), 3600)
  }, [])

  const go = (tab: Tab) => {
    location.hash = tab === 'predict' ? '' : tab
    if (!location.hash) history.replaceState(null, '', location.pathname)
    setRoute({ tab })
    window.scrollTo({ top: 0 })
  }

  useEffect(() => {
    const onHash = () => {
      setRoute(parse(location.hash))
      window.scrollTo({ top: 0 })
    }
    window.addEventListener('hashchange', onHash)
    return () => {
      window.removeEventListener('hashchange', onHash)
      window.clearTimeout(incoming.current)
    }
  }, [])

  const needWallet = useCallback(() => {
    if (connected) return true
    notify('Connect your wallet first')
    return false
  }, [connected, notify])

  const createBattle = (v: Pick<OpenBattle, 'market' | 'leverage' | 'entry' | 'durationMin'>) => {
    if (!needWallet()) return false
    const id = crypto.randomUUID()
    setBattles((b) => [{ id, trader: you, rank: 241, wins: 0, losses: 0, status: 'open', mine: true, ...v }, ...b])
    notify('Battlefield open. Waiting for a challenger…')
    // demo: a random trader challenges you a few seconds later
    window.clearTimeout(incoming.current)
    incoming.current = window.setTimeout(() => {
      if (arenaOpen.current) return
      const challenger = CHALLENGERS[Math.floor(Math.random() * CHALLENGERS.length)]
      setArena({ run: 0, cfg: { battleId: id, challenger, opponent: you, userIsChallenger: false, ...v } })
    }, 5500)
    return true
  }

  const challenge = (b: OpenBattle) => {
    if (!needWallet()) return
    setArena({
      run: 0,
      cfg: {
        battleId: b.id,
        challenger: you,
        opponent: b.trader,
        userIsChallenger: true,
        market: b.market,
        leverage: b.leverage,
        entry: b.entry,
        durationMin: b.durationMin,
      },
    })
  }

  const { tab } = route
  return (
    <>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <Header
        tab={tab}
        onTab={go}
        connected={connected}
        onToggleWallet={() => {
          setConnected((c) => !c)
          notify(connected ? 'Wallet disconnected' : 'Wallet connected (demo, 1,000 USDC)')
        }}
      />
      <main id="main" className="page" key={route.duelId ?? tab}>
        <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
          {tab === 'arena' ? (
            <BattleView battles={battles} onCreate={createBattle} onChallenge={challenge} />
          ) : tab === 'positions' ? (
            connected ? (
              <PositionsView notify={notify} />
            ) : (
              <div className="empty">
                <h3>Connect your wallet</h3>
                <p className="muted">Your bets, balance and winnings show up here once you connect.</p>
                <button className="btn btn-primary" onClick={() => (setConnected(true), notify('Wallet connected (demo, 1,000 USDC)'))}>
                  Connect wallet
                </button>
              </div>
            )
          ) : route.duelId ? (
            <DuelPage id={route.duelId} needWallet={needWallet} notify={notify} />
          ) : (
            <PredictView needWallet={needWallet} notify={notify} />
          )}
        </div>
      </main>
      <footer className="footer">
        <p>EdgeDuel · Demo interface, no real funds. Trading with leverage carries risk.</p>
      </footer>
      <Toast message={toast} />

      {arena && (
        <Arena
          key={arena.run}
          cfg={arena.cfg}
          onAccepted={() => setBattles((all) => all.map((x) => (x.id === arena.cfg.battleId ? { ...x, status: 'matched' } : x)))}
          onClose={(accepted) => {
            if (accepted) setBattles((all) => all.filter((x) => x.id !== arena.cfg.battleId))
            setArena(null)
          }}
          onRematch={() =>
            setArena({
              run: arena.run + 1,
              cfg: { ...arena.cfg, battleId: undefined, userIsChallenger: true, challenger: you, opponent: arena.cfg.userIsChallenger ? arena.cfg.opponent : arena.cfg.challenger },
            })
          }
        />
      )}
    </>
  )
}
