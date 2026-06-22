// Builds the historical-report href for an AM5 source. Returns undefined when
// the card has no EMS tag yet — so the report icon only shows once an id exists.
export function reportHref(opts: {
  tag?: number
  label: string
  unit?: string
  back?: string
  backLabel?: string
}): string | undefined {
  if (!opts.tag) return undefined
  const p = new URLSearchParams({ label: opts.label })
  if (opts.unit) p.set('unit', opts.unit)
  if (opts.back) p.set('back', opts.back)
  if (opts.backLabel) p.set('backLabel', opts.backLabel)
  return `/dashboard/am5/report/${opts.tag}?${p.toString()}`
}
