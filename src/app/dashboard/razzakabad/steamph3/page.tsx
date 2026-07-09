// /dashboard/razzakabad/steamph3/page.tsx
'use client'

import { BoilerPage } from '@/components/metrics/BoilerPage'

export default function SteamPH3Page() {
  return (
    <BoilerPage
      title="Steam Power House 3"
      endpoint="/api/v1/am5/steamph3"
      backHref="/dashboard/razzakabad"
      backLabel="Razzakabad overview"
      report={{ back: '/dashboard/razzakabad/steamph3', backLabel: 'Steam Power House 3' }}
      boilers={[
        { label: 'WHRB 1', flow: 'whrb1steamflow', capacity: 1.0, metrics: [{ label: 'Pressure', key: 'whrb1steampressure', unit: 'PSI' }, { label: 'Water', key: 'whrb1waterflow', unit: 'M³/H' }] },
        { label: 'WHRB 2', flow: 'whrb2steamflow', capacity: 1.0, metrics: [{ label: 'Pressure', key: 'whrb2steampressure', unit: 'PSI' }, { label: 'Water', key: 'whrb2waterflow', unit: 'M³/H' }] },
        { label: 'WHRB 3', flow: 'whrb3steamflow', capacity: 1.0, metrics: [{ label: 'Pressure', key: 'whrb3steampressure', unit: 'PSI' }, { label: 'Water', key: 'whrb3waterflow', unit: 'M³/H' }] },
      ]}
    />
  )
}
