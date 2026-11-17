// Keybind catalogue — single source of truth for the cheatsheet AND the handler.

export interface Keybind {
  keys: string
  action: string
  group: 'Apps & Launcher' | 'Windows' | 'Navigation' | 'Workspaces'
}

export const keybinds: Keybind[] = [
  { keys: 'Super + D', action: 'Open the app launcher (rofi)', group: 'Apps & Launcher' },
  { keys: 'Super + Return', action: 'Open a new terminal', group: 'Apps & Launcher' },
  { keys: 'Super + S  /  ?', action: 'Toggle this keybind cheatsheet', group: 'Apps & Launcher' },

  { keys: 'Super + Q', action: 'Close the focused window', group: 'Windows' },
  { keys: 'Super + F', action: 'Toggle fullscreen', group: 'Windows' },
  { keys: 'Super + V', action: 'Toggle floating / tiled', group: 'Windows' },
  { keys: 'Super + M', action: 'Toggle dwindle ⇄ master layout', group: 'Windows' },

  { keys: 'Super + H / L', action: 'Move focus left / right', group: 'Navigation' },
  { keys: 'Super + K / J', action: 'Move focus up / down', group: 'Navigation' },
  { keys: 'Super + Tab', action: 'Cycle focus to next window', group: 'Navigation' },
  { keys: 'Super + Shift + H/J/K/L', action: 'Move the focused window', group: 'Navigation' },

  { keys: 'Super + 1 … 5', action: 'Switch to workspace 1–5', group: 'Workspaces' },
  { keys: 'Super + Shift + 1 … 5', action: 'Move window to workspace 1–5', group: 'Workspaces' },

  { keys: 'Escape', action: 'Dismiss launcher / overlays', group: 'Apps & Launcher' },
]

export const keybindGroups = ['Apps & Launcher', 'Windows', 'Navigation', 'Workspaces'] as const
