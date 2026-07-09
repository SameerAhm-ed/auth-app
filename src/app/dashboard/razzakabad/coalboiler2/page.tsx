// /dashboard/razzakabad/coalboiler2/page.tsx
'use client'

import { BoilerPage } from '@/components/metrics/BoilerPage'

export default function CoalBoiler2Page() {
  return (
    <BoilerPage
      title="Coal Boiler 2"
      subtitle="OS boiler steam flow and status."
      endpoint="/api/v1/am5/steamph3"
      backHref="/dashboard/razzakabad"
      backLabel="Razzakabad overview"
      report={{ back: '/dashboard/razzakabad/coalboiler2', backLabel: 'Coal Boiler 2' }}
      boilers={[
        {
          label: 'OS Boiler 2',
          flow: 'new_cb_steamflow',
          capacity: 20,
          metrics: [
            { label: 'Pressure', key: 'new_cb_steampressure', unit: 'PSI' },
            { label: 'Water', key: 'new_cb_waterflow', unit: 'M³/H' },
          ],
        },
      ]}
    />
  )
}
