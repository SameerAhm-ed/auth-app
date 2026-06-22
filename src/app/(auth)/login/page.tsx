'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'

export default function LoginPage() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Something went wrong')
        return
      }

      // Let the server (proxy.ts) route to the right place based on role:
      // single-site roles are sent straight to their site, others see the overview.
      router.push('/dashboard')
      router.refresh()
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="shadow-sm p-8">
      <div className="mb-7">
        <h1 className="text-[22px] font-semibold text-ink mb-1">Log in</h1>
        <p className="text-sm text-ink-secondary">Welcome back. Enter your credentials to continue.</p>
      </div>

      {error && <Alert className="mb-5">{error}</Alert>}

      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Email address"
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={form.email}
          onChange={handleChange}
          placeholder="you@example.com"
        />

        <Input
          label="Password"
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={form.password}
          onChange={handleChange}
          placeholder="Enter your password"
        />

        <Button type="submit" fullWidth loading={loading}>
          {loading ? 'Logging in…' : 'Log in'}
        </Button>
      </form>

      <div className="mt-6 pt-5 border-t border-line text-center">
        <p className="text-sm text-ink-secondary">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-brand font-medium hover:underline">
            Create account
          </Link>
        </p>
      </div>

    </Card>
  )
}
