// Keybind cheatsheet overlay — rendered from the same keybinds data the handler
// uses, grouped by category. Toggle with Super+S / ? / the waybar button.
import { AnimatePresence, motion } from 'framer-motion'
import { useWM } from '../store/wm'
import { keybinds, keybindGroups } from '../lib/keybindings'
import { mocha } from '../theme/catppuccin'
import { KeyboardIcon, CloseIcon } from './icons'

function Kbd({ k }: { k: string }) {
  // split a "Super + Shift + H" string into individual key chips
  return (
    <span className="flex flex-wrap items-center gap-1">
      {k.split(/\s*\+\s*|\s*\/\s*/).map((part, i, arr) => (
        <span key={i} className="flex items-center gap-1">
          <kbd className="rounded-md border border-surface1 bg-surface0 px-1.5 py-0.5 font-mono text-[11px] text-text shadow-sm">
            {part === '/' ? 'or' : part}
          </kbd>
          {i < arr.length - 1 && k.includes('/') ? <span className="text-overlay0">/</span> : null}
        </span>
      ))}
    </span>
  )
}

export function Cheatsheet() {
  const open = useWM((s) => s.cheatsheetOpen)
  const setCheatsheet = useWM((s) => s.setCheatsheet)

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="absolute inset-0 z-[300] grid place-items-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onMouseDown={() => setCheatsheet(false)}
        >
          <div className="absolute inset-0 bg-crust/50 backdrop-blur-[2px]" />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 360, damping: 30 }}
            className="glass-strong relative w-[min(760px,94vw)] overflow-hidden rounded-2xl border border-surface1/70 shadow-2xl"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-surface0 px-5 py-3.5">
              <KeyboardIcon width={20} height={20} style={{ color: mocha.lavender }} />
              <div>
                <div className="text-sm font-semibold text-text">Keybindings</div>
                <div className="font-mono text-[11px] text-subtext0">
                  This is a tiling WM — windows auto-arrange. Super = Win / ⌘. You can also just click around.
                </div>
              </div>
              <button
                onClick={() => setCheatsheet(false)}
                className="ml-auto grid h-7 w-7 place-items-center rounded-lg text-subtext0 hover:bg-white/8 hover:text-red"
                aria-label="Close"
              >
                <CloseIcon width={16} height={16} />
              </button>
            </div>

            <div className="grid max-h-[70vh] gap-x-8 gap-y-5 overflow-y-auto p-5 sm:grid-cols-2">
              {keybindGroups.map((group) => (
                <div key={group}>
                  <div className="mb-2 font-mono text-xs font-semibold tracking-wide text-mauve uppercase">{group}</div>
                  <div className="space-y-1.5">
                    {keybinds
                      .filter((b) => b.group === group)
                      .map((b) => (
                        <div key={b.keys} className="flex items-center justify-between gap-3">
                          <span className="text-[13px] text-subtext1">{b.action}</span>
                          <Kbd k={b.keys} />
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
