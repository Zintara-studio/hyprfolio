# hyprfolio

Your portfolio, as an Arch Linux + Hyprland desktop. Fork it, edit one file, deploy.

<!-- demo: docs/demo.gif -->

An interactive developer portfolio styled as **Arch Linux running the [Hyprland](https://hypr.land) tiling window manager**, in a blue + green "Aurora" dark theme. Visitors open the terminal and type `help`, drag floating windows, switch workspaces and play a few games. You edit one data file.

## Features

- **Real tiling window manager**: Hyprland's *dwindle* layout (windows split the focused region, alternating by aspect ratio) plus a *master* layout, computed live from window order.
- **Waybar top bar**: clickable workspace pills, live clock, layout indicator and themed system modules.
- **Bottom dock + rofi-style launcher** (`Super + D`), fully mouse-navigable so recruiters never need the keyboard.
- **Interactive terminal**: `help`, `whoami`, `about`, `projects`, `experience`, `oss`, `skills`, `contact`, `neofetch`, `resume`, easter eggs (`cowsay`, `sl`, `fortune`, `uptime`), command history, tab completion and clickable command chips. Prompt, neofetch and the rest are generated from your data.
- **Keyboard-driven**: Hyprland-style binds (see below), with a `?` keybind cheatsheet.
- **Window apps**: About, Projects, Experience, Skills, Contact and an embedded résumé (PDF) viewer.
- **Live "more on GitHub" feed** in the Projects window, pulled from the GitHub API for your handle.
- **Playable games and tools**: Snake, 2048, Minesweeper, Conway's Game of Life and a Calculator. Each opens as a real, tileable window (keyboard + mouse/touch).
- **Boot + login sequence**, gradient active-window borders, framer-motion animations and a pure-CSS aurora wallpaper.
- Responsive, respects `prefers-reduced-motion`, and fully static.

## Quick start

1. Click **Use this template** on GitHub (or fork / clone this repo).
2. Edit **`src/data/content.ts`**: your name, links, bio, experience, projects and skills. This is the only file you need to touch.
3. Replace **`public/resume.pdf`** with your own résumé.
4. Edit the `<title>`, `description` and `og:*` tags in **`index.html`** (they are static so link previews work without JavaScript).
5. Run it:

   ```bash
   npm i
   npm run dev      # http://localhost:5173
   ```

6. Deploy anywhere that serves a static site:

   - **Vercel**: import the repo; `vercel.json` already sets the Vite build and SPA rewrites.
   - **Netlify**: build command `npm run build`, publish directory `dist`.
   - **GitHub Pages**: run `npm run build` and publish `dist/` (for a project page at `/<repo>/`, set `base: '/<repo>/'` in `vite.config.ts`).

Other scripts:

```bash
npm run build    # type-check + production build -> dist/
npm run preview  # serve the production build locally
```

## Customise

### `src/data/content.ts`

| Export | What it controls |
|---|---|
| `identity` | Name, title, tagline, location, email, phone (leave `''` to hide it), LinkedIn and GitHub URLs, the `username@host` used by the prompt / boot screen / neofetch, and the status line under your name. |
| `about` | Short bio, paragraphs, highlight cards and the four stat tiles in About. |
| `experience` | Work timeline. `current: true` gets the green "Present" marker. |
| `openSource` | Upstream contributions with PR links. Leave the array empty to hide the section. |
| `projectsIntro`, `projects` | Project cards. `featured: true` makes a rich card; the rest go under "also built". `repo` is either a bare repo name under your GitHub handle or `owner/name`. |
| `hiddenRepos` | Repo names to keep out of the live GitHub feed. Repos already in `projects` and your profile README repo are hidden automatically. |
| `skills`, `education` | Skills grid and education cards. |
| `funExtras` | Interests chips and the machine name shown in `neofetch`. |
| `RESUME_PATH` | Path of the résumé under `public/` (default `/resume.pdf`). |

The live GitHub feed stays hidden, and nothing is fetched, until `identity.github` points at a real account instead of the `your-handle` placeholder.

### Theme

- Colour tokens live in two places that should stay in sync: the `@theme` block in `src/index.css` (Tailwind utilities like `bg-base`, `text-green`) and the palette object in `src/theme/catppuccin.ts` (used for inline styles and canvas drawing). The names follow Catppuccin's structure (`base`, `mantle`, `crust`, `surface0..2`, `overlay0..1`, `text`, `subtext0..1`, plus accents), so any Catppuccin-style palette drops in.
- Hyprland decoration constants (gaps, rounding, border gradient) are in `src/theme/catppuccin.ts` too.

### Wallpaper

The aurora wallpaper is pure CSS/SVG in `src/components/Wallpaper.tsx`; there are no image files. Change the gradient colours there, or replace the component's contents with an `<img>` of your own wallpaper.

### Terminal

Commands live in `src/data/terminal.ts`. Personal strings (welcome, prompt, neofetch, `whoami`, `ls`, `cowsay`) are derived from `content.ts`, so you only need this file to add or change commands.

## Keybinds

| Keys | Action |
|---|---|
| `Super + D` | Open the app launcher (rofi) |
| `Super + Return` | Open a new terminal |
| `Super + S` / `?` | Toggle the keybind cheatsheet |
| `Super + Q` | Close the focused window |
| `Super + F` | Toggle fullscreen |
| `Super + V` | Toggle floating / tiled |
| `Super + M` | Toggle dwindle / master layout |
| `Super + H / L` | Move focus left / right |
| `Super + K / J` | Move focus up / down |
| `Super + Tab` | Cycle focus to the next window |
| `Super + Shift + H/J/K/L` | Move the focused window |
| `Super + 1 … 5` | Switch to workspace 1–5 |
| `Super + Shift + 1 … 5` | Move the window to workspace 1–5 |
| `Escape` | Dismiss launcher / overlays |

## Tech stack

- **React 18** + **TypeScript** + **Vite**
- **Tailwind CSS v4** (custom "Aurora" theme tokens)
- **framer-motion** for window animations and dragging
- **zustand** for the window-manager store

## Structure

```
src/
  apps/         # windows: Terminal, About, Projects, Experience, Skills, Contact, ResumeViewer
                #   + games: Snake, Game2048, Minesweeper, GameOfLife, Calculator
  components/   # Desktop shell, Waybar, Dock, TilingStage, Window chrome, Launcher, Cheatsheet, BootScreen, Wallpaper, icons
  store/wm.ts   # zustand window manager (workspaces, windows, focus, actions)
  lib/tiling.ts # Hyprland dwindle/master geometry
  lib/keybindings.ts
  data/         # content.ts (your data) + terminal.ts (command spec)
  theme/        # "Aurora" palette + Hyprland decoration constants
public/resume.pdf
```

## Credits

- Inspired by [vovacodes](https://github.com/vovaushenko/vovacodes) (a Windows-desktop portfolio), but Linux, tiling and ricer-approved.
- WM aesthetic: [Hyprland](https://hypr.land) + [Waybar](https://github.com/Alexays/Waybar)
- Palette structure: [Catppuccin](https://catppuccin.com)
- Fonts: JetBrains Mono, Inter

## License

[MIT](LICENSE)
