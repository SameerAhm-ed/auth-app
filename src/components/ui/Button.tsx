import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/cn'

type Variant = 'primary' | 'secondary' | 'ghost'
type Size = 'md' | 'sm'

interface VariantOptions {
  variant?: Variant
  size?: Size
  fullWidth?: boolean
}

/**
 * Returns the className for a button-styled element. Use directly on a
 * `<Link>` when you need link semantics with button styling.
 */
export function buttonVariants({ variant = 'primary', size = 'md', fullWidth = false }: VariantOptions = {}): string {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed'

  const sizes: Record<Size, string> = {
    md: 'h-11 px-4',
    sm: 'h-9 px-4',
  }

  const variants: Record<Variant, string> = {
    primary: 'bg-brand hover:bg-brand-hover text-brand-fg',
    secondary: 'border border-line-strong text-ink hover:bg-canvas',
    ghost: 'text-ink-secondary hover:text-ink hover:bg-canvas',
  }

  return cn(base, sizes[size], variants[variant], fullWidth && 'w-full')
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantOptions {
  loading?: boolean
  /** Leading icon, swapped for a spinner while `loading`. */
  icon?: React.ReactNode
}

export function Button({
  variant,
  size,
  fullWidth,
  loading = false,
  icon,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size, fullWidth }), className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 size={15} className="animate-spin" /> : icon}
      {children}
    </button>
  )
}
