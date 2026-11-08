import type { Domain, Question } from '../content/schema'
import { topicById } from '../content/topics'
import { shuffle } from './random'

export interface ExamPreset {
  id: string
  title: string
  description: string
  domains: Domain[]
  count: number
  minutes: number
  passPct: number
}

// Typical DEP technical written tests run 60-100 questions; time ~1.5 min/question.
// Pass marks vary by airline (commonly 70-80%). Adjust to the target operator.
export const EXAM_PRESETS: ExamPreset[] = [
  { id: 'technical', title: 'DEP Technical', description: '737-800 systems, limitations, QRH and performance', domains: ['systems', 'limitations', 'procedures', 'performance'], count: 40, minutes: 60, passPct: 75 },
  { id: 'airlaw', title: 'ICAO Air Law', description: 'Chicago Convention, Annexes, PANS-OPS and PANS-ATM', domains: ['airlaw'], count: 30, minutes: 40, passPct: 75 },
  { id: 'full', title: 'Full Mixed', description: 'Everything in the bank, interleaved', domains: ['systems', 'limitations', 'procedures', 'performance', 'airlaw'], count: 80, minutes: 120, passPct: 75 },
  { id: 'sprint', title: 'Sprint', description: '15 questions, 20 minutes, all subjects', domains: ['systems', 'limitations', 'procedures', 'performance', 'airlaw'], count: 15, minutes: 20, passPct: 75 },
]

export interface ExamState {
  presetId: string
  seed: number
  questionIds: string[]
  answers: Record<string, number | undefined> // qid -> chosen ORIGINAL option index
  flagged: string[]
  startedAt: number
  durationMs: number
  submittedAt?: number
}

export function buildExam(preset: ExamPreset, bank: Question[], seed: number, now: number): ExamState {
  const pool = bank.filter((q) => preset.domains.includes(topicById.get(q.topic)?.domain as Domain))
  const picked = shuffle(pool, seed).slice(0, preset.count)
  return {
    presetId: preset.id,
    seed,
    questionIds: picked.map((q) => q.id),
    answers: {},
    flagged: [],
    startedAt: now,
    // Bank smaller than the preset? Scale the clock so time per question stays realistic.
    durationMs: Math.ceil((preset.minutes * picked.length) / preset.count) * 60_000,
  }
}

export function examMinutes(preset: ExamPreset, available: number): number {
  const n = Math.min(preset.count, available)
  return Math.ceil((preset.minutes * n) / preset.count)
}

export function remainingMs(exam: ExamState, now: number): number {
  return Math.max(0, exam.startedAt + exam.durationMs - now)
}

export interface ExamResult {
  presetId: string
  at: number
  total: number
  correct: number
  pct: number // integer percent, floored: 29/40 = 72, never rounded up into a pass
  passed: boolean
  byTopic: Record<string, { total: number; correct: number }>
  timeUsedMs: number
}

export function scoreExam(exam: ExamState, bank: Map<string, Question>, passPct: number, now: number): ExamResult {
  let correct = 0
  const byTopic: ExamResult['byTopic'] = {}
  let total = 0
  for (const qid of exam.questionIds) {
    const q = bank.get(qid)
    if (!q) continue // question deleted while exam in progress: exclude from denominator
    total++
    const t = (byTopic[q.topic] ??= { total: 0, correct: 0 })
    t.total++
    if (exam.answers[qid] === q.answer) {
      correct++
      t.correct++
    }
  }
  const pct = total === 0 ? 0 : Math.floor((correct * 100) / total)
  const end = exam.submittedAt ?? now
  return {
    presetId: exam.presetId,
    at: end,
    total,
    correct,
    pct,
    passed: pct >= passPct,
    byTopic,
    timeUsedMs: Math.min(exam.durationMs, end - exam.startedAt),
  }
}
