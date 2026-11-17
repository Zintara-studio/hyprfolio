// Crisp line icons (stroke = currentColor) so we never depend on a patched
// Nerd Font being installed in the visitor's browser.
import type { SVGProps } from 'react'

type P = SVGProps<SVGSVGElement>

const base = (p: P): P => ({
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  ...p,
})

export const TerminalIcon = (p: P) => (
  <svg {...base(p)}>
    <rect x="2.5" y="4" width="19" height="16" rx="2" />
    <path d="m6 9 3 3-3 3" />
    <path d="M12.5 15h4" />
  </svg>
)

export const UserIcon = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-3.3 3.6-6 8-6s8 2.7 8 6" />
  </svg>
)

export const FolderIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M3 7a2 2 0 0 1 2-2h4l2 2.5h8a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
  </svg>
)

export const BriefcaseIcon = (p: P) => (
  <svg {...base(p)}>
    <rect x="3" y="7" width="18" height="13" rx="2" />
    <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <path d="M3 12h18" />
  </svg>
)

export const CodeIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="m8 8-4 4 4 4" />
    <path d="m16 8 4 4-4 4" />
    <path d="m13 6-2 12" />
  </svg>
)

export const MailIcon = (p: P) => (
  <svg {...base(p)}>
    <rect x="2.5" y="5" width="19" height="14" rx="2" />
    <path d="m3 7 9 6 9-6" />
  </svg>
)

export const FileIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
    <path d="M14 3v5h5" />
    <path d="M9 13h6M9 17h6" />
  </svg>
)

export const CpuIcon = (p: P) => (
  <svg {...base(p)}>
    <rect x="6" y="6" width="12" height="12" rx="2" />
    <path d="M9 9h6v6H9z" />
    <path d="M9 2v2M15 2v2M9 20v2M15 20v2M2 9h2M2 15h2M20 9h2M20 15h2" />
  </svg>
)

export const MemoryIcon = (p: P) => (
  <svg {...base(p)}>
    <rect x="3" y="7" width="18" height="10" rx="1.5" />
    <path d="M7 17v3M11 17v3M15 17v3M19 17v3M7 7v3M11 7v3M15 7v3" />
  </svg>
)

export const WifiIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M2 8.5a16 16 0 0 1 20 0" />
    <path d="M5 12a11 11 0 0 1 14 0" />
    <path d="M8.5 15.5a6 6 0 0 1 7 0" />
    <circle cx="12" cy="19" r="0.6" fill="currentColor" />
  </svg>
)

export const VolumeIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 9v6h4l5 4V5L8 9z" />
    <path d="M16 9a4 4 0 0 1 0 6" />
    <path d="M18.5 7a8 8 0 0 1 0 10" />
  </svg>
)

export const BatteryIcon = (p: P) => (
  <svg {...base(p)}>
    <rect x="2" y="8" width="17" height="9" rx="2" />
    <path d="M21 11v3" />
    <path d="M5 11v3M8 11v3M11 11v3" />
  </svg>
)

export const ClockIcon = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </svg>
)

export const PowerIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 3v9" />
    <path d="M6.5 7a8 8 0 1 0 11 0" />
  </svg>
)

export const SearchIcon = (p: P) => (
  <svg {...base(p)}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
)

export const GridIcon = (p: P) => (
  <svg {...base(p)}>
    <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
    <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
    <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
    <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
  </svg>
)

export const KeyboardIcon = (p: P) => (
  <svg {...base(p)}>
    <rect x="2.5" y="6" width="19" height="12" rx="2" />
    <path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M8 14h8" />
  </svg>
)

export const GithubIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M9 19c-4 1.4-4-2-6-2.5m12 4.5v-3.6c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.3 4.3 0 0 0-.1-3.2s-1-.3-3.4 1.3a11.6 11.6 0 0 0-6 0C7.3 2.9 6.3 3.2 6.3 3.2a4.3 4.3 0 0 0-.1 3.2A4.6 4.6 0 0 0 5 9.6c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21" />
  </svg>
)

export const LinkedinIcon = (p: P) => (
  <svg {...base(p)}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M8 10v7M8 7v.01M12 17v-4a2 2 0 0 1 4 0v4M12 17v-7" />
  </svg>
)

export const ExternalIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M14 4h6v6" />
    <path d="M20 4 10 14" />
    <path d="M18 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5" />
  </svg>
)

export const DownloadIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 3v12" />
    <path d="m7 11 5 4 5-4" />
    <path d="M5 20h14" />
  </svg>
)

export const CloseIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
)

export const FullscreenIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
  </svg>
)

export const FloatIcon = (p: P) => (
  <svg {...base(p)}>
    <rect x="3" y="4" width="13" height="11" rx="2" />
    <rect x="9" y="9" width="12" height="11" rx="2" />
  </svg>
)

// Simplified Arch Linux logo mark.
export const ArchIcon = (p: P) => (
  <svg {...base({ ...p, strokeWidth: 0 })} fill="currentColor" stroke="none">
    <path d="M12 3c-1.6 3.3-2.6 5.4-4.4 8.6.9 1 2 2.1 3.9 3.3-2 .8-3.4 1.6-4.5 2.5L4 20h16l-3-2.6c-1.1-.9-2.5-1.7-4.5-2.5 1.9-1.2 3-2.3 3.9-3.3C14.6 8.4 13.6 6.3 12 3z" />
  </svg>
)

export const HeartIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 20s-7-4.3-9.3-8.5C1.2 8.6 2.6 5.5 5.6 5.1 7.6 4.8 9.4 6 12 8.3 14.6 6 16.4 4.8 18.4 5.1c3 .4 4.4 3.5 2.9 6.4C19 15.7 12 20 12 20z" />
  </svg>
)

export const GamepadIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M7 11h4M9 9v4" />
    <circle cx="15.5" cy="10.5" r="0.6" fill="currentColor" />
    <circle cx="17.5" cy="12.5" r="0.6" fill="currentColor" />
    <path d="M6.5 7h11a3.5 3.5 0 0 1 3.4 2.7l1 4.5A2.4 2.4 0 0 1 19.6 17c-1 0-1.6-.6-2.1-1.3l-.5-.7a2 2 0 0 0-1.6-.8H8.6a2 2 0 0 0-1.6.8l-.5.7C6 16.4 5.4 17 4.4 17a2.4 2.4 0 0 1-2.3-2.8l1-4.5A3.5 3.5 0 0 1 6.5 7Z" />
  </svg>
)

export const MineIcon = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="13" r="6" />
    <path d="M12 3v3M12 7l1.5-1.5M12 7l-1.5-1.5" />
    <path d="M12 9.5v7M8.5 13h7M9.7 10.7l4.6 4.6M14.3 10.7l-4.6 4.6" />
  </svg>
)

export const CellsIcon = (p: P) => (
  <svg {...base({ ...p, strokeWidth: 1.6 })}>
    <rect x="3" y="3" width="5.5" height="5.5" rx="1" />
    <rect x="15.5" y="3" width="5.5" height="5.5" rx="1" />
    <rect x="9.25" y="9.25" width="5.5" height="5.5" rx="1" />
    <rect x="3" y="15.5" width="5.5" height="5.5" rx="1" />
    <rect x="15.5" y="15.5" width="5.5" height="5.5" rx="1" />
  </svg>
)

export const CalculatorIcon = (p: P) => (
  <svg {...base(p)}>
    <rect x="5" y="3" width="14" height="18" rx="2" />
    <path d="M8 7h8" />
    <path d="M8.5 12h.01M12 12h.01M15.5 12h.01M8.5 15.5h.01M12 15.5h.01M15.5 15.5v3M8.5 18h.01M12 18h.01" />
  </svg>
)
