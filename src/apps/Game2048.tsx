import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { mocha } from '../theme/catppuccin'
import { useWM } from '../store/wm'
import type { AppProps } from './types'

// ─────────────────────────────────────────────────────────────────────────────
// 2048 — slide & merge tiles. Blue→green Catppuccin theme.
// ─────────────────────────────────────────────────────────────────────────────

const SIZE = 4
const CELLS = SIZE * SIZE

type Dir = 'up' | 'down' | 'left' | 'right'

// A tile carries a stable id so framer-motion can animate it across moves.
interface Tile {
  id: number
  value: number
  /** flat board index 0..15 (row-major: index = r*SIZE + c) */
  pos: number
  /** marks a freshly spawned tile (pop-in animation) */
  spawned?: boolean
  /** marks a tile that just absorbed another (pulse animation) */
  merged?: boolean
}

interface MoveResult {
  tiles: Tile[]
  gained: number
  moved: boolean
  reached2048: boolean
}

let TILE_SEQ = 1
function nextId() {
  return TILE_SEQ++
}

// ── Tile color lookup: deep blue (small) → bright green/teal (large) ─────────
function tileStyle(value: number): { background: string; color: string; glow?: string } {
  switch (value) {
    case 2:
      return { background: mocha.blue, color: mocha.crust }
    case 4:
      return { background: mocha.sapphire, color: mocha.crust }
    case 8:
      return { background: mocha.sky, color: mocha.crust }
    case 16:
      return { background: mocha.teal, color: mocha.crust }
    case 32:
      return { background: mocha.green, color: mocha.crust }
    case 64:
      return { background: `linear-gradient(135deg, ${mocha.teal}, ${mocha.green})`, color: mocha.crust }
    case 128:
      return { background: `linear-gradient(135deg, ${mocha.sapphire}, ${mocha.green})`, color: mocha.crust }
    case 256:
      return { background: `linear-gradient(135deg, ${mocha.sky}, ${mocha.green})`, color: mocha.crust }
    case 512:
      return {
        background: `linear-gradient(135deg, ${mocha.blue}, ${mocha.green})`,
        color: mocha.crust,
        glow: mocha.green,
      }
    case 1024:
      return {
        background: `linear-gradient(135deg, ${mocha.teal}, ${mocha.green})`,
        color: mocha.crust,
        glow: mocha.green,
      }
    case 2048:
      return {
        background: `linear-gradient(135deg, ${mocha.green}, ${mocha.teal})`,
        color: mocha.crust,
        glow: mocha.green,
      }
    default:
      // beyond 2048 — keep the bright-green glow
      return {
        background: `linear-gradient(135deg, ${mocha.green}, ${mocha.teal})`,
        color: mocha.crust,
        glow: mocha.green,
      }
  }
}

function fontSizeFor(value: number, cell: number): number {
  const digits = String(value).length
  let frac = 0.42
  if (digits >= 4) frac = 0.3
  else if (digits === 3) frac = 0.36
  return Math.max(12, Math.round(cell * frac))
}

// ── Board helpers ────────────────────────────────────────────────────────────
function emptyPositions(tiles: Tile[]): number[] {
  const filled = new Set(tiles.map((t) => t.pos))
  const out: number[] = []
  for (let i = 0; i < CELLS; i++) if (!filled.has(i)) out.push(i)
  return out
}

function spawnTile(tiles: Tile[]): Tile[] {
  const empties = emptyPositions(tiles)
  if (empties.length === 0) return tiles
  const pos = empties[Math.floor(Math.random() * empties.length)]
  const value = Math.random() < 0.9 ? 2 : 4
  return [...tiles, { id: nextId(), value, pos, spawned: true }]
}

function newGameTiles(): Tile[] {
  return spawnTile(spawnTile([]))
}

// Build a 2D value+id grid from tiles for processing a move.
type Cell = { id: number; value: number } | null

function toGrid(tiles: Tile[]): Cell[][] {
  const grid: Cell[][] = Array.from({ length: SIZE }, () => Array<Cell>(SIZE).fill(null))
  for (const t of tiles) {
    const r = Math.floor(t.pos / SIZE)
    const c = t.pos % SIZE
    grid[r][c] = { id: t.id, value: t.value }
  }
  return grid
}

// Extract the four "lines" to process. Each line is ordered so index 0 is the
// edge the tiles slide toward, allowing one shared compress/merge routine.
function getLines(grid: Cell[][], dir: Dir): { coords: [number, number][]; cells: Cell[] }[] {
  const lines: { coords: [number, number][]; cells: Cell[] }[] = []
  for (let i = 0; i < SIZE; i++) {
    const coords: [number, number][] = []
    for (let j = 0; j < SIZE; j++) {
      let r: number
      let c: number
      if (dir === 'left') {
        r = i
        c = j
      } else if (dir === 'right') {
        r = i
        c = SIZE - 1 - j
      } else if (dir === 'up') {
        r = j
        c = i
      } else {
        r = SIZE - 1 - j
        c = i
      }
      coords.push([r, c])
    }
    lines.push({ coords, cells: coords.map(([r, c]) => grid[r][c]) })
  }
  return lines
}

// Compress + merge a single line toward index 0. Returns new cells (length SIZE)
// and points gained. Merges happen once per move per pair.
function collapseLine(cells: Cell[]): { result: Cell[]; gained: number } {
  const filled = cells.filter((c): c is { id: number; value: number } => c !== null)
  const out: Cell[] = []
  let gained = 0
  let i = 0
  while (i < filled.length) {
    if (i + 1 < filled.length && filled[i].value === filled[i + 1].value) {
      const mergedValue = filled[i].value * 2
      gained += mergedValue
      // Keep the first tile's id as the surviving merged tile.
      out.push({ id: filled[i].id, value: mergedValue })
      i += 2
    } else {
      out.push({ id: filled[i].id, value: filled[i].value })
      i += 1
    }
  }
  while (out.length < SIZE) out.push(null)
  return { result: out, gained }
}

function applyMove(tiles: Tile[], dir: Dir): MoveResult {
  const grid = toGrid(tiles)
  const lines = getLines(grid, dir)
  const mergedIds = new Set<number>()
  const survivors = new Map<number, Tile>()
  let gained = 0
  let moved = false
  let reached2048 = false

  for (const line of lines) {
    const before = line.cells
    const { result, gained: g } = collapseLine(before)
    gained += g
    // Detect movement: compare value/id at each slot of the line.
    for (let j = 0; j < SIZE; j++) {
      const b = before[j]
      const a = result[j]
      if ((b?.id ?? -1) !== (a?.id ?? -1) || (b?.value ?? 0) !== (a?.value ?? 0)) moved = true
    }
    // Whether a merge created a new value at a slot.
    const beforeIds = new Set(before.filter((c): c is { id: number; value: number } => c !== null).map((c) => c.id))
    for (let j = 0; j < SIZE; j++) {
      const a = result[j]
      if (!a) continue
      const [r, c] = line.coords[j]
      const pos = r * SIZE + c
      // a.id existed before; if its value changed it merged.
      const wasMerge = beforeIds.has(a.id) && before.find((x) => x?.id === a.id)?.value !== a.value
      if (wasMerge) mergedIds.add(a.id)
      if (a.value === 2048) reached2048 = true
      survivors.set(a.id, { id: a.id, value: a.value, pos, merged: wasMerge })
    }
  }

  const tilesOut = Array.from(survivors.values())
  return { tiles: tilesOut, gained, moved, reached2048 }
}

function hasMoves(tiles: Tile[]): boolean {
  if (tiles.length < CELLS) return true
  const grid = toGrid(tiles)
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const v = grid[r][c]?.value
      if (v === undefined) return true
      if (c + 1 < SIZE && grid[r][c + 1]?.value === v) return true
      if (r + 1 < SIZE && grid[r + 1][c]?.value === v) return true
    }
  }
  return false
}

export default function Game2048({ winId }: AppProps) {
  const isFocused = useWM((s) => s.focusedWindowId === winId)

  const [tiles, setTiles] = useState<Tile[]>(() => newGameTiles())
  const [score, setScore] = useState(0)
  const [best, setBest] = useState(0)
  const [won, setWon] = useState(false)
  const [keptPlaying, setKeptPlaying] = useState(false)
  const [over, setOver] = useState(false)

  // Persist best across the session whenever the score sets a new record.
  useEffect(() => {
    setBest((b) => (score > b ? score : b))
  }, [score])

  // While the win overlay is shown (and the player hasn't chosen "Keep going"),
  // moves should be blocked so clicks/keys behind the overlay don't slide tiles.
  const blocked = over || (won && !keptPlaying)

  // Refs for the keydown handler so we don't re-bind on every state change.
  const tilesRef = useRef(tiles)
  tilesRef.current = tiles
  const blockedRef = useRef(blocked)
  blockedRef.current = blocked

  const newGame = useCallback(() => {
    setTiles(newGameTiles())
    setScore(0)
    setWon(false)
    setKeptPlaying(false)
    setOver(false)
  }, [])

  const move = useCallback((dir: Dir) => {
    if (blockedRef.current) return
    const current = tilesRef.current
    const { tiles: moved, gained, moved: didMove, reached2048 } = applyMove(current, dir)
    if (!didMove) return
    const withSpawn = spawnTile(moved)
    setTiles(withSpawn)
    if (gained > 0) setScore((s) => s + gained)
    if (reached2048) setWon(true)
    if (!hasMoves(withSpawn)) setOver(true)
  }, [])

  const moveRef = useRef(move)
  moveRef.current = move

  // ── Keyboard control (only when this window is focused) ────────────────────
  useEffect(() => {
    if (!isFocused) return
    const onKey = (e: KeyboardEvent) => {
      if (!isFocused) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      let dir: Dir | null = null
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          dir = 'up'
          break
        case 'ArrowDown':
        case 's':
        case 'S':
          dir = 'down'
          break
        case 'ArrowLeft':
        case 'a':
        case 'A':
          dir = 'left'
          break
        case 'ArrowRight':
        case 'd':
        case 'D':
          dir = 'right'
          break
        case 'r':
        case 'R':
          e.preventDefault()
          newGame()
          return
        default:
          return
      }
      if (dir) {
        e.preventDefault()
        moveRef.current(dir)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isFocused, newGame])

  // ── Touch / pointer swipe ──────────────────────────────────────────────────
  const swipeStart = useRef<{ x: number; y: number } | null>(null)
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    swipeStart.current = { x: e.clientX, y: e.clientY }
  }, [])
  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      const start = swipeStart.current
      swipeStart.current = null
      if (!start) return
      const dx = e.clientX - start.x
      const dy = e.clientY - start.y
      const adx = Math.abs(dx)
      const ady = Math.abs(dy)
      const THRESHOLD = 24
      if (Math.max(adx, ady) < THRESHOLD) return
      if (adx > ady) moveRef.current(dx > 0 ? 'right' : 'left')
      else moveRef.current(dy > 0 ? 'down' : 'up')
    },
    []
  )

  // ── Layout sizing: a responsive square board that fits the window ──────────
  const boardWrapRef = useRef<HTMLDivElement>(null)
  const [boardPx, setBoardPx] = useState(360)
  useEffect(() => {
    const el = boardWrapRef.current
    if (!el) return
    const update = () => {
      const w = el.clientWidth
      const h = el.clientHeight
      const s = Math.max(160, Math.min(w, h) - 4)
      setBoardPx(s)
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const GAP = useMemo(() => Math.max(6, Math.round(boardPx * 0.025)), [boardPx])
  const PAD = GAP
  const cellSize = useMemo(() => (boardPx - PAD * 2 - GAP * (SIZE - 1)) / SIZE, [boardPx, PAD, GAP])

  const posToXY = useCallback(
    (pos: number) => {
      const r = Math.floor(pos / SIZE)
      const c = pos % SIZE
      return {
        x: PAD + c * (cellSize + GAP),
        y: PAD + r * (cellSize + GAP),
      }
    },
    [PAD, cellSize, GAP]
  )

  const showOverlay = blocked

  // Background grid cells (static slots).
  const slots = useMemo(() => Array.from({ length: CELLS }, (_, i) => i), [])

  return (
    <div className="flex h-full w-full flex-col overflow-auto bg-base text-text">
      {/* HUD */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-surface0 bg-mantle px-4 py-3">
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-2xl font-bold text-green">2048</span>
          <span className="hidden text-xs text-subtext0 sm:inline">slide &amp; merge</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex min-w-[68px] flex-col items-center rounded-lg border border-surface0 bg-surface0 px-3 py-1">
            <span className="text-[10px] uppercase tracking-wider text-subtext0">Score</span>
            <span className="font-mono text-lg font-bold text-text">{score}</span>
          </div>
          <div className="flex min-w-[68px] flex-col items-center rounded-lg border border-surface0 bg-surface0 px-3 py-1">
            <span className="text-[10px] uppercase tracking-wider text-subtext0">Best</span>
            <span className="font-mono text-lg font-bold text-teal">{best}</span>
          </div>
          <button
            type="button"
            onClick={newGame}
            className="rounded-lg border border-surface1 bg-blue px-3 py-2 font-mono text-sm font-bold text-crust transition-colors hover:bg-sapphire"
          >
            New Game
          </button>
        </div>
      </div>

      {/* Play area */}
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 p-3">
        <div ref={boardWrapRef} className="flex min-h-0 w-full max-w-[520px] flex-1 items-center justify-center">
          <div
            className="relative select-none rounded-2xl border border-surface0 bg-mantle"
            style={{ width: boardPx, height: boardPx, touchAction: 'none' }}
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
          >
            {/* static slots */}
            {slots.map((i) => {
              const { x, y } = posToXY(i)
              return (
                <div
                  key={`slot-${i}`}
                  className="absolute rounded-lg bg-surface0"
                  style={{ left: x, top: y, width: cellSize, height: cellSize }}
                />
              )
            })}

            {/* tiles */}
            <AnimatePresence>
              {tiles.map((t) => {
                const { x, y } = posToXY(t.pos)
                const st = tileStyle(t.value)
                return (
                  <motion.div
                    key={t.id}
                    className="absolute flex items-center justify-center rounded-lg font-mono font-bold"
                    initial={t.spawned ? { scale: 0 } : false}
                    animate={{
                      x,
                      y,
                      scale: t.merged ? [1, 1.12, 1] : 1,
                    }}
                    transition={{
                      x: { type: 'spring', stiffness: 520, damping: 38 },
                      y: { type: 'spring', stiffness: 520, damping: 38 },
                      scale: { duration: 0.18 },
                    }}
                    style={{
                      left: 0,
                      top: 0,
                      width: cellSize,
                      height: cellSize,
                      background: st.background,
                      color: st.color,
                      fontSize: fontSizeFor(t.value, cellSize),
                      boxShadow: st.glow ? `0 0 18px ${st.glow}88, 0 0 4px ${st.glow}` : undefined,
                    }}
                  >
                    {t.value}
                  </motion.div>
                )
              })}
            </AnimatePresence>

            {/* Overlay: win / game over */}
            {showOverlay && (
              <div
                className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 rounded-2xl backdrop-blur-sm"
                style={{ background: 'rgba(17,17,27,0.78)' }}
              >
                {over ? (
                  <>
                    <span className="font-mono text-3xl font-bold text-red">Game Over</span>
                    <span className="font-mono text-sm text-subtext1">Score: {score}</span>
                    <button
                      type="button"
                      onClick={newGame}
                      className="rounded-lg border border-surface1 bg-blue px-5 py-2 font-mono text-sm font-bold text-crust transition-colors hover:bg-sapphire"
                    >
                      Restart
                    </button>
                  </>
                ) : (
                  <>
                    <span className="font-mono text-3xl font-bold text-green">You Win!</span>
                    <span className="font-mono text-sm text-subtext1">You reached 2048</span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setKeptPlaying(true)}
                        className="rounded-lg border border-surface1 bg-teal px-5 py-2 font-mono text-sm font-bold text-crust transition-colors hover:bg-green"
                      >
                        Keep going
                      </button>
                      <button
                        type="button"
                        onClick={newGame}
                        className="rounded-lg border border-surface1 bg-surface1 px-5 py-2 font-mono text-sm font-bold text-text transition-colors hover:bg-surface2"
                      >
                        Restart
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* On-screen D-pad controls (mouse / touch) */}
        <div className="flex flex-col items-center gap-1.5 pb-1">
          <DPadButton label="up" onClick={() => move('up')} />
          <div className="flex gap-1.5">
            <DPadButton label="left" onClick={() => move('left')} />
            <DPadButton label="down" onClick={() => move('down')} />
            <DPadButton label="right" onClick={() => move('right')} />
          </div>
          <span className="mt-1 text-[11px] text-subtext0">
            Arrow keys / WASD, swipe, or buttons. Press R to restart.
          </span>
        </div>
      </div>
    </div>
  )
}

function DPadButton({ label, onClick }: { label: Dir; onClick: () => void }) {
  const arrow = label === 'up' ? '▲' : label === 'down' ? '▼' : label === 'left' ? '◀' : '▶'
  return (
    <button
      type="button"
      aria-label={`move ${label}`}
      onClick={onClick}
      className="flex h-11 w-11 items-center justify-center rounded-lg border border-surface0 bg-surface0 text-text transition-colors hover:bg-surface1 active:bg-blue active:text-crust"
    >
      <span className="text-sm leading-none">{arrow}</span>
    </button>
  )
}
