// /dashboard/razzakabad/coalboiler1/page.tsx
'use client'

import { BoilerPage } from '@/components/metrics/BoilerPage'

export default function CoalBoiler1Page() {
  return (
    <BoilerPage
      title="Out Source Boiler 1"
      subtitle="OS boiler steam flow and status."
      endpoint="/api/v1/am5/steamph3"
      backHref="/dashboard/razzakabad"
      backLabel="Razzakabad overview"
      report={{ back: '/dashboard/razzakabad/coalboiler1', backLabel: 'Out Source Boiler 1' }}
      boilers={[
        {
          label: 'OS Boiler',
          flow: 'steamflow',
          capacity: 15,
          metrics: [
            { label: 'Pressure', key: 'steampressure', unit: 'PSI' },
            { label: 'Water', key: 'waterflow', unit: 'M³/H' },
          ],
        },
      ]}
    />
  )
}
