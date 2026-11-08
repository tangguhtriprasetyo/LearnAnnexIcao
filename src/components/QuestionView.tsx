import { useMemo } from 'react'
import type { Question } from '../content/schema'
import { topicById } from '../content/topics'
import { optionOrder } from '../lib/quiz'
import { SourceLine, StatusBadge } from './common'

const KEYS = ['A', 'B', 'C', 'D', 'E']

interface Props {
  q: Question
  seed: number
  chosen: number | undefined // ORIGINAL option index
  onChoose: (originalIndex: number) => void
  reveal: boolean // show correctness + explanation
  locked?: boolean
}

export function QuestionView({ q, seed, chosen, onChoose, reveal, locked }: Props) {
  const order = useMemo(() => optionOrder(q, seed), [q, seed])
  const topic = topicById.get(q.topic)
  const disabled = locked || reveal
  return (
    <div className="q">
      <div className="q-meta">
        <span className="label">{topic?.title}</span>
        <span className="source">{topic?.ref}</span>
        <StatusBadge status={q.status} />
      </div>
      <p className="q-stem">{q.stem}</p>
      <div className="opts" role="radiogroup" aria-label="Answer options">
        {order.map((orig, pos) => {
          let cls = 'opt'
          if (reveal) {
            if (orig === q.answer) cls += ' correct'
            else if (orig === chosen) cls += ' wrong'
          } else if (orig === chosen) cls += ' selected'
          return (
            <button key={orig} type="button" role="radio" aria-checked={orig === chosen} className={cls} disabled={disabled} onClick={() => onChoose(orig)}>
              <span className="key">{KEYS[pos]}</span>
              <span>{q.options[orig]}</span>
            </button>
          )
        })}
      </div>
      {reveal && (
        <div className="explain">
          {chosen === undefined ? (
            <p className="verdict bad">Not answered</p>
          ) : chosen === q.answer ? (
            <p className="verdict good">Correct</p>
          ) : (
            <p className="verdict bad">Incorrect</p>
          )}
          <p>{q.explanation}</p>
          <SourceLine source={q.source} />
        </div>
      )}
    </div>
  )
}
