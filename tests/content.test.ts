import { describe, expect, it } from 'vitest'
import { FLASHCARDS, QUESTIONS } from '../src/content'
import { topicById, TOPICS } from '../src/content/topics'

describe('content bank integrity', () => {
  it('has unique question and card ids', () => {
    const ids = [...QUESTIONS.map((q) => q.id), ...FLASHCARDS.map((c) => c.id)]
    const dupes = ids.filter((id, i) => ids.indexOf(id) !== i)
    expect(dupes).toEqual([])
  })

  it('every item references a known topic', () => {
    const unknown = [...QUESTIONS, ...FLASHCARDS].filter((x) => !topicById.has(x.topic)).map((x) => `${x.id} -> ${x.topic}`)
    expect(unknown).toEqual([])
  })

  it('every topic has at least one question or card', () => {
    const used = new Set([...QUESTIONS, ...FLASHCARDS].map((x) => x.topic))
    expect(TOPICS.filter((t) => !used.has(t.id)).map((t) => t.id)).toEqual([])
  })

  it('no question gives away the answer by being the only option repeated in the stem', () => {
    // Cheap guard against careless writing: the correct option text should not appear verbatim in the stem.
    const leaks = QUESTIONS.filter((q) => q.options[q.answer].length > 12 && q.stem.includes(q.options[q.answer]))
    expect(leaks.map((q) => q.id)).toEqual([])
  })

  it('correct answer is not always in the same position (writer bias check)', () => {
    const counts = [0, 0, 0, 0, 0]
    for (const q of QUESTIONS) counts[q.answer]++
    // Options are shuffled at runtime anyway; this just keeps the source files honest.
    expect(Math.max(...counts) / QUESTIONS.length).toBeLessThan(0.9)
  })
})
