import { cn } from '@/lib/cn'

/** Neutral surface container: white background, hairline border, rounded. */
export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('bg-surface border border-line rounded-xl', className)} {...props} />
}
