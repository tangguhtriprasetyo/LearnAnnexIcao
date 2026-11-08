import { useEffect, useMemo, useRef, useState } from 'react'
import { QUESTIONS, questionById } from '../content'
import { topicById } from '../content/topics'
import { Bar, fmtDuration } from '../components/common'
import { QuestionView } from '../components/QuestionView'
import { buildExam, EXAM_PRESETS, examMinutes, remainingMs, scoreExam, type ExamResult } from '../lib/exam'
import { useProgress } from '../lib/progress'
import { newSeed } from '../lib/random'

export function Exam() {
  const { data, update } = useProgress()
  const exam = data.activeExam
  const [idx, setIdx] = useState(0)
  const [now, setNow] = useState(Date.now())
  const [confirming, setConfirming] = useState(false)
  const [result, setResult] = useState<{ r: ExamResult; ids: string[]; answers: Record<string, number | undefined>; seed: number } | null>(null)
  const [reviewIdx, setReviewIdx] = useState<number | null>(null)

  const preset = exam ? EXAM_PRESETS.find((p) => p.id === exam.presetId) : undefined
  const left = exam ? remainingMs(exam, now) : 0

  useEffect(() => {
    if (!exam) return
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [exam])

  const submitted = useRef<number | null>(null)
  const submit = () => {
    if (!exam || !preset || submitted.current === exam.startedAt) return
    submitted.current = exam.startedAt // guard against double submit (timer + click, StrictMode effects)
    const at = Date.now()
    const done = { ...exam, submittedAt: at }
    const r = scoreExam(done, questionById, preset.passPct, at)
    const attempts = exam.questionIds
      .filter((id) => questionById.has(id))
      .map((qid) => ({ qid, correct: exam.answers[qid] === questionById.get(qid)!.answer, at, mode: 'exam' as const }))
    update((d) => ({ ...d, activeExam: null, exams: [...d.exams, r], attempts: [...d.attempts, ...attempts] }))
    setResult({ r, ids: exam.questionIds, answers: exam.answers, seed: exam.seed })
    setConfirming(false)
    setIdx(0)
  }

  // Auto-submit when time runs out (also covers reopening the tab after expiry).
  useEffect(() => {
    if (exam && left === 0) submit()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exam, left])

  const poolSize = useMemo(() => Object.fromEntries(EXAM_PRESETS.map((p) => [p.id, buildExam(p, QUESTIONS, 0, 0).questionIds.length])), [])

  if (result) {
    const { r } = result
    if (reviewIdx !== null) {
      const qid = result.ids[reviewIdx]
      const q = questionById.get(qid)
      return (
        <section className="section">
          <div className="section-head">
            <span className="label">Review · {reviewIdx + 1} of {result.ids.length}</span>
            <button className="btn" onClick={() => setReviewIdx(null)}>Back to results</button>
          </div>
          {q && <div className="panel"><QuestionView q={q} seed={result.seed} chosen={result.answers[qid]} onChoose={() => {}} reveal /></div>}
          <div className="row">
            <button className="btn" disabled={reviewIdx === 0} onClick={() => setReviewIdx(reviewIdx - 1)}>Previous</button>
            <button className="btn primary" disabled={reviewIdx === result.ids.length - 1} onClick={() => setReviewIdx(reviewIdx + 1)}>Next</button>
          </div>
        </section>
      )
    }
    return (
      <>
        <section className="section">
          <span className="label">{EXAM_PRESETS.find((p) => p.id === r.presetId)?.title} · result</span>
          <div className="result-hero">
            <span className="score">{r.pct}%</span>
            <div>
              <p className={`verdict ${r.passed ? 'good' : 'bad'}`}>{r.passed ? 'Pass' : 'Below pass mark'}</p>
              <p className="mono muted">{r.correct}/{r.total} correct · {fmtDuration(r.timeUsedMs)} used</p>
            </div>
          </div>
        </section>
        <section className="section">
          <h2>By topic</h2>
          <div className="panel bars">
            {Object.entries(r.byTopic).sort((a, b) => a[1].correct / a[1].total - b[1].correct / b[1].total).map(([t, s]) => (
              <div className="bar-row" key={t}>
                <span className="name">{topicById.get(t)?.title}<small>{topicById.get(t)?.ref}</small></span>
                <Bar value={s.correct / s.total} />
                <span className="pct">{s.correct}/{s.total}</span>
              </div>
            ))}
          </div>
        </section>
        <section className="section">
          <h2>Answers</h2>
          <p className="muted">Green is correct, red is wrong or unanswered. Select a number to see the explanation.</p>
          <div className="qgrid">
            {result.ids.map((id, i) => {
              const q = questionById.get(id)
              const ok = q && result.answers[id] === q.answer
              return <button key={id} className={ok ? 'right' : 'miss'} onClick={() => setReviewIdx(i)} aria-label={`Question ${i + 1}, ${ok ? 'correct' : 'incorrect'}`}>{i + 1}</button>
            })}
          </div>
          <div className="row"><button className="btn primary" onClick={() => setResult(null)}>Done</button></div>
        </section>
      </>
    )
  }

  if (exam && preset) {
    const qid = exam.questionIds[idx]
    const q = questionById.get(qid)
    const answeredCount = exam.questionIds.filter((id) => exam.answers[id] !== undefined).length
    const flagged = exam.flagged.includes(qid)
    const setAnswer = (i: number) => update((d) => d.activeExam ? { ...d, activeExam: { ...d.activeExam, answers: { ...d.activeExam.answers, [qid]: i } } } : d)
    const toggleFlag = () => update((d) => d.activeExam ? { ...d, activeExam: { ...d.activeExam, flagged: flagged ? d.activeExam.flagged.filter((f) => f !== qid) : [...d.activeExam.flagged, qid] } } : d)
    return (
      <section className="section">
        <div className="exam-bar">
          <span className="label">{preset.title} · {answeredCount}/{exam.questionIds.length} answered</span>
          <span className={`timer ${left < 5 * 60_000 ? 'low' : ''}`} aria-live="off">{fmtDuration(left)}</span>
        </div>
        {q ? (
          <div className="panel">
            <QuestionView q={q} seed={exam.seed} chosen={exam.answers[qid]} onChoose={setAnswer} reveal={false} />
          </div>
        ) : (
          <p className="muted">This question was removed from the bank. It will not count.</p>
        )}
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <div className="row">
            <button className="btn" disabled={idx === 0} onClick={() => setIdx(idx - 1)}>Previous</button>
            <button className="btn primary" disabled={idx === exam.questionIds.length - 1} onClick={() => setIdx(idx + 1)}>Next</button>
          </div>
          <button className="btn" aria-pressed={flagged} onClick={toggleFlag}>{flagged ? 'Unflag' : 'Flag for review'}</button>
        </div>
        <div className="qgrid" aria-label="Question navigator">
          {exam.questionIds.map((id, i) => (
            <button key={id} className={[exam.answers[id] !== undefined && 'answered', i === idx && 'current', exam.flagged.includes(id) && 'flagged'].filter(Boolean).join(' ')} onClick={() => setIdx(i)} aria-label={`Question ${i + 1}`}>{i + 1}</button>
          ))}
        </div>
        {confirming ? (
          <div className="confirm" role="alertdialog" aria-label="Confirm submission">
            <span>{exam.questionIds.length - answeredCount > 0 ? `${exam.questionIds.length - answeredCount} unanswered questions will be marked wrong. ` : ''}Submit the exam?</span>
            <div className="row">
              <button className="btn" onClick={() => setConfirming(false)}>Keep working</button>
              <button className="btn primary" onClick={submit}>Submit</button>
            </div>
          </div>
        ) : (
          <div className="row">
            <button className="btn" onClick={() => setConfirming(true)}>Submit exam</button>
            <span className="source">Your progress is saved. You can close the tab and come back, but the clock keeps running.</span>
          </div>
        )}
      </section>
    )
  }

  return (
    <>
      <section className="section">
        <span className="label">Mock exam</span>
        <h1>Timed, no feedback until the end</h1>
        <p className="muted" style={{ maxWidth: '64ch' }}>
          Like the real written test: answer, flag, move on. Scores are floored (74.9% counts as 74%). Pass marks vary by airline, commonly 70 to 80%. The presets use 75%.
        </p>
      </section>
      <div className="presets">
        {EXAM_PRESETS.map((p) => (
          <button key={p.id} className="preset" onClick={() => { update((d) => ({ ...d, activeExam: buildExam(p, QUESTIONS, newSeed(), Date.now()) })); setIdx(0); setNow(Date.now()) }}>
            <h3>{p.title}</h3>
            <span className="muted">{p.description}</span>
            <span className="spec">{Math.min(p.count, poolSize[p.id])} Q · {examMinutes(p, poolSize[p.id])} min · pass {p.passPct}%</span>
            {poolSize[p.id] < p.count && <span className="source">Bank has {poolSize[p.id]} of the {p.count} questions this preset is designed for</span>}
          </button>
        ))}
      </div>
    </>
  )
}
