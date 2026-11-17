// Bottom dock — the mouse-first way to open apps (alternative to Super+D / rofi).
// Apps first, a divider, then games. Horizontally scrollable on narrow screens.
import { useState } from 'react'
import { motion } from 'framer-motion'
import { useWM } from '../store/wm'
import { APP_LIST } from '../apps/registry'
import { mocha } from '../theme/catppuccin'

export function Dock() {
  const openApp = useWM((s) => s.openApp)
  const windows = useWM((s) => s.windows)
  const [hover, setHover] = useState<string | null>(null)

  const runningIds = new Set(Object.values(windows).map((w) => w.appId))

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-3 z-[150] flex justify-center px-2">
      <div className="glass-strong no-scrollbar pointer-events-auto flex max-w-full items-end gap-1.5 overflow-x-auto rounded-2xl border border-white/8 px-2.5 py-2 shadow-2xl">
        {APP_LIST.map((app, i) => {
          const Icon = app.icon
          const running = runningIds.has(app.id)
          const showDivider = i > 0 && APP_LIST[i - 1].group !== app.group
          return (
            <div key={app.id} className="flex items-end">
              {showDivider && <span className="mx-1.5 mb-1 h-8 w-px shrink-0 self-center bg-surface1/70" />}
              <div className="relative flex shrink-0 flex-col items-center">
                {hover === app.id && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute -top-9 whitespace-nowrap rounded-md border border-surface1 bg-crust px-2 py-1 font-mono text-[11px] text-text shadow-lg"
                  >
                    {app.label}
                  </motion.div>
                )}
                <motion.button
                  onClick={() => openApp(app.id, { floating: app.defaultFloating, allowMultiple: app.allowMultiple })}
                  onMouseEnter={() => setHover(app.id)}
                  onMouseLeave={() => setHover(null)}
                  whileHover={{ y: -6, scale: 1.12 }}
                  whileTap={{ scale: 0.94 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                  className="grid h-11 w-11 place-items-center rounded-xl border border-white/5"
                  style={{
                    color: mocha[app.accent],
                    background: `color-mix(in oklab, ${mocha[app.accent]} ${running ? 18 : 9}%, ${mocha.surface0})`,
                    boxShadow: running ? `0 6px 18px -8px ${mocha[app.accent]}` : undefined,
                  }}
                  title={`${app.label} — ${app.description}`}
                  aria-label={app.label}
                >
                  <Icon width={22} height={22} />
                </motion.button>
                <span
                  className="mt-1 h-1 w-1 rounded-full transition-opacity"
                  style={{
                    background: mocha[app.accent],
                    opacity: running ? 1 : 0,
                    boxShadow: `0 0 6px ${mocha[app.accent]}`,
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
