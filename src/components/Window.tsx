// Window chrome: the gradient active border + a thin, discoverable titlebar with
// float / fullscreen / close controls. Positioning + animation is the parent's job.
import type { PointerEvent, ReactNode } from 'react'
import { useWM, type WMWindow } from '../store/wm'
import { mocha, hypr } from '../theme/catppuccin'
import { APPS } from '../apps/registry'
import { CloseIcon, FloatIcon, FullscreenIcon } from './icons'

function TitleButton({
  title,
  onClick,
  hover,
  children,
}: {
  title: string
  onClick: (e: React.MouseEvent) => void
  hover: string
  children: ReactNode
}) {
  return (
    <button
      title={title}
      aria-label={title}
      onClick={(e) => {
        e.stopPropagation()
        onClick(e)
      }}
      onMouseDown={(e) => e.stopPropagation()}
      className="grid h-6 w-6 place-items-center rounded-md text-subtext0 transition-colors"
      style={{ ['--h' as string]: hover }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
        e.currentTarget.style.color = hover
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent'
        e.currentTarget.style.color = mocha.subtext0
      }}
    >
      {children}
    </button>
  )
}

export function WindowChrome({
  win,
  focused,
  children,
  onTitlePointerDown,
}: {
  win: WMWindow
  focused: boolean
  children: ReactNode
  onTitlePointerDown?: (e: PointerEvent) => void
}) {
  const { closeWindow, toggleFloating, toggleFullscreen, focusWindow } = useWM()
  const def = APPS[win.appId]
  const Icon = def.icon

  return (
    <div
      className={`flex h-full w-full flex-col rounded-[10px] p-[2px] ${focused ? 'active-border' : ''}`}
      style={{
        background: focused ? undefined : hypr.inactiveBorder,
        boxShadow: focused ? hypr.shadow : '0 4px 16px rgba(17,17,27,0.4)',
      }}
      onMouseDown={() => focusWindow(win.id)}
    >
      <div className="flex h-full w-full flex-col overflow-hidden rounded-[8px] bg-base">
        {/* titlebar */}
        <div
          className="flex h-8 shrink-0 cursor-default items-center gap-2 border-b border-surface0 px-2.5 select-none"
          style={{
            cursor: win.floating ? 'grab' : 'default',
            background: `linear-gradient(180deg, color-mix(in oklab, ${mocha[def.accent]} 9%, ${mocha.mantle}), ${mocha.mantle})`,
          }}
          onPointerDown={onTitlePointerDown}
          onDoubleClick={() => toggleFullscreen(win.id)}
        >
          <Icon width={14} height={14} style={{ color: mocha[def.accent] }} />
          <span className="truncate font-mono text-xs text-subtext1">{win.title}</span>
          <div className="ml-auto flex items-center gap-0.5">
            <TitleButton title="Toggle floating (Super+V)" hover={mocha.yellow} onClick={() => toggleFloating(win.id)}>
              <FloatIcon width={13} height={13} />
            </TitleButton>
            <TitleButton title="Fullscreen (Super+F)" hover={mocha.green} onClick={() => toggleFullscreen(win.id)}>
              <FullscreenIcon width={13} height={13} />
            </TitleButton>
            <TitleButton title="Close (Super+Q)" hover={mocha.red} onClick={() => closeWindow(win.id)}>
              <CloseIcon width={14} height={14} />
            </TitleButton>
          </div>
        </div>
        {/* content */}
        <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
      </div>
    </div>
  )
}
