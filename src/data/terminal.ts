// ─────────────────────────────────────────────────────────────────────────────
// Terminal app spec — command set, neofetch, welcome, prompt.
// Everything personal is derived from src/data/content.ts, so you normally
// don't need to touch this file.
// ─────────────────────────────────────────────────────────────────────────────

import {
  identity,
  experience,
  education,
  openSource,
  projects,
  skills,
  funExtras,
  shortUrl,
  RESUME_FILENAME,
} from './content'

export type CommandKind = 'static' | 'dynamic' | 'action' | 'easteregg'

export interface TerminalCommand {
  name: string
  usage?: string
  description: string
  kind: CommandKind
  staticOutput?: string
  /** which content section to render: about|projects|experience|skills|contact|education */
  dynamicSource?: string
  /** for kind=action: clear | open:<appId> | download:resume | neofetch | help | sudo | history */
  action?: string
}

export interface NeofetchRow {
  key: string
  value: string
}

export interface TerminalSpec {
  welcome: string
  prompt: string
  behaviorNotes: string
  neofetchArt: string[]
  neofetchInfo: NeofetchRow[]
  commands: TerminalCommand[]
}

const user = identity.username
const userAtHost = `${identity.username}@${identity.host}`
const currentJob = experience.find((e) => e.current) ?? experience[0]
const featuredNames = projects
  .filter((p) => p.featured)
  .slice(0, 3)
  .map((p) => p.name)
const topStack = skills.flatMap((g) => g.items).slice(0, 5)

/** Pads `user user` columns in the fake `ls -la` output. */
const owner = `${user} ${user}`.padEnd(Math.max(10, user.length * 2 + 2))

/** ASCII cow with a speech bubble sized to the line. */
function cow(line: string): string {
  const text = ` ${line} `
  return [
    ` ${'_'.repeat(text.length)}`,
    `<${text}>`,
    ` ${'-'.repeat(text.length)}`,
    '        \\   ^__^',
    '         \\  (oo)\\_______',
    '            (__)\\       )\\/\\',
    '                ||----w |',
    '                ||     ||',
  ].join('\n')
}

/** Neofetch rows; optional rows drop out when their source data is empty. */
const neofetchRows: Array<NeofetchRow | null> = [
  { key: 'user@host', value: userAtHost },
  { key: 'OS', value: 'Arch Linux x86_64' },
  { key: 'Host', value: funExtras.machine },
  { key: 'Kernel', value: '6.x-zen1-1 (rolling, ofc)' },
  { key: 'Uptime', value: 'shipping since day one, 0 days since last deploy' },
  { key: 'Packages', value: '1312 (pacman), 47 (yay)' },
  { key: 'Shell', value: 'zsh 5.9' },
  { key: 'WM', value: 'Hyprland (Wayland)' },
  { key: 'Terminal', value: 'kitty' },
  { key: 'Theme', value: 'Aurora (blue → green)' },
  { key: 'CPU', value: 'Caffeine-overclocked human v25' },
  currentJob ? { key: 'Role', value: `${currentJob.role} @ ${currentJob.company}` } : null,
  topStack.length ? { key: 'Stack', value: topStack.join(' · ') } : null,
  openSource.length
    ? { key: 'OpenSource', value: `${openSource.length} upstream project${openSource.length === 1 ? '' : 's'}` }
    : null,
  education[0] ? { key: 'Education', value: `${education[0].degree} — ${education[0].institution}` } : null,
  identity.location ? { key: 'Location', value: identity.location } : null,
  identity.email ? { key: 'Email', value: identity.email } : null,
  identity.github ? { key: 'GitHub', value: shortUrl(identity.github) } : null,
  identity.linkedin ? { key: 'LinkedIn', value: shortUrl(identity.linkedin) } : null,
]

export const terminal: TerminalSpec = {
  welcome: `Welcome to ${user}-shell v1.0.0 (zsh 5.9 on Arch Linux x86_64)

  ${identity.name} — ${identity.title}
  ${identity.location ? `${identity.location} · ` : ''}Arch + Hyprland enjoyer (yes, I use Arch btw)

This is an interactive terminal. Explore my portfolio by typing commands.
Type \`help\` to see everything you can run, or \`neofetch\` if you just want the vibes.
Tip: ↑/↓ recall history, Tab completes commands.`,
  prompt: `${userAtHost} ~ ❯`,
  behaviorNotes:
    'History via up/down arrows; Tab completion against the command list; unknown commands print a zsh-style not-found with a did-you-mean suggestion; blinking block cursor; Ctrl+L clears.',
  neofetchArt: [
    '                   -`                  ',
    '                  .o+`                 ',
    '                 `ooo/                 ',
    '                `+oooo:                ',
    '               `+oooooo:               ',
    '               -+oooooo+:              ',
    '             `/:-:++oooo+:             ',
    '            `/++++/+++++++:            ',
    '           `/++++++++++++++:           ',
    '          `/+++ooooooooooooo/`         ',
    '         ./ooosssso++osssssso+`        ',
    '        .oossssso-````/ossssss+`       ',
    '       -osssssso.      :ssssssso.      ',
    '      :osssssss/        osssso+++.     ',
    '     /ossssssss/        +ssssooo/-     ',
    '   `/ossssso+/:-        -:/+osssso+-   ',
    '  `+sso+:-`                 `.-/+oso:  ',
    ' `++:.                          `-/+/ ',
    ' .`                                 `.',
  ],
  neofetchInfo: neofetchRows.filter((r): r is NeofetchRow => r !== null),
  commands: [
    {
      name: 'help',
      usage: 'help',
      description: 'List all available commands.',
      kind: 'static',
      staticOutput: `Available commands — type any of them to run:

  whoami         Who is ${identity.name}? The one-line version
  about          The longer intro / bio
  projects       Featured projects${featuredNames.length ? ` (${featuredNames.join(', ')}...)` : ''}
  experience     Work history & internships
  oss            Upstream open-source contributions
  skills         Tech stack & tooling
  education      Degrees & schooling
  contact        How to reach me + socials
  resume         Open / download my resume (${RESUME_FILENAME})
  neofetch       System info, Arch-flavored
  ls             List the 'files' in this directory
  open <app>     Launch an app window (about, projects, resume, contact...)
  echo <text>    Print text back
  history        Show command history
  clear          Clear the screen  (Ctrl+L)
  sudo <cmd>     Run as root... or try to

Easter eggs (you didn't hear it from me):  cowsay · fortune · sl · uptime

Hints: ↑/↓ for history · Tab to autocomplete · commands are case-insensitive.`,
    },
    {
      name: 'whoami',
      usage: 'whoami',
      description: 'Print a one-line identity / current role.',
      kind: 'static',
      staticOutput: `${user} — ${identity.title}. Arch + Hyprland.${identity.location ? ` ${identity.location}.` : ''}`,
    },
    { name: 'about', usage: 'about', description: 'Show the longer bio / introduction.', kind: 'dynamic', dynamicSource: 'about' },
    {
      name: 'projects',
      usage: 'projects',
      description: 'List featured projects with stack and short descriptions.',
      kind: 'dynamic',
      dynamicSource: 'projects',
    },
    {
      name: 'experience',
      usage: 'experience',
      description: 'Show professional experience and internships.',
      kind: 'dynamic',
      dynamicSource: 'experience',
    },
    {
      name: 'oss',
      usage: 'oss',
      description: 'Show upstream open-source contributions.',
      kind: 'dynamic',
      dynamicSource: 'opensource',
    },
    { name: 'skills', usage: 'skills', description: 'Show the technical skills / tech stack.', kind: 'dynamic', dynamicSource: 'skills' },
    { name: 'education', usage: 'education', description: 'Show educational background.', kind: 'dynamic', dynamicSource: 'education' },
    { name: 'contact', usage: 'contact', description: 'Show contact details and social links.', kind: 'dynamic', dynamicSource: 'contact' },
    {
      name: 'neofetch',
      usage: 'neofetch',
      description: `Display Arch-style system info with ASCII logo, themed to ${identity.name}.`,
      kind: 'action',
      action: 'neofetch',
    },
    { name: 'clear', usage: 'clear', description: 'Clear the terminal screen.', kind: 'action', action: 'clear' },
    {
      name: 'ls',
      usage: 'ls [-la]',
      description: 'List the files in the current directory.',
      kind: 'static',
      staticOutput: `total 28
drwxr-xr-x  ${owner} about.md
drwxr-xr-x  ${owner} projects/
drwxr-xr-x  ${owner} experience/
drwxr-xr-x  ${owner} opensource/
-rw-r--r--  ${owner} skills.json
-rw-r--r--  ${owner} education.txt
-rw-r--r--  ${owner} contact.vcf
-rw-r--r--  ${owner} resume.pdf
-rw-------  ${owner} .secrets   (nice try)

Tip: run \`resume\` to grab the resume, or just run any name above as a command.`,
    },
    { name: 'resume', usage: 'resume', description: `Open or download my resume (${RESUME_FILENAME}).`, kind: 'action', action: 'download:resume' },
    { name: 'open', usage: 'open <app>', description: 'Launch an app window (about|projects|experience|skills|contact|resume|terminal).', kind: 'action', action: 'open' },
    { name: 'echo', usage: 'echo <text>', description: 'Print the given text back to the terminal.', kind: 'static', staticOutput: '' },
    { name: 'history', usage: 'history', description: "Show the list of commands you've run this session.", kind: 'action', action: 'history' },
    { name: 'sudo', usage: 'sudo <command>', description: 'Attempt to run a command with root privileges.', kind: 'action', action: 'sudo' },
    {
      name: 'cowsay',
      usage: 'cowsay [text]',
      description: 'An ASCII cow says something wise. Easter egg.',
      kind: 'easteregg',
      staticOutput: cow(`I use Arch btw. Also: hire ${identity.name}. 🐧`),
    },
    {
      name: 'fortune',
      usage: 'fortune',
      description: 'Print a random pearl of developer wisdom. Easter egg.',
      kind: 'easteregg',
      staticOutput: `"It works on my machine."
   — said no one running Arch with confidence

  (Pro tip: it's not a bug, it's an undocumented feature.)`,
    },
    {
      name: 'sl',
      usage: 'sl',
      description: 'You meant `ls`, didn\'t you? A steam locomotive rolls by. Easter egg.',
      kind: 'easteregg',
      staticOutput: `      ====        ________                ___________
  _D _|  |_______/        \\__I_I_____===__|_________|
   |(_)---  |   H\\________/ |   |        =|___ ___|
   /     |  |   H  |  |     |   |         ||_| |_||
  |      |  |   H  |__--------------------| [___] |
  | ________|___H__/__|_____/[][]~\\_______|       |
  |/ |   |-----------I_____I [][] []  D   |=======|__

  choo choo... (you typed \`sl\` instead of \`ls\` — classic)`,
    },
    {
      name: 'uptime',
      usage: 'uptime',
      description: "Show how long this 'system' has been up. Easter egg.",
      kind: 'easteregg',
      staticOutput: ` 04:20:00 up 437 days,  caffeine high,  load average: 0.99, 1.00, 0.42
  (0 unplanned reboots — Arch stable, who knew)`,
    },
    {
      name: 'exit',
      usage: 'exit',
      description: 'There is no escape — this is the portfolio. Easter egg.',
      kind: 'easteregg',
      staticOutput:
        'There is no exit. You live here now. (Just kidding — close the window, or type `help` to keep exploring.)',
    },
  ],
}
