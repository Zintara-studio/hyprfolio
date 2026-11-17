import type { AppProps } from './types'
import { skills } from '../data/content'
import { mocha, type ColorName } from '../theme/catppuccin'
import { AppScroll, PathBar, SectionLabel, Tag, Card, IconTile } from './_ui'
import { CodeIcon } from '../components/icons'

const ACCENTS: ColorName[] = ['yellow', 'green', 'blue', 'mauve', 'peach', 'teal', 'pink', 'sky', 'lavender', 'red']

export default function Skills(_props: AppProps) {
  return (
    <AppScroll>
      <PathBar path="skills.json" accent="yellow" />

      <SectionLabel accent="yellow">skills</SectionLabel>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {skills.map((group, i) => {
          const accent = ACCENTS[i % ACCENTS.length]
          return (
            <Card key={group.category} accent={accent} bar className="rounded-xl p-4 pt-4.5">
              <div className="mb-3 flex items-center gap-2.5">
                <IconTile accent={accent}>
                  <CodeIcon width={16} height={16} />
                </IconTile>
                <h3 className="font-mono text-sm font-semibold tracking-wide" style={{ color: mocha[accent] }}>
                  {group.category}
                </h3>
              </div>
              <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
                {group.items.map((item) => (
                  <li key={item}>
                    <Tag accent={accent}>{item}</Tag>
                  </li>
                ))}
              </ul>
            </Card>
          )
        })}
      </div>
    </AppScroll>
  )
}
