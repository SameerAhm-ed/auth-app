// Shared status + fuel helpers for the live metric cards.

export interface Status {
  text: string
  color: string
}

// Sites with an explicit error flag (AM4/14/15).
export function engineStatus(error: number, load: number): Status {
  if (error > 0) return { text: 'FAULT', color: 'var(--color-danger)' }
  if (load === 0) return { text: 'OFF', color: 'var(--color-ink-muted)' }
  return { text: 'RUNNING', color: '#22a06b' }
}

// AM5 has no error fields — status is load-based.
export function loadStatus(value: number, threshold = 0): Status {
  if (value > threshold) return { text: 'RUNNING', color: '#22a06b' }
  return { text: 'OFF', color: 'var(--color-ink-muted)' }
}

// Fuel-type badges — fixed hex colors that stay legible in light + dark.
export interface Fuel {
  label: string
  color: string
}

export const FUEL: Record<string, Fuel> = {
  NGAS: { label: 'N-GAS', color: '#22a06b' },
  RLNG: { label: 'R-LNG', color: '#d9a441' },
  IND: { label: 'IND', color: '#e0852b' },
  DIESEL: { label: 'DIESEL', color: '#c0506b' },
  HFO: { label: 'HFO', color: '#3b82a6' },
}

// PH2-style dynamic fuel selector: 1=N-GAS, 2=R-LNG, 3=IND.
export function fuelFromBit(bit: number | undefined): Fuel | undefined {
  if (bit === 1) return FUEL.NGAS
  if (bit === 2) return FUEL.RLNG
  if (bit === 3) return FUEL.IND
  return undefined
}
