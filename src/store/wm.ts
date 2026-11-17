// ─────────────────────────────────────────────────────────────────────────────
// Window-manager store (zustand). Emulates a Hyprland tiling WM:
// workspaces, per-workspace ordered window lists, focus, floating/fullscreen,
// and the UI flags for the launcher / cheatsheet.
// Geometry is NEVER stored here — it is derived from order via lib/tiling.
// ─────────────────────────────────────────────────────────────────────────────

import { create } from 'zustand'
import { computeLayout, nearestInDirection, type LayoutKind, type TileWindow } from '../lib/tiling'
import { identity, RESUME_FILENAME } from '../data/content'

export type AppId =
  | 'terminal'
  | 'about'
  | 'projects'
  | 'experience'
  | 'skills'
  | 'contact'
  | 'resume'
  | 'snake'
  | '2048'
  | 'minesweeper'
  | 'life'
  | 'calculator'

export type WorkspaceId = 1 | 2 | 3 | 4 | 5
export const WORKSPACE_IDS: WorkspaceId[] = [1, 2, 3, 4, 5]

export interface FloatRect {
  x: number
  y: number
  w: number
  h: number
}

export interface WMWindow {
  id: string
  appId: AppId
  title: string
  workspace: WorkspaceId
  floating: boolean
  fullscreen: boolean
  float?: FloatRect
}

export interface Workspace {
  id: WorkspaceId
  windowOrder: string[]
  layout: LayoutKind
}

interface OpenOpts {
  title?: string
  floating?: boolean
  workspace?: WorkspaceId
  allowMultiple?: boolean
}

interface WMState {
  windows: Record<string, WMWindow>
  workspaces: Record<WorkspaceId, Workspace>
  activeWorkspace: WorkspaceId
  focusedWindowId: string | null
  zIndex: Record<string, number>
  nextZ: number
  wsDirection: 1 | -1
  screen: { w: number; h: number }

  launcherOpen: boolean
  cheatsheetOpen: boolean
  booted: boolean

  // lifecycle
  openApp: (appId: AppId, opts?: OpenOpts) => string
  closeWindow: (id: string) => void

  // focus
  focusWindow: (id: string) => void
  focusNext: () => void
  focusPrev: () => void
  focusDir: (dir: 'left' | 'right' | 'up' | 'down') => void

  // workspaces
  switchWorkspace: (ws: WorkspaceId) => void
  moveWindowToWorkspace: (id: string, ws: WorkspaceId, follow?: boolean) => void
  setLayout: (ws: WorkspaceId, layout: LayoutKind) => void
  toggleLayout: (ws?: WorkspaceId) => void

  // window ops
  toggleFullscreen: (id?: string) => void
  toggleFloating: (id?: string) => void
  moveWindowInOrder: (id: string, dir: 'next' | 'prev') => void
  setFloatRect: (id: string, rect: FloatRect) => void
  raise: (id: string) => void

  // misc
  setScreen: (w: number, h: number) => void
  setBooted: (b: boolean) => void

  // ui
  toggleLauncher: () => void
  setLauncher: (open: boolean) => void
  toggleCheatsheet: () => void
  setCheatsheet: (open: boolean) => void
}

const APP_TITLES: Record<AppId, string> = {
  terminal: `${identity.username}@${identity.host}: ~`,
  about: 'About — ~/about.md',
  projects: 'Projects — ~/projects',
  experience: 'Experience — ~/experience',
  skills: 'Skills — ~/skills.json',
  contact: 'Contact — ~/contact.vcf',
  resume: `Resume — ${RESUME_FILENAME}`,
  snake: 'Snake — /usr/games/snake',
  '2048': '2048 — /usr/games/2048',
  minesweeper: 'Minesweeper — /usr/games/mines',
  life: "Conway's Game of Life",
  calculator: 'Calculator',
}

let idCounter = 0
const newId = () => `w${++idCounter}`

function emptyWorkspaces(): Record<WorkspaceId, Workspace> {
  return {
    1: { id: 1, windowOrder: [], layout: 'dwindle' },
    2: { id: 2, windowOrder: [], layout: 'dwindle' },
    3: { id: 3, windowOrder: [], layout: 'dwindle' },
    4: { id: 4, windowOrder: [], layout: 'dwindle' },
    5: { id: 5, windowOrder: [], layout: 'dwindle' },
  }
}

export const useWM = create<WMState>((set, get) => ({
  windows: {},
  workspaces: emptyWorkspaces(),
  activeWorkspace: 1,
  focusedWindowId: null,
  zIndex: {},
  nextZ: 1,
  wsDirection: 1,
  screen: { w: 1280, h: 720 },

  launcherOpen: false,
  cheatsheetOpen: false,
  booted: false,

  openApp: (appId, opts = {}) => {
    const state = get()

    // Focus-or-open: avoid duplicate content windows unless allowMultiple.
    if (!opts.allowMultiple) {
      const existing = Object.values(state.windows).find((w) => w.appId === appId)
      if (existing) {
        set((s) => {
          const dir = existing.workspace >= s.activeWorkspace ? 1 : -1
          return {
            activeWorkspace: existing.workspace,
            wsDirection: existing.workspace === s.activeWorkspace ? s.wsDirection : (dir as 1 | -1),
            focusedWindowId: existing.id,
            zIndex: { ...s.zIndex, [existing.id]: s.nextZ },
            nextZ: s.nextZ + 1,
            launcherOpen: false,
          }
        })
        return existing.id
      }
    }

    const id = newId()
    const ws = opts.workspace ?? state.activeWorkspace
    const win: WMWindow = {
      id,
      appId,
      title: opts.title ?? APP_TITLES[appId],
      workspace: ws,
      floating: opts.floating ?? false,
      fullscreen: false,
    }
    set((s) => ({
      windows: { ...s.windows, [id]: win },
      workspaces: {
        ...s.workspaces,
        [ws]: { ...s.workspaces[ws], windowOrder: [...s.workspaces[ws].windowOrder, id] },
      },
      focusedWindowId: id,
      activeWorkspace: ws,
      zIndex: { ...s.zIndex, [id]: s.nextZ },
      nextZ: s.nextZ + 1,
      launcherOpen: false,
    }))
    return id
  },

  closeWindow: (id) => {
    set((s) => {
      const win = s.windows[id]
      if (!win) return s
      const { [id]: _removed, ...rest } = s.windows
      const ws = s.workspaces[win.workspace]
      const order = ws.windowOrder.filter((w) => w !== id)
      let focused = s.focusedWindowId
      if (focused === id) {
        const idx = ws.windowOrder.indexOf(id)
        focused = order[Math.max(0, idx - 1)] ?? order[0] ?? null
      }
      return {
        windows: rest,
        workspaces: { ...s.workspaces, [win.workspace]: { ...ws, windowOrder: order } },
        focusedWindowId: focused,
      }
    })
  },

  focusWindow: (id) => {
    set((s) => {
      const win = s.windows[id]
      if (!win) return s
      return {
        focusedWindowId: id,
        zIndex: win.floating ? { ...s.zIndex, [id]: s.nextZ } : s.zIndex,
        nextZ: win.floating ? s.nextZ + 1 : s.nextZ,
      }
    })
  },

  focusNext: () => {
    const s = get()
    const order = s.workspaces[s.activeWorkspace].windowOrder
    if (order.length === 0) return
    const idx = s.focusedWindowId ? order.indexOf(s.focusedWindowId) : -1
    const next = order[(idx + 1 + order.length) % order.length]
    get().focusWindow(next)
  },

  focusPrev: () => {
    const s = get()
    const order = s.workspaces[s.activeWorkspace].windowOrder
    if (order.length === 0) return
    const idx = s.focusedWindowId ? order.indexOf(s.focusedWindowId) : 0
    const prev = order[(idx - 1 + order.length) % order.length]
    get().focusWindow(prev)
  },

  focusDir: (dir) => {
    const s = get()
    if (!s.focusedWindowId) {
      get().focusNext()
      return
    }
    const ws = s.workspaces[s.activeWorkspace]
    const tiles: TileWindow[] = ws.windowOrder
      .map((wid) => s.windows[wid])
      .filter(Boolean)
      .map((w) => ({ id: w.id, floating: w.floating, fullscreen: w.fullscreen }))
    const rects = computeLayout(tiles, ws.layout, s.screen.w, s.screen.h)
    const target = nearestInDirection(rects, s.focusedWindowId, dir)
    if (target) get().focusWindow(target)
  },

  switchWorkspace: (ws) => {
    set((s) => {
      if (ws === s.activeWorkspace) return s
      const dir: 1 | -1 = ws > s.activeWorkspace ? 1 : -1
      const order = s.workspaces[ws].windowOrder
      return {
        activeWorkspace: ws,
        wsDirection: dir,
        focusedWindowId: order[order.length - 1] ?? null,
        launcherOpen: false,
      }
    })
  },

  moveWindowToWorkspace: (id, ws, follow = true) => {
    set((s) => {
      const win = s.windows[id]
      if (!win || win.workspace === ws) return s
      const from = s.workspaces[win.workspace]
      const to = s.workspaces[ws]
      const next: Partial<WMState> = {
        windows: { ...s.windows, [id]: { ...win, workspace: ws, fullscreen: false } },
        workspaces: {
          ...s.workspaces,
          [win.workspace]: { ...from, windowOrder: from.windowOrder.filter((w) => w !== id) },
          [ws]: { ...to, windowOrder: [...to.windowOrder, id] },
        },
      }
      if (follow) {
        next.activeWorkspace = ws
        next.wsDirection = ws > s.activeWorkspace ? 1 : -1
        next.focusedWindowId = id
      } else if (s.focusedWindowId === id) {
        const remaining = from.windowOrder.filter((w) => w !== id)
        next.focusedWindowId = remaining[remaining.length - 1] ?? null
      }
      return next as WMState
    })
  },

  setLayout: (ws, layout) => {
    set((s) => ({ workspaces: { ...s.workspaces, [ws]: { ...s.workspaces[ws], layout } } }))
  },

  toggleLayout: (ws) => {
    const s = get()
    const id = ws ?? s.activeWorkspace
    const current = s.workspaces[id].layout
    get().setLayout(id, current === 'dwindle' ? 'master' : 'dwindle')
  },

  toggleFullscreen: (id) => {
    set((s) => {
      const target = id ?? s.focusedWindowId
      if (!target || !s.windows[target]) return s
      const win = s.windows[target]
      return { windows: { ...s.windows, [target]: { ...win, fullscreen: !win.fullscreen } } }
    })
  },

  toggleFloating: (id) => {
    set((s) => {
      const target = id ?? s.focusedWindowId
      if (!target || !s.windows[target]) return s
      const win = s.windows[target]
      const floating = !win.floating
      const float: FloatRect =
        win.float ??
        {
          x: Math.round(s.screen.w * 0.2),
          y: Math.round(s.screen.h * 0.18),
          w: Math.round(s.screen.w * 0.55),
          h: Math.round(s.screen.h * 0.6),
        }
      return {
        windows: { ...s.windows, [target]: { ...win, floating, fullscreen: false, float } },
        zIndex: { ...s.zIndex, [target]: s.nextZ },
        nextZ: s.nextZ + 1,
      }
    })
  },

  moveWindowInOrder: (id, dir) => {
    set((s) => {
      const win = s.windows[id]
      if (!win) return s
      const ws = s.workspaces[win.workspace]
      const order = [...ws.windowOrder]
      const i = order.indexOf(id)
      const j = dir === 'next' ? i + 1 : i - 1
      if (i < 0 || j < 0 || j >= order.length) return s
      ;[order[i], order[j]] = [order[j], order[i]]
      return { workspaces: { ...s.workspaces, [win.workspace]: { ...ws, windowOrder: order } } }
    })
  },

  setFloatRect: (id, rect) => {
    set((s) => {
      const win = s.windows[id]
      if (!win) return s
      return { windows: { ...s.windows, [id]: { ...win, float: rect } } }
    })
  },

  raise: (id) => {
    set((s) => ({ zIndex: { ...s.zIndex, [id]: s.nextZ }, nextZ: s.nextZ + 1 }))
  },

  setScreen: (w, h) => set({ screen: { w, h } }),
  setBooted: (b) => set({ booted: b }),

  toggleLauncher: () => set((s) => ({ launcherOpen: !s.launcherOpen, cheatsheetOpen: false })),
  setLauncher: (open) => set({ launcherOpen: open }),
  toggleCheatsheet: () => set((s) => ({ cheatsheetOpen: !s.cheatsheetOpen, launcherOpen: false })),
  setCheatsheet: (open) => set({ cheatsheetOpen: open }),
}))

export { APP_TITLES }
