'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ShieldOff } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button, buttonVariants } from '@/components/ui/Button'

export default function UnauthorizedPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleLogout = async () => {
    setLoading(true)
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } finally {
      router.push('/login')
      router.refresh()
    }
  }

  return (
    <div className="min-h-dvh bg-canvas flex items-center justify-center px-4">
      <Card className="shadow-sm p-10 w-full max-w-[400px] text-center">
        <div className="w-14 h-14 bg-danger-bg rounded-xl flex items-center justify-center mx-auto mb-5">
          <ShieldOff size={24} className="text-danger" aria-hidden="true" />
        </div>
        <h1 className="text-xl font-semibold text-ink mb-2">Access denied</h1>
        <p className="text-sm text-ink-secondary mb-7 leading-relaxed">
          You don&apos;t have permission to view this site. If you think this is a
          mistake, contact your administrator.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/dashboard" className={`${buttonVariants({ variant: 'primary' })} flex-1`}>
            Back to dashboard
          </Link>
          <Button variant="secondary" onClick={handleLogout} loading={loading} className="flex-1">
            {loading ? 'Logging out…' : 'Log out'}
          </Button>
        </div>
      </Card>
    </div>
  )
}
