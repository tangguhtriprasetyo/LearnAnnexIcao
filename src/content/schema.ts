import { z } from 'zod'

/**
 * Content schema. Every item MUST cite where its answer comes from, and carry a review status.
 * Rule of the project: write your own wording and cite the reference. Never paste manual text.
 *
 * status:
 *  - draft:    written from general knowledge, NOT yet checked against a controlled document
 *  - verified: checked against the cited document at the cited revision by `verifiedBy` on `verifiedAt`
 */

export const DomainSchema = z.enum(['systems', 'limitations', 'procedures', 'performance', 'airlaw'])
export type Domain = z.infer<typeof DomainSchema>

export const SourceSchema = z.object({
  doc: z.string().min(2), // e.g. "FCOM Vol 2", "QRH", "FCTM", "ICAO Annex 2", "ICAO Doc 8168"
  ref: z.string().min(2), // chapter / section, e.g. "13 Hydraulics - System Description"
  revision: z.string().optional(), // e.g. "Rev 45, 2026-06-15" - required once verified
})
export type Source = z.infer<typeof SourceSchema>

const Review = {
  status: z.enum(['draft', 'verified']),
  verifiedBy: z.string().optional(),
  verifiedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
}

function verifiedNeedsEvidence(v: { status: string; verifiedBy?: string; verifiedAt?: string; source: Source }) {
  return v.status !== 'verified' || (!!v.verifiedBy && !!v.verifiedAt && !!v.source.revision)
}
const verifiedMsg = { message: 'verified items need verifiedBy, verifiedAt and source.revision' }

export const QuestionSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9-]+$/),
    topic: z.string(),
    stem: z.string().min(10),
    options: z.array(z.string().min(1)).min(3).max(5),
    answer: z.number().int().nonnegative(),
    explanation: z.string().min(20),
    source: SourceSchema,
    difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)]),
    /** Set true if option order matters (e.g. "all of the above") and must not be shuffled. */
    fixedOrder: z.boolean().optional(),
    ...Review,
  })
  .refine((q) => q.answer < q.options.length, { message: 'answer index out of range' })
  .refine((q) => new Set(q.options).size === q.options.length, { message: 'duplicate options' })
  .refine(verifiedNeedsEvidence, verifiedMsg)
export type Question = z.infer<typeof QuestionSchema>

/** A QRH-style line: "Item ........ ACTION" */
export const StepSchema = z.object({
  item: z.string(),
  action: z.string(),
  condition: z.string().optional(), // e.g. "If runaway continues:"
})
export type Step = z.infer<typeof StepSchema>

export const FlashcardSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9-]+$/),
    topic: z.string(),
    kind: z.enum(['limitation', 'memory-item', 'fact']),
    front: z.string().min(3),
    back: z.string().optional(),
    steps: z.array(StepSchema).optional(),
    source: SourceSchema,
    ...Review,
  })
  .refine((c) => !!c.back || (c.steps && c.steps.length > 0), { message: 'card needs back or steps' })
  .refine(verifiedNeedsEvidence, verifiedMsg)
export type Flashcard = z.infer<typeof FlashcardSchema>

export interface Topic {
  id: string
  title: string
  domain: Domain
  /** ATA chapter (systems) or ICAO document reference (air law) */
  ref?: string
}
