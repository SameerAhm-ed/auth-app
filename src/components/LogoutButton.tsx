'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export default function LogoutButton() {
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
    <Button
      variant="ghost"
      size="sm"
      onClick={handleLogout}
      loading={loading}
      icon={<LogOut size={15} />}
      aria-label="Log out"
      className="h-11 md:h-9 px-2.5 sm:px-4"
    >
      {/* Label hides on mobile to keep the navbar uncluttered (icon-only tap target). */}
      <span className="hidden sm:inline">{loading ? 'Logging out…' : 'Log out'}</span>
    </Button>
  )
}
