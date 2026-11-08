import type { Step } from '../content/schema'

export function QrhSteps({ title, steps }: { title: string; steps: Step[] }) {
  return (
    <div className="qrh" aria-label={`${title} memory items`}>
      <div className="title">{title}</div>
      {steps.map((s, i) => (
        <div key={i}>
          {s.condition && <div className="cond">{s.condition}</div>}
          {s.action ? (
            <div className="step">
              <span className="item">{s.item}</span>
              <span className="dots" aria-hidden="true" />
              <span className="act">{s.action}</span>
            </div>
          ) : (
            <div className="step"><span className="item">{s.item}</span></div>
          )}
        </div>
      ))}
    </div>
  )
}
