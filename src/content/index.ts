import { FlashcardSchema, QuestionSchema, type Flashcard, type Question } from './schema'
import airlaw from './questions/airlaw.json'
import systems from './questions/systems.json'
import lpp from './questions/limitations-procedures-performance.json'
import cards from './flashcards.json'

// Add new question files here. Each file is validated against the schema at load time;
// `npm test` runs the same checks plus cross-file checks (unique ids, known topics).
const rawQuestions: unknown[] = [...airlaw, ...systems, ...lpp]

export const QUESTIONS: Question[] = rawQuestions.map((q) => QuestionSchema.parse(q))
export const FLASHCARDS: Flashcard[] = (cards as unknown[]).map((c) => FlashcardSchema.parse(c))

export const questionById = new Map(QUESTIONS.map((q) => [q.id, q]))
export const cardById = new Map(FLASHCARDS.map((c) => [c.id, c]))
