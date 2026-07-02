import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { Card } from '@/components/ui/Card'

/** Themed placeholder for AM dashboards that aren't instrumented yet. */
export function ComingSoon({ label }: { label: string }) {
  return (
    <main id="main-content" tabIndex={-1} className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div>
        <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm text-ink-secondary hover:text-ink transition-colors mb-2">
          <ChevronLeft size={15} />
          Dashboard
        </Link>
        <h1 className="text-2xl font-semibold text-ink mb-1">{label}</h1>
        <p className="text-sm text-ink-secondary">Monitoring for {label} isn&apos;t set up yet.</p>
      </div>

      <Card className="p-10 text-center">
        <h2 className="text-base font-semibold text-ink mb-1">Coming soon</h2>
        <p className="text-sm text-ink-secondary">This dashboard will be available once {label} is instrumented.</p>
      </Card>
    </main>
  )
}
