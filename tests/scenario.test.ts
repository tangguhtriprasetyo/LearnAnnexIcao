import { describe, expect, it } from 'vitest'
import { DEFAULT_INPUTS, evaluate, lowPressureLights, PUMP_LIGHTS } from '../src/lab/hydraulics'
import { generateScenarioQuestion, KIND_LABEL, type QuizKind } from '../src/lab/scenarioQuiz'

const KINDS = Object.keys(KIND_LABEL) as QuizKind[]
const N = 2000

describe('scenario question generator', () => {
  it('is deterministic per seed', () => {
    expect(generateScenarioQuestion(12345)).toEqual(generateScenarioQuestion(12345))
  })

  it.each(KINDS)('produces well-formed, self-consistent "%s" questions', (kind) => {
    for (let seed = 1; seed <= N; seed++) {
      const q = generateScenarioQuestion(seed, [kind])
      expect(q.kind).toBe(kind)
      expect(q.options.length).toBeGreaterThanOrEqual(3)
      expect(new Set(q.options).size).toBe(q.options.length)
      expect(q.answer).toBeGreaterThanOrEqual(0)
      expect(q.answer).toBeLessThan(q.options.length)

      // Re-derive the truth independently from the model and check the marked answer.
      const s = evaluate(q.inputs)
      const correct = q.options[q.answer]
      const user = (name: string) => s.users.find((u) => u.name === name)
      if (kind === 'not-available') {
        expect(user(correct)?.powered).toBe(false)
        for (const o of q.options) if (o !== correct) expect(user(o)?.powered).toBe(true)
      }
      if (kind === 'available') {
        expect(user(correct)?.powered).toBe(true)
        for (const o of q.options) if (o !== correct) expect(user(o)?.powered).toBe(false)
      }
      if (kind === 'standby') expect(correct.startsWith('Running')).toBe(s.standby)
      if (kind === 'ptu') expect(correct.startsWith('Operating')).toBe(s.ptu)
      if (kind === 'lights') {
        const on = lowPressureLights(q.inputs)
        const expected = PUMP_LIGHTS.filter((p) => on[p])
        expect(correct).toBe(expected.length ? expected.join(', ') : 'None')
      }
    }
  })

  it('never shows the PTU or LGTU working on the ground (takeoff roll counts only for auto standby)', () => {
    const roll = { ...DEFAULT_INPUTS, airborne: false, groundFast: true, flaps: '1-10' as const }
    const bLost = evaluate({ ...roll, pumpEng2: false, pumpElec1: false })
    expect(bLost.ptu).toBe(false)
    expect(bLost.standby).toBe(true) // A or B lost, flaps extended, >60 kt
    const aLost = evaluate({ ...roll, eng1Running: false, pumpElec2: false })
    expect(aLost.users.find((u) => u.name === 'Landing gear')?.via).toBe('manual extension')
  })

  it('covers every failure and phase across seeds', () => {
    const f = new Set<string>(), p = new Set<string>()
    for (let seed = 1; seed <= 500; seed++) {
      const q = generateScenarioQuestion(seed)
      f.add(q.failure.id); p.add(q.phase.id)
    }
    expect(f.size).toBe(10)
    expect(p.size).toBe(5)
  })
})
