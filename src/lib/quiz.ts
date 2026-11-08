import type { Question } from '../content/schema'
import { hashString, shuffle } from './random'

/** Display order of option indices for a question. Same seed -> same order. */
export function optionOrder(q: Question, seed: number): number[] {
  const idx = q.options.map((_, i) => i)
  return q.fixedOrder ? idx : shuffle(idx, seed ^ hashString(q.id))
}

export interface Attempt {
  qid: string
  correct: boolean
  at: number // epoch ms
  mode: 'practice' | 'exam'
}

export interface TopicStat {
  topic: string
  total: number // questions available in topic
  seen: number // distinct questions attempted
  mastered: number // distinct questions whose latest attempt was correct
  attempts: number
  correctAttempts: number
}

/** Latest attempt per question. */
export function latestByQuestion(attempts: Attempt[]): Map<string, Attempt> {
  const m = new Map<string, Attempt>()
  for (const a of attempts) {
    const prev = m.get(a.qid)
    if (!prev || a.at >= prev.at) m.set(a.qid, a)
  }
  return m
}

export function topicStats(questions: Question[], attempts: Attempt[]): Map<string, TopicStat> {
  const known = new Map(questions.map((q) => [q.id, q.topic]))
  const stats = new Map<string, TopicStat>()
  const get = (topic: string) => {
    let s = stats.get(topic)
    if (!s) stats.set(topic, (s = { topic, total: 0, seen: 0, mastered: 0, attempts: 0, correctAttempts: 0 }))
    return s
  }
  for (const q of questions) get(q.topic).total++
  for (const a of attempts) {
    const topic = known.get(a.qid)
    if (!topic) continue // question removed from the bank; ignore its history
    const s = get(topic)
    s.attempts++
    if (a.correct) s.correctAttempts++
  }
  for (const [qid, a] of latestByQuestion(attempts)) {
    const topic = known.get(qid)
    if (!topic) continue
    const s = get(topic)
    s.seen++
    if (a.correct) s.mastered++
  }
  return stats
}

export type PracticeFilter = 'all' | 'unseen' | 'missed'

export function selectPractice(
  questions: Question[],
  attempts: Attempt[],
  topics: Set<string>,
  filter: PracticeFilter,
  count: number,
  seed: number,
): Question[] {
  const latest = latestByQuestion(attempts)
  const pool = questions.filter((q) => {
    if (!topics.has(q.topic)) return false
    const a = latest.get(q.id)
    if (filter === 'unseen') return !a
    if (filter === 'missed') return !!a && !a.correct
    return true
  })
  return shuffle(pool, seed).slice(0, count)
}
