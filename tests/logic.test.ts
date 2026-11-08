import { describe, expect, it } from 'vitest'
import type { Question } from '../src/content/schema'
import { QUESTIONS, questionById } from '../src/content'
import { buildExam, EXAM_PRESETS, remainingMs, scoreExam } from '../src/lib/exam'
import { optionOrder, selectPractice, topicStats, type Attempt } from '../src/lib/quiz'
import { shuffle } from '../src/lib/random'
import { dueQueue, Rating, review } from '../src/lib/srs'
import { DEFAULT_INPUTS, evaluate } from '../src/lab/hydraulics'

const q = (id: string, topic: string, answer = 0): Question => ({
  id, topic, stem: 'A sufficiently long stem?', options: ['a', 'b', 'c', 'd'], answer,
  explanation: 'An explanation of twenty+ chars.', source: { doc: 'FCOM', ref: 'x' }, difficulty: 1, status: 'draft',
})

describe('shuffle / option order', () => {
  it('is deterministic per seed and a permutation', () => {
    expect(shuffle([1, 2, 3, 4, 5], 42)).toEqual(shuffle([1, 2, 3, 4, 5], 42))
    expect([...shuffle([1, 2, 3, 4, 5], 7)].sort()).toEqual([1, 2, 3, 4, 5])
  })
  it('respects fixedOrder', () => {
    expect(optionOrder({ ...q('x', 't'), fixedOrder: true }, 99)).toEqual([0, 1, 2, 3])
  })
})

describe('exam', () => {
  const preset = EXAM_PRESETS.find((p) => p.id === 'airlaw')!
  it('only draws from preset domains and never exceeds bank size', () => {
    const exam = buildExam(preset, QUESTIONS, 1, 0)
    expect(exam.questionIds.length).toBeLessThanOrEqual(preset.count)
    expect(exam.questionIds.every((id) => id.startsWith('al-'))).toBe(true)
    expect(new Set(exam.questionIds).size).toBe(exam.questionIds.length)
  })

  it('floors the percentage so 74.9% does not round to a 75% pass', () => {
    const bank = new Map<string, Question>()
    const ids: string[] = []
    const answers: Record<string, number> = {}
    for (let i = 0; i < 1000; i++) {
      const id = `q${i}`
      bank.set(id, q(id, 'al-annex2'))
      ids.push(id)
      answers[id] = i < 749 ? 0 : 1 // 749 / 1000 correct = 74.9%
    }
    const r = scoreExam({ presetId: 'x', seed: 0, questionIds: ids, answers, flagged: [], startedAt: 0, durationMs: 1 }, bank, 75, 1)
    expect(r.pct).toBe(74)
    expect(r.passed).toBe(false)
  })

  it('treats unanswered as wrong and drops deleted questions from the denominator', () => {
    const bank = new Map([['a', q('a', 't')], ['b', q('b', 't')]])
    const r = scoreExam({ presetId: 'x', seed: 0, questionIds: ['a', 'b', 'gone'], answers: { a: 0 }, flagged: [], startedAt: 0, durationMs: 10 }, bank, 75, 5)
    expect(r.total).toBe(2)
    expect(r.correct).toBe(1)
    expect(r.pct).toBe(50)
  })

  it('timer never goes negative', () => {
    expect(remainingMs({ presetId: 'x', seed: 0, questionIds: [], answers: {}, flagged: [], startedAt: 0, durationMs: 1000 }, 5000)).toBe(0)
  })

  it('every preset can be built from the real bank', () => {
    for (const p of EXAM_PRESETS) expect(buildExam(p, QUESTIONS, 3, 0).questionIds.length).toBeGreaterThan(0)
    expect(questionById.size).toBe(QUESTIONS.length)
  })
})

describe('practice selection and stats', () => {
  const bank = [q('a', 't1'), q('b', 't1'), q('c', 't2')]
  const attempts: Attempt[] = [
    { qid: 'a', correct: false, at: 1, mode: 'practice' },
    { qid: 'a', correct: true, at: 2, mode: 'practice' },
    { qid: 'b', correct: false, at: 3, mode: 'exam' },
  ]
  it('filters missed by latest attempt', () => {
    expect(selectPractice(bank, attempts, new Set(['t1', 't2']), 'missed', 10, 1).map((x) => x.id)).toEqual(['b'])
    expect(selectPractice(bank, attempts, new Set(['t1', 't2']), 'unseen', 10, 1).map((x) => x.id)).toEqual(['c'])
  })
  it('computes mastery from latest attempt and ignores removed questions', () => {
    const s = topicStats(bank, [...attempts, { qid: 'removed', correct: true, at: 9, mode: 'practice' }])
    expect(s.get('t1')).toMatchObject({ total: 2, seen: 2, mastered: 1, attempts: 3, correctAttempts: 1 })
  })
})

describe('spaced repetition', () => {
  it('Again schedules sooner than Easy, and the card round-trips through JSON', () => {
    const now = new Date('2026-01-01T00:00:00Z')
    const again = review(undefined, Rating.Again, now)
    const easy = review(undefined, Rating.Easy, now)
    expect(new Date(again.due).getTime()).toBeLessThan(new Date(easy.due).getTime())
    const roundTrip = JSON.parse(JSON.stringify(easy))
    expect(() => review(roundTrip, Rating.Good, new Date('2026-02-01T00:00:00Z'))).not.toThrow()
  })
  it('queues due cards before new ones and caps new cards', () => {
    const now = new Date('2026-01-10T00:00:00Z')
    const cards = { x: review(undefined, Rating.Again, new Date('2026-01-01T00:00:00Z')) }
    expect(dueQueue(['n1', 'x', 'n2', 'n3'], cards, now, 2)).toEqual(['x', 'n1', 'n2'])
  })
})

describe('hydraulics model', () => {
  const run = (o: Partial<typeof DEFAULT_INPUTS>) => evaluate({ ...DEFAULT_INPUTS, ...o })
  const user = (s: ReturnType<typeof evaluate>, n: string) => s.users.find((u) => u.name === n)!

  it('ENG 1 failure: system A survives on ELEC 2', () => {
    const s = run({ eng1Running: false })
    expect(s.sysA).toBe(true)
    expect(run({ eng1Running: false, acPower: false }).sysA).toBe(false)
  })
  it('loss of A with flaps extended airborne auto-starts standby; ground spoilers lost', () => {
    const s = run({ pumpEng1: false, pumpElec2: false, flaps: '15+' })
    expect(s.standby).toBe(true)
    expect(user(s, 'Ground spoilers').powered).toBe(false)
    expect(user(s, 'Rudder').via).toContain('B')
  })
  it('no auto standby with flaps up', () => {
    expect(run({ pumpEng1: false, pumpElec2: false, flaps: 'UP' }).standby).toBe(false)
  })
  it('PTU runs only with flaps 1-10, airborne, B EDP lost, A available', () => {
    expect(run({ pumpEng2: false, flaps: '1-10' }).ptu).toBe(true)
    expect(run({ pumpEng2: false, flaps: '15+' }).ptu).toBe(false)
    expect(run({ pumpEng2: false, flaps: 'UP' }).ptu).toBe(false)
    expect(run({ pumpEng2: false, airborne: false }).ptu).toBe(false)
  })
  it('loss of A and B: ailerons in manual reversion, rudder on standby', () => {
    const s = run({ pumpEng1: false, pumpElec2: false, pumpEng2: false, pumpElec1: false, flaps: '15+' })
    expect(user(s, 'Ailerons')).toMatchObject({ powered: false, via: 'manual reversion' })
    expect(user(s, 'Rudder')).toMatchObject({ powered: true, via: 'Standby PCU' })
  })
})
