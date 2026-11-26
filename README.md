# EdgeDuel

Solana-only frontend for EdgeDuel: a prediction market on live 1v1 trading duels (the main product), plus an Arena where traders create the duels. Frontend only, all data is mocked in `src/data.ts`.

**Stack:** React 19, TypeScript, Vite, lucide-react. Plain CSS with design tokens in `src/index.css`.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build
```

Add `?fast=8` to the URL to run the simulated market 8x faster (durations and betting windows shrink accordingly).

## How the market works
- One pool per duel. Winners split the whole pool minus a 5% fee, in proportion to their stake (parimutuel), so odds move with every bet.
- Betting stays open until 25% of the session has elapsed (`LOCK_AT` in `src/market.ts`).
- Simulated by `src/store.tsx`: bots bet, PnL random-walks, duels settle and new ones open.
- Routes: `#` Predict, `#duel/<id>` duel page, `#arena`, `#positions`.

## Structure
- `src/components/BattleView.tsx`: hero, stats, filters, open battles, empty state
- `src/components/CreateBattleDialog.tsx`: native `<dialog>` with validated form
- `src/components/PredictView.tsx`, `DuelPage.tsx`, `BetPanel.tsx`, `PositionsView.tsx`: the prediction market
- `src/store.tsx`, `src/market.ts`: simulated market state and odds math
- `src/components/Header.tsx`: tabs (ARIA tablist), Solana badge, wallet toggle (demo)
- `src/types.ts`, `src/data.ts`, `src/format.ts`, `src/hooks.ts`

## Next (backend/on-chain)
Replace `src/data.ts` with an API, and the wallet toggle with the Solana wallet adapter (Phantom, Solflare). The app is Solana-only: escrow and settlement would be an Anchor program, with USDC (SPL) stakes and PnL read from the trading venue.
