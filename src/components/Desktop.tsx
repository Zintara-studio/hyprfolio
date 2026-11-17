// The desktop shell: wallpaper, waybar, tiling stage, dock, overlays, the global
// Hyprland-style keyboard handler and a keypress HUD.
import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useWM } from '../store/wm'
import { Waybar } from './Waybar'
import { TilingStage } from './TilingStage'
import { Dock } from './Dock'
import { Launcher } from './Launcher'
import { Cheatsheet } from './Cheatsheet'
import { Wallpaper } from './Wallpaper'

const HINT_KEY = 'hyprfolio-hint-dismissed'

export function Desktop() {
  const [hud, setHud] = useState<string | null>(null)
  const hudTimer = useRef<number | null>(null)
  const [showHint, setShowHint] = useState(false)

  const flash = (msg: string) => {
    setHud(msg)
    if (hudTimer.current) window.clearTimeout(hudTimer.current)
    hudTimer.current = window.setTimeout(() => setHud(null), 1400)
  }

  // Seed the desktop with a couple of windows so the tiling is visible on load.
  useEffect(() => {
    const s = useWM.getState()
    if (Object.keys(s.windows).length === 0) {
      s.openApp('about')
      s.openApp('terminal', { allowMultiple: true })
    }
    try {
      if (!localStorage.getItem(HINT_KEY)) {
        setShowHint(true)
        const t = window.setTimeout(() => setShowHint(false), 9000)
        return () => window.clearTimeout(t)
      }
    } catch {
      setShowHint(true)
    }
  }, [])

  const dismissHint = () => {
    setShowHint(false)
    try {
      localStorage.setItem(HINT_KEY, '1')
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      const typing =
        !!t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || (t as HTMLElement).isContentEditable)
      const s = useWM.getState()

      if (e.key === 'Escape') {
        if (s.launcherOpen) return s.setLauncher(false)
        if (s.cheatsheetOpen) return s.setCheatsheet(false)
      }

      if (!typing && e.key === '?') {
        e.preventDefault()
        return s.toggleCheatsheet()
      }

      const mod = e.metaKey // Super / Win / Cmd
      if (!mod) return

      // Workspace numbers
      if (/^[1-5]$/.test(e.key)) {
        e.preventDefault()
        const ws = Number(e.key) as 1 | 2 | 3 | 4 | 5
        if (e.shiftKey && s.focusedWindowId) {
          s.moveWindowToWorkspace(s.focusedWindowId, ws, true)
          flash(`Super+Shift+${ws} → move to workspace ${ws}`)
        } else {
          s.switchWorkspace(ws)
          flash(`Super+${ws} → workspace ${ws}`)
        }
        return
      }

      const k = e.key.toLowerCase()
      const moveDir = (dir: 'next' | 'prev') => s.focusedWindowId && s.moveWindowInOrder(s.focusedWindowId, dir)

      switch (k) {
        case 'd':
          e.preventDefault()
          s.toggleLauncher()
          flash('Super+D → launcher')
          break
        case 'enter':
          e.preventDefault()
          s.openApp('terminal', { allowMultiple: true })
          flash('Super+Return → terminal')
          break
        case 'q':
          e.preventDefault()
          if (s.focusedWindowId) {
            s.closeWindow(s.focusedWindowId)
            flash('Super+Q → close window')
          }
          break
        case 'f':
          e.preventDefault()
          s.toggleFullscreen()
          flash('Super+F → fullscreen')
          break
        case 'v':
          e.preventDefault()
          s.toggleFloating()
          flash('Super+V → toggle floating')
          break
        case 'm':
          e.preventDefault()
          s.toggleLayout()
          flash('Super+M → layout')
          break
        case 's':
          e.preventDefault()
          s.toggleCheatsheet()
          break
        case 'tab':
          e.preventDefault()
          e.shiftKey ? s.focusPrev() : s.focusNext()
          break
        case 'h':
          e.preventDefault()
          e.shiftKey ? moveDir('prev') : s.focusDir('left')
          break
        case 'l':
          e.preventDefault()
          e.shiftKey ? moveDir('next') : s.focusDir('right')
          break
        case 'k':
          e.preventDefault()
          e.shiftKey ? moveDir('prev') : s.focusDir('up')
          break
        case 'j':
          e.preventDefault()
          e.shiftKey ? moveDir('next') : s.focusDir('down')
          break
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return (
    <div className="relative flex h-screen w-screen flex-col overflow-hidden bg-crust">
      {/* Aurora borealis wallpaper */}
      <Wallpaper />

      {/* very faint geometric grid for that tiling-WM feel */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(218,242,236,0.55) 1px, transparent 1px), linear-gradient(90deg, rgba(218,242,236,0.55) 1px, transparent 1px)',
          backgroundSize: '46px 46px',
        }}
      />

      <Waybar />
      <TilingStage />
      <Dock />

      <Launcher />
      <Cheatsheet />

      {/* first-visit hint */}
      <AnimatePresence>
        {showHint && (
          <motion.button
            onClick={dismissHint}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-14 left-1/2 z-[180] -translate-x-1/2 rounded-full border border-surface1/70 bg-mantle/90 px-4 py-2 text-center font-mono text-[12px] text-subtext1 shadow-xl backdrop-blur soft-pulse"
          >
            <span className="text-mauve">Arch + Hyprland</span> · open apps from the dock ↓, type in the terminal, or
            press <span className="rounded bg-surface0 px-1 text-text">?</span> for keybinds
            <span className="ml-2 text-overlay0">(click to dismiss)</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* keypress HUD */}
      <AnimatePresence>
        {hud && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            className="absolute bottom-24 left-1/2 z-[190] -translate-x-1/2 rounded-lg border border-surface1/70 bg-crust/90 px-3 py-1.5 font-mono text-[12px] text-text shadow-xl backdrop-blur"
          >
            {hud}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
