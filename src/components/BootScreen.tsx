// A short, skippable Arch boot + login sequence for flavour.
import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { mocha } from '../theme/catppuccin'
import { identity } from '../data/content'

const BOOT_LINES: Array<[string, 'ok' | 'info']> = [
  ['Reached target Basic System.', 'ok'],
  ['Started Journal Service.', 'ok'],
  [`Mounted /home/${identity.username}.`, 'ok'],
  ['Started Network Manager.', 'ok'],
  ['Reached target Network.', 'ok'],
  ['Started Bluetooth service.', 'ok'],
  ['Loaded kernel modules (zen).', 'ok'],
  ['Starting pipewire & wireplumber…', 'info'],
  ['Started User Login Management.', 'ok'],
  ['Started GreenWithEnvy GPU service.', 'ok'],
  ['Reached target Graphical Interface.', 'ok'],
  ['Starting Hyprland (Wayland) compositor…', 'info'],
]

export function BootScreen({ onDone }: { onDone: () => void }) {
  const [count, setCount] = useState(0)
  const [phase, setPhase] = useState<'boot' | 'login'>('boot')
  const done = useRef(false)

  const finish = () => {
    if (done.current) return
    done.current = true
    onDone()
  }

  useEffect(() => {
    if (phase !== 'boot') return
    if (count >= BOOT_LINES.length) {
      const t = setTimeout(() => setPhase('login'), 450)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => setCount((c) => c + 1), 70 + Math.random() * 80)
    return () => clearTimeout(t)
  }, [count, phase])

  useEffect(() => {
    if (phase !== 'login') return
    const t = setTimeout(finish, 2400)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  useEffect(() => {
    const skip = () => finish()
    window.addEventListener('keydown', skip)
    return () => window.removeEventListener('keydown', skip)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div
      onClick={finish}
      className="fixed inset-0 z-[1000] overflow-hidden bg-crust px-6 py-6 font-mono text-[13px] leading-relaxed sm:px-10 sm:py-8"
      style={{ color: mocha.text }}
    >
      <div className="absolute top-4 right-5 text-[11px] text-overlay0">click / any key to skip</div>

      <div className="mb-3 text-subtext0">
        Arch Linux 6.x-zen1-1 (tty1) — <span style={{ color: mocha.mauve }}>
          {identity.username}@{identity.host}
        </span>
      </div>

      {phase === 'boot' &&
        BOOT_LINES.slice(0, count).map(([line, kind], i) => (
          <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2">
            <span>
              [<span style={{ color: kind === 'ok' ? mocha.green : mocha.yellow }}>{kind === 'ok' ? '  OK  ' : ' ···· '}</span>]
            </span>
            <span className="text-subtext1">{line}</span>
          </motion.div>
        ))}

      {phase === 'login' && (
        <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.45 } } }}>
          {[
            <span key="l1">
              <span style={{ color: mocha.green }}>{identity.host} login:</span> {identity.username}
            </span>,
            <span key="l2">
              <span style={{ color: mocha.green }}>Password:</span> <span className="text-overlay1">••••••••••</span>
            </span>,
            <span key="l3" className="text-subtext0">
              Last login: just now on tty1
            </span>,
            <span key="l4">
              <span style={{ color: mocha.blue }}>~</span> Starting <span style={{ color: mocha.mauve }}>Hyprland</span>{' '}
              session
              <span className="cursor-blink">▋</span>
            </span>,
          ].map((node, i) => (
            <motion.div key={i} variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }} className="py-0.5">
              {node}
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  )
}
