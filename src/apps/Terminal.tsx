import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { AppProps } from './types'
import { terminal } from '../data/terminal'
import {
  identity,
  about,
  projects,
  experience,
  openSource,
  skills,
  education,
  contact,
  shortUrl,
  hasRealGithub,
  RESUME_PATH,
  RESUME_FILENAME,
} from '../data/content'
import { mocha } from '../theme/catppuccin'
import { useWM, type AppId } from '../store/wm'

// ─────────────────────────────────────────────────────────────────────────────
// Scrollback block model. Each entry renders as one node in the scrollback.
// ─────────────────────────────────────────────────────────────────────────────
type BlockKind = 'cmd' | 'out' | 'err' | 'jsx'

interface Block {
  id: number
  kind: BlockKind
  text?: string
  node?: React.ReactNode
}

const VALID_APPS: AppId[] = [
  'terminal',
  'about',
  'projects',
  'experience',
  'skills',
  'contact',
  'resume',
]

const CHIP_COMMANDS = [
  'help',
  'about',
  'projects',
  'experience',
  // only advertise `oss` when there is something to show
  ...(openSource.length > 0 ? ['oss'] : []),
  'skills',
  'resume',
  'contact',
  'neofetch',
]

// Longest common prefix of a list of strings (for Tab completion).
function longestCommonPrefix(words: string[]): string {
  if (words.length === 0) return ''
  let prefix = words[0]
  for (let i = 1; i < words.length; i++) {
    const w = words[i]
    let j = 0
    while (j < prefix.length && j < w.length && prefix[j] === w[j]) j++
    prefix = prefix.slice(0, j)
    if (prefix === '') break
  }
  return prefix
}

// Tiny Levenshtein for "did you mean" suggestions.
function editDistance(a: string, b: string): number {
  const m = a.length
  const n = b.length
  const dp: number[] = Array.from({ length: n + 1 }, (_, i) => i)
  for (let i = 1; i <= m; i++) {
    let prev = dp[0]
    dp[0] = i
    for (let j = 1; j <= n; j++) {
      const tmp = dp[j]
      dp[j] = Math.min(
        dp[j] + 1,
        dp[j - 1] + 1,
        prev + (a[i - 1] === b[j - 1] ? 0 : 1),
      )
      prev = tmp
    }
  }
  return dp[n]
}

export default function Terminal(_props: AppProps) {
  const openApp = useWM((s) => s.openApp)

  const [blocks, setBlocks] = useState<Block[]>([])
  const [input, setInput] = useState('')
  const [, setHistory] = useState<string[]>([])

  // History navigation state (refs avoid stale closures in key handlers).
  const historyRef = useRef<string[]>([])
  const histIndexRef = useRef<number>(-1) // -1 = not navigating (editing draft)
  const draftRef = useRef<string>('')

  const inputRef = useRef<HTMLInputElement | null>(null)
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const blockIdRef = useRef(0)

  const commandNames = useMemo(() => terminal.commands.map((c) => c.name), [])
  const commandMap = useMemo(() => {
    const m = new Map<string, (typeof terminal.commands)[number]>()
    for (const c of terminal.commands) m.set(c.name.toLowerCase(), c)
    return m
  }, [])

  const nextBlockId = useCallback(() => ++blockIdRef.current, [])

  const pushBlocks = useCallback(
    (items: Array<Omit<Block, 'id'>>) => {
      setBlocks((prev) => [
        ...prev,
        ...items.map((it) => ({ ...it, id: nextBlockId() })),
      ])
    },
    [nextBlockId],
  )

  // Keep scrollback pinned to the bottom on new output.
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [blocks])

  // ── Renderers for dynamic content sections ────────────────────────────────
  const renderAbout = useCallback((): React.ReactNode => {
    return (
      <div className="whitespace-pre-wrap">
        <div>
          <span style={{ color: mocha.green }} className="font-semibold">
            {identity.name}
          </span>
          <span style={{ color: mocha.overlay1 }}> — </span>
          <span style={{ color: mocha.subtext1 }}>{identity.title}</span>
        </div>
        <div className="mt-2" style={{ color: mocha.text }}>
          {about.short}
        </div>
        {about.paragraphs.map((p, i) => (
          <div key={i} className="mt-2" style={{ color: mocha.subtext1 }}>
            {p}
          </div>
        ))}
      </div>
    )
  }, [])

  const renderProjects = useCallback((): React.ReactNode => {
    // Only the featured tier here — the full list (plus the live GitHub feed)
    // lives in the Projects window.
    const featured = projects.filter((p) => p.featured)
    const rest = projects.length - featured.length
    return (
      <div className="whitespace-pre-wrap">
        {featured.map((p, i) => (
          <div key={p.name} className={i > 0 ? 'mt-4' : ''}>
            <div>
              <span style={{ color: mocha.green }} className="font-semibold">
                {p.name}
              </span>
              {p.tagline ? (
                <span style={{ color: mocha.overlay1 }}> — {p.tagline}</span>
              ) : null}
            </div>
            <div className="mt-0.5">
              <span style={{ color: mocha.mauve }}>stack: </span>
              <span style={{ color: mocha.subtext0 }}>{p.stack.join(', ')}</span>
            </div>
            <div className="mt-1" style={{ color: mocha.subtext1 }}>
              {p.blurb}
            </div>
            {p.url ? (
              <div className="mt-0.5">
                <span style={{ color: mocha.overlay0 }}>↳ </span>
                <a
                  href={p.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  style={{ color: mocha.sky }}
                  className="underline decoration-dotted underline-offset-2 hover:opacity-80"
                >
                  {p.url}
                </a>
              </div>
            ) : null}
          </div>
        ))}
        {rest > 0 ? (
          <div className="mt-4" style={{ color: mocha.overlay1 }}>
            …plus {rest} more{hasRealGithub ? ', and every repo pulled live from GitHub' : ''} — run{' '}
            <span style={{ color: mocha.green }}>open projects</span>.
          </div>
        ) : null}
      </div>
    )
  }, [])

  const renderExperience = useCallback((): React.ReactNode => {
    return (
      <div className="whitespace-pre-wrap">
        {experience.map((e, i) => {
          const meta = [e.location, e.mode].filter(Boolean).join(' · ')
          return (
            <div key={`${e.role}-${e.company}`} className={i > 0 ? 'mt-4' : ''}>
              <div>
                <span style={{ color: mocha.green }} className="font-semibold">
                  {e.role}
                </span>
                <span style={{ color: mocha.overlay1 }}> @ </span>
                <span style={{ color: mocha.blue }}>{e.company}</span>
              </div>
              <div className="mt-0.5" style={{ color: mocha.subtext0 }}>
                {e.start}
                {' — '}
                {e.current ? (
                  <span style={{ color: mocha.green }}>{e.end}</span>
                ) : (
                  <span>{e.end}</span>
                )}
                {meta ? (
                  <span style={{ color: mocha.overlay0 }}>{`  (${meta})`}</span>
                ) : null}
              </div>
              <div className="mt-1">
                {e.bullets.map((b, bi) => (
                  <div key={bi} style={{ color: mocha.subtext1 }}>
                    <span style={{ color: mocha.peach }}>• </span>
                    {b}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    )
  }, [])

  const renderOpenSource = useCallback((): React.ReactNode => {
    if (openSource.length === 0) {
      return (
        <div style={{ color: mocha.overlay1 }}>
          No upstream contributions listed yet — check{' '}
          <span style={{ color: mocha.green }}>projects</span> instead.
        </div>
      )
    }
    return (
      <div className="whitespace-pre-wrap">
        {openSource.map((o, i) => (
          <div key={o.project} className={i > 0 ? 'mt-4' : ''}>
            <div>
              <span style={{ color: mocha.green }} className="font-semibold">
                {o.project}
              </span>
              <span style={{ color: mocha.overlay1 }}> — {o.tagline}</span>
            </div>
            <div className="mt-0.5">
              <span style={{ color: mocha.mauve }}>stack: </span>
              <span style={{ color: mocha.subtext0 }}>{o.stack.join(', ')}</span>
            </div>
            <div className="mt-1">
              {o.bullets.map((b, bi) => (
                <div key={bi} style={{ color: mocha.subtext1 }}>
                  <span style={{ color: mocha.teal }}>• </span>
                  {b}
                </div>
              ))}
            </div>
            {o.prs.map((pr) => (
              <div key={pr.url} className="mt-0.5">
                <span style={{ color: mocha.overlay0 }}>↳ </span>
                <a
                  href={pr.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  style={{ color: mocha.sky }}
                  className="underline decoration-dotted underline-offset-2 hover:opacity-80"
                >
                  {pr.label}
                </a>
                <span style={{ color: mocha.green }}> (merged)</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    )
  }, [])

  const renderSkills = useCallback((): React.ReactNode => {
    return (
      <div className="whitespace-pre-wrap">
        {skills.map((g, i) => (
          <div key={g.category} className={i > 0 ? 'mt-2' : ''}>
            <span style={{ color: mocha.mauve }} className="font-semibold">
              {g.category}
            </span>
            <span style={{ color: mocha.overlay1 }}>: </span>
            <span style={{ color: mocha.text }}>{g.items.join('  ')}</span>
          </div>
        ))}
      </div>
    )
  }, [])

  const renderEducation = useCallback((): React.ReactNode => {
    return (
      <div className="whitespace-pre-wrap">
        {education.map((ed, i) => {
          const isPresent = /present/i.test(ed.end)
          return (
            <div
              key={`${ed.degree}-${ed.institution}`}
              className={i > 0 ? 'mt-3' : ''}
            >
              <div>
                <span style={{ color: mocha.green }} className="font-semibold">
                  {ed.degree}
                </span>
                <span style={{ color: mocha.overlay1 }}> @ </span>
                <span style={{ color: mocha.blue }}>{ed.institution}</span>
              </div>
              <div className="mt-0.5" style={{ color: mocha.subtext0 }}>
                {ed.start}
                {' — '}
                {isPresent ? (
                  <span style={{ color: mocha.green }}>{ed.end}</span>
                ) : (
                  <span>{ed.end}</span>
                )}
                {ed.location ? (
                  <span style={{ color: mocha.overlay0 }}>{`  (${ed.location})`}</span>
                ) : null}
              </div>
              {ed.detail ? (
                <div className="mt-1" style={{ color: mocha.subtext1 }}>
                  {ed.detail}
                </div>
              ) : null}
            </div>
          )
        })}
      </div>
    )
  }, [])

  const renderContact = useCallback((): React.ReactNode => {
    const linkedinShort = shortUrl(contact.linkedin)
    const githubShort = shortUrl(contact.github)
    const label = (s: string) => (
      <span style={{ color: mocha.mauve }}>{s.padEnd(10)}</span>
    )
    return (
      <div className="whitespace-pre-wrap">
        <div>
          {label('email')}
          <a
            href={`mailto:${contact.email}`}
            style={{ color: mocha.sky }}
            className="underline decoration-dotted underline-offset-2 hover:opacity-80"
          >
            {contact.email}
          </a>
        </div>
        {contact.phone ? (
          <div>
            {label('phone')}
            <span style={{ color: mocha.text }}>{contact.phone}</span>
          </div>
        ) : null}
        <div>
          {label('linkedin')}
          <a
            href={contact.linkedin}
            target="_blank"
            rel="noreferrer noopener"
            style={{ color: mocha.sky }}
            className="underline decoration-dotted underline-offset-2 hover:opacity-80"
          >
            {linkedinShort}
          </a>
        </div>
        <div>
          {label('github')}
          <a
            href={contact.github}
            target="_blank"
            rel="noreferrer noopener"
            style={{ color: mocha.sky }}
            className="underline decoration-dotted underline-offset-2 hover:opacity-80"
          >
            {githubShort}
          </a>
        </div>
        <div>
          {label('location')}
          <span style={{ color: mocha.text }}>{contact.location}</span>
        </div>
      </div>
    )
  }, [])

  const renderNeofetch = useCallback((): React.ReactNode => {
    const palette: string[] = [
      mocha.red,
      mocha.peach,
      mocha.yellow,
      mocha.green,
      mocha.teal,
      mocha.blue,
      mocha.mauve,
      mocha.pink,
    ]
    const dashCount = Math.min(
      24,
      identity.username.length + identity.host.length + 1,
    )
    return (
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-5">
        <pre
          className="whitespace-pre text-[11px] leading-[1.15]"
          style={{ color: mocha.blue }}
        >
          {terminal.neofetchArt.join('\n')}
        </pre>
        <div className="min-w-0">
          <div>
            <span style={{ color: mocha.green }} className="font-semibold">
              {identity.username}
            </span>
            <span style={{ color: mocha.overlay1 }}>@</span>
            <span style={{ color: mocha.green }} className="font-semibold">
              {identity.host}
            </span>
          </div>
          <div style={{ color: mocha.overlay0 }}>{'-'.repeat(dashCount)}</div>
          <div className="mt-0.5">
            {terminal.neofetchInfo.map((row) => (
              <div key={row.key}>
                <span style={{ color: mocha.blue }} className="font-semibold">
                  {row.key}
                </span>
                <span style={{ color: mocha.overlay1 }}>: </span>
                <span style={{ color: mocha.text }}>{row.value}</span>
              </div>
            ))}
          </div>
          <div className="mt-2 flex gap-1">
            {palette.map((c, i) => (
              <span
                key={i}
                className="inline-block h-3 w-3 rounded-sm"
                style={{ background: c }}
              />
            ))}
          </div>
        </div>
      </div>
    )
  }, [])

  // ── Welcome / discoverability chips ───────────────────────────────────────
  // Chips live inside a rendered block; point them at the latest runCommand.
  const runCommandRef = useRef<(line: string) => void>(() => {})

  const renderWelcome = useCallback((): React.ReactNode => {
    return (
      <div>
        <div className="whitespace-pre-wrap" style={{ color: mocha.subtext1 }}>
          {terminal.welcome}
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {CHIP_COMMANDS.map((cmd) => (
            <button
              key={cmd}
              type="button"
              onClick={(ev) => {
                ev.stopPropagation()
                runCommandRef.current(cmd)
                inputRef.current?.focus()
              }}
              className="rounded-md border border-surface1 bg-surface0/40 px-2 py-0.5 text-[12px] text-green transition-colors hover:border-green/60 hover:bg-surface0"
            >
              {cmd}
            </button>
          ))}
        </div>
      </div>
    )
  }, [])

  // Seed the welcome block once, on mount.
  useEffect(() => {
    setBlocks([{ id: nextBlockId(), kind: 'jsx', node: renderWelcome() }])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Command dispatch ──────────────────────────────────────────────────────
  const triggerResumeDownload = useCallback(() => {
    try {
      const a = document.createElement('a')
      a.href = RESUME_PATH
      a.download = RESUME_FILENAME
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    } catch {
      // best-effort download; ignore failures
    }
  }, [])

  // Produces the output block(s) for a parsed command.
  const dispatch = useCallback(
    (raw: string): Array<Omit<Block, 'id'>> => {
      const trimmed = raw.trim()
      if (trimmed === '') return []

      const parts = trimmed.split(/\s+/)
      const first = parts[0].toLowerCase()
      const args = parts.slice(1)
      const cmd = commandMap.get(first)

      if (!cmd) {
        // Unknown command — zsh-style not-found + optional suggestion.
        let suggestion = ''
        let best = Infinity
        for (const name of commandNames) {
          const d = editDistance(first, name.toLowerCase())
          if (d < best && d <= 2) {
            best = d
            suggestion = name
          }
        }
        const out: Array<Omit<Block, 'id'>> = [
          { kind: 'err', text: `zsh: command not found: ${parts[0]}` },
        ]
        if (suggestion) {
          out.push({ kind: 'out', text: `did you mean '${suggestion}'?` })
        }
        out.push({
          kind: 'out',
          text: "Type 'help' for a list of available commands.",
        })
        return out
      }

      switch (cmd.kind) {
        case 'static': {
          if (cmd.name === 'echo') {
            return [{ kind: 'out', text: args.join(' ') }]
          }
          return [{ kind: 'out', text: cmd.staticOutput ?? '' }]
        }

        case 'easteregg': {
          return [{ kind: 'out', text: cmd.staticOutput ?? '' }]
        }

        case 'dynamic': {
          switch (cmd.dynamicSource) {
            case 'about':
              return [{ kind: 'jsx', node: renderAbout() }]
            case 'projects':
              return [{ kind: 'jsx', node: renderProjects() }]
            case 'experience':
              return [{ kind: 'jsx', node: renderExperience() }]
            case 'opensource':
              return [{ kind: 'jsx', node: renderOpenSource() }]
            case 'skills':
              return [{ kind: 'jsx', node: renderSkills() }]
            case 'education':
              return [{ kind: 'jsx', node: renderEducation() }]
            case 'contact':
              return [{ kind: 'jsx', node: renderContact() }]
            default:
              return [{ kind: 'err', text: `nothing to show for '${cmd.name}'` }]
          }
        }

        case 'action': {
          const action = cmd.action ?? ''
          if (action === 'clear') {
            // Handled by runCommand before dispatch; no output here.
            return []
          }
          if (action === 'neofetch') {
            return [{ kind: 'jsx', node: renderNeofetch() }]
          }
          if (action === 'download:resume') {
            const sub = args[0]?.toLowerCase()
            if (sub === 'open' || sub === 'view') {
              openApp('resume')
              return [{ kind: 'out', text: 'Opening resume …' }]
            }
            triggerResumeDownload()
            return [
              {
                kind: 'jsx',
                node: (
                  <div className="whitespace-pre-wrap">
                    <div style={{ color: mocha.green }}>
                      Downloading {RESUME_FILENAME} …
                    </div>
                    <div style={{ color: mocha.overlay1 }}>
                      (also: 'open resume' to view it in a window)
                    </div>
                  </div>
                ),
              },
            ]
          }
          if (action === 'help') {
            const help = commandMap.get('help')
            return [{ kind: 'out', text: help?.staticOutput ?? '' }]
          }
          if (action === 'history') {
            const list = historyRef.current
            if (list.length === 0) {
              return [{ kind: 'out', text: '(no commands yet)' }]
            }
            const text = list
              .map((c, i) => `${String(i + 1).padStart(4)}  ${c}`)
              .join('\n')
            return [{ kind: 'out', text }]
          }
          if (action === 'sudo') {
            return [
              {
                kind: 'jsx',
                node: (
                  <div className="whitespace-pre-wrap">
                    <div style={{ color: mocha.subtext0 }}>
                      [sudo] password for {identity.username}:{'  '}
                    </div>
                    <div style={{ color: mocha.red }}>
                      Nice try. You don&apos;t have root here — but you can{' '}
                      <span style={{ color: mocha.green }}>open contact</span> to
                      reach me. 🔒
                    </div>
                  </div>
                ),
              },
            ]
          }
          if (action === 'open') {
            const target = args[0]?.toLowerCase()
            if (target && (VALID_APPS as string[]).includes(target)) {
              openApp(target as AppId)
              return [{ kind: 'out', text: `Opening ${target} …` }]
            }
            return [
              {
                kind: 'jsx',
                node: (
                  <div className="whitespace-pre-wrap">
                    <div style={{ color: mocha.red }}>
                      open: unknown app{args[0] ? ` '${args[0]}'` : ''}
                    </div>
                    <div style={{ color: mocha.subtext1 }}>
                      <span style={{ color: mocha.overlay1 }}>available: </span>
                      {VALID_APPS.join('  ')}
                    </div>
                  </div>
                ),
              },
            ]
          }
          return [{ kind: 'err', text: `unhandled action: ${action}` }]
        }

        default:
          return [{ kind: 'err', text: `unhandled command: ${cmd.name}` }]
      }
    },
    [
      commandMap,
      commandNames,
      openApp,
      renderAbout,
      renderProjects,
      renderExperience,
      renderOpenSource,
      renderSkills,
      renderEducation,
      renderContact,
      renderNeofetch,
      triggerResumeDownload,
    ],
  )

  // Echo the entered line as a prompt block.
  const echoBlock = useCallback(
    (line: string): Omit<Block, 'id'> => ({ kind: 'cmd', text: line }),
    [],
  )

  // Run a command line (shared by Enter and chip clicks).
  const runCommand = useCallback(
    (line: string) => {
      const trimmed = line.trim()

      // Record in command history (skip blanks and consecutive duplicates).
      // Update the ref synchronously so commands like `history` (which read
      // historyRef during dispatch below) see the just-entered command.
      if (trimmed) {
        const prev = historyRef.current
        const next =
          prev[prev.length - 1] === trimmed ? prev : [...prev, trimmed]
        historyRef.current = next
        setHistory(next)
      }
      histIndexRef.current = -1
      draftRef.current = ''

      // Empty line: just reprint a prompt.
      if (trimmed === '') {
        pushBlocks([echoBlock('')])
        return
      }

      // Clear is special: wipe the scrollback entirely.
      const first = trimmed.split(/\s+/)[0].toLowerCase()
      const cmd = commandMap.get(first)
      if (cmd && cmd.kind === 'action' && cmd.action === 'clear') {
        setBlocks([])
        return
      }

      const output = dispatch(trimmed)
      pushBlocks([echoBlock(line), ...output])
    },
    [commandMap, dispatch, echoBlock, pushBlocks],
  )

  // Keep ref in sync so chips (rendered inside blocks) call the latest version.
  useEffect(() => {
    runCommandRef.current = runCommand
  }, [runCommand])

  // ── Input key handling ────────────────────────────────────────────────────
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Ctrl+L clears.
      if (e.ctrlKey && (e.key === 'l' || e.key === 'L')) {
        e.preventDefault()
        setBlocks([])
        return
      }

      if (e.key === 'Enter') {
        e.preventDefault()
        const line = input
        setInput('')
        runCommand(line)
        return
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault()
        const list = historyRef.current
        if (list.length === 0) return
        if (histIndexRef.current === -1) {
          // Save current draft before entering history.
          draftRef.current = input
          histIndexRef.current = list.length - 1
        } else if (histIndexRef.current > 0) {
          histIndexRef.current -= 1
        }
        setInput(list[histIndexRef.current] ?? '')
        return
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        const list = historyRef.current
        if (histIndexRef.current === -1) return
        if (histIndexRef.current < list.length - 1) {
          histIndexRef.current += 1
          setInput(list[histIndexRef.current] ?? '')
        } else {
          // Past the newest → restore the draft.
          histIndexRef.current = -1
          setInput(draftRef.current)
        }
        return
      }

      if (e.key === 'Tab') {
        e.preventDefault()
        const value = input
        const leadingWs = value.match(/^\s*/)?.[0] ?? ''
        const rest = value.slice(leadingWs.length)
        // Only complete the command name (no space typed yet).
        if (rest.includes(' ')) return
        const token = rest.toLowerCase()
        if (token === '') return
        const matches = commandNames.filter((n) =>
          n.toLowerCase().startsWith(token),
        )
        if (matches.length === 0) return
        if (matches.length === 1) {
          setInput(leadingWs + matches[0] + ' ')
          return
        }
        // Multiple: print candidates + fill the longest common prefix.
        const lcp = longestCommonPrefix(matches.map((m) => m.toLowerCase()))
        pushBlocks([{ kind: 'out', text: matches.join('   ') }])
        if (lcp.length > token.length) {
          setInput(leadingWs + lcp)
        }
        return
      }
    },
    [input, runCommand, commandNames, pushBlocks],
  )

  // While the user types normally, exit history-navigation mode.
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      histIndexRef.current = -1
      setInput(e.target.value)
    },
    [],
  )

  // ── Render helpers ────────────────────────────────────────────────────────
  const promptEl = (
    <span style={{ color: mocha.green }} className="shrink-0 font-semibold">
      {terminal.prompt}
    </span>
  )

  const renderBlock = (b: Block): React.ReactNode => {
    switch (b.kind) {
      case 'cmd':
        return (
          <div className="flex gap-2">
            {promptEl}
            <span style={{ color: mocha.text }} className="break-all">
              {b.text}
            </span>
          </div>
        )
      case 'err':
        return (
          <div className="whitespace-pre-wrap" style={{ color: mocha.red }}>
            {b.text}
          </div>
        )
      case 'out':
        return (
          <div className="whitespace-pre-wrap" style={{ color: mocha.subtext1 }}>
            {b.text}
          </div>
        )
      case 'jsx':
        return <div>{b.node}</div>
      default:
        return null
    }
  }

  return (
    <div
      className="flex h-full w-full flex-col bg-base font-mono text-[13px] leading-relaxed text-text"
      onClick={() => inputRef.current?.focus()}
    >
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3">
        <div className="flex flex-col gap-1.5">
          {blocks.map((b) => (
            <div key={b.id}>{renderBlock(b)}</div>
          ))}

          {/* Active input line, pinned at the bottom of the scrollback. */}
          <div className="flex items-center gap-2">
            {promptEl}
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              autoFocus
              spellCheck={false}
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              aria-label="terminal input"
              className="min-w-0 flex-1 border-0 bg-transparent p-0 font-mono text-[13px] text-text outline-none focus:outline-none focus:ring-0"
              style={{ caretColor: mocha.green }}
            />
            <span
              className="cursor-blink shrink-0"
              style={{ color: mocha.green }}
            >
              ▋
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
