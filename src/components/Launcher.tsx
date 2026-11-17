// rofi-style app launcher. Opens with Super+D or the Arch menu / empty-workspace
// hint. Fuzzy filter, full keyboard + mouse navigation.
import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useWM } from '../store/wm'
import { APP_LIST } from '../apps/registry'
import { mocha } from '../theme/catppuccin'
import { SearchIcon } from './icons'

export function Launcher() {
  const open = useWM((s) => s.launcherOpen)
  const setLauncher = useWM((s) => s.setLauncher)
  const openApp = useWM((s) => s.openApp)

  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return APP_LIST
    return APP_LIST.filter(
      (a) => a.label.toLowerCase().includes(q) || a.description.toLowerCase().includes(q) || a.id.includes(q),
    )
  }, [query])

  useEffect(() => {
    if (open) {
      setQuery('')
      setActive(0)
      // focus after the modal mounts
      const t = setTimeout(() => inputRef.current?.focus(), 30)
      return () => clearTimeout(t)
    }
  }, [open])

  useEffect(() => {
    setActive((a) => Math.min(a, Math.max(0, results.length - 1)))
  }, [results.length])

  const launch = (i: number) => {
    const app = results[i]
    if (!app) return
    openApp(app.id, { floating: app.defaultFloating, allowMultiple: app.allowMultiple })
    setLauncher(false)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => (a + 1) % Math.max(1, results.length))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => (a - 1 + results.length) % Math.max(1, results.length))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      launch(active)
    }
    // Escape is handled by the global handler in Desktop.
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="absolute inset-0 z-[300] grid place-items-start justify-center pt-[14vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onMouseDown={() => setLauncher(false)}
        >
          <div className="absolute inset-0 bg-crust/40 backdrop-blur-[2px]" />
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            className="glass-strong relative w-[min(540px,92vw)] overflow-hidden rounded-2xl border border-surface1/70 shadow-2xl"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-surface0 px-4 py-3">
              <SearchIcon width={18} height={18} className="text-overlay1" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Search apps…  (try: terminal, projects, resume)"
                className="w-full bg-transparent font-mono text-sm text-text placeholder:text-overlay0 focus:outline-none"
              />
              <kbd className="hidden rounded bg-surface0 px-1.5 py-0.5 font-mono text-[10px] text-subtext0 sm:block">
                esc
              </kbd>
            </div>

            <div className="max-h-[46vh] overflow-y-auto p-2">
              {results.length === 0 && (
                <div className="px-3 py-6 text-center font-mono text-sm text-overlay0">no matches — try `help`</div>
              )}
              {results.map((app, i) => {
                const Icon = app.icon
                const isActive = i === active
                return (
                  <button
                    key={app.id}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => launch(i)}
                    className="relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors"
                    style={{
                      background: isActive
                        ? `color-mix(in oklab, ${mocha[app.accent]} 14%, ${mocha.surface0})`
                        : 'transparent',
                      boxShadow: isActive ? `inset 2px 0 0 ${mocha[app.accent]}` : undefined,
                    }}
                  >
                    <span
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-white/5 bg-mantle"
                      style={{
                        color: mocha[app.accent],
                        boxShadow: isActive ? `0 4px 14px -8px ${mocha[app.accent]}` : undefined,
                      }}
                    >
                      <Icon width={18} height={18} />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-text">{app.label}</span>
                      <span className="block truncate font-mono text-xs text-subtext0">{app.description}</span>
                    </span>
                    {isActive && <span className="ml-auto font-mono text-[11px] text-overlay1">↵</span>}
                  </button>
                )
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
