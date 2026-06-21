'use client'

import { useSyncExternalStore, useState } from 'react'
import { Share, X } from 'lucide-react'

const DISMISS_KEY = 'ios-install-hint-dismissed'

// iOS Safari has no install prompt API, so we show a manual "Add to Home
// Screen" hint — but only on iOS, and only when not already installed.
function isEligible(): boolean {
  if (typeof window === 'undefined') return false
  const nav = window.navigator as Navigator & { standalone?: boolean }
  const ua = nav.userAgent || ''
  const isIOS = /iphone|ipad|ipod/i.test(ua) || (nav.platform === 'MacIntel' && nav.maxTouchPoints > 1)
  const standalone = window.matchMedia('(display-mode: standalone)').matches || nav.standalone === true
  return isIOS && !standalone
}

const subscribe = () => () => {}

export function IosInstallHint() {
  // Read eligibility without setState-in-effect (SSR-safe via the third arg).
  const eligible = useSyncExternalStore(subscribe, isEligible, () => false)
  const [dismissed, setDismissed] = useState<boolean>(() => {
    try {
      return typeof window !== 'undefined' && localStorage.getItem(DISMISS_KEY) === '1'
    } catch {
      return false
    }
  })

  if (!eligible || dismissed) return null

  const dismiss = () => {
    setDismissed(true)
    try {
      localStorage.setItem(DISMISS_KEY, '1')
    } catch {
      /* ignore */
    }
  }

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 p-3 flex justify-center pointer-events-none"
      style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
    >
      <div className="pointer-events-auto w-full max-w-sm flex items-center gap-3 rounded-xl border border-line bg-surface shadow-lg px-3 py-2.5">
        <div className="w-9 h-9 rounded-lg bg-surface-subtle flex items-center justify-center shrink-0">
          <Share size={16} className="text-ink-secondary" aria-hidden="true" />
        </div>
        <p className="flex-1 text-xs text-ink-secondary leading-snug">
          Install this app: tap <span className="font-medium text-ink">Share</span>, then{' '}
          <span className="font-medium text-ink">Add to Home Screen</span>.
        </p>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          className="w-8 h-8 -mr-1 flex items-center justify-center rounded-lg text-ink-muted hover:text-ink hover:bg-canvas transition-colors shrink-0"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
