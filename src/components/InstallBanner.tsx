'use client'

import { useSyncExternalStore, useState } from 'react'
import { Download, X } from 'lucide-react'
import {
  subscribeInstallPrompt,
  getInstallPromptSnapshot,
  getInstallPromptServerSnapshot,
  triggerInstallPrompt,
} from '@/lib/installPrompt'

// Session-scoped dismiss: hidden for the rest of this tab session, back next
// visit. (Not localStorage — we don't want to bury it permanently.)
const DISMISS_KEY = 'pwa-install-banner-dismissed'

/**
 * App-wide install banner for Chromium browsers. Appears the moment the
 * browser fires `beforeinstallprompt` (captured pre-hydration by the head
 * script) — on ANY route, including logged-out /login. One tap runs the
 * native install dialog (browsers require that user gesture; a page cannot
 * auto-open it). iOS has no such event — IosInstallHint covers that.
 */
export function InstallBanner() {
  const deferred = useSyncExternalStore(
    subscribeInstallPrompt,
    getInstallPromptSnapshot,
    getInstallPromptServerSnapshot,
  )
  const [dismissed, setDismissed] = useState<boolean>(() => {
    try {
      return typeof window !== 'undefined' && sessionStorage.getItem(DISMISS_KEY) === '1'
    } catch {
      return false
    }
  })

  if (!deferred || dismissed) return null

  const dismiss = () => {
    setDismissed(true)
    try {
      sessionStorage.setItem(DISMISS_KEY, '1')
    } catch {
      /* ignore */
    }
  }

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-50 p-3 flex justify-center pointer-events-none"
      style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
    >
      <div className="pointer-events-auto w-full max-w-md flex items-center gap-3 rounded-xl border border-line bg-surface shadow-lg px-4 py-3">
        <div className="w-10 h-10 rounded-lg bg-brand-subtle flex items-center justify-center shrink-0">
          <Download size={18} className="text-brand" aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-ink leading-tight">Install EMS</p>
          <p className="text-xs text-ink-secondary leading-snug mt-0.5">
            Add to your home screen for full-screen, one-tap access.
          </p>
        </div>
        <button
          type="button"
          onClick={triggerInstallPrompt}
          className="shrink-0 inline-flex items-center justify-center h-9 px-3.5 rounded-lg text-sm font-semibold bg-brand text-brand-fg hover:opacity-90 transition-opacity"
        >
          Install
        </button>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          className="w-9 h-9 -mr-1 flex items-center justify-center rounded-lg text-ink-muted hover:text-ink hover:bg-canvas transition-colors shrink-0"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
