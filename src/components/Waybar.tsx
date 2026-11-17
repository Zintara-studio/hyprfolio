// Waybar — the floating Hyprland-style top bar. Every module is a real, clickable
// control: Arch menu, workspace pills, layout toggle, fake-but-lively system
// stats, a keybind button and a power menu.
import { useEffect, useState } from 'react'
import { useWM, WORKSPACE_IDS, type WorkspaceId } from '../store/wm'
import { APPS } from '../apps/registry'
import { identity, shortUrl } from '../data/content'
import { mocha } from '../theme/catppuccin'
import {
  ArchIcon,
  BatteryIcon,
  ClockIcon,
  CpuIcon,
  GithubIcon,
  GridIcon,
  KeyboardIcon,
  LinkedinIcon,
  MemoryIcon,
  PowerIcon,
  VolumeIcon,
  WifiIcon,
} from './icons'

function Pill({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`glass-strong flex items-center gap-0.5 rounded-xl border border-white/5 px-1 py-1 ${className}`}>
      {children}
    </div>
  )
}

function Mod({
  color,
  title,
  onClick,
  children,
  className = '',
}: {
  color?: string
  title?: string
  onClick?: () => void
  children: React.ReactNode
  className?: string
}) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      title={title}
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-lg px-2 py-1 font-mono text-[12.5px] font-medium transition-colors ${onClick ? 'hover:bg-white/8' : ''} ${className}`}
      style={{ color: color ?? mocha.subtext1 }}
    >
      {children}
    </Tag>
  )
}

export function Waybar() {
  const activeWorkspace = useWM((s) => s.activeWorkspace)
  const workspaces = useWM((s) => s.workspaces)
  const windows = useWM((s) => s.windows)
  const focusedWindowId = useWM((s) => s.focusedWindowId)
  const switchWorkspace = useWM((s) => s.switchWorkspace)
  const toggleLauncher = useWM((s) => s.toggleLauncher)
  const toggleCheatsheet = useWM((s) => s.toggleCheatsheet)
  const toggleLayout = useWM((s) => s.toggleLayout)

  const [now, setNow] = useState(() => new Date())
  const [cpu, setCpu] = useState(11)
  const [mem, setMem] = useState(38)

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  useEffect(() => {
    const t = setInterval(() => {
      setCpu((c) => Math.min(97, Math.max(4, Math.round(c + (Math.random() * 18 - 9)))))
      setMem((m) => Math.min(86, Math.max(28, Math.round(m + (Math.random() * 8 - 4)))))
    }, 2400)
    return () => clearInterval(t)
  }, [])

  const focusedTitle = focusedWindowId ? windows[focusedWindowId]?.title : null
  const layout = workspaces[activeWorkspace].layout

  const fmtDate = now.toLocaleDateString('en-US', { weekday: 'short', day: '2-digit', month: 'short' })
  const fmtTime = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })

  return (
    <header className="z-[200] grid shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-2 px-2 pt-1.5">
      {/* LEFT */}
      <div className="flex items-center gap-2 justify-self-start">
        <Pill>
          <Mod color={mocha.mauve} title="Open app launcher (Super+D)" onClick={toggleLauncher}>
            <ArchIcon width={17} height={17} />
          </Mod>
        </Pill>

        <Pill>
          {WORKSPACE_IDS.map((id: WorkspaceId) => {
            const occupied = workspaces[id].windowOrder.length > 0
            const active = id === activeWorkspace
            return (
              <button
                key={id}
                title={`Workspace ${id}`}
                onClick={() => switchWorkspace(id)}
                className="grid h-7 w-7 place-items-center rounded-lg font-mono text-[12.5px] transition-all"
                style={{
                  background: active
                    ? `linear-gradient(135deg, ${mocha.blue}, ${mocha.teal})`
                    : occupied
                      ? `color-mix(in oklab, ${mocha.blue} 14%, transparent)`
                      : 'transparent',
                  color: active ? mocha.crust : occupied ? mocha.text : mocha.overlay0,
                  fontWeight: active ? 700 : 500,
                  boxShadow: active ? `0 0 10px ${mocha.blue}80` : undefined,
                }}
              >
                {occupied || active ? id : '·'}
              </button>
            )
          })}
        </Pill>

        {focusedTitle && (
          <Pill className="hidden max-w-[34ch] lg:flex">
            <Mod color={mocha.subtext0} className="italic">
              <span className="truncate">{focusedTitle}</span>
            </Mod>
          </Pill>
        )}
      </div>

      {/* CENTER — clock */}
      <Pill className="justify-self-center">
        <Mod color={mocha.lavender} title={now.toLocaleString()}>
          <ClockIcon width={15} height={15} />
          <span className="text-text">{fmtDate}</span>
          <span className="px-1 text-overlay0">·</span>
          <span className="text-text tabular-nums">{fmtTime}</span>
        </Mod>
      </Pill>

      {/* RIGHT */}
      <div className="flex items-center gap-2 justify-self-end">
        <Pill className="hidden md:flex">
          <Mod color={mocha.peach} title="Toggle layout (Super+M)" onClick={() => toggleLayout()}>
            <GridIcon width={14} height={14} />
            <span className="capitalize">{layout}</span>
          </Mod>
        </Pill>

        <Pill className="hidden sm:flex">
          <Mod color={mocha.sapphire} title="CPU">
            <CpuIcon width={14} height={14} />
            <span className="tabular-nums">{cpu}%</span>
          </Mod>
          <Mod color={mocha.green} title="Memory">
            <MemoryIcon width={14} height={14} />
            <span className="tabular-nums">{mem}%</span>
          </Mod>
          <Mod color={mocha.teal} title="Network: connected" className="hidden lg:flex">
            <WifiIcon width={14} height={14} />
            <span>online</span>
          </Mod>
          <Mod color={mocha.yellow} title="Volume" className="hidden lg:flex">
            <VolumeIcon width={14} height={14} />
            <span className="tabular-nums">68%</span>
          </Mod>
          <Mod color={mocha.blue} title="Battery (charging)">
            <BatteryIcon width={15} height={15} />
            <span className="tabular-nums">100%</span>
          </Mod>
        </Pill>

        <Pill>
          <Mod color={mocha.subtext1} title={shortUrl(identity.github)} onClick={() => window.open(identity.github, '_blank')}>
            <GithubIcon width={15} height={15} />
          </Mod>
          <Mod
            color={mocha.subtext1}
            title={shortUrl(identity.linkedin)}
            onClick={() => window.open(identity.linkedin, '_blank')}
            className="hidden sm:flex"
          >
            <LinkedinIcon width={15} height={15} />
          </Mod>
          <Mod color={mocha.lavender} title="Keybinds (Super+S or ?)" onClick={toggleCheatsheet}>
            <KeyboardIcon width={16} height={16} />
          </Mod>
          <Mod color={mocha.red} title="Power" onClick={toggleCheatsheet}>
            <PowerIcon width={15} height={15} />
          </Mod>
        </Pill>
      </div>
    </header>
  )
}
