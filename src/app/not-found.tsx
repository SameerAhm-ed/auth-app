import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { buttonVariants } from '@/components/ui/Button'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center px-4">
      <Card className="shadow-sm p-10 w-full max-w-[400px] text-center">
        <p className="text-4xl font-bold text-ink mb-2">404</p>
        <h1 className="text-xl font-semibold text-ink mb-2">Page not found</h1>
        <p className="text-sm text-ink-secondary mb-7 leading-relaxed">
          The page you&apos;re looking for doesn&apos;t exist or may have moved.
        </p>
        <Link href="/dashboard" className={buttonVariants({ variant: 'primary', fullWidth: true })}>
          Back to dashboard
        </Link>
      </Card>
    </div>
  )
}
