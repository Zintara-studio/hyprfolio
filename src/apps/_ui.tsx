// Shared, themed building blocks so every app window looks like it belongs to
// the same desktop. App components compose these.
//
// NOTE: accent colours are applied via inline styles from the `mocha` palette
// (never runtime-constructed Tailwind classes), so they always render.
import type { ReactNode } from 'react'
import { mocha, type ColorName } from '../theme/catppuccin'
import { ExternalIcon } from '../components/icons'

/** Scrollable, padded content area for an app window. */
export function AppScroll({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`h-full overflow-y-auto bg-base px-6 py-5 text-text ${className}`}>{children}</div>
}

/** A small "code editor" style breadcrumb / file path header. */
export function PathBar({ path, accent = 'mauve' }: { path: string; accent?: ColorName }) {
  return (
    <div className="mb-4 flex items-center gap-2 font-mono text-xs text-subtext0">
      <span style={{ color: mocha[accent] }}>~</span>
      <span className="text-overlay1">/</span>
      <span>{path}</span>
    </div>
  )
}

export function SectionLabel({ children, accent = 'blue' }: { children: ReactNode; accent?: ColorName }) {
  return (
    <div className="mb-3 flex items-center gap-2" style={{ ['--a' as string]: mocha[accent] }}>
      <span className="font-mono text-sm" style={{ color: mocha[accent] }}>
        ##
      </span>
      <h2 className="font-mono text-sm font-semibold tracking-wide text-text uppercase">{children}</h2>
      <span className="rule-accent h-px flex-1" />
    </div>
  )
}

export function Tag({ children, accent = 'blue' }: { children: ReactNode; accent?: ColorName }) {
  return (
    <span
      className="tag-accent inline-flex items-center rounded-md px-2 py-0.5 font-mono text-xs"
      style={{ ['--a' as string]: mocha[accent] }}
    >
      {children}
    </span>
  )
}

/** Accent-tinted panel: hover lift + glow, optional top accent bar. */
export function Card({
  children,
  accent = 'blue',
  bar = false,
  className = '',
}: {
  children: ReactNode
  accent?: ColorName
  bar?: boolean
  className?: string
}) {
  return (
    <div
      className={`card overflow-hidden ${bar ? 'card-bar' : ''} ${className}`}
      style={{ ['--a' as string]: mocha[accent] }}
    >
      {children}
    </div>
  )
}

/** Rounded gradient tile behind a small icon — used for card headers. */
export function IconTile({ children, accent = 'blue' }: { children: ReactNode; accent?: ColorName }) {
  const hex = mocha[accent]
  return (
    <span
      className="grid h-9 w-9 shrink-0 place-items-center rounded-lg"
      style={{
        color: mocha.crust,
        background: `linear-gradient(135deg, ${hex}, color-mix(in oklab, ${hex} 55%, ${mocha.crust}))`,
        boxShadow: `0 4px 14px -6px ${hex}`,
      }}
    >
      {children}
    </span>
  )
}

export function Bullet({ children, accent = 'green' }: { children: ReactNode; accent?: ColorName }) {
  return (
    <li className="flex gap-2.5 text-sm leading-relaxed text-subtext1">
      <span className="mt-1.5 shrink-0 font-mono text-[10px]" style={{ color: mocha[accent] }}>
        ▪
      </span>
      <span>{children}</span>
    </li>
  )
}

export function ExternalLink({
  href,
  children,
  accent = 'sapphire',
}: {
  href: string
  children: ReactNode
  accent?: ColorName
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      className="inline-flex items-center gap-1.5 underline-offset-2 hover:underline"
      style={{ color: mocha[accent] }}
    >
      {children}
      <ExternalIcon width={13} height={13} />
    </a>
  )
}

export function Divider() {
  return <div className="my-5 h-px bg-surface0" />
}

/** A key=value row, mono, for vcf / config-file vibes. */
export function KeyVal({ k, children, accent = 'yellow' }: { k: string; children: ReactNode; accent?: ColorName }) {
  return (
    <div className="flex flex-wrap gap-x-3 font-mono text-sm">
      <span className="w-28 shrink-0" style={{ color: mocha[accent] }}>
        {k}
      </span>
      <span className="text-text">{children}</span>
    </div>
  )
}
