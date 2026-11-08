import type { Source } from '../content/schema'

export function StatusBadge({ status }: { status: 'draft' | 'verified' }) {
  return status === 'verified' ? (
    <span className="badge verified" title="Checked against the cited document revision">Verified</span>
  ) : (
    <span className="badge draft" title="Written from general knowledge. Check against your current controlled documents.">Unverified</span>
  )
}

export function SourceLine({ source }: { source: Source }) {
  return (
    <p className="source">
      <b>{source.doc}</b> · {source.ref}
      {source.revision ? ` · ${source.revision}` : ' · revision not recorded'}
    </p>
  )
}

export function Bar({ value }: { value: number | null }) {
  const pct = value == null ? 0 : Math.round(value * 100)
  const cls = value == null ? '' : value < 0.5 ? 'low' : value < 0.8 ? 'mid' : 'high'
  return (
    <div className="track" role="img" aria-label={value == null ? 'not started' : `${pct}%`}>
      <div className={`fill ${cls}`} style={{ width: `${pct}%` }} />
    </div>
  )
}

export function fmtDuration(ms: number) {
  const s = Math.ceil(ms / 1000)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  const mm = String(m).padStart(h ? 2 : 1, '0')
  return `${h ? `${h}:` : ''}${mm}:${String(sec).padStart(2, '0')}`
}

export function fmtDate(ms: number) {
  return new Date(ms).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}
