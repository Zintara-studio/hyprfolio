// The desktop "stage": measures itself, derives tiling geometry from the active
// workspace's window order, and renders each window with framer-motion so the
// dwindle reflow, open/close pops, workspace slide and floating drag all animate.
import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useDragControls, useMotionValue, type PanInfo } from 'framer-motion'
import { useWM, type WMWindow } from '../store/wm'
import { computeLayout, type Rect } from '../lib/tiling'
import { APPS } from '../apps/registry'
import { WindowChrome } from './Window'
import { GridIcon } from './icons'

function AppContent({ win }: { win: WMWindow }) {
  const Comp = APPS[win.appId].component
  return <Comp winId={win.id} />
}

function TiledWindow({ win, rect, focused }: { win: WMWindow; rect?: Rect; focused: boolean }) {
  if (!rect) return null
  return (
    <motion.div
      className="absolute top-0 left-0"
      style={{ zIndex: focused ? 50 : 10 }}
      initial={{ x: rect.x, y: rect.y, width: rect.w, height: rect.h, opacity: 0, scale: 0.95 }}
      animate={{ x: rect.x, y: rect.y, width: rect.w, height: rect.h, opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92 }}
      transition={{
        type: 'spring',
        stiffness: 360,
        damping: 32,
        opacity: { duration: 0.18 },
        scale: { duration: 0.18 },
      }}
    >
      <WindowChrome win={win} focused={focused}>
        <AppContent win={win} />
      </WindowChrome>
    </motion.div>
  )
}

function FloatingWindow({ win, focused, z, bounds }: { win: WMWindow; focused: boolean; z: number; bounds: { w: number; h: number } }) {
  const setFloatRect = useWM((s) => s.setFloatRect)
  // 520 tall so the Contact card's CTAs aren't clipped below the fold.
  const float = win.float ?? { x: 120, y: 90, w: 600, h: 520 }
  const x = useMotionValue(float.x)
  const y = useMotionValue(float.y)
  const controls = useDragControls()

  useEffect(() => {
    x.set(float.x)
    y.set(float.y)
  }, [float.x, float.y, x, y])

  return (
    <motion.div
      className="absolute top-0 left-0"
      style={{ x, y, width: float.w, height: float.h, zIndex: 100 + (z || 0) }}
      drag
      dragControls={controls}
      dragListener={false}
      dragMomentum={false}
      dragConstraints={{
        left: 0,
        top: 0,
        right: Math.max(0, bounds.w - float.w),
        bottom: Math.max(0, bounds.h - float.h),
      }}
      onDragEnd={(_e, _info: PanInfo) => setFloatRect(win.id, { x: x.get(), y: y.get(), w: float.w, h: float.h })}
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
      whileDrag={{ scale: 1.01 }}
    >
      <WindowChrome win={win} focused={focused} onTitlePointerDown={(e) => controls.start(e)}>
        <AppContent win={win} />
      </WindowChrome>
    </motion.div>
  )
}

function EmptyHint({ ws }: { ws: number }) {
  const toggleLauncher = useWM((s) => s.toggleLauncher)
  return (
    <div className="pointer-events-none absolute inset-0 grid place-items-center">
      <button
        onClick={toggleLauncher}
        className="pointer-events-auto flex flex-col items-center gap-3 rounded-2xl border border-dashed border-surface1/70 bg-mantle/40 px-10 py-8 text-center backdrop-blur-sm transition-colors hover:border-blue/50 hover:bg-mantle/60"
      >
        <GridIcon width={30} height={30} className="text-overlay1" />
        <div className="font-mono text-sm text-subtext1">
          Workspace <span className="text-blue">{ws}</span> is empty
        </div>
        <div className="max-w-xs text-xs text-subtext0">
          Press <kbd className="rounded bg-surface0 px-1.5 py-0.5 font-mono text-[11px] text-text">Super + D</kbd> or
          click any icon in the dock to open an app.
        </div>
      </button>
    </div>
  )
}

const wsVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? '100%' : '-100%', opacity: 0.3 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? '-100%' : '100%', opacity: 0.3 }),
}

export function TilingStage() {
  const ref = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 0, h: 0 })

  const setScreen = useWM((s) => s.setScreen)
  const activeWorkspace = useWM((s) => s.activeWorkspace)
  const wsDirection = useWM((s) => s.wsDirection)
  const windows = useWM((s) => s.windows)
  const workspaces = useWM((s) => s.workspaces)
  const focusedWindowId = useWM((s) => s.focusedWindowId)
  const zIndex = useWM((s) => s.zIndex)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const r = entries[0].contentRect
      setSize({ w: r.width, h: r.height })
      setScreen(r.width, r.height)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [setScreen])

  const ws = workspaces[activeWorkspace]
  const order = ws.windowOrder
  const tiles = order
    .map((id) => windows[id])
    .filter(Boolean)
    .map((w) => ({ id: w.id, floating: w.floating, fullscreen: w.fullscreen }))
  // Reserve room at the bottom so tiled windows never hide behind the dock.
  const DOCK_RESERVE = 84
  const usableH = Math.max(160, size.h - DOCK_RESERVE)
  const rects = computeLayout(tiles, ws.layout, size.w, usableH)

  return (
    <div ref={ref} className="relative min-h-0 flex-1 overflow-hidden">
      <AnimatePresence custom={wsDirection} initial={false} mode="popLayout">
        <motion.div
          key={activeWorkspace}
          custom={wsDirection}
          variants={wsVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ type: 'spring', stiffness: 320, damping: 34, opacity: { duration: 0.2 } }}
          className="absolute inset-0"
        >
          <AnimatePresence>
            {order.map((id) => {
              const win = windows[id]
              if (!win) return null
              return win.floating ? (
                <FloatingWindow key={id} win={win} focused={focusedWindowId === id} z={zIndex[id] ?? 1} bounds={size} />
              ) : (
                <TiledWindow key={id} win={win} rect={rects[id]} focused={focusedWindowId === id} />
              )
            })}
          </AnimatePresence>
          {order.length === 0 && <EmptyHint ws={activeWorkspace} />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
