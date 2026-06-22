import { WifiOff } from 'lucide-react'
import { Card } from '@/components/ui/Card'

export const metadata = { title: 'Offline · EMS' }

export default function OfflinePage() {
  return (
    <div className="min-h-dvh bg-canvas flex items-center justify-center px-4">
      <Card className="shadow-sm p-10 w-full max-w-[400px] text-center">
        <div className="w-14 h-14 bg-surface-subtle rounded-xl flex items-center justify-center mx-auto mb-5">
          <WifiOff size={24} className="text-ink-muted" aria-hidden="true" />
        </div>
        <h1 className="text-xl font-semibold text-ink mb-2">You&apos;re offline</h1>
        <p className="text-sm text-ink-secondary leading-relaxed">
          This is a live dashboard — it needs a connection to show real-time data. Reconnect and it&apos;ll resume automatically.
        </p>
      </Card>
    </div>
  )
}
