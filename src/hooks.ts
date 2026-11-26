import { useEffect, useRef, useState } from 'react'

/** Counts down from `start` seconds, ticking once per second. Stops at 0. */
export function useCountdown(start: number) {
  const [left, setLeft] = useState(start)
  useEffect(() => {
    const id = window.setInterval(() => setLeft((s) => (s > 0 ? s - 1 : 0)), 1000)
    return () => window.clearInterval(id)
  }, [])
  return left
}

/** Eases a number toward `target` (skipped when the user prefers reduced motion). */
export function useCountUp(target: number, ms = 900) {
  const [value, setValue] = useState(target)
  const first = useRef(true)
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce || !first.current) {
      setValue(target)
      return
    }
    first.current = false
    setValue(0)
    const t0 = performance.now()
    let raf = 0
    const step = (t: number) => {
      const p = Math.min(1, (t - t0) / ms)
      setValue(target * (1 - Math.pow(1 - p, 3)))
      if (p < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [target, ms])
  return value
}

export function useLockedDialog(open: boolean, ref: React.RefObject<HTMLDialogElement | null>) {
  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open, ref])
}
