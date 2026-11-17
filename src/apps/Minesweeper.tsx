// Minesweeper — classic, mouse-first, fully self-contained.
// Blue/green Catppuccin theme. Keyboard optional; mouse/touch fully playable.
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'
import { mocha } from '../theme/catppuccin'
import { useWM } from '../store/wm'
import type { AppProps } from './types'

// ── Difficulty presets ───────────────────────────────────────────────────────
type DiffKey = 'easy' | 'medium' | 'hard'
interface Diff {
  key: DiffKey
  label: string
  rows: number
  cols: number
  mines: number
}
const DIFFS: Record<DiffKey, Diff> = {
  easy: { key: 'easy', label: 'Easy', rows: 9, cols: 9, mines: 10 },
  medium: { key: 'medium', label: 'Medium', rows: 16, cols: 16, mines: 40 },
  hard: { key: 'hard', label: 'Hard', rows: 16, cols: 30, mines: 99 },
}

// ── Cell model ───────────────────────────────────────────────────────────────
interface Cell {
  mine: boolean
  adj: number // adjacent mine count
  revealed: boolean
  flagged: boolean
}
type Board = Cell[][]
type Status = 'idle' | 'playing' | 'won' | 'lost'

// Number → color (1 blue, 2 green, 3 red, 4 sapphire, 5 teal, 6 sky, 7 lavender, 8 subtext)
const NUM_COLORS: Record<number, string> = {
  1: mocha.blue,
  2: mocha.green,
  3: mocha.red,
  4: mocha.sapphire,
  5: mocha.teal,
  6: mocha.sky,
  7: mocha.lavender,
  8: mocha.subtext0,
}

function makeEmpty(rows: number, cols: number): Board {
  const b: Board = []
  for (let r = 0; r < rows; r++) {
    const row: Cell[] = []
    for (let c = 0; c < cols; c++) {
      row.push({ mine: false, adj: 0, revealed: false, flagged: false })
    }
    b.push(row)
  }
  return b
}

function inBounds(r: number, c: number, rows: number, cols: number): boolean {
  return r >= 0 && r < rows && c >= 0 && c < cols
}

function neighbors(r: number, c: number, rows: number, cols: number): [number, number][] {
  const out: [number, number][] = []
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue
      const nr = r + dr
      const nc = c + dc
      if (inBounds(nr, nc, rows, cols)) out.push([nr, nc])
    }
  }
  return out
}

// Deep-clone so React state updates are immutable.
function cloneBoard(b: Board): Board {
  return b.map((row) => row.map((cell) => ({ ...cell })))
}

// Place mines AFTER first click, excluding the clicked cell + its neighbors (when room).
function placeMines(
  base: Board,
  rows: number,
  cols: number,
  mines: number,
  safeR: number,
  safeC: number,
): Board {
  const b = cloneBoard(base)
  const total = rows * cols

  // Build forbidden set: clicked cell + neighbors. If that leaves too few free
  // cells for all mines, shrink the safe zone to just the clicked cell.
  const wantSafe = new Set<number>()
  wantSafe.add(safeR * cols + safeC)
  for (const [nr, nc] of neighbors(safeR, safeC, rows, cols)) {
    wantSafe.add(nr * cols + nc)
  }
  let safe = wantSafe
  if (total - safe.size < mines) {
    safe = new Set<number>([safeR * cols + safeC])
  }

  // Collect candidate indices, shuffle, take first `mines`.
  const candidates: number[] = []
  for (let i = 0; i < total; i++) {
    if (!safe.has(i)) candidates.push(i)
  }
  // Fisher–Yates partial shuffle.
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = candidates[i]
    candidates[i] = candidates[j]
    candidates[j] = tmp
  }
  const chosen = candidates.slice(0, Math.min(mines, candidates.length))
  for (const idx of chosen) {
    const r = Math.floor(idx / cols)
    const c = idx % cols
    b[r][c].mine = true
  }

  // Compute adjacency counts.
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (b[r][c].mine) continue
      let count = 0
      for (const [nr, nc] of neighbors(r, c, rows, cols)) {
        if (b[nr][nc].mine) count++
      }
      b[r][c].adj = count
    }
  }
  return b
}

// Flood-fill reveal from (r,c). Mutates the provided (already-cloned) board.
function floodReveal(b: Board, r: number, c: number, rows: number, cols: number): void {
  const stack: [number, number][] = [[r, c]]
  while (stack.length) {
    const [cr, cc] = stack.pop() as [number, number]
    const cell = b[cr][cc]
    if (cell.revealed || cell.flagged) continue
    cell.revealed = true
    if (cell.adj === 0 && !cell.mine) {
      for (const [nr, nc] of neighbors(cr, cc, rows, cols)) {
        const n = b[nr][nc]
        // Never expand into mines; flagged/already-revealed are skipped.
        if (!n.revealed && !n.flagged && !n.mine) {
          stack.push([nr, nc])
        }
      }
    }
  }
}

function countFlags(b: Board): number {
  let n = 0
  for (const row of b) for (const cell of row) if (cell.flagged) n++
  return n
}

function checkWin(b: Board): boolean {
  for (const row of b) {
    for (const cell of row) {
      if (!cell.mine && !cell.revealed) return false
    }
  }
  return true
}

function revealAll(b: Board): Board {
  const nb = cloneBoard(b)
  for (const row of nb) {
    for (const cell of row) {
      if (cell.mine) cell.revealed = true
    }
  }
  return nb
}

export default function Minesweeper({ winId }: AppProps) {
  const isFocused = useWM((s) => s.focusedWindowId === winId)

  const [diffKey, setDiffKey] = useState<DiffKey>('easy')
  const diff = DIFFS[diffKey]

  const [board, setBoard] = useState<Board>(() => makeEmpty(diff.rows, diff.cols))
  const [status, setStatus] = useState<Status>('idle')
  const [flagMode, setFlagMode] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [bestTimes, setBestTimes] = useState<Record<DiffKey, number | null>>({
    easy: null,
    medium: null,
    hard: null,
  })

  // Keyboard cursor for accessibility (optional).
  const [cursor, setCursor] = useState<{ r: number; c: number }>({ r: 0, c: 0 })

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [cellPx, setCellPx] = useState(28)

  // Live mirror of `seconds` so the reveal/chord callbacks can read the current
  // elapsed time WITHOUT depending on `seconds` (which would otherwise recreate
  // those callbacks every tick and churn the keydown listener).
  const secondsRef = useRef(0)
  useEffect(() => {
    secondsRef.current = seconds
  }, [seconds])

  const flagsUsed = useMemo(() => countFlags(board), [board])
  const minesRemaining = diff.mines - flagsUsed

  // ── Reset / New game ─────────────────────────────────────────────────────
  const newGame = useCallback(
    (d: Diff) => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      setBoard(makeEmpty(d.rows, d.cols))
      setStatus('idle')
      setSeconds(0)
      setCursor({ r: 0, c: 0 })
    },
    [],
  )

  // When difficulty changes, start a fresh game.
  useEffect(() => {
    newGame(DIFFS[diffKey])
  }, [diffKey, newGame])

  // ── Timer: runs while playing, stops otherwise ─────────────────────────────
  useEffect(() => {
    if (status === 'playing') {
      timerRef.current = setInterval(() => {
        setSeconds((s) => (s < 999 ? s + 1 : s))
      }, 1000)
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [status])

  // Cleanup any stray interval on unmount (belt + suspenders).
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  // ── Responsive cell sizing ────────────────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const compute = () => {
      const pad = 16 // breathing room
      const availW = el.clientWidth - pad
      const availH = el.clientHeight - pad
      if (availW <= 0 || availH <= 0) return
      const byW = Math.floor(availW / diff.cols)
      const byH = Math.floor(availH / diff.rows)
      const size = Math.max(16, Math.min(40, Math.min(byW, byH)))
      setCellPx(size)
    }
    compute()
    const ro = new ResizeObserver(compute)
    ro.observe(el)
    return () => ro.disconnect()
  }, [diff.rows, diff.cols])

  // ── Core actions ───────────────────────────────────────────────────────────
  const revealCell = useCallback(
    (r: number, c: number) => {
      if (status === 'won' || status === 'lost') return
      setBoard((prev) => {
        const rows = prev.length
        const cols = prev[0].length
        if (!inBounds(r, c, rows, cols)) return prev

        // First reveal: generate mines now (first click always safe).
        let working = prev
        let firstMove = false
        if (status === 'idle') {
          working = placeMines(prev, rows, cols, diff.mines, r, c)
          firstMove = true
        }

        const cell = working[r][c]
        if (cell.flagged) return prev // can't reveal a flagged cell
        if (cell.revealed) return prev

        const nb = cloneBoard(working)

        // Hit a mine → lose.
        if (nb[r][c].mine) {
          nb[r][c].revealed = true
          const exploded = revealAll(nb)
          setStatus('lost')
          return exploded
        }

        floodReveal(nb, r, c, rows, cols)

        if (checkWin(nb)) {
          // Auto-flag remaining mines for a tidy win board.
          for (const row of nb) {
            for (const cl of row) {
              if (cl.mine) cl.flagged = true
            }
          }
          setStatus('won')
          // Record best time (read live elapsed via ref to avoid stale closure).
          setBestTimes((bt) => {
            const cur = bt[diff.key]
            const t = secondsRef.current
            if (cur === null || t < cur) return { ...bt, [diff.key]: t }
            return bt
          })
          return nb
        }

        if (firstMove) setStatus('playing')
        return nb
      })
    },
    [status, diff.mines, diff.key],
  )

  const toggleFlag = useCallback(
    (r: number, c: number) => {
      if (status === 'won' || status === 'lost') return
      setBoard((prev) => {
        const rows = prev.length
        const cols = prev[0].length
        if (!inBounds(r, c, rows, cols)) return prev
        const cell = prev[r][c]
        if (cell.revealed) return prev
        const nb = cloneBoard(prev)
        nb[r][c].flagged = !nb[r][c].flagged
        return nb
      })
      // Flagging before first reveal shouldn't start the timer; only revealing does.
    },
    [status],
  )

  // Chord: clicking a satisfied number reveals its non-flagged neighbors.
  const chord = useCallback(
    (r: number, c: number) => {
      if (status !== 'playing') return
      setBoard((prev) => {
        const rows = prev.length
        const cols = prev[0].length
        const cell = prev[r][c]
        if (!cell.revealed || cell.adj === 0) return prev
        let flags = 0
        for (const [nr, nc] of neighbors(r, c, rows, cols)) {
          if (prev[nr][nc].flagged) flags++
        }
        if (flags !== cell.adj) return prev

        const nb = cloneBoard(prev)
        let hitMine = false
        for (const [nr, nc] of neighbors(r, c, rows, cols)) {
          const n = nb[nr][nc]
          if (n.flagged || n.revealed) continue
          if (n.mine) {
            n.revealed = true
            hitMine = true
          } else {
            floodReveal(nb, nr, nc, rows, cols)
          }
        }
        if (hitMine) {
          setStatus('lost')
          return revealAll(nb)
        }
        if (checkWin(nb)) {
          for (const row of nb) for (const cl of row) if (cl.mine) cl.flagged = true
          setStatus('won')
          setBestTimes((bt) => {
            const curBest = bt[diff.key]
            const t = secondsRef.current
            if (curBest === null || t < curBest) return { ...bt, [diff.key]: t }
            return bt
          })
        }
        return nb
      })
    },
    [status, diff.key],
  )

  // ── Primary click handler (left click / tap) ───────────────────────────────
  const onCellClick = useCallback(
    (r: number, c: number) => {
      setCursor({ r, c })
      if (flagMode) {
        toggleFlag(r, c)
        return
      }
      const cell = board[r]?.[c]
      if (cell && cell.revealed && cell.adj > 0) {
        chord(r, c)
      } else {
        revealCell(r, c)
      }
    },
    [flagMode, board, toggleFlag, chord, revealCell],
  )

  // ── Keyboard controls (only when focused) ──────────────────────────────────
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!isFocused) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const rows = board.length
      const cols = board[0]?.length ?? 0
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault()
          setCursor((p) => ({ ...p, r: Math.max(0, p.r - 1) }))
          break
        case 'ArrowDown':
          e.preventDefault()
          setCursor((p) => ({ ...p, r: Math.min(rows - 1, p.r + 1) }))
          break
        case 'ArrowLeft':
          e.preventDefault()
          setCursor((p) => ({ ...p, c: Math.max(0, p.c - 1) }))
          break
        case 'ArrowRight':
          e.preventDefault()
          setCursor((p) => ({ ...p, c: Math.min(cols - 1, p.c + 1) }))
          break
        case ' ':
        case 'Enter': {
          e.preventDefault()
          const cell = board[cursor.r]?.[cursor.c]
          if (cell && cell.revealed && cell.adj > 0) chord(cursor.r, cursor.c)
          else revealCell(cursor.r, cursor.c)
          break
        }
        case 'f':
        case 'F':
          e.preventDefault()
          toggleFlag(cursor.r, cursor.c)
          break
        case 'r':
        case 'R':
          e.preventDefault()
          newGame(diff)
          break
        default:
          break
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isFocused, board, cursor, chord, revealCell, toggleFlag, newGame, diff])

  // ── HUD bits ───────────────────────────────────────────────────────────────
  const face = status === 'won' ? '😎' : status === 'lost' ? '💀' : '🙂'
  const statusText =
    status === 'won' ? 'You win!' : status === 'lost' ? 'Boom!' : 'Playing'

  const pad3 = (n: number) => {
    const v = Math.max(-99, Math.min(999, n))
    const sign = v < 0 ? '-' : ''
    const num = Math.abs(v).toString().padStart(sign ? 2 : 3, '0')
    return sign + num
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-base text-text">
      {/* Top bar: difficulty + new game */}
      <div className="flex flex-wrap items-center gap-2 border-b border-surface0 bg-mantle px-3 py-2">
        <span className="font-mono text-xs text-subtext0">Difficulty:</span>
        {(Object.keys(DIFFS) as DiffKey[]).map((k) => {
          const active = k === diffKey
          return (
            <button
              key={k}
              onClick={() => setDiffKey(k)}
              className={
                'rounded-md border px-2 py-1 font-mono text-xs transition-colors ' +
                (active
                  ? 'border-blue bg-surface0 text-blue'
                  : 'border-surface0 bg-base text-subtext1 hover:bg-surface0')
              }
            >
              {DIFFS[k].label}
            </button>
          )
        })}
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setFlagMode((f) => !f)}
            aria-pressed={flagMode}
            className={
              'rounded-md border px-2 py-1 font-mono text-xs transition-colors ' +
              (flagMode
                ? 'border-green bg-surface0 text-green'
                : 'border-surface0 bg-base text-subtext1 hover:bg-surface0')
            }
            title="Toggle flag mode (tap to flag)"
          >
            🚩 Flag {flagMode ? 'ON' : 'OFF'}
          </button>
          <button
            onClick={() => newGame(diff)}
            className="rounded-md border border-surface0 bg-base px-2 py-1 font-mono text-xs text-sky transition-colors hover:bg-surface0"
          >
            New game
          </button>
        </div>
      </div>

      {/* HUD */}
      <div className="flex items-center justify-center gap-3 border-b border-surface0 bg-mantle px-3 py-2">
        <div
          className="flex items-center gap-1 rounded-md border border-surface0 bg-crust px-2 py-1 font-mono text-sm"
          title="Mines remaining"
        >
          <span>💣</span>
          <span className="tabular-nums text-red">{pad3(minesRemaining)}</span>
        </div>

        <button
          onClick={() => newGame(diff)}
          className="rounded-md border border-surface0 bg-surface0 px-3 py-1 text-lg leading-none transition-transform hover:scale-110 active:scale-95"
          title="Click to start a new game"
        >
          {face}
        </button>

        <div
          className="flex items-center gap-1 rounded-md border border-surface0 bg-crust px-2 py-1 font-mono text-sm"
          title="Elapsed time"
        >
          <span>⏱</span>
          <span className="tabular-nums text-teal">{pad3(seconds)}</span>
        </div>
      </div>

      {/* Status line */}
      <div className="flex items-center justify-center gap-3 border-b border-surface0 bg-base px-3 py-1">
        <span
          className="font-mono text-xs"
          style={{
            color:
              status === 'won'
                ? mocha.green
                : status === 'lost'
                  ? mocha.red
                  : mocha.subtext0,
          }}
        >
          {statusText}
        </span>
        {bestTimes[diffKey] !== null && (
          <span className="font-mono text-xs text-subtext0">
            Best: {bestTimes[diffKey]}s
          </span>
        )}
      </div>

      {/* Play area */}
      <div
        ref={containerRef}
        className="flex flex-1 items-center justify-center overflow-auto p-2"
      >
        <div
          className="grid select-none rounded-md border border-surface1 bg-crust p-1"
          style={{
            gridTemplateColumns: `repeat(${diff.cols}, ${cellPx}px)`,
            gridTemplateRows: `repeat(${diff.rows}, ${cellPx}px)`,
            gap: 1,
          }}
          // Block native context menu across the whole grid.
          onContextMenu={(e) => e.preventDefault()}
        >
          {board.map((row, r) =>
            row.map((cell, c) => {
              const isCursor = isFocused && cursor.r === r && cursor.c === c
              const fontSize = Math.max(10, Math.floor(cellPx * 0.55))

              // Visual states.
              let content: ReactNode = ''
              let bgClass = 'bg-surface0'
              let style: CSSProperties = { fontSize }
              let borderClass = 'border-surface1'

              if (cell.revealed) {
                bgClass = 'bg-mantle'
                borderClass = 'border-surface0'
                if (cell.mine) {
                  bgClass = status === 'lost' ? 'bg-base' : 'bg-mantle'
                  content = '💣'
                  // Mark the detonated mine red-ish.
                  style = { ...style, background: mocha.red + '33' }
                } else if (cell.adj > 0) {
                  content = cell.adj
                  style = { ...style, color: NUM_COLORS[cell.adj] ?? mocha.text }
                }
              } else if (cell.flagged) {
                content = '🚩'
              }

              return (
                <button
                  key={`${r}-${c}`}
                  onClick={() => onCellClick(r, c)}
                  onContextMenu={(e) => {
                    e.preventDefault()
                    toggleFlag(r, c)
                  }}
                  className={
                    'flex items-center justify-center border font-mono font-bold leading-none transition-colors ' +
                    bgClass +
                    ' ' +
                    borderClass +
                    (cell.revealed
                      ? ''
                      : ' hover:brightness-125 active:brightness-90')
                  }
                  style={{
                    width: cellPx,
                    height: cellPx,
                    ...style,
                    outline: isCursor ? `2px solid ${mocha.sky}` : undefined,
                    outlineOffset: isCursor ? -2 : undefined,
                  }}
                  aria-label={
                    cell.revealed
                      ? cell.mine
                        ? 'mine'
                        : `${cell.adj} adjacent`
                      : cell.flagged
                        ? 'flagged'
                        : 'covered'
                  }
                >
                  {content}
                </button>
              )
            }),
          )}
        </div>
      </div>

      {/* Footer help */}
      <div className="border-t border-surface0 bg-mantle px-3 py-1 text-center font-mono text-[10px] text-overlay1">
        Left-click reveal · Right-click flag · Click a number to chord · Keys:
        arrows move, Space reveal, F flag, R restart
      </div>
    </div>
  )
}
