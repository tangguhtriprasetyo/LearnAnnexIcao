import { useRef, useState } from 'react'
import { FLASHCARDS, QUESTIONS } from '../content'
import { useProgress, validateImport } from '../lib/progress'

export function DataPage() {
  const { data, replaceAll, persistent } = useProgress()
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)
  const [confirmReset, setConfirmReset] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `dep-prep-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 1000)
    setMsg({ kind: 'ok', text: 'Backup downloaded. If nothing downloaded, this view blocks downloads: open the site directly in a browser tab.' })
  }

  const importJson = async (f: File) => {
    try {
      const parsed = validateImport(JSON.parse(await f.text()))
      replaceAll(parsed)
      setMsg({ kind: 'ok', text: `Restored ${parsed.attempts.length} answers, ${Object.keys(parsed.cards).length} card schedules and ${parsed.exams.length} exam results.` })
    } catch (e) {
      setMsg({ kind: 'err', text: e instanceof SyntaxError ? 'That file is not valid JSON.' : (e as Error).message })
    }
  }

  const verified = QUESTIONS.filter((q) => q.status === 'verified').length + FLASHCARDS.filter((c) => c.status === 'verified').length
  const total = QUESTIONS.length + FLASHCARDS.length

  return (
    <>
      <section className="section">
        <span className="label">Progress data</span>
        <h1>Your progress stays on this device</h1>
        <p className="muted" style={{ maxWidth: '64ch' }}>
          Nothing is sent to a server. Progress lives in this browser's storage, so clearing site data or switching devices loses it. Export a backup regularly and import it on another device.
        </p>
      </section>
      <div className="stats">
        <div className="stat"><span className="label">Storage</span><span className="v" style={{ fontSize: 'var(--step-1)', color: persistent ? 'var(--good)' : 'var(--bad)' }}>{persistent ? 'Saved locally' : 'Not persisting'}</span></div>
        <div className="stat"><span className="label">Answers logged</span><span className="v">{data.attempts.length}</span></div>
        <div className="stat"><span className="label">Cards scheduled</span><span className="v">{Object.keys(data.cards).length}</span></div>
        <div className="stat"><span className="label">Content verified</span><span className="v">{verified}<small> / {total}</small></span></div>
      </div>
      <div className="row">
        <button className="btn primary" onClick={exportJson}>Export backup</button>
        <button className="btn" onClick={() => fileRef.current?.click()}>Import backup</button>
        <input ref={fileRef} id="import-file" type="file" accept="application/json,.json" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) importJson(f); e.target.value = '' }} />
        <button className="btn danger" onClick={() => setConfirmReset(true)}>Reset all progress</button>
      </div>
      {confirmReset && (
        <div className="confirm" role="alertdialog" aria-label="Confirm reset">
          <span>This deletes every answer, card schedule and exam result on this device. Export a backup first if you might want them back.</span>
          <div className="row">
            <button className="btn" onClick={() => setConfirmReset(false)}>Cancel</button>
            <button className="btn danger" onClick={() => { replaceAll({ version: 1, attempts: [], labAttempts: [], cards: {}, exams: [], activeExam: null }); setConfirmReset(false); setMsg({ kind: 'ok', text: 'Progress reset.' }) }}>Delete progress</button>
          </div>
        </div>
      )}
      {msg && <p role="status" style={{ color: msg.kind === 'ok' ? 'var(--good)' : 'var(--bad)' }}>{msg.text}</p>}
      <section className="section">
        <h2>Importing replaces, it does not merge</h2>
        <p className="muted" style={{ maxWidth: '64ch' }}>An import overwrites what is on this device. If you studied on two devices, import on the one with less progress, or merge the files by hand.</p>
      </section>
    </>
  )
}
