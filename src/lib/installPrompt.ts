export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

type Listener = () => void

let deferred: BeforeInstallPromptEvent | null = null
const listeners = new Set<Listener>()
const notify = () => listeners.forEach((l) => l())

// Module-level singleton: registers on first import, whichever page loads
// first (e.g. /login), so the event isn't lost if the user isn't signed in
// yet when Chrome decides to fire it. A JS module only evaluates once, so
// this can't double-register the way a per-route component mount could.
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferred = e as BeforeInstallPromptEvent
    notify()
  })
  window.addEventListener('appinstalled', () => {
    deferred = null
    notify()
  })
}

export const subscribeInstallPrompt = (cb: Listener) => {
  listeners.add(cb)
  return () => listeners.delete(cb)
}
export const getInstallPromptSnapshot = () => deferred
export const getInstallPromptServerSnapshot = () => null

export async function triggerInstallPrompt() {
  if (!deferred) return
  await deferred.prompt()
  await deferred.userChoice
  deferred = null
  notify()
}
