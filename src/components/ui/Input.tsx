'use client'

import { useId, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/cn'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  /** Optional content rendered below the field (e.g. a strength meter). */
  footer?: React.ReactNode
}

/**
 * Labelled text input. When `type="password"` it renders an accessible
 * show/hide toggle with a comfortable (36px) touch target.
 */
export function Input({ label, footer, id, type = 'text', className, ...props }: InputProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const [reveal, setReveal] = useState(false)

  const isPassword = type === 'password'
  const inputType = isPassword ? (reveal ? 'text' : 'password') : type

  return (
    <div className="space-y-1.5">
      <label htmlFor={inputId} className="block text-sm font-medium text-ink">
        {label}
      </label>
      <div className="relative">
        <input
          id={inputId}
          type={inputType}
          className={cn(
            'w-full h-11 px-3 text-base sm:text-sm border border-line-strong rounded-lg bg-surface text-ink placeholder:text-ink-muted focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all',
            isPassword && 'pr-11',
            className,
          )}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setReveal((v) => !v)}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-md text-ink-muted hover:text-ink-secondary transition-colors"
            aria-label={reveal ? 'Hide password' : 'Show password'}
          >
            {reveal ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
      {footer}
    </div>
  )
}
