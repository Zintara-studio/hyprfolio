import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { AppProps } from './types'
import { mocha } from '../theme/catppuccin'
import { useWM } from '../store/wm'

// ─────────────────────────────────────────────────────────────────────────────
// Conway's Game of Life — interactive cellular automaton on a toroidal grid.
// Canvas-rendered for performance; click/drag to paint; Play/Pause/Step/Clear/
// Random + speed slider. Standard B3/S23 rules with wrap-around edges.
// ─────────────────────────────────────────────────────────────────────────────

const COLS = 48
const ROWS = 30
const CELL_PX = 16 // logical cell size; canvas scales to fit container

const hyprShadow = '0 8px 24px 0 rgba(6, 23, 27, 0.55)'

// Parse the live-theme accents once so alive cells tint blue → green.
const ALIVE_FROM = mocha.blue // '#4f9cf6'
const ALIVE_TO = mocha.green // '#43e08f'
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ]
}
const ALIVE_FROM_RGB = hexToRgb(ALIVE_FROM)
const ALIVE_TO_RGB = hexToRgb(ALIVE_TO)

type Grid = Uint8Array // length COLS*ROWS, 1 = alive

const idx = (x: number, y: number) => y * COLS + x

function emptyGrid(): Grid {
  return new Uint8Array(COLS * ROWS)
}

function randomGrid(p = 0.25): Grid {
  const g = emptyGrid()
  for (let i = 0; i < g.length; i++) g[i] = Math.random() < p ? 1 : 0
  return g
}

// Seed pattern: a glider sailing across plus a small "pulsar-ish" scatter so the
// board is alive and obviously dynamic on open.
function seedGrid(): Grid {
  const g = emptyGrid()
  const set = (x: number, y: number) => {
    const xx = ((x % COLS) + COLS) % COLS
    const yy = ((y % ROWS) + ROWS) % ROWS
    g[idx(xx, yy)] = 1
  }
  // Glider (top-left, moving down-right)
  const glider: Array<[number, number]> = [
    [1, 0],
    [2, 1],
    [0, 2],
    [1, 2],
    [2, 2],
  ]
  glider.forEach(([x, y]) => set(x + 2, y + 2))

  // Lightweight spaceship (LWSS) — travels horizontally
  const lwss: Array<[number, number]> = [
    [1, 0],
    [4, 0],
    [0, 1],
    [0, 2],
    [4, 2],
    [0, 3],
    [1, 3],
    [2, 3],
    [3, 3],
  ]
  lwss.forEach(([x, y]) => set(x + 30, y + 6))

  // Blinker oscillator
  ;[[8, 20], [9, 20], [10, 20]].forEach(([x, y]) => set(x, y))

  // Pulsar quadrant scatter for a pleasant texture
  const pulsar: Array<[number, number]> = [
    [2, 0],
    [3, 0],
    [4, 0],
    [0, 2],
    [5, 2],
    [0, 3],
    [5, 3],
    [0, 4],
    [5, 4],
    [2, 5],
    [3, 5],
    [4, 5],
  ]
  pulsar.forEach(([x, y]) => set(x + 18, y + 18))

  return g
}

// One generation step with toroidal (wrap-around) neighbours. Returns new grid.
function step(g: Grid): Grid {
  const next = emptyGrid()
  for (let y = 0; y < ROWS; y++) {
    const yUp = (y - 1 + ROWS) % ROWS
    const yDn = (y + 1) % ROWS
    for (let x = 0; x < COLS; x++) {
      const xL = (x - 1 + COLS) % COLS
      const xR = (x + 1) % COLS
      const n =
        g[idx(xL, yUp)] +
        g[idx(x, yUp)] +
        g[idx(xR, yUp)] +
        g[idx(xL, y)] +
        g[idx(xR, y)] +
        g[idx(xL, yDn)] +
        g[idx(x, yDn)] +
        g[idx(xR, yDn)]
      const alive = g[idx(x, y)] === 1
      next[idx(x, y)] = alive ? (n === 2 || n === 3 ? 1 : 0) : n === 3 ? 1 : 0
    }
  }
  return next
}

function countAlive(g: Grid): number {
  let c = 0
  for (let i = 0; i < g.length; i++) c += g[i]
  return c
}

export default function GameOfLife({ winId }: AppProps) {
  const isFocused = useWM((s) => s.focusedWindowId === winId)

  const [grid, setGrid] = useState<Grid>(() => seedGrid())
  const [running, setRunning] = useState(true)
  const [gen, setGen] = useState(0)
  const [speed, setSpeed] = useState(120) // ms per generation
  // Derive the live-cell count from the grid so it can never desync.
  const alive = useMemo(() => countAlive(grid), [grid])

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const tickRef = useRef<number | null>(null)
  const paintingRef = useRef(false)
  const paintValRef = useRef<0 | 1>(1) // what we paint while dragging
  const lastCellRef = useRef<number>(-1)
  const [cssSize, setCssSize] = useState<{ w: number; h: number }>({
    w: COLS * CELL_PX,
    h: ROWS * CELL_PX,
  })

  // ── Simulation interval ────────────────────────────────────────────────────
  useEffect(() => {
    if (!running) return
    tickRef.current = window.setInterval(() => {
      setGrid((g) => step(g))
      setGen((n) => n + 1)
    }, speed)
    return () => {
      if (tickRef.current !== null) {
        clearInterval(tickRef.current)
        tickRef.current = null
      }
    }
  }, [running, speed])

  // ── Responsive sizing: keep aspect ratio, fit within wrapper ───────────────
  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const compute = () => {
      const pad = 8
      const aw = Math.max(0, el.clientWidth - pad)
      const ah = Math.max(0, el.clientHeight - pad)
      const aspect = COLS / ROWS
      let w = aw
      let h = w / aspect
      if (h > ah) {
        h = ah
        w = h * aspect
      }
      setCssSize({ w: Math.max(120, Math.floor(w)), h: Math.max(75, Math.floor(h)) })
    }
    compute()
    const ro = new ResizeObserver(compute)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // ── Canvas draw ────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const pxW = Math.floor(cssSize.w * dpr)
    const pxH = Math.floor(cssSize.h * dpr)
    if (canvas.width !== pxW) canvas.width = pxW
    if (canvas.height !== pxH) canvas.height = pxH

    const cw = cssSize.w / COLS
    const ch = cssSize.h / ROWS

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    // Dead background
    ctx.fillStyle = mocha.crust
    ctx.fillRect(0, 0, cssSize.w, cssSize.h)

    // Grid lines (faint)
    ctx.strokeStyle = mocha.surface0
    ctx.lineWidth = 1
    ctx.globalAlpha = 0.5
    ctx.beginPath()
    for (let x = 0; x <= COLS; x++) {
      const gx = Math.round(x * cw) + 0.5
      ctx.moveTo(gx, 0)
      ctx.lineTo(gx, cssSize.h)
    }
    for (let y = 0; y <= ROWS; y++) {
      const gy = Math.round(y * ch) + 0.5
      ctx.moveTo(0, gy)
      ctx.lineTo(cssSize.w, gy)
    }
    ctx.stroke()
    ctx.globalAlpha = 1

    // Alive cells: blue→green tint by column, with a soft glow
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        if (grid[idx(x, y)] !== 1) continue
        const t = COLS > 1 ? x / (COLS - 1) : 0
        // Lerp between the live theme's blue and green for an on-theme tint.
        const r = Math.round(ALIVE_FROM_RGB[0] + (ALIVE_TO_RGB[0] - ALIVE_FROM_RGB[0]) * t)
        const gC = Math.round(ALIVE_FROM_RGB[1] + (ALIVE_TO_RGB[1] - ALIVE_FROM_RGB[1]) * t)
        const b = Math.round(ALIVE_FROM_RGB[2] + (ALIVE_TO_RGB[2] - ALIVE_FROM_RGB[2]) * t)
        const fill = `rgb(${r}, ${gC}, ${b})`
        const px = x * cw
        const py = y * ch
        ctx.fillStyle = fill
        ctx.shadowColor = fill
        ctx.shadowBlur = Math.min(cw, ch) * 0.6
        ctx.fillRect(px + 0.8, py + 0.8, cw - 1.6, ch - 1.6)
      }
    }
    ctx.shadowBlur = 0
  }, [grid, cssSize])

  // ── Pointer painting (toggle on tap, drag to paint) ────────────────────────
  const cellFromEvent = useCallback(
    (clientX: number, clientY: number): number => {
      const canvas = canvasRef.current
      if (!canvas) return -1
      const rect = canvas.getBoundingClientRect()
      const cw = rect.width / COLS
      const ch = rect.height / ROWS
      const x = Math.floor((clientX - rect.left) / cw)
      const y = Math.floor((clientY - rect.top) / ch)
      if (x < 0 || x >= COLS || y < 0 || y >= ROWS) return -1
      return idx(x, y)
    },
    [],
  )

  const paintCell = useCallback((cellIdx: number, val: 0 | 1) => {
    if (cellIdx < 0) return
    setGrid((g) => {
      if (g[cellIdx] === val) return g
      const next = g.slice() as Grid
      next[cellIdx] = val
      return next
    })
  }, [])

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      e.preventDefault()
      const cellIdx = cellFromEvent(e.clientX, e.clientY)
      if (cellIdx < 0) return
      paintingRef.current = true
      lastCellRef.current = cellIdx
      // Decide paint value from current cell state: toggle it, then continue
      // painting that same value while dragging.
      const current = grid[cellIdx]
      const val: 0 | 1 = current === 1 ? 0 : 1
      paintValRef.current = val
      paintCell(cellIdx, val)
      try {
        ;(e.target as HTMLCanvasElement).setPointerCapture(e.pointerId)
      } catch {
        /* noop */
      }
    },
    [cellFromEvent, grid, paintCell],
  )

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!paintingRef.current) return
      const cellIdx = cellFromEvent(e.clientX, e.clientY)
      if (cellIdx < 0 || cellIdx === lastCellRef.current) return
      lastCellRef.current = cellIdx
      paintCell(cellIdx, paintValRef.current)
    },
    [cellFromEvent, paintCell],
  )

  const endPaint = useCallback(() => {
    paintingRef.current = false
    lastCellRef.current = -1
  }, [])

  // ── Controls ───────────────────────────────────────────────────────────────
  const doStep = useCallback(() => {
    setGrid((g) => step(g))
    setGen((n) => n + 1)
  }, [])

  const doClear = useCallback(() => {
    setRunning(false)
    setGrid(emptyGrid())
    setGen(0)
  }, [])

  const doRandom = useCallback(() => {
    setGrid(randomGrid(0.25))
    setGen(0)
  }, [])

  const doReset = useCallback(() => {
    setGrid(seedGrid())
    setGen(0)
    setRunning(true)
  }, [])

  const togglePlay = useCallback(() => setRunning((r) => !r), [])

  // ── Keyboard (only when focused) ───────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!isFocused) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      switch (e.key) {
        case ' ':
          e.preventDefault()
          togglePlay()
          break
        case 'ArrowRight':
        case 's':
        case 'S':
          e.preventDefault()
          if (!running) doStep()
          break
        case 'c':
        case 'C':
          e.preventDefault()
          doClear()
          break
        case 'r':
        case 'R':
          e.preventDefault()
          doRandom()
          break
        default:
          break
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isFocused, running, togglePlay, doStep, doClear, doRandom])

  const speedLabel = useMemo(() => `${speed}ms`, [speed])

  const btnBase =
    'rounded-md px-3 py-1.5 text-xs font-mono transition-colors border border-surface0 select-none'

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-base text-text">
      {/* HUD / Controls bar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-surface0 bg-mantle px-3 py-2">
        <button
          type="button"
          onClick={togglePlay}
          className={`${btnBase} ${
            running ? 'bg-surface0 text-peach' : 'bg-surface0 text-green'
          } hover:bg-surface1`}
          aria-pressed={running}
        >
          {running ? '⏸ Pause' : '▶ Play'}
        </button>
        <button
          type="button"
          onClick={doStep}
          disabled={running}
          className={`${btnBase} bg-surface0 text-blue hover:bg-surface1 disabled:opacity-40 disabled:cursor-not-allowed`}
        >
          ⏭ Step
        </button>
        <button
          type="button"
          onClick={doClear}
          className={`${btnBase} bg-surface0 text-subtext1 hover:bg-surface1`}
        >
          ✕ Clear
        </button>
        <button
          type="button"
          onClick={doRandom}
          className={`${btnBase} bg-surface0 text-teal hover:bg-surface1`}
        >
          ⚄ Random
        </button>
        <button
          type="button"
          onClick={doReset}
          className={`${btnBase} bg-surface0 text-sky hover:bg-surface1`}
        >
          ↺ Reset
        </button>

        {/* Speed slider */}
        <label className="ml-1 flex items-center gap-2 text-xs font-mono text-subtext0">
          <span className="hidden sm:inline">Speed</span>
          <input
            type="range"
            min={60}
            max={600}
            step={20}
            // Invert so dragging right = faster
            value={660 - speed}
            onChange={(e) => setSpeed(660 - Number(e.target.value))}
            className="h-1.5 w-24 cursor-pointer accent-blue"
            aria-label="Simulation speed"
          />
          <span className="w-12 tabular-nums text-overlay1">{speedLabel}</span>
        </label>

        {/* Counters */}
        <div className="ml-auto flex items-center gap-3 font-mono text-xs">
          <span className="rounded-md border border-surface0 bg-surface0/60 px-2 py-1">
            <span className="text-overlay1">gen</span>{' '}
            <span className="tabular-nums text-blue">{gen}</span>
          </span>
          <span className="rounded-md border border-surface0 bg-surface0/60 px-2 py-1">
            <span className="text-overlay1">alive</span>{' '}
            <span className="tabular-nums text-green">{alive}</span>
          </span>
        </div>
      </div>

      {/* Play area */}
      <div
        ref={wrapRef}
        className="relative flex min-h-0 flex-1 items-center justify-center overflow-auto p-1"
      >
        <canvas
          ref={canvasRef}
          width={cssSize.w}
          height={cssSize.h}
          style={{
            width: cssSize.w,
            height: cssSize.h,
            touchAction: 'none',
            borderRadius: 8,
            boxShadow: `0 0 0 1px ${mocha.surface0}, ${hyprShadow}`,
            cursor: 'crosshair',
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endPaint}
          onPointerLeave={endPaint}
          onPointerCancel={endPaint}
        />
      </div>

      {/* Hint line */}
      <div className="border-t border-surface0 bg-mantle px-3 py-1.5 text-center font-mono text-[11px] text-overlay1">
        click / drag to draw{' '}
        <span className="text-surface2">·</span> <span className="text-blue">Space</span> play/pause{' '}
        <span className="text-surface2">·</span> <span className="text-blue">S</span>/→ step{' '}
        <span className="text-surface2">·</span> <span className="text-blue">R</span> random{' '}
        <span className="text-surface2">·</span> <span className="text-blue">C</span> clear{' '}
        <span className="text-surface2">·</span> toroidal {COLS}×{ROWS}
      </div>
    </div>
  )
}
