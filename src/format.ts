const usd0 = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
const usd2 = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 })

export const money = (n: number) => usd0.format(n)
export const money2 = (n: number) => usd2.format(n)

export const compactMoney = (n: number) =>
  '$' + new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(n)

export const pct = (n: number) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${Math.abs(n).toFixed(1)}%`

export const clock = (s: number) => {
  const m = Math.floor(s / 60)
  return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

export const duration = (min: number) => (min >= 60 ? `${min / 60} hr` : `${min} min`)

export const mult = (n: number) => `${n.toFixed(2)}x`
export const signedMoney = (n: number) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${money2(Math.abs(n))}`
