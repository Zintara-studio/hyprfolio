import { useCallback, useEffect, useMemo, useState } from 'react'
import type { AppProps } from './types'
import { mocha } from '../theme/catppuccin'
import { useWM } from '../store/wm'

// ── Operator state-machine ──────────────────────────────────────────────────
// Immediate-execution model like a basic desktop calculator: each new operator
// commits the pending operation left-to-right. No JS eval is used anywhere.

type Op = '+' | '-' | '*' | '/'

interface CalcState {
  /** What the display currently shows (digits the user is typing, or a result). */
  display: string
  /** The committed accumulator value (left operand), or null before any op. */
  acc: number | null
  /** Pending operator awaiting its right operand. */
  op: Op | null
  /** True right after an op/equals — next digit starts a fresh entry. */
  overwrite: boolean
  /** Last operator + operand, so repeated "=" can replay the operation. */
  lastOp: Op | null
  lastOperand: number | null
  /** Sticky error state; cleared by AC. */
  error: boolean
}

const INITIAL: CalcState = {
  display: '0',
  acc: null,
  op: null,
  overwrite: true,
  lastOp: null,
  lastOperand: null,
  error: false,
}

const OP_SYMBOL: Record<Op, string> = { '+': '+', '-': '−', '*': '×', '/': '÷' }

// Trim floating-point noise without losing precision for normal numbers.
function formatNumber(n: number): string {
  if (!Number.isFinite(n)) return 'Error'
  if (n === 0) return '0'
  const abs = Math.abs(n)
  // Use exponential for very large / very small magnitudes.
  if (abs >= 1e15 || abs < 1e-10) {
    return n.toExponential(6).replace(/\.?0+e/, 'e')
  }
  // Round to 12 significant-ish digits to kill 0.1+0.2 style artifacts.
  const rounded = Math.round((n + Number.EPSILON) * 1e10) / 1e10
  let s = String(rounded)
  if (s.includes('e') || s.includes('E')) {
    s = rounded.toPrecision(12)
  }
  // Strip trailing zeros in the fractional part.
  if (s.includes('.')) {
    s = s.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '')
  }
  return s
}

function compute(a: number, b: number, op: Op): number {
  switch (op) {
    case '+':
      return a + b
    case '-':
      return a - b
    case '*':
      return a * b
    case '/':
      return b === 0 ? Number.NaN : a / b
  }
}

function inputDigit(s: CalcState, d: string): CalcState {
  if (s.error) return s
  if (s.overwrite) {
    return { ...s, display: d === '0' ? '0' : d, overwrite: false }
  }
  if (s.display === '0') {
    return { ...s, display: d === '0' ? '0' : d }
  }
  if (s.display.replace(/[-.]/g, '').length >= 15) return s
  return { ...s, display: s.display + d }
}

function inputDot(s: CalcState): CalcState {
  if (s.error) return s
  if (s.overwrite) return { ...s, display: '0.', overwrite: false }
  if (s.display.includes('.')) return s
  return { ...s, display: s.display + '.' }
}

function inputOp(s: CalcState, op: Op): CalcState {
  if (s.error) return s
  const cur = parseFloat(s.display)
  // Chaining: if there's a pending op and the user just typed a fresh operand,
  // evaluate it before stacking the next operator (left-to-right).
  if (s.op !== null && s.acc !== null && !s.overwrite) {
    const result = compute(s.acc, cur, s.op)
    if (!Number.isFinite(result)) return { ...INITIAL, display: 'Error', error: true, overwrite: false }
    return {
      ...s,
      acc: result,
      display: formatNumber(result),
      op,
      overwrite: true,
      lastOp: null,
      lastOperand: null,
    }
  }
  // No pending op yet, or operator pressed twice — just (re)arm the operator.
  return {
    ...s,
    acc: s.acc === null ? cur : s.acc,
    op,
    overwrite: true,
    lastOp: null,
    lastOperand: null,
  }
}

function inputEquals(s: CalcState): CalcState {
  if (s.error) return s
  // Fresh "=" with a pending operation.
  if (s.op !== null && s.acc !== null) {
    const b = parseFloat(s.display)
    const result = compute(s.acc, b, s.op)
    if (!Number.isFinite(result)) return { ...INITIAL, display: 'Error', error: true, overwrite: false }
    return {
      ...INITIAL,
      display: formatNumber(result),
      acc: result,
      overwrite: true,
      lastOp: s.op,
      lastOperand: b,
    }
  }
  // Repeated "=" replays the last operation against the current display value.
  if (s.lastOp !== null && s.lastOperand !== null) {
    const a = parseFloat(s.display)
    const result = compute(a, s.lastOperand, s.lastOp)
    if (!Number.isFinite(result)) return { ...INITIAL, display: 'Error', error: true, overwrite: false }
    return {
      ...s,
      display: formatNumber(result),
      acc: result,
      op: null,
      overwrite: true,
    }
  }
  return { ...s, overwrite: true }
}

function inputNegate(s: CalcState): CalcState {
  if (s.error || s.display === '0') return s
  const negated = s.display.startsWith('-') ? s.display.slice(1) : '-' + s.display
  return { ...s, display: negated }
}

function inputPercent(s: CalcState): CalcState {
  if (s.error) return s
  const cur = parseFloat(s.display)
  // Percent relative to accumulator when in an operation, else plain /100.
  const base = s.op !== null && s.acc !== null ? (s.acc * cur) / 100 : cur / 100
  return { ...s, display: formatNumber(base), overwrite: true }
}

function inputBackspace(s: CalcState): CalcState {
  if (s.error || s.overwrite) return s
  if (s.display.length <= 1 || (s.display.length === 2 && s.display.startsWith('-'))) {
    return { ...s, display: '0', overwrite: true }
  }
  return { ...s, display: s.display.slice(0, -1) }
}

// ── Button definitions ──────────────────────────────────────────────────────

type BtnKind = 'fn' | 'op' | 'eq' | 'digit'

interface BtnDef {
  label: string
  kind: BtnKind
  /** grid column span */
  span?: number
}

const LAYOUT: BtnDef[][] = [
  [
    { label: 'AC', kind: 'fn' },
    { label: '±', kind: 'fn' },
    { label: '%', kind: 'fn' },
    { label: '÷', kind: 'op' },
  ],
  [
    { label: '7', kind: 'digit' },
    { label: '8', kind: 'digit' },
    { label: '9', kind: 'digit' },
    { label: '×', kind: 'op' },
  ],
  [
    { label: '4', kind: 'digit' },
    { label: '5', kind: 'digit' },
    { label: '6', kind: 'digit' },
    { label: '−', kind: 'op' },
  ],
  [
    { label: '1', kind: 'digit' },
    { label: '2', kind: 'digit' },
    { label: '3', kind: 'digit' },
    { label: '+', kind: 'op' },
  ],
  [
    { label: '0', kind: 'digit', span: 2 },
    { label: '.', kind: 'digit' },
    { label: '=', kind: 'eq' },
  ],
]

const OP_FROM_LABEL: Record<string, Op> = { '÷': '/', '×': '*', '−': '-', '+': '+' }

export default function Calculator({ winId }: AppProps) {
  const isFocused = useWM((s) => s.focusedWindowId === winId)
  const [state, setState] = useState<CalcState>(INITIAL)

  const press = useCallback((label: string) => {
    setState((s) => {
      switch (label) {
        case 'AC':
          return INITIAL
        case '±':
          return inputNegate(s)
        case '%':
          return inputPercent(s)
        case '÷':
        case '×':
        case '−':
        case '+': {
          const op = OP_FROM_LABEL[label]
          return op ? inputOp(s, op) : s
        }
        case '=':
          return inputEquals(s)
        case '.':
          return inputDot(s)
        case '⌫':
          return inputBackspace(s)
        default:
          return /^[0-9]$/.test(label) ? inputDigit(s, label) : s
      }
    })
  }, [])

  // Keyboard handling — only when this window is focused.
  useEffect(() => {
    if (!isFocused) return
    const onKey = (e: KeyboardEvent) => {
      if (!isFocused) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const k = e.key
      if (/^[0-9]$/.test(k)) {
        e.preventDefault()
        press(k)
      } else if (k === '.' || k === ',') {
        e.preventDefault()
        press('.')
      } else if (k === '+') {
        e.preventDefault()
        press('+')
      } else if (k === '-') {
        e.preventDefault()
        press('−')
      } else if (k === '*' || k === 'x' || k === 'X') {
        e.preventDefault()
        press('×')
      } else if (k === '/') {
        e.preventDefault()
        press('÷')
      } else if (k === 'Enter' || k === '=') {
        e.preventDefault()
        press('=')
      } else if (k === 'Backspace') {
        e.preventDefault()
        press('⌫')
      } else if (k === 'Escape' || k === 'c' || k === 'C') {
        e.preventDefault()
        press('AC')
      } else if (k === '%') {
        e.preventDefault()
        press('%')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isFocused, press])

  // Secondary expression line, e.g. "12 ×".
  const expression = useMemo(() => {
    if (state.error) return 'cannot divide by zero'
    if (state.op !== null && state.acc !== null) {
      return `${formatNumber(state.acc)} ${OP_SYMBOL[state.op]}`
    }
    if (state.lastOp !== null && state.lastOperand !== null) {
      return `${OP_SYMBOL[state.lastOp]} ${formatNumber(state.lastOperand)} =`
    }
    return ' '
  }, [state])

  // Scale display font with length so long numbers still fit.
  const dispLen = state.display.length
  const dispClass =
    dispLen <= 8
      ? 'text-5xl sm:text-6xl'
      : dispLen <= 12
        ? 'text-4xl sm:text-5xl'
        : dispLen <= 16
          ? 'text-3xl sm:text-4xl'
          : 'text-2xl sm:text-3xl'

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-base text-text">
      {/* Display */}
      <div className="flex shrink-0 flex-col items-end justify-end gap-1 px-5 pt-5 pb-3">
        <div className="min-h-[1.25rem] truncate font-mono text-sm text-subtext0">{expression}</div>
        <div
          className={`w-full truncate text-right font-mono font-medium leading-none ${dispClass}`}
          style={{ color: state.error ? mocha.red : mocha.text }}
          aria-live="polite"
        >
          {state.display}
        </div>
      </div>

      {/* Keypad */}
      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-auto p-3">
        {LAYOUT.map((row, ri) => (
          <div key={ri} className="grid flex-1 grid-cols-4 gap-2">
            {row.map((b) => (
              <CalcButton key={b.label} def={b} onPress={press} />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Button component ────────────────────────────────────────────────────────

function CalcButton({ def, onPress }: { def: BtnDef; onPress: (label: string) => void }) {
  // Per-kind base styling. Operators use a blue/teal accent; equals is green;
  // digits sit on surface0; function keys on surface1.
  const base =
    'flex select-none items-center justify-center rounded-xl font-mono text-xl font-medium transition-all duration-75 active:scale-95 outline-none focus-visible:ring-2 focus-visible:ring-blue/70'

  let kindClass = ''
  let style: React.CSSProperties | undefined
  switch (def.kind) {
    case 'digit':
      kindClass = 'bg-surface0 text-text hover:bg-surface1 active:bg-surface2'
      break
    case 'fn':
      kindClass = 'bg-surface1 text-subtext1 hover:bg-surface2 active:bg-overlay0'
      break
    case 'op':
      kindClass = 'text-base hover:brightness-110 active:brightness-95'
      style = { background: mocha.blue, color: mocha.crust }
      break
    case 'eq':
      kindClass = 'hover:brightness-110 active:brightness-95'
      style = { background: mocha.green, color: mocha.crust }
      break
  }

  const spanClass = def.span === 2 ? 'col-span-2' : ''

  return (
    <button
      type="button"
      onClick={() => onPress(def.label)}
      className={`${base} ${kindClass} ${spanClass}`}
      style={style}
      aria-label={def.label}
    >
      {def.label}
    </button>
  )
}
