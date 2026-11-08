import { useMemo, useState } from 'react'
import { cardById, FLASHCARDS } from '../content'
import { topicById } from '../content/topics'
import { SourceLine, StatusBadge } from '../components/common'
import { QrhSteps } from '../components/QrhSteps'
import { useProgress } from '../lib/progress'
import { dueQueue, previewIntervals, Rating, review, type Grade } from '../lib/srs'

type Kind = 'all' | 'limitation' | 'memory-item' | 'fact'
const KIND_LABEL: Record<Kind, string> = { all: 'All cards', limitation: 'Limitations', 'memory-item': 'Memory items', fact: 'Air law figures' }
const NEW_PER_SESSION = 15

export function Cards() {
  const { data, update } = useProgress()
  const [kind, setKind] = useState<Kind>('all')
  const [queue, setQueue] = useState<string[] | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [reviewed, setReviewed] = useState(0)

  const ids = useMemo(() => FLASHCARDS.filter((c) => kind === 'all' || c.kind === kind).map((c) => c.id), [kind])
  const preview = dueQueue(ids, data.cards, new Date(), NEW_PER_SESSION)

  const start = () => { setQueue(preview); setRevealed(false); setReviewed(0) }

  if (queue && queue.length > 0) {
    const card = cardById.get(queue[0])!
    const stored = data.cards[card.id]
    const intervals = previewIntervals(stored, new Date())
    const grade = (g: Grade) => {
      const next = review(stored, g, new Date())
      update((d) => ({ ...d, cards: { ...d.cards, [card.id]: next } }))
      // "Again" re-queues the card at the end of this session so it is seen again today.
      setQueue((q) => (q ? [...q.slice(1), ...(g === Rating.Again ? [card.id] : [])] : q))
      setRevealed(false)
      setReviewed((n) => n + 1)
    }
    return (
      <section className="section">
        <div className="section-head">
          <span className="label">{KIND_LABEL[kind]} · {queue.length} left · {reviewed} reviewed</span>
          <button className="btn" onClick={() => setQueue(null)}>End review</button>
        </div>
        <div className="card">
          <div className="q-meta">
            <span className="label">{topicById.get(card.topic)?.title}</span>
            <StatusBadge status={card.status} />
            {!stored && <span className="badge" style={{ color: 'var(--accent)' }}>New</span>}
          </div>
          <p className="card-front">{card.kind === 'memory-item' ? `Recall the memory items: ${card.front}` : card.front}</p>
          {revealed ? (
            <>
              {card.steps ? <QrhSteps title={card.front} steps={card.steps} /> : <p className="card-back">{card.back}</p>}
              <SourceLine source={card.source} />
            </>
          ) : (
            <p className="muted">Say the answer out loud, the way you would in the sim, then reveal it.</p>
          )}
        </div>
        {revealed ? (
          <div className="grades" role="group" aria-label="How well did you recall it?">
            <button className="btn again" onClick={() => grade(Rating.Again)}>Again<small>{intervals[Rating.Again]}</small></button>
            <button className="btn" onClick={() => grade(Rating.Hard)}>Hard<small>{intervals[Rating.Hard]}</small></button>
            <button className="btn good" onClick={() => grade(Rating.Good)}>Good<small>{intervals[Rating.Good]}</small></button>
            <button className="btn" onClick={() => grade(Rating.Easy)}>Easy<small>{intervals[Rating.Easy]}</small></button>
          </div>
        ) : (
          <button className="btn primary" onClick={() => setRevealed(true)} autoFocus>Show answer</button>
        )}
        <p className="source">For memory items, grade "Again" for any wrong word or wrong order. A partly right memory item fails in the sim.</p>
      </section>
    )
  }

  return (
    <>
      <section className="section">
        <span className="label">Flashcards · spaced repetition</span>
        <h1>{queue ? 'Session complete' : 'Limitations and memory items'}</h1>
        <p className="muted" style={{ maxWidth: '64ch' }}>
          Each card is scheduled with FSRS, which estimates how fast you forget it and brings it back just before you would. The target here is 92% recall. Short daily reviews work better than one long session.
        </p>
      </section>
      <div className="row">
        {(Object.keys(KIND_LABEL) as Kind[]).map((k) => (
          <button key={k} className="chip" aria-pressed={kind === k} onClick={() => { setKind(k); setQueue(null) }}>{KIND_LABEL[k]}</button>
        ))}
      </div>
      <div className="row">
        <button className="btn primary" disabled={preview.length === 0} onClick={start}>
          {preview.length ? `Review ${preview.length} cards` : 'Nothing due'}
        </button>
        <span className="source">
          {preview.filter((id) => data.cards[id]).length} due · {preview.filter((id) => !data.cards[id]).length} new (max {NEW_PER_SESSION} new per session)
        </span>
      </div>
      {preview.length === 0 && <p className="muted">All caught up. The next cards come due as their intervals run out.</p>}
    </>
  )
}
