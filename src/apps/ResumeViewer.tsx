import type { AppProps } from './types'
import { identity, RESUME_PATH, RESUME_FILENAME } from '../data/content'
import { mocha } from '../theme/catppuccin'
import { FileIcon, DownloadIcon, ExternalIcon } from '../components/icons'

export default function ResumeViewer(_props: AppProps) {
  return (
    <div className="flex h-full w-full flex-col bg-base">
      {/* Toolbar */}
      <div className="flex shrink-0 items-center gap-2 border-b border-surface0 bg-mantle px-3 py-2">
        <FileIcon
          width={16}
          height={16}
          style={{ color: mocha.red }}
          className="shrink-0"
        />
        <span className="truncate font-mono text-xs text-subtext1">
          {RESUME_FILENAME}
        </span>

        <div className="ml-auto flex items-center gap-2">
          <a
            href={RESUME_PATH}
            download
            className="inline-flex items-center gap-1.5 rounded-lg border border-surface0 bg-surface0/40 px-2.5 py-1 text-xs text-subtext1 transition-colors hover:border-red/60 hover:bg-surface1 hover:text-text"
          >
            <DownloadIcon width={14} height={14} style={{ color: mocha.red }} />
            Download
          </a>
          <a
            href={RESUME_PATH}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-surface0 bg-surface0/40 px-2.5 py-1 text-xs text-subtext1 transition-colors hover:border-red/60 hover:bg-surface1 hover:text-text"
          >
            <ExternalIcon width={14} height={14} style={{ color: mocha.red }} />
            Open in new tab
          </a>
        </div>
      </div>

      {/* PDF view */}
      <div className="relative flex min-h-0 flex-1 flex-col">
        <iframe
          src={RESUME_PATH}
          title={`${identity.name} resume`}
          className="h-full w-full border-0 bg-white"
        />
        <div className="shrink-0 border-t border-surface0 bg-mantle px-3 py-2 text-center text-xs text-subtext0">
          Can't see the PDF?{' '}
          <a
            href={RESUME_PATH}
            download
            className="text-red underline-offset-2 hover:underline"
          >
            Download it
          </a>{' '}
          /{' '}
          <a
            href={RESUME_PATH}
            target="_blank"
            rel="noreferrer"
            className="text-red underline-offset-2 hover:underline"
          >
            Open in a new tab
          </a>
          .
        </div>
      </div>
    </div>
  )
}
