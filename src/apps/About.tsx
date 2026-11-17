import type { ReactNode } from 'react'
import type { AppProps } from './types'
import { identity, about, funExtras } from '../data/content'
import { mocha, type ColorName } from '../theme/catppuccin'
import { AppScroll, PathBar, SectionLabel, Tag, Card } from './_ui'
import { GithubIcon, LinkedinIcon, MailIcon } from '../components/icons'

// Accents cycled across interest chips (literal array, indexed by i — never runtime class strings).
const INTEREST_ACCENTS: ColorName[] = ['mauve', 'blue', 'green', 'peach', 'teal', 'pink', 'yellow', 'sky']
const STAT_ACCENTS: ColorName[] = ['green', 'teal', 'blue', 'mauve']

function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  const first = parts[0]?.[0] ?? ''
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : ''
  return (first + last).toUpperCase()
}

function QuickLink({
  href,
  icon,
  label,
  accent,
}: {
  href: string
  icon: ReactNode
  label: string
  accent: ColorName
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      className="tag-accent group inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-transform hover:-translate-y-0.5"
      style={{ ['--a' as string]: mocha[accent] }}
    >
      {icon}
      <span className="font-mono text-xs">{label}</span>
    </a>
  )
}

export default function About(_props: AppProps) {
  return (
    <AppScroll>
      <PathBar path="about/me.md" accent="mauve" />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <header className="flex flex-col gap-5 sm:flex-row sm:items-center">
        {/* animated gradient ring around the monogram */}
        <div className="active-border h-24 w-24 shrink-0 rounded-2xl p-[2px] shadow-lg">
          <div
            className="grid h-full w-full place-items-center rounded-[14px] select-none"
            style={{
              background: `linear-gradient(135deg, ${mocha.crust} 0%, ${mocha.base} 100%)`,
            }}
          >
            <span className="font-mono text-3xl font-bold tracking-tight text-text">{initials(identity.name)}</span>
          </div>
        </div>

        <div className="min-w-0 space-y-1.5">
          <h1 className="text-2xl font-bold tracking-tight text-text sm:text-3xl">{identity.name}</h1>
          <p className="font-mono text-xs leading-relaxed text-subtext0">{identity.title}</p>
          <p className="text-sm leading-relaxed text-subtext1 italic">{identity.tagline}</p>
          <p className="flex items-center gap-2 text-sm text-subtext0">
            <span
              className="inline-block h-1.5 w-1.5 rounded-full"
              style={{ background: mocha.green, boxShadow: `0 0 6px ${mocha.green}` }}
            />
            {identity.location}
            {identity.availability && (
              <>
                <span className="text-overlay0">·</span>
                <span style={{ color: mocha.green }}>{identity.availability}</span>
              </>
            )}
          </p>
        </div>
      </header>

      {/* ── Stats ────────────────────────────────────────────────────────── */}
      <div className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {about.stats.map((stat, i) => {
          const accent = STAT_ACCENTS[i % STAT_ACCENTS.length]
          return (
            <Card key={stat.label} accent={accent} bar className="rounded-xl px-3.5 py-3 pt-3.5">
              <div className="font-mono text-xl font-bold tracking-tight" style={{ color: mocha[accent] }}>
                {stat.value}
              </div>
              <div className="mt-0.5 text-[11px] leading-snug text-subtext0">{stat.label}</div>
            </Card>
          )
        })}
      </div>

      {/* ── Quick links ──────────────────────────────────────────────────── */}
      <div className="mt-5 flex flex-wrap gap-2.5">
        <QuickLink
          href={identity.github}
          label="GitHub"
          accent="lavender"
          icon={<GithubIcon width={16} height={16} />}
        />
        <QuickLink
          href={identity.linkedin}
          label="LinkedIn"
          accent="blue"
          icon={<LinkedinIcon width={16} height={16} />}
        />
        <QuickLink
          href={`mailto:${identity.email}`}
          label="Email"
          accent="peach"
          icon={<MailIcon width={16} height={16} />}
        />
      </div>

      {/* ── whoami ───────────────────────────────────────────────────────── */}
      <section className="mt-8">
        <SectionLabel accent="mauve">whoami</SectionLabel>
        <div className="space-y-4">
          {about.paragraphs.map((para, i) => (
            <p key={i} className="text-sm leading-relaxed text-subtext1">
              {para}
            </p>
          ))}
        </div>
      </section>

      {/* ── highlights ───────────────────────────────────────────────────── */}
      <section className="mt-8">
        <SectionLabel accent="green">highlights</SectionLabel>
        <div className="grid gap-2.5 sm:grid-cols-2">
          {about.highlights.map((item, i) => (
            <Card key={i} accent="green" className="flex gap-2.5 rounded-xl px-3.5 py-3">
              <span className="mt-0.5 shrink-0 font-mono text-xs" style={{ color: mocha.green }}>
                ▪
              </span>
              <span className="text-sm leading-relaxed text-subtext1">{item}</span>
            </Card>
          ))}
        </div>
      </section>

      {/* ── interests ────────────────────────────────────────────────────── */}
      <section className="mt-8 mb-2">
        <SectionLabel accent="pink">interests</SectionLabel>
        <div className="flex flex-wrap gap-2">
          {funExtras.interests.map((interest, i) => (
            <Tag key={i} accent={INTEREST_ACCENTS[i % INTEREST_ACCENTS.length]}>
              {interest}
            </Tag>
          ))}
        </div>
      </section>
    </AppScroll>
  )
}
