// ─────────────────────────────────────────────────────────────────────────────
// Hyprland-style tiling geometry. Pure functions: an ordered window list ->
// pixel rects. Geometry is always derived (never stored), so it stays in sync.
// ─────────────────────────────────────────────────────────────────────────────

import { hypr } from '../theme/catppuccin'

export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

export interface TileWindow {
  id: string
  floating: boolean
  fullscreen: boolean
}

export type LayoutKind = 'dwindle' | 'master'

const GAP_OUT = hypr.gapsOuter // 12
const GAP_IN = hypr.gapsInner // 6

function snap(r: Rect): Rect {
  return {
    x: Math.round(r.x),
    y: Math.round(r.y),
    w: Math.max(1, Math.round(r.w)),
    h: Math.max(1, Math.round(r.h)),
  }
}

/**
 * Authentic Hyprland "dwindle": each window splits the remaining region in half.
 * Split axis follows the region's aspect ratio (wide -> vertical divider, tall ->
 * horizontal divider), producing the signature spiral that flips with depth.
 */
function dwindle(order: TileWindow[], W: number, H: number): Record<string, Rect> {
  const tiled = order.filter((w) => !w.floating && !w.fullscreen)
  const out: Record<string, Rect> = {}
  if (tiled.length === 0) return out

  const region: Rect = { x: GAP_OUT, y: GAP_OUT, w: W - 2 * GAP_OUT, h: H - 2 * GAP_OUT }

  function place(wins: TileWindow[], r: Rect) {
    if (wins.length === 1) {
      out[wins[0].id] = snap(r)
      return
    }
    const splitVertical = r.w >= r.h // wide -> left | right
    const [head, ...rest] = wins
    if (splitVertical) {
      const half = (r.w - GAP_IN) / 2
      out[head.id] = snap({ x: r.x, y: r.y, w: half, h: r.h })
      place(rest, { x: r.x + half + GAP_IN, y: r.y, w: r.w - half - GAP_IN, h: r.h })
    } else {
      const half = (r.h - GAP_IN) / 2
      out[head.id] = snap({ x: r.x, y: r.y, w: r.w, h: half })
      place(rest, { x: r.x, y: r.y + half + GAP_IN, w: r.w, h: r.h - half - GAP_IN })
    }
  }

  place(tiled, region)
  return out
}

/**
 * Master layout: first window is the master column (left), the rest stack in a
 * right-hand column. mfact controls the master share of the width.
 */
function master(order: TileWindow[], W: number, H: number, mfact = 0.56): Record<string, Rect> {
  const tiled = order.filter((w) => !w.floating && !w.fullscreen)
  const out: Record<string, Rect> = {}
  if (tiled.length === 0) return out

  const region: Rect = { x: GAP_OUT, y: GAP_OUT, w: W - 2 * GAP_OUT, h: H - 2 * GAP_OUT }
  if (tiled.length === 1) {
    out[tiled[0].id] = snap(region)
    return out
  }

  const [head, ...stack] = tiled
  const masterW = (region.w - GAP_IN) * mfact
  out[head.id] = snap({ x: region.x, y: region.y, w: masterW, h: region.h })

  const stackX = region.x + masterW + GAP_IN
  const stackW = region.w - masterW - GAP_IN
  const k = stack.length
  const totalGaps = (k - 1) * GAP_IN
  const eachH = (region.h - totalGaps) / k
  stack.forEach((w, i) => {
    out[w.id] = snap({ x: stackX, y: region.y + i * (eachH + GAP_IN), w: stackW, h: eachH })
  })
  return out
}

export function computeLayout(
  order: TileWindow[],
  layout: LayoutKind,
  W: number,
  H: number,
): Record<string, Rect> {
  // A fullscreen window owns the whole stage; nothing else is tiled.
  const fs = order.find((w) => w.fullscreen && !w.floating)
  if (fs) return { [fs.id]: { x: 0, y: 0, w: W, h: H } }

  return layout === 'master' ? master(order, W, H) : dwindle(order, W, H)
}

/** Geometric neighbour selection for Super+h/j/k/l directional focus. */
export function nearestInDirection(
  rects: Record<string, Rect>,
  fromId: string,
  dir: 'left' | 'right' | 'up' | 'down',
): string | null {
  const from = rects[fromId]
  if (!from) return null
  const fc = { x: from.x + from.w / 2, y: from.y + from.h / 2 }

  let best: string | null = null
  let bestScore = Infinity
  for (const [id, r] of Object.entries(rects)) {
    if (id === fromId) continue
    const c = { x: r.x + r.w / 2, y: r.y + r.h / 2 }
    const dx = c.x - fc.x
    const dy = c.y - fc.y
    const inDir =
      (dir === 'left' && dx < -1) ||
      (dir === 'right' && dx > 1) ||
      (dir === 'up' && dy < -1) ||
      (dir === 'down' && dy > 1)
    if (!inDir) continue
    // primary distance along axis, penalise cross-axis offset
    const along = dir === 'left' || dir === 'right' ? Math.abs(dx) : Math.abs(dy)
    const cross = dir === 'left' || dir === 'right' ? Math.abs(dy) : Math.abs(dx)
    const score = along + cross * 2
    if (score < bestScore) {
      bestScore = score
      best = id
    }
  }
  return best
}
