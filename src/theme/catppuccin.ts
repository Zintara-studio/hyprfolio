// ─────────────────────────────────────────────────────────────────────────────
// "Aurora" — a custom BLUE + GREEN dark theme.
// (Kept the export name `mocha` and the original accent keys so every component
// keeps working untouched; only the hex values changed. `palette` is an alias.)
// Use these for raw values (gradients, canvas, framer-motion). Tailwind utilities
// (bg-base, text-text, border-surface1, text-blue, text-green, …) are wired in index.css.
// ─────────────────────────────────────────────────────────────────────────────

export const mocha = {
  // neutrals — deep teal-navy
  base: '#0e2930',
  mantle: '#0a2127',
  crust: '#06171b',
  surface0: '#16383f',
  surface1: '#1f4953',
  surface2: '#2b5d68',
  overlay0: '#4a7077',
  overlay1: '#6b9197',
  text: '#daf2ec',
  subtext0: '#8ab7b1',
  subtext1: '#b2d8d2',

  // accents — a blue → green spectrum (warm hues remapped into the cool family;
  // red/maroon kept genuinely red for close buttons & error/danger states)
  blue: '#4f9cf6', // primary
  sapphire: '#34b9ef',
  sky: '#2bd6e6', // cyan
  teal: '#1fd6c0',
  green: '#43e08f', // secondary primary
  lavender: '#7aa7ff', // periwinkle blue
  mauve: '#5fd0b0', // remapped → sea green
  peach: '#8be67a', // remapped → lime green
  yellow: '#cfe86a', // chartreuse (yellow-green)
  pink: '#54dbc8', // remapped → aqua
  flamingo: '#9fe6cf', // mint
  rosewater: '#c7f0e3', // pale mint
  red: '#ff7a93', // kept red (coral)
  maroon: '#f4889b', // kept red (soft)
} as const

export const palette = mocha
export type ColorName = keyof typeof mocha

// Hyprland decoration constants (mirrors hyprland.conf).
export const hypr = {
  gapsInner: 6,
  gapsOuter: 12,
  borderSize: 2,
  rounding: 10,
  // signature active-window gradient — blue → teal → green
  activeBorder: 'linear-gradient(135deg, #4f9cf6 0%, #1fd6c0 50%, #43e08f 100%)',
  inactiveBorder: mocha.surface1,
  shadow: '0 8px 24px 0 rgba(6, 23, 27, 0.55)',
  waybarHeight: 38,
} as const

// Pure-CSS blue-green "aurora mesh" wallpaper.
export const WALLPAPER_CSS =
  'radial-gradient(1200px 800px at 12% 8%, rgba(67,224,143,0.16), transparent 60%), ' +
  'radial-gradient(1000px 700px at 88% 92%, rgba(79,156,246,0.18), transparent 60%), ' +
  'radial-gradient(900px 600px at 50% 50%, rgba(31,214,192,0.10), transparent 55%), ' +
  'radial-gradient(700px 500px at 80% 18%, rgba(43,214,230,0.10), transparent 55%), ' +
  'linear-gradient(135deg, #0a2127 0%, #0e2930 55%, #06171b 100%)'
