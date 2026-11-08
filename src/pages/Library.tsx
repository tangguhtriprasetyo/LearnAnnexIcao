import { useMemo, useState } from 'react'
import { FLASHCARDS, QUESTIONS } from '../content'
import { DOMAINS, topicById, TOPICS } from '../content/topics'
import { SourceLine, StatusBadge } from '../components/common'
import { QrhSteps } from '../components/QrhSteps'

export function Library() {
  const [domain, setDomain] = useState('')
  const [topic, setTopic] = useState('')
  const [status, setStatus] = useState('')
  const [text, setText] = useState('')
  const [what, setWhat] = useState<'questions' | 'cards'>('questions')

  const match = (t: string, st: string, hay: string) =>
    (!domain || topicById.get(t)?.domain === domain) &&
    (!topic || t === topic) &&
    (!status || st === status) &&
    (!text || hay.toLowerCase().includes(text.toLowerCase()))

  const qs = useMemo(() => QUESTIONS.filter((q) => match(q.topic, q.status, `${q.stem} ${q.options.join(' ')} ${q.explanation} ${q.source.ref}`)), [domain, topic, status, text]) // eslint-disable-line
  const cs = useMemo(() => FLASHCARDS.filter((c) => match(c.topic, c.status, `${c.front} ${c.back ?? ''} ${(c.steps ?? []).map((s) => s.item + s.action).join(' ')}`)), [domain, topic, status, text]) // eslint-disable-line

  return (
    <>
      <section className="section">
        <span className="label">Library</span>
        <h1>Browse and review the content</h1>
        <p className="muted" style={{ maxWidth: '64ch' }}>Use this view to check items against your manuals. Filter by unverified, open an item, compare it with the cited section, then update its status in the content files.</p>
      </section>
      <div className="row">
        <button className="chip" aria-pressed={what === 'questions'} onClick={() => setWhat('questions')}>Questions ({QUESTIONS.length})</button>
        <button className="chip" aria-pressed={what === 'cards'} onClick={() => setWhat('cards')}>Flashcards ({FLASHCARDS.length})</button>
      </div>
      <div className="row" style={{ alignItems: 'flex-end' }}>
        <label className="field" style={{ flex: '1 1 200px' }}><span className="label">Search</span>
          <input id="lib-search" type="search" value={text} onChange={(e) => setText(e.target.value)} placeholder="e.g. PTU, Annex 13, EGT" /></label>
        <label className="field"><span className="label">Subject</span>
          <select id="lib-domain" value={domain} onChange={(e) => { setDomain(e.target.value); setTopic('') }}>
            <option value="">All</option>{DOMAINS.map((d) => <option key={d.id} value={d.id}>{d.title}</option>)}
          </select></label>
        <label className="field"><span className="label">Topic</span>
          <select id="lib-topic" value={topic} onChange={(e) => setTopic(e.target.value)}>
            <option value="">All</option>{TOPICS.filter((t) => !domain || t.domain === domain).map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
          </select></label>
        <label className="field"><span className="label">Status</span>
          <select id="lib-status" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All</option><option value="draft">Unverified</option><option value="verified">Verified</option>
          </select></label>
      </div>
      <div className="panel" style={{ paddingBlock: 4 }}>
        {what === 'questions' ? (
          qs.length === 0 ? <p className="muted" style={{ padding: '14px 0' }}>No questions match these filters.</p> :
          qs.map((q) => (
            <details key={q.id} className="lib-item">
              <summary>
                <span className="q-meta"><span className="label">{topicById.get(q.topic)?.title}</span><StatusBadge status={q.status} /><span className="source">{q.id}</span></span>
                <span>{q.stem}</span>
              </summary>
              <p className="answer">Answer: {q.options[q.answer]}</p>
              <p className="muted">{q.explanation}</p>
              <SourceLine source={q.source} />
            </details>
          ))
        ) : cs.length === 0 ? <p className="muted" style={{ padding: '14px 0' }}>No cards match these filters.</p> :
          cs.map((c) => (
            <details key={c.id} className="lib-item">
              <summary>
                <span className="q-meta"><span className="label">{topicById.get(c.topic)?.title}</span><StatusBadge status={c.status} /><span className="source">{c.id}</span></span>
                <span>{c.front}</span>
              </summary>
              {c.steps ? <QrhSteps title={c.front} steps={c.steps} /> : <p className="answer">{c.back}</p>}
              <SourceLine source={c.source} />
            </details>
          ))}
      </div>
    </>
  )
}
