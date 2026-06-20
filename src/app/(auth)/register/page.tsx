'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Check, Circle } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: '8+ characters', pass: password.length >= 8 },
    { label: 'Uppercase letter', pass: /[A-Z]/.test(password) },
    { label: 'Number', pass: /\d/.test(password) },
  ]
  if (!password) return null
  return (
    <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1" aria-label="Password requirements">
      {checks.map((c) => (
        <li
          key={c.label}
          className={cn('flex items-center gap-1 text-xs', c.pass ? 'text-brand' : 'text-ink-secondary')}
        >
          {c.pass ? <Check size={12} aria-hidden="true" /> : <Circle size={9} aria-hidden="true" />}
          <span>{c.label}</span>
          <span className="sr-only">{c.pass ? '— met' : '— not met'}</span>
        </li>
      ))}
    </ul>
  )
}

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
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
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Something went wrong')
        return
      }

      // New accounts are single-site users; let proxy.ts route them to their site.
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
        <h1 className="text-[22px] font-semibold text-ink mb-1">Create an account</h1>
        <p className="text-sm text-ink-secondary">Fill in your details to get started.</p>
      </div>

      {error && <Alert className="mb-5">{error}</Alert>}

      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Full name"
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          required
          value={form.name}
          onChange={handleChange}
          placeholder="Jane Smith"
        />

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
          autoComplete="new-password"
          required
          minLength={8}
          value={form.password}
          onChange={handleChange}
          placeholder="Min. 8 characters"
          footer={<PasswordStrength password={form.password} />}
        />

        <Button type="submit" fullWidth loading={loading}>
          {loading ? 'Creating account…' : 'Create account'}
        </Button>
      </form>

      <div className="mt-6 pt-5 border-t border-line text-center">
        <p className="text-sm text-ink-secondary">
          Already have an account?{' '}
          <Link href="/login" className="text-brand font-medium hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </Card>
  )
}
