'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'

export default function LoginPage() {
  const router = useRouter()
  const [form, setForm] = useState({ username: '', password: '' })
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

      // Server returns where to land (single-site users go straight to their site).
      router.push(data.redirect || '/dashboard')
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
          label="Username"
          id="username"
          name="username"
          type="text"
          autoComplete="username"
          autoCapitalize="none"
          required
          value={form.username}
          onChange={handleChange}
          placeholder="Enter your username"
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
          Accounts are created by your administrator.
        </p>
      </div>
    </Card>
  )
}
