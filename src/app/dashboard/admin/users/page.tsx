'use client'

import { useEffect, useState, useCallback } from 'react'
import { UserPlus, Pencil, KeyRound, Power, X, ShieldCheck } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { ALL_SITES, ROLE_VALUES, type Role } from '@/lib/constants'
import { siteLabel, GROUP_SITE_IDS } from '@/lib/dashboardCategories'

// Split the site-access list so group grants (Garments, Razzakabad — each
// covers a whole category's worth of mills in one grant) are visually
// separate from individual mills, making it obvious at a glance which kind
// of access an admin is picking. GROUP_SITE_IDS stays correct automatically
// if a group is added later — same set constants.ts uses for routing.
const GROUP_SITES = ALL_SITES.filter((s) => GROUP_SITE_IDS.has(s))
const INDIVIDUAL_SITES = ALL_SITES.filter((s) => !GROUP_SITE_IDS.has(s))

interface AdminUser {
  id: string
  username: string
  name: string
  email: string | null
  role: Role
  sites: string[]
  isActive: boolean
}

type FormState = {
  mode: 'create' | 'edit'
  id?: string
  username: string
  name: string
  password: string
  role: Role
  sites: string[]
}

const blankForm: FormState = { mode: 'create', username: '', name: '', password: '', role: 'user', sites: [] }

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState<FormState | null>(null)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/users', { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load users')
      setUsers(data.users)
      setError('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // load() only sets state after awaiting the fetch, not synchronously.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [load])

  const openCreate = () => setForm({ ...blankForm })
  const openEdit = (u: AdminUser) =>
    setForm({ mode: 'edit', id: u.id, username: u.username, name: u.name, password: '', role: u.role, sites: u.sites })
  const close = () => setForm(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form) return
    setSaving(true)
    setError('')
    try {
      const isCreate = form.mode === 'create'
      const url = isCreate ? '/api/admin/users' : `/api/admin/users/${form.id}`
      const method = isCreate ? 'POST' : 'PATCH'
      const payload: Record<string, unknown> = {
        name: form.name,
        role: form.role,
        sites: form.role === 'user' ? form.sites : [],
      }
      if (isCreate) payload.username = form.username
      if (form.password) payload.password = form.password
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Save failed')
      close()
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (u: AdminUser) => {
    setError('')
    const res = await fetch(`/api/admin/users/${u.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !u.isActive }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error || 'Update failed')
      return
    }
    await load()
  }

  return (
    <main id="main-content" tabIndex={-1} className="max-w-4xl mx-auto px-4 sm:px-6 py-5 pb-16">
      <div className="flex items-center justify-between gap-4 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-brand-subtle text-ink flex items-center justify-center shrink-0">
            <ShieldCheck size={18} />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-ink">User Management</h1>
            <p className="text-[13px] text-ink-secondary">Create and manage accounts, roles and site access.</p>
          </div>
        </div>
        {!form && (
          <Button size="sm" icon={<UserPlus size={15} />} onClick={openCreate}>
            Add user
          </Button>
        )}
      </div>

      {error && <Alert className="mb-4">{error}</Alert>}

      {form && (
        <Card className="p-5 mb-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-ink">
              {form.mode === 'create' ? 'New user' : `Edit ${form.username}`}
            </h2>
            <button type="button" onClick={close} aria-label="Close" className="text-ink-muted hover:text-ink">
              <X size={18} />
            </button>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <Input
                label="Username"
                name="username"
                autoCapitalize="none"
                required
                disabled={form.mode === 'edit'}
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                placeholder="e.g. jsmith"
              />
              <Input
                label="Full name"
                name="name"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Javeria Smith"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-ink mb-1.5">
                  Role
                </label>
                <select
                  id="role"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
                  className="w-full h-11 px-3 rounded-lg border border-line-strong bg-surface text-ink text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                >
                  {ROLE_VALUES.map((r) => (
                    <option key={r} value={r}>
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <Input
                label={form.mode === 'create' ? 'Password' : 'New password (leave blank to keep)'}
                name="password"
                type="password"
                autoComplete="new-password"
                required={form.mode === 'create'}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder={form.mode === 'create' ? 'At least 8 characters' : '••••••••'}
              />
            </div>

            {form.role === 'user' ? (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-ink mb-2">Group access</p>
                  <p className="text-[12px] text-ink-muted mb-2">Grants every mill in the category at once.</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {GROUP_SITES.map((s) => (
                      <SiteCheckbox key={s} site={s} form={form} setForm={setForm} />
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-ink mb-2">Individual mill access</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {INDIVIDUAL_SITES.map((s) => (
                      <SiteCheckbox key={s} site={s} form={form} setForm={setForm} />
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-[13px] text-ink-muted rounded-lg bg-canvas border border-line px-3 py-2.5">
                {form.role === 'admin' ? 'Admins' : 'Managers'} can see all sites
                {form.role === 'admin' && ' and manage users'}.
              </p>
            )}

            <div className="flex items-center gap-2 pt-1">
              <Button type="submit" size="sm" loading={saving}>
                {form.mode === 'create' ? 'Create user' : 'Save changes'}
              </Button>
              <Button type="button" size="sm" variant="secondary" onClick={close}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <p className="text-sm text-ink-muted animate-pulse">Loading users…</p>
      ) : (
        <div className="space-y-2">
          {users.map((u) => (
            <Card key={u.id} className="p-4 flex flex-wrap items-center gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-ink truncate">{u.name}</span>
                  <RoleBadge role={u.role} />
                  {!u.isActive && (
                    <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded bg-danger-bg text-danger">Disabled</span>
                  )}
                </div>
                <p className="text-[13px] text-ink-muted">@{u.username}</p>
                {u.role === 'user' && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {u.sites.length === 0 ? (
                      <span className="text-[11px] text-ink-muted">No sites assigned</span>
                    ) : (
                      u.sites.map((s) => (
                        <span key={s} className="text-[11px] px-1.5 py-0.5 rounded bg-canvas border border-line text-ink-secondary">
                          {siteLabel(s)}
                        </span>
                      ))
                    )}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1">
                <IconBtn label="Edit" onClick={() => openEdit(u)}>
                  <Pencil size={15} />
                </IconBtn>
                <IconBtn label="Reset password" onClick={() => openEdit(u)}>
                  <KeyRound size={15} />
                </IconBtn>
                <IconBtn label={u.isActive ? 'Disable' : 'Enable'} onClick={() => toggleActive(u)} danger={u.isActive}>
                  <Power size={15} />
                </IconBtn>
              </div>
            </Card>
          ))}
        </div>
      )}
    </main>
  )
}

function SiteCheckbox({
  site,
  form,
  setForm,
}: {
  site: string
  form: FormState
  setForm: (f: FormState) => void
}) {
  const checked = form.sites.includes(site)
  return (
    <label
      className={`flex items-center gap-2 h-10 px-3 rounded-lg border text-sm cursor-pointer transition-colors ${
        checked ? 'border-brand bg-brand-subtle text-ink' : 'border-line text-ink-secondary hover:bg-canvas'
      }`}
    >
      <input
        type="checkbox"
        className="accent-brand"
        checked={checked}
        onChange={(e) =>
          setForm({
            ...form,
            sites: e.target.checked ? [...form.sites, site] : form.sites.filter((x) => x !== site),
          })
        }
      />
      {siteLabel(site)}
    </label>
  )
}

function RoleBadge({ role }: { role: Role }) {
  const styles: Record<Role, string> = {
    admin: 'bg-brand-subtle text-brand',
    manager: 'bg-canvas text-ink-secondary border border-line',
    user: 'bg-canvas text-ink-muted border border-line',
  }
  return <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded capitalize ${styles[role]}`}>{role}</span>
}

function IconBtn({
  children,
  label,
  onClick,
  danger,
}: {
  children: React.ReactNode
  label: string
  onClick: () => void
  danger?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`w-9 h-9 flex items-center justify-center rounded-lg text-ink-muted hover:bg-canvas transition-colors ${
        danger ? 'hover:text-danger' : 'hover:text-ink'
      }`}
    >
      {children}
    </button>
  )
}
