// ─────────────────────────────────────────────────────────────────────────────
// Portfolio content — the single source of truth.
//
// This is the ONE file you edit to make hyprfolio yours. Every window, the
// terminal (welcome, prompt, neofetch, whoami, ls, cowsay…), the boot screen,
// the Waybar links and the window titles all read from here.
//
// Also replace public/resume.pdf with your own résumé, and edit the <title> /
// meta tags in index.html.
// ─────────────────────────────────────────────────────────────────────────────

export interface Identity {
  name: string
  title: string
  tagline: string
  location: string
  email: string
  /** Leave '' to hide the phone row everywhere. */
  phone: string
  linkedin: string
  /** Full profile URL. The handle in it drives the live "more on GitHub" feed. */
  github: string
  /** Shown in the shell prompt, boot screen and neofetch: `username@host`. */
  username: string
  host: string
  /** Small status line under your name in About. Leave '' to hide it. */
  availability: string
}

export interface Stat {
  value: string
  label: string
}

export interface About {
  short: string
  paragraphs: string[]
  highlights: string[]
  stats: Stat[]
}

export interface Experience {
  role: string
  company: string
  start: string
  end: string
  current: boolean
  location: string
  mode: string
  bullets: string[]
}

/** An upstream contribution to someone else's project. */
export interface OpenSource {
  project: string
  url: string
  stack: string[]
  tagline: string
  bullets: string[]
  prs: { label: string; url: string }[]
}

export interface Project {
  name: string
  stack: string[]
  tagline: string
  blurb: string
  bullets: string[]
  /** Live site / demo. '' if there isn't one. */
  url: string
  /** GitHub repo for the "source" link. Either a bare name (resolved under your
   *  own GitHub handle) or `owner/name` for a repo that lives elsewhere, e.g. an
   *  org. Also used to keep the repo out of the live "more on GitHub" feed so it
   *  isn't listed twice. */
  repo?: string
  /** true → rich card at the top; false → compact row under "also built". */
  featured?: boolean
}

export interface SkillGroup {
  category: string
  items: string[]
}

export interface Education {
  degree: string
  institution: string
  location: string
  start: string
  end: string
  detail: string
}

export interface Contact {
  email: string
  phone: string
  linkedin: string
  github: string
  location: string
}

export interface FunExtras {
  uptimeJoke: string
  motd: string
  /** Shown as "Host" in neofetch. */
  machine: string
  interests: string[]
}

// ── You ─────────────────────────────────────────────────────────────────────

export const identity: Identity = {
  name: 'Your Name',
  title: 'Software Engineer',
  tagline: 'I build fast, reliable software and the tools that make other people faster.',
  location: 'Earth',
  email: 'you@example.com',
  phone: '',
  linkedin: 'https://linkedin.com/in/your-handle',
  github: 'https://github.com/your-handle',
  username: 'you',
  host: 'arch',
  availability: 'open to opportunities',
}

export const about: About = {
  short:
    'Software engineer who likes shipping things end to end: backend services, web frontends and the deploy pipeline in between.',
  paragraphs: [
    "I'm a software engineer who enjoys turning fuzzy problems into small, shippable pieces. Most of my work sits on the backend (APIs, queues, databases) with enough frontend to put a good interface on top of it.",
    'I care about the boring parts that make software last: tests that catch real bugs, logs you can actually read at 2am, and deploys that nobody is scared of. I would rather delete code than add it.',
    'Outside work I tinker with my Linux setup, contribute to open source when I can, and build side projects to learn new things. This page is one of them: an Arch + Hyprland desktop in the browser.',
  ],
  highlights: [
    'Shipped and operated production services used by real customers',
    'Comfortable across the stack: TypeScript, Python, SQL and a bit of Go',
    'Cut a slow CI pipeline from 20 minutes to under 6',
    'Writes the docs and runbooks other engineers actually read',
  ],
  stats: [
    { value: '5+', label: 'years writing code' },
    { value: '10+', label: 'projects shipped' },
    { value: '3', label: 'open-source PRs merged' },
    { value: '∞', label: 'cups of coffee' },
  ],
}

// ── Work ────────────────────────────────────────────────────────────────────

export const experience: Experience[] = [
  {
    role: 'Software Engineer',
    company: 'Your Company',
    start: 'Jan 2025',
    end: 'Present',
    current: true,
    location: 'Remote',
    mode: 'Full-time',
    bullets: [
      'Own a set of backend services end to end, from design docs to on-call.',
      'Built an internal job queue that replaced a third-party service and cut monthly costs.',
      'Mentor newer engineers through code review and pairing.',
    ],
  },
  {
    role: 'Software Engineering Intern',
    company: 'Previous Startup',
    start: 'May 2024',
    end: 'Dec 2024',
    current: false,
    location: '',
    mode: 'Hybrid',
    bullets: [
      'Shipped customer-facing features in a React + Node.js codebase.',
      'Added end-to-end tests to the checkout flow, catching regressions before release.',
    ],
  },
]

/** Upstream contributions. Leave empty to hide the section (and the `oss`
 *  terminal command will say there is nothing yet). Example entry:
 *
 *  {
 *    project: 'some-org/some-project',
 *    url: 'https://github.com/some-org/some-project',
 *    stack: ['Rust', 'Tokio'],
 *    tagline: 'What the project is, in one line',
 *    bullets: ['What you fixed or added, and why it mattered.'],
 *    prs: [{ label: 'PR #123 — short title', url: 'https://github.com/some-org/some-project/pull/123' }],
 *  },
 */
export const openSource: OpenSource[] = []

/** One-line intro shown at the top of the Projects window. */
export const projectsIntro =
  "A few things I've built end to end — web apps, backend systems and the tools around them."

export const projects: Project[] = [
  // ── Featured: rich cards ────────────────────────────────────────────────────
  {
    name: 'hyprfolio',
    stack: ['React 18', 'TypeScript', 'Vite', 'Tailwind v4', 'zustand', 'framer-motion'],
    tagline: 'This portfolio — an Arch + Hyprland desktop in the browser',
    blurb:
      'A portfolio template styled as Arch Linux running the Hyprland tiling window manager: real dwindle/master tiling, Waybar, a working terminal, and a few games. Fork it, edit one file, deploy.',
    bullets: [
      'Hyprland-style dwindle and master layouts computed live from window order.',
      'Interactive terminal with history, tab completion and easter eggs.',
      'All content lives in a single data file; fully static, deploys anywhere.',
    ],
    url: '',
    repo: 'Zintara-studio/hyprfolio',
    featured: true,
  },
  {
    name: 'loose-leaf',
    stack: ['React', 'Vite', 'Canvas'],
    tagline: 'Scrapbook carousels and stories for Instagram',
    blurb:
      'A scrapbook-style post maker: pick one of 71 templates, drop in photos, edit the words and download the JPEGs. Carousel, story and square sizes. Photos never leave the browser.',
    bullets: [
      '71 templates across carousel (4:5), story (9:16) and square (1:1) formats.',
      'Everything renders to a canvas in the tab; nothing is uploaded anywhere.',
      'A validator checks every template against the spec before it ships.',
    ],
    url: '',
    repo: 'Zintara-studio/loose-leaf',
    featured: true,
  },
  {
    name: 'teadiOS',
    stack: ['Remotion', 'Postgres', 'Vite', 'React', 'Node.js', 'Docker'],
    tagline: "A Remotion render farm made of your team's laptops",
    blurb:
      'An open-source render farm: the queue lives in Postgres, a worker container runs on every laptop, and the finished video lands on your CDN. Anyone on the team submits from the browser; the next free machine takes it.',
    bullets: [
      'Job queue built on Postgres with SKIP LOCKED — no broker to run.',
      'Row-level security is the only authorization layer.',
      'Static Vite console in the browser; a worker container on each machine.',
    ],
    url: '',
    repo: 'Zintara-studio/teadiOS',
    featured: true,
  },
  {
    name: 'side-quest',
    stack: ['Next.js 15', 'React 19', 'TypeScript', 'Spring Boot', 'WebSockets', 'PostgreSQL'],
    tagline: 'An esports league platform with a live player auction',
    blurb:
      'Runs an amateur multi-game esports league end to end: players, franchises, matches and standings, a pre-season player auction streamed live over WebSockets, and an admin control room.',
    bullets: [
      'Next.js 15 frontend serving the public league and the admin control room from one codebase.',
      'Spring Boot backend with a single versioned REST API shared by players and admins.',
      'Live auction bid room over WebSockets.',
    ],
    url: '',
    repo: 'Zintara-studio/side-quest',
    featured: true,
  },

  // ── Compact tier: "also built" ──────────────────────────────────────────────
  {
    name: 'Your Side Project',
    stack: ['TypeScript', 'Node.js', 'PostgreSQL'],
    tagline: 'Replace me with something you shipped',
    blurb:
      'Two or three sentences on what it does, who it is for and what was hard about it. Set `url` for a live demo and `repo` for the source.',
    bullets: [],
    url: '',
  },
  {
    name: 'dotfiles',
    stack: ['Shell', 'Hyprland', 'Waybar'],
    tagline: 'My Arch + Hyprland setup, versioned',
    blurb: 'Config for the window manager, bar, terminal and editor, with an install script for a fresh machine.',
    bullets: [],
    url: '',
  },
  {
    name: 'Weekend Hack',
    stack: ['Python', 'SQLite'],
    tagline: 'Something small and fun',
    blurb: 'A tiny tool built in a weekend to scratch an itch. Delete this entry or swap in your own.',
    bullets: [],
    url: '',
  },
]

/** Repos to keep out of the live "more on GitHub" feed (exact repo names under
 *  your handle). Repos already listed in `projects` and your profile README repo
 *  are hidden automatically. Add your portfolio's own repo here if you renamed it. */
export const hiddenRepos: string[] = []

// ── Skills & education ──────────────────────────────────────────────────────

export const skills: SkillGroup[] = [
  { category: 'Languages', items: ['TypeScript', 'JavaScript', 'Python', 'Go', 'SQL'] },
  { category: 'Frontend', items: ['React', 'Next.js', 'Vite', 'Tailwind CSS', 'HTML & CSS'] },
  { category: 'Backend', items: ['Node.js', 'Express', 'FastAPI', 'REST APIs', 'WebSockets'] },
  { category: 'Data', items: ['PostgreSQL', 'Redis', 'SQLite', 'MongoDB'] },
  { category: 'Cloud & DevOps', items: ['Docker', 'GitHub Actions', 'AWS', 'Linux', 'Git'] },
  { category: 'Practices', items: ['Testing', 'Code review', 'System design', 'Observability'] },
]

export const education: Education[] = [
  {
    degree: 'B.Sc. Computer Science',
    institution: 'Your University',
    location: '',
    start: '2020',
    end: '2024',
    detail: 'Coursework in algorithms, operating systems, databases and networks.',
  },
]

export const funExtras: FunExtras = {
  uptimeJoke: 'uptime: shipping since day one, zero unplanned reboots, infinite coffee',
  motd: 'Welcome. Have a look around — the terminal is the fun part.',
  machine: 'ThinkPad (Built Different™)',
  interests: ['Linux ricing', 'Open source', 'Developer tooling', 'System design', 'Building side projects'],
}

/** Your résumé. Replace public/resume.pdf with your own file. */
export const RESUME_PATH = '/resume.pdf'

// ─────────────────────────────────────────────────────────────────────────────
// Derived values — you shouldn't need to edit anything below this line.
// ─────────────────────────────────────────────────────────────────────────────

/** Strip protocol and trailing slash: "https://github.com/x/" → "github.com/x". */
export function shortUrl(url: string): string {
  return url.replace(/^https?:\/\/(www\.)?/i, '').replace(/\/+$/, '')
}

/** The handle-ish path of a profile URL: ".../in/your-handle" → "in/your-handle". */
function profilePath(url: string, host: string): string {
  return shortUrl(url).replace(new RegExp(`^${host.replace('.', '\\.')}/?`, 'i'), '')
}

/** Placeholder handle shipped with the template. While github is still set to
 *  this, the live GitHub feed is hidden and never fetched. */
export const GITHUB_PLACEHOLDER = 'your-handle'

/** GitHub handle, e.g. "your-handle". */
export const githubHandle = profilePath(identity.github, 'github.com').split('/')[0] ?? ''

/** true once `identity.github` points at a real account. */
export const hasRealGithub = githubHandle !== '' && githubHandle !== GITHUB_PLACEHOLDER

/** LinkedIn path, e.g. "in/your-handle". */
export const linkedinHandle = profilePath(identity.linkedin, 'linkedin.com')

/** File name of the résumé, e.g. "resume.pdf". */
export const RESUME_FILENAME = RESUME_PATH.split('/').pop() || 'resume.pdf'

export const contact: Contact = {
  email: identity.email,
  phone: identity.phone,
  linkedin: identity.linkedin,
  github: identity.github,
  location: identity.location,
}

export const content = {
  identity,
  about,
  experience,
  openSource,
  projects,
  skills,
  education,
  contact,
  funExtras,
}

export type Content = typeof content
