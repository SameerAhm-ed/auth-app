export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

declare global {
  interface Window {
    // Set by the inline capture script in the root layout <head> — see
    // installCaptureScript in src/app/layout.tsx. Holds the deferred
    // beforeinstallprompt event (or null once used/installed).
    __deferredInstall?: BeforeInstallPromptEvent | null
  }
}

type Listener = () => void
const listeners = new Set<Listener>()
const notify = () => listeners.forEach((l) => l())

// The one-shot beforeinstallprompt event is captured pre-hydration by the
// inline head script (so it can never fire into a page with no listener).
// This module only *reacts* to it: the head script dispatches a 'bip' event
// on every change to window.__deferredInstall, and we re-notify subscribers.
if (typeof window !== 'undefined') {
  window.addEventListener('bip', notify)
}

export const subscribeInstallPrompt = (cb: Listener) => {
  listeners.add(cb)
  return () => {
    listeners.delete(cb)
  }
}

// getSnapshot must be referentially stable while unchanged: window.__deferredInstall
// is the same event object (or null) until the head script mutates it, then 'bip'
// fires and useSyncExternalStore re-reads. No new object created here.
export const getInstallPromptSnapshot = (): BeforeInstallPromptEvent | null =>
  (typeof window !== 'undefined' ? window.__deferredInstall ?? null : null)
export const getInstallPromptServerSnapshot = (): BeforeInstallPromptEvent | null => null

export async function triggerInstallPrompt() {
  const e = typeof window !== 'undefined' ? window.__deferredInstall : null
  if (!e) return
  await e.prompt()
  await e.userChoice
  window.__deferredInstall = null
  notify()
}
