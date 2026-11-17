import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { AppProps } from './types'
import { mocha } from '../theme/catppuccin'
import { useWM } from '../store/wm'

// ─────────────────────────────────────────────────────────────────────────────
// Snake — classic arcade game on a canvas. Green snake, blue/teal food.
// Arrow keys + WASD steer; on-screen D-pad for mouse/touch. Pauses when the
// window loses focus. High score persisted to localStorage (best-effort).
// ─────────────────────────────────────────────────────────────────────────────

const COLS = 17
const ROWS = 17
const BASE_MS = 130 // starting tick interval
const MIN_MS = 65 // fastest the snake ever gets
const HS_KEY = 'portfolio.snake.highscore'

type Dir = 'up' | 'down' | 'left' | 'right'
type Cell = { x: number; y: number }
type Phase = 'idle' | 'playing' | 'over'

const DELTA: Record<Dir, Cell> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
}

const OPPOSITE: Record<Dir, Dir> = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
}

function initialSnake(): Cell[] {
  const cy = Math.floor(ROWS / 2)
  const cx = Math.floor(COLS / 2)
  // length 3, heading right (head first)
  return [
    { x: cx, y: cy },
    { x: cx - 1, y: cy },
    { x: cx - 2, y: cy },
  ]
}

function randomFood(snake: Cell[]): Cell {
  const occupied = new Set(snake.map((c) => `${c.x},${c.y}`))
  const free: Cell[] = []
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (!occupied.has(`${x},${y}`)) free.push({ x, y })
    }
  }
  if (free.length === 0) return { x: 0, y: 0 } // board full (win-ish)
  return free[Math.floor(Math.random() * free.length)]
}

function loadHighScore(): number {
  try {
    const raw = localStorage.getItem(HS_KEY)
    const n = raw ? parseInt(raw, 10) : 0
    return Number.isFinite(n) && n > 0 ? n : 0
  } catch {
    return 0
  }
}

function saveHighScore(n: number): void {
  try {
    localStorage.setItem(HS_KEY, String(n))
  } catch {
    /* ignore (private mode / disabled storage) */
  }
}

export default function Snake({ winId }: AppProps) {
  const isFocused = useWM((s) => s.focusedWindowId === winId)

  // Game state (React for rendering HUD/overlays)
  const [phase, setPhase] = useState<Phase>('idle')
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState<number>(() => loadHighScore())

  // Mutable game state (refs so the tick loop reads the latest without re-binding)
  const snakeRef = useRef<Cell[]>(initialSnake())
  const dirRef = useRef<Dir>('right')
  const pendingDirRef = useRef<Dir>('right') // next direction applied at tick
  const foodRef = useRef<Cell>(randomFood(snakeRef.current))
  const scoreRef = useRef(0)
  const phaseRef = useRef<Phase>('idle')

  // Canvas / sizing
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const [side, setSide] = useState(0) // pixel side length of the square board
  const loopRef = useRef<number | null>(null)

  // Keep phaseRef synced with phase state.
  useEffect(() => {
    phaseRef.current = phase
  }, [phase])

  // ── Rendering ──────────────────────────────────────────────────────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || side <= 0) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2))
    const pxSide = Math.floor(side * dpr)
    if (canvas.width !== pxSide || canvas.height !== pxSide) {
      canvas.width = pxSide
      canvas.height = pxSide
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    const cell = side / COLS

    // Board background
    ctx.fillStyle = mocha.crust
    ctx.fillRect(0, 0, side, side)

    // Subtle grid lines
    ctx.strokeStyle = mocha.surface0
    ctx.lineWidth = 1
    ctx.globalAlpha = 0.6
    for (let i = 1; i < COLS; i++) {
      const p = Math.round(i * cell) + 0.5
      ctx.beginPath()
      ctx.moveTo(p, 0)
      ctx.lineTo(p, side)
      ctx.stroke()
    }
    for (let i = 1; i < ROWS; i++) {
      const p = Math.round(i * cell) + 0.5
      ctx.beginPath()
      ctx.moveTo(0, p)
      ctx.lineTo(side, p)
      ctx.stroke()
    }
    ctx.globalAlpha = 1

    const pad = Math.max(1, cell * 0.08)
    const r = Math.max(2, cell * 0.22)

    const roundRect = (x: number, y: number, w: number, h: number, rad: number) => {
      const rr = Math.min(rad, w / 2, h / 2)
      ctx.beginPath()
      ctx.moveTo(x + rr, y)
      ctx.arcTo(x + w, y, x + w, y + h, rr)
      ctx.arcTo(x + w, y + h, x, y + h, rr)
      ctx.arcTo(x, y + h, x, y, rr)
      ctx.arcTo(x, y, x + w, y, rr)
      ctx.closePath()
    }

    // Food (pulsing blue/sky dot)
    const food = foodRef.current
    const fx = food.x * cell
    const fy = food.y * cell
    ctx.fillStyle = mocha.blue
    ctx.shadowColor = mocha.sky
    ctx.shadowBlur = cell * 0.4
    roundRect(fx + pad * 1.5, fy + pad * 1.5, cell - pad * 3, cell - pad * 3, r)
    ctx.fill()
    ctx.shadowBlur = 0

    // Snake body (tail -> head) so the head draws on top.
    const snake = snakeRef.current
    for (let i = snake.length - 1; i >= 0; i--) {
      const seg = snake[i]
      const isHead = i === 0
      ctx.fillStyle = isHead ? mocha.teal : mocha.green
      if (isHead) {
        ctx.shadowColor = mocha.teal
        ctx.shadowBlur = cell * 0.35
      }
      roundRect(seg.x * cell + pad, seg.y * cell + pad, cell - pad * 2, cell - pad * 2, r)
      ctx.fill()
      ctx.shadowBlur = 0
    }
  }, [side])

  // Redraw whenever sizing changes.
  useEffect(() => {
    draw()
  }, [draw])

  // ── Responsive board sizing ─────────────────────────────────────────────────
  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const compute = () => {
      const w = el.clientWidth
      const h = el.clientHeight
      const s = Math.max(0, Math.floor(Math.min(w, h)) - 2)
      setSide(s)
    }
    compute()
    const ro = new ResizeObserver(compute)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // ── Direction control ────────────────────────────────────────────────────────
  const setDirection = useCallback((d: Dir) => {
    // Disallow 180° reversal relative to the committed direction.
    if (d === OPPOSITE[dirRef.current]) return
    pendingDirRef.current = d
  }, [])

  const startGame = useCallback(() => {
    snakeRef.current = initialSnake()
    dirRef.current = 'right'
    pendingDirRef.current = 'right'
    foodRef.current = randomFood(snakeRef.current)
    scoreRef.current = 0
    setScore(0)
    setPhase('playing')
    // Paint the fresh board immediately so the new snake/food show without
    // waiting for the first tick (otherwise the previous board lingers ~1 tick).
    draw()
  }, [draw])

  // A control press: start if idle/over, otherwise steer.
  const handleControl = useCallback(
    (d: Dir) => {
      if (phaseRef.current !== 'playing') {
        startGame()
        // Snake spawns heading right; ignore an instant 'left' reversal, else honor it.
        if (d !== 'left') pendingDirRef.current = d
        return
      }
      setDirection(d)
    },
    [setDirection, startGame],
  )

  // ── The game tick ────────────────────────────────────────────────────────────
  const tick = useCallback(() => {
    if (phaseRef.current !== 'playing') return

    const dir = pendingDirRef.current
    // Final guard against reversal (in case two presses happened in one frame).
    if (dir !== OPPOSITE[dirRef.current]) {
      dirRef.current = dir
    }
    const d = dirRef.current
    const snake = snakeRef.current
    const head = snake[0]
    const next: Cell = { x: head.x + DELTA[d].x, y: head.y + DELTA[d].y }

    // Wall collision
    if (next.x < 0 || next.x >= COLS || next.y < 0 || next.y >= ROWS) {
      endGame()
      return
    }

    const ate = next.x === foodRef.current.x && next.y === foodRef.current.y

    // Self collision. The tail cell is vacated this move (unless we just ate),
    // so colliding with the last segment is allowed when not eating.
    const checkLen = ate ? snake.length : snake.length - 1
    for (let i = 0; i < checkLen; i++) {
      if (snake[i].x === next.x && snake[i].y === next.y) {
        endGame()
        return
      }
    }

    const newSnake = [next, ...snake]
    if (ate) {
      foodRef.current = randomFood(newSnake)
      scoreRef.current += 1
      setScore(scoreRef.current)
    } else {
      newSnake.pop()
    }
    snakeRef.current = newSnake
    draw()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draw])

  const endGame = useCallback(() => {
    setPhase('over')
    setHighScore((prev) => {
      const best = Math.max(prev, scoreRef.current)
      if (best > prev) saveHighScore(best)
      return best
    })
  }, [])

  // ── Loop management: speed scales with score; pause when unfocused ──────────────
  const intervalMs = useMemo(() => {
    const sp = Math.max(MIN_MS, BASE_MS - score * 4)
    return sp
  }, [score])

  useEffect(() => {
    const clear = () => {
      if (loopRef.current !== null) {
        clearInterval(loopRef.current)
        loopRef.current = null
      }
    }
    clear()
    if (phase === 'playing' && isFocused) {
      loopRef.current = window.setInterval(tick, intervalMs)
    }
    return clear
  }, [phase, isFocused, intervalMs, tick])

  // ── Keyboard ──────────────────────────────────────────────────────────────────
  useEffect(() => {
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
        case ' ':
        case 'Enter':
          if (phaseRef.current !== 'playing') {
            e.preventDefault()
            startGame()
          }
          return
        default:
          return
      }

      e.preventDefault()
      handleControl(dir)
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isFocused, handleControl, startGame])

  // ── UI ────────────────────────────────────────────────────────────────────────
  const dpadBtn =
    'flex items-center justify-center rounded-md bg-surface0 border border-surface1 text-text ' +
    'active:bg-surface1 hover:bg-surface1 transition-colors select-none touch-none'

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-base text-text">
      {/* HUD */}
      <div className="flex items-center justify-between gap-2 border-b border-surface0 bg-mantle px-3 py-2 font-mono text-sm">
        <div className="flex items-center gap-3">
          <span className="text-teal">snake</span>
          <span className="text-subtext1">
            score <span className="text-green">{score}</span>
          </span>
          <span className="text-subtext0">
            best <span className="text-sky">{highScore}</span>
          </span>
        </div>
        <button
          type="button"
          onClick={startGame}
          className="rounded-md border border-surface1 bg-surface0 px-3 py-1 text-xs text-text transition-colors hover:bg-surface1 active:bg-surface1"
        >
          New game
        </button>
      </div>

      {/* Board area */}
      <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto p-3">
        <div className="flex flex-col items-center gap-3">
          <div ref={wrapRef} className="relative flex aspect-square w-full max-w-[min(70vh,520px)] items-center justify-center">
            <div className="relative" style={{ width: side || undefined, height: side || undefined }}>
              <canvas
                ref={canvasRef}
                onClick={() => {
                  if (phaseRef.current !== 'playing') startGame()
                }}
                className="block rounded-md border border-surface0"
                style={{ width: side, height: side }}
              />

              {/* Start overlay */}
              {phase === 'idle' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center rounded-md bg-crust/80 px-4 text-center backdrop-blur-sm">
                  <div className="mb-1 font-mono text-lg text-teal">Snake</div>
                  <div className="mb-4 max-w-[16rem] text-sm text-subtext1">
                    Press an arrow key (or WASD) or tap a control to start.
                  </div>
                  <button
                    type="button"
                    onClick={startGame}
                    className="rounded-md border border-surface1 bg-surface0 px-4 py-1.5 font-mono text-sm text-green transition-colors hover:bg-surface1"
                  >
                    Start
                  </button>
                </div>
              )}

              {/* Game over overlay */}
              {phase === 'over' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center rounded-md bg-crust/85 px-4 text-center backdrop-blur-sm">
                  <div className="mb-1 font-mono text-lg text-red">Game over</div>
                  <div className="mb-1 font-mono text-sm text-subtext1">
                    score <span className="text-green">{score}</span>
                  </div>
                  {score >= highScore && score > 0 && (
                    <div className="mb-3 font-mono text-xs text-sky">new best!</div>
                  )}
                  <button
                    type="button"
                    onClick={startGame}
                    className="mt-2 rounded-md border border-surface1 bg-surface0 px-4 py-1.5 font-mono text-sm text-green transition-colors hover:bg-surface1"
                  >
                    Restart
                  </button>
                </div>
              )}

              {/* Paused (focus lost while playing) hint */}
              {phase === 'playing' && !isFocused && (
                <div className="absolute inset-0 flex items-center justify-center rounded-md bg-crust/70 backdrop-blur-sm">
                  <span className="font-mono text-sm text-subtext1">paused — click to resume</span>
                </div>
              )}
            </div>
          </div>

          {/* On-screen D-pad */}
          <div className="grid grid-cols-3 grid-rows-3 gap-1.5" style={{ width: 156 }}>
            <span />
            <button
              type="button"
              aria-label="Up"
              className={dpadBtn}
              style={{ height: 44 }}
              onClick={() => handleControl('up')}
            >
              <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="m6 14 6-6 6 6" />
              </svg>
            </button>
            <span />

            <button
              type="button"
              aria-label="Left"
              className={dpadBtn}
              style={{ height: 44 }}
              onClick={() => handleControl('left')}
            >
              <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="m14 6-6 6 6 6" />
              </svg>
            </button>
            <button
              type="button"
              aria-label="New game"
              className="flex items-center justify-center rounded-md bg-surface0 border border-surface1 text-subtext0 hover:bg-surface1 active:bg-surface1 transition-colors select-none"
              style={{ height: 44 }}
              onClick={startGame}
            >
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12a9 9 0 1 1-2.64-6.36" />
                <path d="M21 3v5h-5" />
              </svg>
            </button>
            <button
              type="button"
              aria-label="Right"
              className={dpadBtn}
              style={{ height: 44 }}
              onClick={() => handleControl('right')}
            >
              <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="m10 6 6 6-6 6" />
              </svg>
            </button>

            <span />
            <button
              type="button"
              aria-label="Down"
              className={dpadBtn}
              style={{ height: 44 }}
              onClick={() => handleControl('down')}
            >
              <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="m6 10 6 6 6-6" />
              </svg>
            </button>
            <span />
          </div>
        </div>
      </div>
    </div>
  )
}
