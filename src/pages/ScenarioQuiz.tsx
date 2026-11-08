import { useMemo, useState } from 'react'
import { HydStatusPanel, HydUsersTable } from '../components/HydStatus'
import { generateScenarioQuestion, KIND_LABEL, type QuizKind } from '../lab/scenarioQuiz'
import { USER_SOURCES, type HydInputs } from '../lab/hydraulics'
import { useProgress } from '../lib/progress'
import { newSeed } from '../lib/random'

const KEYS = ['A', 'B', 'C', 'D']
const ALL_KINDS = Object.keys(KIND_LABEL) as QuizKind[]

export function ScenarioQuiz({ onOpenInPanel }: { onOpenInPanel: (i: HydInputs) => void }) {
  const { data, update } = useProgress()
  const [kinds, setKinds] = useState<QuizKind[]>(ALL_KINDS)
  const [seed, setSeed] = useState(newSeed)
  const [chosen, setChosen] = useState<number | undefined>()
  const [session, setSession] = useState({ right: 0, total: 0 })

  const q = useMemo(() => generateScenarioQuestion(seed, kinds), [seed, kinds])
  const answered = chosen !== undefined

  const byKind = useMemo(() => {
    const m = new Map<string, { right: number; total: number }>()
    for (const a of data.labAttempts) {
      const s = m.get(a.kind) ?? { right: 0, total: 0 }
      s.total++
      if (a.correct) s.right++
      m.set(a.kind, s)
    }
    return m
  }, [data.labAttempts])

  const choose = (i: number) => {
    const correct = i === q.answer
    setChosen(i)
    setSession((s) => ({ right: s.right + (correct ? 1 : 0), total: s.total + 1 }))
    update((d) => ({ ...d, labAttempts: [...d.labAttempts, { kind: q.kind, failure: q.failure.id, phase: q.phase.id, correct, at: Date.now() }] }))
  }
  const next = () => { setSeed(newSeed()); setChosen(undefined) }
  const toggleKind = (k: QuizKind) => {
    const n = kinds.includes(k) ? kinds.filter((x) => x !== k) : [...kinds, k]
    if (n.length === 0) return // keep at least one type selected
    setKinds(n); setSeed(newSeed()); setChosen(undefined)
  }

  // Highlight the users the question is about (option text that names a user).
  const highlight = q.options.filter((o) => q.state.users.some((u) => u.name === o))

  return (
    <div className="section" style={{ gap: 18 }}>
      <p className="muted" style={{ maxWidth: '66ch' }}>
        Each question is generated from the hydraulic model: a random failure in a random phase of flight. Work it out from system knowledge, then check the panel state that the model produced.
      </p>
      <div className="row">
        {ALL_KINDS.map((k) => (
          <button key={k} className="chip" aria-pressed={kinds.includes(k)} onClick={() => toggleKind(k)}>{KIND_LABEL[k]}</button>
        ))}
      </div>

      <div className="scenario-brief">
        <span className="tag">SCENARIO</span>
        <p>{q.scenario}</p>
      </div>

      <div className="panel q">
        <div className="q-meta">
          <span className="label">{KIND_LABEL[q.kind]}</span>
          <span className="source">ATA 29 · generated</span>
          <span className="badge draft" title="Answers come from the simplified hydraulic model, which is not yet verified against your FCOM">Model-based</span>
        </div>
        <p className="q-stem">{q.stem}</p>
        <div className="opts" role="radiogroup" aria-label="Answer options">
          {q.options.map((o, i) => {
            let cls = 'opt'
            if (answered) { if (i === q.answer) cls += ' correct'; else if (i === chosen) cls += ' wrong' }
            return (
              <button key={o} type="button" role="radio" aria-checked={i === chosen} className={cls} disabled={answered} onClick={() => choose(i)}>
                <span className="key">{KEYS[i]}</span><span>{o}</span>
              </button>
            )
          })}
        </div>
        {answered && (
          <div className="explain">
            <p className={`verdict ${chosen === q.answer ? 'good' : 'bad'}`}>{chosen === q.answer ? 'Correct' : 'Incorrect'}</p>
            {q.explanation.map((e) => <p key={e}>{e}</p>)}
            {highlight.length > 0 && (
              <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 4 }}>
                {highlight.map((name) => {
                  const u = q.state.users.find((x) => x.name === name)!
                  return (
                    <li key={name}>
                      <b>{name}</b>: <span style={{ color: u.powered ? 'var(--good)' : 'var(--bad)' }}>{u.powered ? `powered via ${u.via}` : u.via}</span>
                      <span className="muted"> ({USER_SOURCES[name]})</span>
                    </li>
                  )
                })}
              </ul>
            )}
            <p className="source"><b>FCOM Vol 2</b> · 13 Hydraulics · via the simplified lab model</p>
          </div>
        )}
      </div>

      {answered && (
        <>
          <div className="row">
            <button className="btn primary" onClick={next} autoFocus>Next scenario</button>
            <button className="btn" onClick={() => onOpenInPanel(q.inputs)}>Open this state in the panel</button>
          </div>
          <div className="grid-2">
            <HydStatusPanel s={q.state} />
            <HydUsersTable s={q.state} highlight={highlight} />
          </div>
        </>
      )}

      <div className="section" style={{ gap: 8 }}>
        <span className="label">This session: {session.right}/{session.total} · all time by type</span>
        <div className="kind-stats">
          {ALL_KINDS.map((k) => {
            const s = byKind.get(k)
            return <span key={k}>{KIND_LABEL[k]} {s ? `${s.right}/${s.total} (${Math.floor((s.right * 100) / s.total)}%)` : '-'}</span>
          })}
        </div>
      </div>
    </div>
  )
}
