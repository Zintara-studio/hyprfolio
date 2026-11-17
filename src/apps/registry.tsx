// App registry — the single mapping from AppId to its window metadata + component.
// The launcher, dock and store all read from here.
import type { ComponentType, SVGProps } from 'react'
import type { AppId } from '../store/wm'
import type { ColorName } from '../theme/catppuccin'
import type { AppProps } from './types'
import { RESUME_FILENAME } from '../data/content'
import {
  TerminalIcon,
  UserIcon,
  FolderIcon,
  BriefcaseIcon,
  CodeIcon,
  MailIcon,
  FileIcon,
  GamepadIcon,
  GridIcon,
  MineIcon,
  CellsIcon,
  CalculatorIcon,
} from '../components/icons'

import Terminal from './Terminal'
import About from './About'
import Projects from './Projects'
import Experience from './Experience'
import Skills from './Skills'
import Contact from './Contact'
import ResumeViewer from './ResumeViewer'
import Snake from './Snake'
import Game2048 from './Game2048'
import Minesweeper from './Minesweeper'
import GameOfLife from './GameOfLife'
import Calculator from './Calculator'

export interface AppDef {
  id: AppId
  label: string
  description: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
  accent: ColorName
  component: ComponentType<AppProps>
  group: 'app' | 'game'
  defaultFloating?: boolean
  allowMultiple?: boolean
}

export const APPS: Record<AppId, AppDef> = {
  terminal: {
    id: 'terminal',
    label: 'Terminal',
    description: 'kitty · type help',
    icon: TerminalIcon,
    accent: 'green',
    component: Terminal,
    group: 'app',
    allowMultiple: true,
  },
  about: {
    id: 'about',
    label: 'About',
    description: 'whoami · bio',
    icon: UserIcon,
    accent: 'mauve',
    component: About,
    group: 'app',
  },
  projects: {
    id: 'projects',
    label: 'Projects',
    description: 'things I built',
    icon: FolderIcon,
    accent: 'blue',
    component: Projects,
    group: 'app',
  },
  experience: {
    id: 'experience',
    label: 'Experience',
    description: 'work history',
    icon: BriefcaseIcon,
    accent: 'peach',
    component: Experience,
    group: 'app',
  },
  skills: {
    id: 'skills',
    label: 'Skills',
    description: 'the tech stack',
    icon: CodeIcon,
    accent: 'yellow',
    component: Skills,
    group: 'app',
  },
  resume: {
    id: 'resume',
    label: 'Resume',
    description: RESUME_FILENAME,
    icon: FileIcon,
    accent: 'red',
    component: ResumeViewer,
    group: 'app',
  },
  contact: {
    id: 'contact',
    label: 'Contact',
    description: 'say hello',
    icon: MailIcon,
    accent: 'teal',
    component: Contact,
    group: 'app',
    defaultFloating: true,
  },
  snake: {
    id: 'snake',
    label: 'Snake',
    description: 'arcade · arrows/WASD',
    icon: GamepadIcon,
    accent: 'green',
    component: Snake,
    group: 'game',
  },
  '2048': {
    id: '2048',
    label: '2048',
    description: 'slide & merge',
    icon: GridIcon,
    accent: 'sapphire',
    component: Game2048,
    group: 'game',
  },
  minesweeper: {
    id: 'minesweeper',
    label: 'Minesweeper',
    description: 'classic · mouse',
    icon: MineIcon,
    accent: 'red',
    component: Minesweeper,
    group: 'game',
  },
  life: {
    id: 'life',
    label: 'Game of Life',
    description: "Conway's cells",
    icon: CellsIcon,
    accent: 'teal',
    component: GameOfLife,
    group: 'game',
  },
  calculator: {
    id: 'calculator',
    label: 'Calculator',
    description: 'crunch numbers',
    icon: CalculatorIcon,
    accent: 'blue',
    component: Calculator,
    group: 'game',
    defaultFloating: true,
  },
}

// Order shown in launcher / dock (apps first, then games).
export const APP_LIST: AppDef[] = [
  APPS.terminal,
  APPS.about,
  APPS.projects,
  APPS.experience,
  APPS.skills,
  APPS.resume,
  APPS.contact,
  APPS.snake,
  APPS['2048'],
  APPS.minesweeper,
  APPS.life,
  APPS.calculator,
]
