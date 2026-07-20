'use client'

import { useSyncExternalStore } from 'react'
import { Download } from 'lucide-react'
import {
  subscribeInstallPrompt,
  getInstallPromptSnapshot,
  getInstallPromptServerSnapshot,
  triggerInstallPrompt,
} from '@/lib/installPrompt'

/**
 * Shows an "Install" button whenever the shared install-prompt store has a
 * captured `beforeinstallprompt` event (captured app-wide, not just here —
 * see src/lib/installPrompt.ts). Hidden otherwise.
 */
export function InstallButton() {
  const deferred = useSyncExternalStore(subscribeInstallPrompt, getInstallPromptSnapshot, getInstallPromptServerSnapshot)

  if (!deferred) return null

  return (
    <button
      type="button"
      onClick={triggerInstallPrompt}
      className="inline-flex items-center justify-center gap-1.5 h-11 md:h-9 px-3 rounded-lg text-sm font-medium text-ink-secondary hover:text-ink hover:bg-canvas transition-colors"
    >
      <Download size={15} />
      <span className="hidden sm:inline">Install</span>
    </button>
  )
}
