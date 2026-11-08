import { useMemo } from 'react'
import { FLASHCARDS, QUESTIONS } from '../content'
import { DOMAINS, TOPICS } from '../content/topics'
import { Bar, fmtDate } from '../components/common'
import { EXAM_PRESETS } from '../lib/exam'
import { useProgress } from '../lib/progress'
import { topicStats } from '../lib/quiz'
import { dueQueue } from '../lib/srs'

export function Home() {
  const { data } = useProgress()
  const stats = useMemo(() => topicStats(QUESTIONS, data.attempts), [data.attempts])
  const now = new Date()
  const due = dueQueue(FLASHCARDS.map((c) => c.id), data.cards, now, 0).length
  const newCards = FLASHCARDS.filter((c) => !data.cards[c.id]).length
  let seen = 0, mastered = 0
  for (const s of stats.values()) { seen += s.seen; mastered += s.mastered }
  const lastExam = data.exams[data.exams.length - 1]
  const drafts = QUESTIONS.filter((q) => q.status === 'draft').length + FLASHCARDS.filter((c) => c.status === 'draft').length
  const weakest = [...stats.values()].filter((s) => s.seen >= 2).sort((a, b) => a.mastered / a.seen - b.mastered / b.seen).slice(0, 3)

  return (
    <>
      <section className="section">
        <span className="label">Boeing 737-800 · ICAO air law · direct entry</span>
        <h1>Prepare for the technical assessment</h1>
        <p className="muted" style={{ maxWidth: '62ch' }}>
          Answer questions by ATA chapter and ICAO Annex, drill limitations and memory items with spaced repetition, and sit timed mock exams. Every answer cites the document it comes from.
        </p>
      </section>

      {drafts > 0 && (
        <div className="annunciator" role="note">
          <span className="lamp">VERIFY</span>
          <p>
            {drafts} of {QUESTIONS.length + FLASHCARDS.length} items are <b>unverified</b>. They were written from general 737NG and ICAO knowledge, not from your airline's controlled documents. Your FCOM revision, engine variant and options can change limitations and memory items. Check each one against your current manuals and mark it verified in the content files.
          </p>
        </div>
      )}

      <div className="stats">
        <div className="stat"><span className="label">Cards due</span><span className="v">{due}<small> +{newCards} new</small></span></div>
        <div className="stat"><span className="label">Mastered</span><span className="v">{mastered}<small> / {QUESTIONS.length}</small></span></div>
        <div className="stat"><span className="label">Seen</span><span className="v">{seen}<small> questions</small></span></div>
        <div className="stat">
          <span className="label">Last mock</span>
          <span className="v">{lastExam ? <>{lastExam.pct}<small>% {lastExam.passed ? 'pass' : 'fail'}</small></> : <small>none yet</small>}</span>
        </div>
      </div>

      <div className="row">
        <a className="btn primary" href="#practice">Start practice</a>
        <a className="btn" href="#cards">Review {due + Math.min(newCards, 15)} cards</a>
        <a className="btn" href="#exam">Sit a mock exam</a>
      </div>

      {weakest.length > 0 && (
        <section className="section">
          <h2>Weakest areas</h2>
          <p className="muted">Topics where your latest answers are most often wrong (at least 2 questions seen).</p>
          <div className="row">
            {weakest.map((s) => (
              <span key={s.topic} className="badge" style={{ color: 'var(--bad)' }}>
                {TOPICS.find((t) => t.id === s.topic)?.title} · {Math.round((s.mastered / s.seen) * 100)}%
              </span>
            ))}
          </div>
        </section>
      )}

      <section className="section">
        <div className="section-head">
          <h2>Mastery by topic</h2>
          <span className="source">mastered = latest answer correct</span>
        </div>
        <div className="grid-2">
          {DOMAINS.map((d) => (
            <div className="panel" key={d.id}>
              <div className="section-head" style={{ marginBottom: 6 }}>
                <h3>{d.title}</h3>
                <span className="source">{d.blurb}</span>
              </div>
              <div className="bars">
                {TOPICS.filter((t) => t.domain === d.id).map((t) => {
                  const s = stats.get(t.id)
                  const total = s?.total ?? 0
                  const v = s && total ? s.mastered / total : null
                  return (
                    <div className="bar-row" key={t.id}>
                      <span className="name">{t.title}<small>{t.ref}</small></span>
                      <Bar value={s?.seen ? v : null} />
                      <span className="pct">{s?.mastered ?? 0}/{total}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {data.exams.length > 0 && (
        <section className="section">
          <h2>Mock exam history</h2>
          <div className="panel table-wrap">
            <table className="users">
              <thead><tr><th>Date</th><th>Exam</th><th>Score</th><th>Result</th></tr></thead>
              <tbody>
                {[...data.exams].reverse().slice(0, 10).map((e) => (
                  <tr key={e.at}>
                    <td className="mono">{fmtDate(e.at)}</td>
                    <td>{EXAM_PRESETS.find((p) => p.id === e.presetId)?.title ?? e.presetId}</td>
                    <td className="mono">{e.correct}/{e.total} · {e.pct}%</td>
                    <td style={{ color: e.passed ? 'var(--good)' : 'var(--bad)' }}>{e.passed ? 'PASS' : 'FAIL'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  )
}
