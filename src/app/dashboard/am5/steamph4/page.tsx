// /dashboard/am5/steamph4/page.tsx
'use client'

import { BoilerPage } from '@/components/metrics/BoilerPage'

export default function SteamPH4Page() {
  return (
    <BoilerPage
      title="Steam Power House 4"
      endpoint="/api/v1/am5/steamph4"
      boilers={[
        { label: 'WHRB 4', flow: 'whrb4steamflow', capacity: 1.0, metrics: [{ label: 'Pressure', key: 'whrb4steampressure', unit: 'PSI' }, { label: 'Water', key: 'whrb4waterflow', unit: 'M³/H' }] },
        { label: 'WHRB 5', flow: 'whrb5steamflow', capacity: 1.0, metrics: [{ label: 'Pressure', key: 'whrb5steampressure', unit: 'PSI' }, { label: 'Water', key: 'whrb5waterflow', unit: 'M³/H' }] },
      ]}
    />
  )
}
