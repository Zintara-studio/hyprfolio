// Experience.tsx — work history as a vertical timeline (accent: peach), then
// upstream open-source contributions, then education.
import type { AppProps } from './types'
import { experience, education, openSource } from '../data/content'
import { mocha } from '../theme/catppuccin'
import { AppScroll, PathBar, SectionLabel, Tag, Bullet, Card, ExternalLink } from './_ui'
import { GithubIcon } from '../components/icons'

export default function Experience(_props: AppProps) {
  return (
    <AppScroll>
      <PathBar path="experience/work.log" accent="peach" />

      <SectionLabel accent="peach">experience</SectionLabel>

      <ol className="relative mt-4 space-y-6">
        {/* Vertical timeline rail */}
        <span className="absolute top-1.5 bottom-1.5 left-[7px] w-px bg-surface1" aria-hidden="true" />

        {experience.map((job) => {
          const badges = [job.mode, job.location].filter((b) => b !== '')
          return (
            <li key={`${job.company}-${job.start}`} className="relative pl-9">
              {/* Node dot */}
              <span className="absolute top-1.5 left-0 flex h-4 w-4 items-center justify-center">
                {job.current ? (
                  <span
                    className="h-3 w-3 rounded-full ring-2 ring-base"
                    style={{
                      background: mocha.green,
                      boxShadow: `0 0 0 3px ${mocha.green}33, 0 0 10px ${mocha.green}99`,
                    }}
                    aria-hidden="true"
                  />
                ) : (
                  <span
                    className="h-2.5 w-2.5 rounded-full border-2 border-surface2 bg-base ring-2 ring-base"
                    aria-hidden="true"
                  />
                )}
              </span>

              {/* Card */}
              <Card accent={job.current ? 'green' : 'peach'} bar className="rounded-xl p-4 pt-4.5">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <h3 className="text-[15px] leading-snug text-text">
                    <span className="font-semibold">{job.role}</span>
                    <span className="text-overlay1"> @ </span>
                    <span className="font-medium" style={{ color: job.current ? mocha.green : mocha.peach }}>
                      {job.company}
                    </span>
                  </h3>

                  <div className="shrink-0 font-mono text-xs text-subtext0">
                    {job.start}
                    <span className="text-overlay0"> – </span>
                    {job.current ? <span style={{ color: mocha.green }}>Present</span> : <span>{job.end}</span>}
                  </div>
                </div>

                {badges.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {job.mode !== '' && <Tag accent="mauve">{job.mode}</Tag>}
                    {job.location !== '' && <Tag accent="sky">{job.location}</Tag>}
                  </div>
                )}

                {job.bullets.length > 0 && (
                  <ul className="mt-3 space-y-2">
                    {job.bullets.map((b, i) => (
                      <Bullet key={i} accent={job.current ? 'green' : 'peach'}>
                        {b}
                      </Bullet>
                    ))}
                  </ul>
                )}
              </Card>
            </li>
          )
        })}
      </ol>

      {openSource.length > 0 && (
        <section className="mt-8">
          <SectionLabel accent="teal">open source</SectionLabel>

          <div className="mt-4 space-y-4">
            {openSource.map((oss) => (
              <Card key={oss.project} accent="teal" bar className="rounded-xl p-4 pt-4.5">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <h3 className="flex items-center gap-2 text-[15px] leading-snug text-text">
                    <GithubIcon width={15} height={15} style={{ color: mocha.teal }} />
                    <span className="font-semibold" style={{ color: mocha.teal }}>
                      {oss.project}
                    </span>
                  </h3>
                  <p className="font-mono text-xs text-subtext0">{oss.tagline}</p>
                </div>

                <div className="mt-2.5 flex flex-wrap gap-2">
                  {oss.stack.map((tech) => (
                    <Tag key={tech} accent="sky">
                      {tech}
                    </Tag>
                  ))}
                </div>

                <ul className="mt-3 space-y-2">
                  {oss.bullets.map((b, i) => (
                    <Bullet key={i} accent="teal">
                      {b}
                    </Bullet>
                  ))}
                </ul>

                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-surface0 pt-3">
                  {oss.prs.map((pr) => (
                    <ExternalLink key={pr.url} href={pr.url} accent="green">
                      <span className="font-mono text-xs">{pr.label} · merged</span>
                    </ExternalLink>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {education.length > 0 && (
        <div className="mt-8">
          <SectionLabel accent="lavender">education</SectionLabel>

          <div className="mt-4 space-y-4">
            {education.map((edu) => (
              <Card key={`${edu.institution}-${edu.start}`} accent="lavender" className="rounded-xl p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <h3 className="text-[15px] leading-snug text-text">
                    <span className="font-semibold">{edu.degree}</span>
                    <span className="text-overlay1"> @ </span>
                    <span className="font-medium" style={{ color: mocha.lavender }}>
                      {edu.institution}
                    </span>
                  </h3>

                  <div className="shrink-0 font-mono text-xs text-subtext0">
                    {edu.start}
                    <span className="text-overlay0"> – </span>
                    {edu.end.toLowerCase() === 'present' ? (
                      <span style={{ color: mocha.green }}>Present</span>
                    ) : (
                      <span>{edu.end}</span>
                    )}
                  </div>
                </div>

                {edu.location !== '' && <div className="mt-2 font-mono text-xs text-subtext0">{edu.location}</div>}

                {edu.detail !== '' && <p className="mt-2 text-sm leading-relaxed text-subtext1">{edu.detail}</p>}
              </Card>
            ))}
          </div>
        </div>
      )}
    </AppScroll>
  )
}
