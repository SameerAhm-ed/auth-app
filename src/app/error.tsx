'use client' // Error boundaries must be Client Components

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button, buttonVariants } from '@/components/ui/Button'

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  useEffect(() => {
    // Surface the error in the console for debugging / reporting.
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center px-4">
      <Card className="shadow-sm p-10 w-full max-w-[400px] text-center">
        <div className="w-14 h-14 bg-danger-bg rounded-xl flex items-center justify-center mx-auto mb-5">
          <AlertTriangle size={24} className="text-danger" aria-hidden="true" />
        </div>
        <h1 className="text-xl font-semibold text-ink mb-2">Something went wrong</h1>
        <p className="text-sm text-ink-secondary mb-7 leading-relaxed">
          An unexpected error occurred. You can try again, or head back to your dashboard.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button variant="primary" onClick={() => unstable_retry()} className="flex-1">
            Try again
          </Button>
          <Link href="/dashboard" className={`${buttonVariants({ variant: 'secondary' })} flex-1`}>
            Back to dashboard
          </Link>
        </div>
      </Card>
    </div>
  )
}
