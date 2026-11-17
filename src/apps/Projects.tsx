// Projects.tsx — three tiers, decreasing in weight:
//   1. featured   → rich cards (blurb + bullets + stack)
//   2. also built → compact rows (blurb + inline stack)
//   3. more on GitHub → live feed from the GitHub API so it stays current
//      (hidden, and never fetched, while identity.github is the placeholder)
import { useEffect, useState } from 'react'
import type { AppProps } from './types'
import { projects, projectsIntro, identity, githubHandle, hasRealGithub, hiddenRepos } from '../data/content'
import { mocha, type ColorName } from '../theme/catppuccin'
import { AppScroll, PathBar, SectionLabel, Tag, Bullet, ExternalLink, Card, IconTile } from './_ui'
import { FolderIcon, GithubIcon } from '../components/icons'

// Cycled per-card accent colours (literal ColorName values only).
const ACCENTS: ColorName[] = ['blue', 'mauve', 'green', 'peach']

// GitHub handle, derived from identity.github so there's one source of truth.
const GH_USER = githubHandle

/** `repo` is either a bare name (under GH_USER) or `owner/name`. */
function repoUrl(repo: string): string {
  return `https://github.com/${repo.includes('/') ? repo : `${GH_USER}/${repo}`}`
}

/** Bare repo name, for de-duplicating against the live feed. */
function repoName(repo: string): string {
  return repo.split('/').pop() ?? repo
}

const FEATURED = projects.filter((p) => p.featured)
const ALSO_BUILT = projects.filter((p) => !p.featured)

/** Strip protocol / trailing slash so a URL reads like a clean domain label. */
function domainLabel(url: string): string {
  return url.replace(/^https?:\/\//i, '').replace(/\/+$/, '')
}

export default function Projects(_props: AppProps) {
  return (
    <AppScroll>
      <PathBar path="projects" accent="blue" />

      {projectsIntro && (
        <p className="mb-5 max-w-2xl text-sm leading-relaxed text-subtext1">{projectsIntro}</p>
      )}

      {FEATURED.length > 0 && <SectionLabel accent="blue">featured projects</SectionLabel>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {FEATURED.map((project, i) => {
          const accent = ACCENTS[i % ACCENTS.length]
          return (
            <Card key={project.name} accent={accent} bar className="flex flex-col rounded-xl p-4 pt-4.5">
              {/* Header: gradient icon tile + name, tagline beneath */}
              <div className="mb-2.5 flex items-start gap-3">
                <IconTile accent={accent}>
                  <FolderIcon width={17} height={17} />
                </IconTile>
                <div className="min-w-0">
                  <h3 className="font-semibold leading-tight text-text">{project.name}</h3>
                  <p className="font-mono text-xs leading-snug text-subtext0">{project.tagline}</p>
                </div>
              </div>

              <p className="mb-3 text-sm leading-relaxed text-subtext1">{project.blurb}</p>

              {project.bullets.length > 0 && (
                <ul className="mb-3 flex flex-col gap-1.5">
                  {project.bullets.map((b, bi) => (
                    <Bullet key={bi} accent={accent}>
                      {b}
                    </Bullet>
                  ))}
                </ul>
              )}

              {project.stack.length > 0 && (
                <div className="mb-4 flex flex-wrap gap-1.5">
                  {project.stack.map((tech) => (
                    <Tag key={tech} accent={accent}>
                      {tech}
                    </Tag>
                  ))}
                </div>
              )}

              {/* Footer: live link and/or source link, pinned to the bottom */}
              <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-surface0 pt-3">
                <ProjectLinks project={project} accent={accent} />
              </div>
            </Card>
          )
        })}
      </div>

      {ALSO_BUILT.length > 0 && (
        <section className="mt-8">
          <SectionLabel accent="teal">also built</SectionLabel>

          <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-2">
            {ALSO_BUILT.map((project, i) => {
              const accent = ACCENTS[(i + 2) % ACCENTS.length]
              return (
                <Card key={project.name} accent={accent} className="rounded-lg px-3.5 py-3">
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                    <h3 className="text-sm font-semibold text-text">{project.name}</h3>
                    <p className="font-mono text-[11px] text-subtext0">{project.tagline}</p>
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-subtext1">{project.blurb}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="font-mono text-[11px]" style={{ color: mocha[accent] }}>
                      {project.stack.join(' · ')}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                    <ProjectLinks project={project} accent={accent} />
                  </div>
                </Card>
              )
            })}
          </div>
        </section>
      )}

      {hasRealGithub && <MoreOnGithub />}
    </AppScroll>
  )
}

/** Live-site link and/or source link, with an honest fallback when neither exists. */
function ProjectLinks({
  project,
  accent,
}: {
  project: (typeof projects)[number]
  accent: ColorName
}) {
  return (
    <>
      {project.url && (
        <ExternalLink href={project.url} accent={accent}>
          <span className="font-mono text-xs">{domainLabel(project.url)}</span>
        </ExternalLink>
      )}
      {project.repo ? (
        <ExternalLink href={repoUrl(project.repo)} accent={accent}>
          <span className="inline-flex items-center gap-1.5 font-mono text-xs">
            <GithubIcon width={13} height={13} />
            source
          </span>
        </ExternalLink>
      ) : (
        !project.url && (
          <span className="inline-flex items-center gap-1.5 font-mono text-xs text-overlay1">
            <GithubIcon width={13} height={13} />
            Source available on request
          </span>
        )
      )}
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// "more on GitHub" — live feed of every other owned repo.
// ─────────────────────────────────────────────────────────────────────────────

interface GhRepo {
  id: number
  name: string
  description: string | null
  html_url: string
  homepage: string | null
  language: string | null
  stargazers_count: number
  fork: boolean
  archived: boolean
  pushed_at: string
}

type FeedState = { status: 'loading' } | { status: 'ready'; repos: GhRepo[] } | { status: 'error' }

// Repos already shown as a card above, your profile README repo (named after
// your handle) and anything listed in `hiddenRepos` in content.ts — kept out of
// the live feed to avoid dupes and noise.
const EXCLUDED_REPOS = new Set<string>([
  ...projects.flatMap((p) => (p.repo ? [repoName(p.repo)] : [])),
  GH_USER,
  ...hiddenRepos,
])

const CACHE_KEY = `gh-repos:${GH_USER}`

/** Fetch owned, non-fork repos from the GitHub API, newest first, with a
 *  per-session cache so reopening the window is instant. */
function useGithubRepos(): FeedState {
  const [state, setState] = useState<FeedState>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false

    // Paint instantly from cache if we fetched earlier this session.
    try {
      const cached = sessionStorage.getItem(CACHE_KEY)
      if (cached) setState({ status: 'ready', repos: JSON.parse(cached) as GhRepo[] })
    } catch {
      /* ignore unavailable / corrupt cache */
    }

    fetch(`https://api.github.com/users/${GH_USER}/repos?per_page=100&sort=pushed`, {
      headers: { Accept: 'application/vnd.github+json' },
    })
      .then((r) => {
        if (!r.ok) throw new Error(`GitHub ${r.status}`)
        return r.json() as Promise<GhRepo[]>
      })
      .then((all) => {
        if (cancelled) return
        const repos = all
          .filter((r) => !r.fork && !r.archived && !EXCLUDED_REPOS.has(r.name))
          .sort((a, b) =>
            b.stargazers_count !== a.stargazers_count
              ? b.stargazers_count - a.stargazers_count
              : b.pushed_at.localeCompare(a.pushed_at),
          )
        try {
          sessionStorage.setItem(CACHE_KEY, JSON.stringify(repos))
        } catch {
          /* storage full / unavailable — non-fatal */
        }
        setState({ status: 'ready', repos })
      })
      .catch(() => {
        if (cancelled) return
        // Keep cached results on screen if we already have them; otherwise error.
        setState((prev) => (prev.status === 'ready' ? prev : { status: 'error' }))
      })

    return () => {
      cancelled = true
    }
  }, [])

  return state
}

function MoreOnGithub() {
  const feed = useGithubRepos()

  return (
    <section className="mt-8">
      <SectionLabel accent="sapphire">more on github</SectionLabel>

      <p className="mb-4 max-w-2xl text-sm leading-relaxed text-subtext1">
        Everything else I&apos;ve pushed — coursework, experiments, and half-finished ideas — pulled live from{' '}
        <ExternalLink href={identity.github} accent="sapphire">
          <span className="font-mono text-xs">github.com/{GH_USER}</span>
        </ExternalLink>
        , newest first.
      </p>

      {feed.status === 'loading' && <FeedSkeleton />}

      {feed.status === 'error' && (
        <Card accent="sapphire" className="rounded-xl p-4 text-sm leading-relaxed text-subtext1">
          Couldn&apos;t reach the GitHub API right now (it rate-limits anonymous requests).{' '}
          <ExternalLink href={`${identity.github}?tab=repositories`} accent="sapphire">
            Browse the repos directly
          </ExternalLink>
          .
        </Card>
      )}

      {feed.status === 'ready' &&
        (feed.repos.length === 0 ? (
          <p className="text-sm text-subtext0">Nothing else to show here yet.</p>
        ) : (
          <ul className="grid grid-cols-1 gap-2 lg:grid-cols-2">
            {feed.repos.map((repo) => (
              <RepoRow key={repo.id} repo={repo} />
            ))}
          </ul>
        ))}
    </section>
  )
}

function RepoRow({ repo }: { repo: GhRepo }) {
  return (
    <li>
      <Card accent="sapphire" className="flex h-full items-start gap-3 rounded-lg px-3.5 py-3">
        <span className="mt-0.5 shrink-0 text-overlay1">
          <GithubIcon width={15} height={15} />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <a
              href={repo.html_url}
              target="_blank"
              rel="noreferrer noopener"
              className="font-mono text-sm text-text underline-offset-2 hover:underline"
            >
              {repo.name}
            </a>
            {repo.language && <span className="font-mono text-[11px] text-subtext0">· {repo.language}</span>}
            {repo.stargazers_count > 0 && (
              <span className="font-mono text-[11px]" style={{ color: mocha.yellow }}>
                ★ {repo.stargazers_count}
              </span>
            )}
          </div>
          {repo.description && <p className="mt-0.5 text-xs leading-relaxed text-subtext1">{repo.description}</p>}
        </div>

        {repo.homepage && (
          <span className="mt-0.5 shrink-0">
            <ExternalLink href={repo.homepage} accent="sapphire">
              <span className="font-mono text-[11px]">live</span>
            </ExternalLink>
          </span>
        )}
      </Card>
    </li>
  )
}

function FeedSkeleton() {
  return (
    <ul className="grid grid-cols-1 gap-2 lg:grid-cols-2" aria-hidden>
      {Array.from({ length: 6 }).map((_, i) => (
        <li key={i} className="flex items-center gap-3 rounded-lg border border-surface0 bg-mantle px-3.5 py-3">
          <span className="h-3.5 w-3.5 shrink-0 animate-pulse rounded bg-surface1" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-1/3 animate-pulse rounded bg-surface1" />
            <div className="h-2.5 w-2/3 animate-pulse rounded bg-surface0" />
          </div>
        </li>
      ))}
    </ul>
  )
}
