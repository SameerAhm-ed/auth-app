'use client'

import { useSyncExternalStore } from 'react'
import { Sun, Moon } from 'lucide-react'

/**
 * Toggles the `.dark` class on <html> and persists the choice.
 * The initial class is set by an inline script in the root layout (before
 * paint), so there's no flash. We read the live class via useSyncExternalStore
 * so the icon always matches the actual theme.
 */
function subscribe(callback: () => void) {
  const observer = new MutationObserver(callback)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
  return () => observer.disconnect()
}

function getSnapshot() {
  return document.documentElement.classList.contains('dark')
}

export function ThemeToggle() {
  const isDark = useSyncExternalStore(subscribe, getSnapshot, () => false)

  const toggle = () => {
    const next = !isDark
    document.documentElement.classList.toggle('dark', next)
    try {
      localStorage.setItem('theme', next ? 'dark' : 'light')
    } catch {
      /* ignore (private mode / storage disabled) */
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="w-9 h-9 flex items-center justify-center rounded-lg text-ink-secondary hover:text-ink hover:bg-canvas transition-colors"
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  )
}
