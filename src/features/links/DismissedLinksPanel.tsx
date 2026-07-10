import { useState } from 'react'
import type { LinkStat } from '../../types'
import { formatTimeAgo } from '../../shared/utils'

interface DismissedLinksPanelProps {
  dismissedMap: Record<string, LinkStat>
  onRestoreLink?: (url: string) => void
}

export function DismissedLinksPanel({ dismissedMap, onRestoreLink }: DismissedLinksPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  const links = Object.values(dismissedMap).sort(
    (a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime()
  )

  if (links.length === 0) return null

  return (
    <div className="flex flex-col mt-4 overflow-hidden">
      <button
        onClick={() => setIsCollapsed((v) => !v)}
        className="w-full flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 bg-theme-secondary hover:bg-theme-tertiary transition-colors focus:outline-none"
      >
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-lg bg-amber-500/20">
            <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="text-left">
            <h2 className="text-sm sm:text-base font-semibold text-theme-primary">Ziyaret Edilen Linkler</h2>
            <p className="text-xs text-theme-muted">{links.length} link açıldı — tekrar gönderilirse burada güncellenir</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-bold text-amber-400">
            {links.length}
          </span>
          <svg
            className={`h-4 w-4 text-theme-muted transition-transform duration-200 ${isCollapsed ? '-rotate-90' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {!isCollapsed && (
        <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 animate-fade-in">
          <div className="flex flex-wrap gap-2">
            {links.map((link) => (
              <div
                key={link.url}
                className="group flex items-center gap-1.5 rounded-lg bg-theme-tertiary hover:bg-amber-500/5 px-2.5 py-1.5 transition-colors"
              >
                <svg className="h-3 w-3 flex-shrink-0 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="max-w-[200px] sm:max-w-[280px] truncate text-xs text-theme-muted hover:text-amber-400 transition-colors"
                  title={link.url}
                >
                  {link.hostname}
                </a>
                {link.count > 1 && (
                  <span className="rounded-full bg-amber-500/20 px-1.5 py-0.5 text-xs font-bold text-amber-400">
                    ×{link.count}
                  </span>
                )}
                <span className="hidden sm:block text-xs text-theme-muted opacity-60">
                  {formatTimeAgo(link.lastAt)}
                </span>
                {onRestoreLink && (
                  <button
                    onClick={() => onRestoreLink(link.url)}
                    className="opacity-0 group-hover:opacity-100 ml-1 flex h-4 w-4 items-center justify-center rounded text-theme-muted hover:text-theme-primary transition-all"
                    title="Listeye geri ekle"
                  >
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
