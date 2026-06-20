import { cn } from '@/lib/cn'

interface AlertProps {
  children: React.ReactNode
  variant?: 'danger'
  className?: string
}

/** Inline feedback banner. Announces itself to screen readers via role="alert". */
export function Alert({ children, variant = 'danger', className }: AlertProps) {
  const variants = {
    danger: 'bg-danger-bg border-danger-line text-danger',
  }

  return (
    <div
      role="alert"
      className={cn('flex items-start gap-2.5 rounded-lg border px-4 py-3 text-sm', variants[variant], className)}
    >
      <svg aria-hidden="true" className="mt-0.5 shrink-0" width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12A6 6 0 0010 16zm-1-5a1 1 0 112 0v-4a1 1 0 11-2 0v4zm0 2a1 1 0 112 0 1 1 0 01-2 0z"
          clipRule="evenodd"
        />
      </svg>
      <span>{children}</span>
    </div>
  )
}
