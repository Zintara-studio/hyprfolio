import { useState, useRef, useEffect } from 'react'
import type { AppProps } from './types'
import { identity, contact, githubHandle, linkedinHandle } from '../data/content'
import { mocha } from '../theme/catppuccin'
import { KeyVal, ExternalLink, Divider, Card } from './_ui'
import { MailIcon, LinkedinIcon, GithubIcon } from '../components/icons'

export default function Contact(_props: AppProps) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [])

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(contact.email)
    } catch {
      /* clipboard may be unavailable; still show feedback */
    }
    setCopied(true)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setCopied(false), 1600)
  }

  return (
    <div className="h-full w-full overflow-y-auto bg-base p-6 text-text">
      <div className="mx-auto flex max-w-md flex-col">
        {/* Heading */}
        <header className="mb-5">
          <h1 className="text-2xl font-semibold tracking-tight text-text">
            Let&apos;s build something.
          </h1>
          <p className="mt-1.5 text-sm leading-relaxed text-subtext0">{identity.tagline}</p>
        </header>

        {/* vcf-style contact block */}
        <Card accent="teal" bar className="rounded-xl p-4 pt-4.5">
          <div className="mb-3 flex items-center gap-2 font-mono text-[11px] tracking-wide text-overlay1 uppercase">
            <span style={{ color: mocha.teal }}>~</span>
            <span>{identity.username}.vcf</span>
          </div>

          <div className="flex flex-col gap-2.5">
            <KeyVal k="EMAIL" accent="teal">
              <a
                href={`mailto:${contact.email}`}
                className="underline-offset-2 hover:underline"
                style={{ color: mocha.sky }}
              >
                {contact.email}
              </a>
            </KeyVal>

            {contact.phone && (
              <KeyVal k="PHONE" accent="teal">
                <a
                  href={`tel:${contact.phone.replace(/\s+/g, '')}`}
                  className="underline-offset-2 hover:underline"
                  style={{ color: mocha.sky }}
                >
                  {contact.phone}
                </a>
              </KeyVal>
            )}

            <KeyVal k="LINKEDIN" accent="teal">
              <ExternalLink href={contact.linkedin} accent="sapphire">
                {linkedinHandle}
              </ExternalLink>
            </KeyVal>

            <KeyVal k="GITHUB" accent="teal">
              <ExternalLink href={contact.github} accent="sapphire">
                @{githubHandle}
              </ExternalLink>
            </KeyVal>

            <KeyVal k="LOCATION" accent="teal">
              <span className="text-subtext1">{contact.location}</span>
            </KeyVal>
          </div>
        </Card>

        {/* quick-glance icon row */}
        <div className="mt-3 flex items-center gap-3 text-overlay1">
          <a
            href={`mailto:${contact.email}`}
            aria-label="Email"
            className="transition-colors hover:text-text"
          >
            <MailIcon width={16} height={16} />
          </a>
          <ExternalLink href={contact.linkedin} accent="overlay1">
            <LinkedinIcon width={16} height={16} />
          </ExternalLink>
          <ExternalLink href={contact.github} accent="overlay1">
            <GithubIcon width={16} height={16} />
          </ExternalLink>
        </div>

        <Divider />

        {/* CTAs */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={copyEmail}
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-transform hover:-translate-y-0.5 active:translate-y-0"
            style={{
              background: `linear-gradient(135deg, ${mocha.teal}, ${mocha.green})`,
              color: mocha.crust,
              boxShadow: `0 8px 22px -10px ${mocha.teal}`,
            }}
          >
            <MailIcon width={15} height={15} />
            {copied ? 'Copied!' : 'Copy email'}
          </button>

          <a
            href={`mailto:${contact.email}`}
            className="inline-flex items-center gap-2 rounded-lg border border-surface1 bg-surface0 px-4 py-2 text-sm font-medium text-text transition-colors hover:border-surface2 hover:bg-surface1"
          >
            Email me
          </a>
        </div>

        <p className="mt-4 font-mono text-[11px] leading-relaxed text-overlay0">
          # static site — links open your own mail / browser client directly.
        </p>
      </div>
    </div>
  )
}
