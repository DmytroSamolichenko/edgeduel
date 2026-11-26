import { useEffect, useId, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'

export interface Option<T extends string | number> {
  value: T
  label: string
}

interface Props<T extends string | number> {
  /** accessible name of the control */
  label: string
  /** short visible prefix, e.g. "Entry:" */
  prefix?: string
  value: T
  options: Option<T>[]
  onChange: (v: T) => void
  className?: string
}

/** Custom dropdown that replaces the native <select> so the open list matches the app. */
export function Select<T extends string | number>({ label, prefix, value, options, onChange, className = '' }: Props<T>) {
  const [open, setOpen] = useState(false)
  const selected = Math.max(0, options.findIndex((o) => o.value === value))
  const [active, setActive] = useState(selected)
  const [flip, setFlip] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const uid = useId()

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => !root.current?.contains(e.target as Node) && setOpen(false)
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  const openList = () => {
    const r = root.current?.getBoundingClientRect()
    // open towards the left when there is no room on the right
    setFlip(!!r && r.left + 176 > window.innerWidth - 12)
    setActive(selected)
    setOpen(true)
  }
  const choose = (i: number) => {
    onChange(options[i].value)
    setOpen(false)
  }

  const onKey = (e: React.KeyboardEvent) => {
    const last = options.length - 1
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
        e.preventDefault()
        openList()
      }
      return
    }
    switch (e.key) {
      case 'ArrowDown':
        setActive((a) => Math.min(last, a + 1))
        break
      case 'ArrowUp':
        setActive((a) => Math.max(0, a - 1))
        break
      case 'Home':
        setActive(0)
        break
      case 'End':
        setActive(last)
        break
      case 'Enter':
      case ' ':
        choose(active)
        break
      case 'Escape':
      case 'Tab':
        setOpen(false)
        return
      default:
        return
    }
    e.preventDefault()
  }

  return (
    <div className={`dd ${className}`} ref={root}>
      <button
        type="button"
        className="dd-btn"
        role="combobox"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${uid}-list`}
        aria-activedescendant={open ? `${uid}-${active}` : undefined}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onKey}
      >
        {prefix && <span className="dd-prefix">{prefix}</span>}
        <span className="dd-value">{options[selected].label}</span>
        <ChevronDown size={14} className="dd-chev" aria-hidden="true" />
      </button>
      {open && (
        <ul className={`dd-list ${flip ? 'is-flip' : ''}`} role="listbox" id={`${uid}-list`} aria-label={label}>
          {options.map((o, i) => (
            <li
              key={String(o.value)}
              id={`${uid}-${i}`}
              role="option"
              aria-selected={i === selected}
              className={`dd-opt ${i === active ? 'is-active' : ''} ${i === selected ? 'is-selected' : ''}`}
              onMouseEnter={() => setActive(i)}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => choose(i)}
            >
              {o.label}
              {i === selected && <Check size={14} aria-hidden="true" />}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
