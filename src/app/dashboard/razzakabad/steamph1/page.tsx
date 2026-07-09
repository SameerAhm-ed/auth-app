// /dashboard/razzakabad/steamph1/page.tsx
'use client'

import { BoilerPage } from '@/components/metrics/BoilerPage'

export default function SteamPH1Page() {
  return (
    <BoilerPage
      title="Steam Power House 1"
      endpoint="/api/v1/am5/steamph1"
      backHref="/dashboard/razzakabad"
      backLabel="Razzakabad overview"
      report={{ back: '/dashboard/razzakabad/steamph1', backLabel: 'Steam Power House 1' }}
      boilers={[
        {
          label: 'Gas Fired Boiler',
          flow: 'gasfiredsteamflow',
          capacity: 20,
          metrics: [
            { label: 'Water', key: 'gasfiredwaterflow', unit: 'M³/H' },
            { label: 'Pressure', key: 'gasfiredpressure', unit: 'PSI' },
            { label: 'Gas', key: 'gasfiredgasflow', unit: 'M³/H' },
          ],
        },
        { label: 'WHRB 1', flow: 'whrb1steam', capacity: 1.5, metrics: [{ label: 'Pressure', key: 'whrb1pressure', unit: 'PSI' }, { label: 'Water', key: 'whrb1water', unit: 'M³/H' }] },
        { label: 'WHRB 2', flow: 'whrb2steam', capacity: 0.75, metrics: [{ label: 'Pressure', key: 'whrb2pressure', unit: 'PSI' }, { label: 'Water', key: 'whrb2water', unit: 'M³/H' }] },
        { label: 'WHRB 3', flow: 'whrb3steam', capacity: 0.88, metrics: [{ label: 'Pressure', key: 'whrb3pressure', unit: 'PSI' }] },
        { label: 'WHRB 4', flow: 'whrb4steam', capacity: 0.88, metrics: [{ label: 'Pressure', key: 'whrb4pressure', unit: 'PSI' }] },
      ]}
    />
  )
}
