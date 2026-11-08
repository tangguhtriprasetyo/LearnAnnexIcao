import { useMemo, useState } from 'react'
import { QUESTIONS } from '../content'
import type { Question } from '../content/schema'
import { DOMAINS, TOPICS } from '../content/topics'
import { QuestionView } from '../components/QuestionView'
import { useProgress } from '../lib/progress'
import { selectPractice, type PracticeFilter } from '../lib/quiz'
import { newSeed } from '../lib/random'

interface Session { items: Question[]; seed: number; idx: number; chosen?: number; results: boolean[] }

export function Practice() {
  const { data, update } = useProgress()
  const [topics, setTopics] = useState<Set<string>>(() => new Set(TOPICS.map((t) => t.id)))
  const [filter, setFilter] = useState<PracticeFilter>('all')
  const [count, setCount] = useState(10)
  const [session, setSession] = useState<Session | null>(null)

  const available = useMemo(
    () => selectPractice(QUESTIONS, data.attempts, topics, filter, 10_000, 1).length,
    [data.attempts, topics, filter],
  )

  const toggleTopic = (id: string) => setTopics((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n })
  const toggleDomain = (d: string) => {
    const ids = TOPICS.filter((t) => t.domain === d).map((t) => t.id)
    const allOn = ids.every((id) => topics.has(id))
    setTopics((s) => { const n = new Set(s); ids.forEach((id) => (allOn ? n.delete(id) : n.add(id))); return n })
  }

  const start = () => {
    const seed = newSeed()
    setSession({ items: selectPractice(QUESTIONS, data.attempts, topics, filter, count, seed), seed, idx: 0, results: [] })
  }

  if (session) {
    const done = session.idx >= session.items.length
    if (done) {
      const right = session.results.filter(Boolean).length
      return (
        <section className="section">
          <span className="label">Session complete</span>
          <h1>{right} / {session.items.length} correct</h1>
          <p className="muted">Answers are saved. Missed questions show up under the "Missed last time" filter until you get them right.</p>
          <div className="row">
            <button className="btn primary" onClick={start}>Another set</button>
            <button className="btn" onClick={() => setSession(null)}>Change topics</button>
          </div>
        </section>
      )
    }
    const q = session.items[session.idx]
    const answered = session.chosen !== undefined
    const choose = (i: number) => {
      const correct = i === q.answer
      update((d) => ({ ...d, attempts: [...d.attempts, { qid: q.id, correct, at: Date.now(), mode: 'practice' }] }))
      setSession({ ...session, chosen: i, results: [...session.results, correct] })
    }
    const next = () => setSession({ ...session, idx: session.idx + 1, chosen: undefined })
    return (
      <section className="section">
        <div className="section-head">
          <span className="label">Practice · question {session.idx + 1} of {session.items.length}</span>
          <button className="btn" onClick={() => setSession(null)}>End session</button>
        </div>
        <div className="progress-line"><div style={{ width: `${(session.idx / session.items.length) * 100}%` }} /></div>
        <div className="panel">
          <QuestionView q={q} seed={session.seed} chosen={session.chosen} onChoose={choose} reveal={answered} />
        </div>
        {answered && (
          <div className="row">
            <button className="btn primary" onClick={next} autoFocus>
              {session.idx + 1 === session.items.length ? 'Finish' : 'Next question'}
            </button>
          </div>
        )}
      </section>
    )
  }

  return (
    <>
      <section className="section">
        <span className="label">Practice</span>
        <h1>Build a question set</h1>
        <p className="muted">You see the answer, explanation and source reference right after each question.</p>
      </section>
      <div className="panel topic-picks">
        {DOMAINS.map((d) => {
          const ids = TOPICS.filter((t) => t.domain === d.id)
          return (
            <fieldset key={d.id}>
              <legend className="row" style={{ gap: 10 }}>
                <span className="label">{d.title}</span>
                <button type="button" className="chip" onClick={() => toggleDomain(d.id)}>
                  {ids.every((t) => topics.has(t.id)) ? 'None' : 'All'}
                </button>
              </legend>
              {ids.map((t) => (
                <button key={t.id} type="button" className="chip" aria-pressed={topics.has(t.id)} onClick={() => toggleTopic(t.id)}>
                  {t.title}
                </button>
              ))}
            </fieldset>
          )
        })}
      </div>
      <div className="row" style={{ alignItems: 'flex-end', gap: 16 }}>
        <label className="field">
          <span className="label">Questions</span>
          <select id="practice-filter" value={filter} onChange={(e) => setFilter(e.target.value as PracticeFilter)}>
            <option value="all">All in selected topics</option>
            <option value="unseen">Not attempted yet</option>
            <option value="missed">Missed last time</option>
          </select>
        </label>
        <label className="field">
          <span className="label">Set size</span>
          <select id="practice-count" value={count} onChange={(e) => setCount(Number(e.target.value))}>
            {[5, 10, 20, 40].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
        <button className="btn primary" disabled={available === 0} onClick={start}>
          Start {Math.min(count, available)} questions
        </button>
        <span className="source">{available} match</span>
      </div>
      {available === 0 && (
        <p className="muted">
          {filter === 'missed' ? 'Nothing missed in these topics. Pick "All" or other topics.' : filter === 'unseen' ? 'You have attempted every question in these topics.' : 'Select at least one topic.'}
        </p>
      )}
    </>
  )
}
