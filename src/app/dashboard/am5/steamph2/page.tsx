// /dashboard/am5/steamph2/page.tsx
'use client'

import { BoilerPage } from '@/components/metrics/BoilerPage'

export default function SteamPH2Page() {
  return (
    <BoilerPage
      title="Steam Power House 2"
      endpoint="/api/v1/am5/steamph2"
      report={{ back: '/dashboard/am5/steamph2', backLabel: 'Steam Power House 2' }}
      boilers={[
        {
          label: 'HRSG',
          flow: 'hrsgsteamflow',
          capacity: 20,
          metrics: [
            { label: 'Pressure', key: 'hrsgsteampressure', unit: 'PSI' },
            { label: 'Water', key: 'hrsgwaterflow', unit: 'M³/H' },
            { label: 'Free Steam', key: 'hrsgfreesteamflow', unit: 'T/H' },
          ],
        },
        { label: 'WHRB 1', flow: 'whrb1steamflow', capacity: 1.0, metrics: [{ label: 'Pressure', key: 'whrb1steampressure', unit: 'PSI' }, { label: 'Water', key: 'whrb1waterflow', unit: 'M³/H' }] },
        { label: 'WHRB 2', flow: 'whrb2steamflow', capacity: 1.6, metrics: [{ label: 'Pressure', key: 'whrb2steampressure', unit: 'PSI' }, { label: 'Water', key: 'whrb2waterflow', unit: 'M³/H' }] },
        { label: 'WHRB 3', flow: 'whrb3steamflow', capacity: 1.6, metrics: [{ label: 'Pressure', key: 'whrb3steampressure', unit: 'PSI' }, { label: 'Water', key: 'whrb3waterflow', unit: 'M³/H' }] },
        { label: 'WHRB 4', flow: 'whrb4steamflow', capacity: 1.0, metrics: [{ label: 'Pressure', key: 'whrb4steampressure', unit: 'PSI' }, { label: 'Water', key: 'whrb4waterflow', unit: 'M³/H' }] },
      ]}
    />
  )
}
