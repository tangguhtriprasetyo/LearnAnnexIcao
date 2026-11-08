import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { Attempt } from './quiz'
import type { ExamResult, ExamState } from './exam'
import type { StoredCard } from './srs'
import { isPersistent, load, probeStorage, save } from './storage'

export interface LabAttempt {
  kind: string // scenario question kind, e.g. 'standby'
  failure: string
  phase: string
  correct: boolean
  at: number
}

export interface ProgressData {
  version: 1
  attempts: Attempt[]
  labAttempts: LabAttempt[]
  cards: Record<string, StoredCard>
  exams: ExamResult[]
  activeExam: ExamState | null
}

const EMPTY: ProgressData = { version: 1, attempts: [], labAttempts: [], cards: {}, exams: [], activeExam: null }
const KEY = 'progress-v1'

interface Ctx {
  data: ProgressData
  ready: boolean
  persistent: boolean
  update: (fn: (d: ProgressData) => ProgressData) => void
  replaceAll: (d: ProgressData) => void
}

const ProgressContext = createContext<Ctx | null>(null)

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<ProgressData>(EMPTY)
  const [ready, setReady] = useState(false)
  const [persistent, setPersistent] = useState(true)
  const writeQueue = useRef(Promise.resolve())

  useEffect(() => {
    ;(async () => {
      await probeStorage()
      const stored = await load<ProgressData>(KEY, EMPTY)
      setData({ ...EMPTY, ...stored })
      setPersistent(isPersistent())
      setReady(true)
    })()
  }, [])

  const persist = useCallback((d: ProgressData) => {
    // Serialise writes so an older snapshot never lands after a newer one.
    writeQueue.current = writeQueue.current.then(() => save(KEY, d)).then(() => setPersistent(isPersistent()))
  }, [])

  const update = useCallback(
    (fn: (d: ProgressData) => ProgressData) => {
      setData((prev) => {
        const next = fn(prev)
        persist(next)
        return next
      })
    },
    [persist],
  )

  const replaceAll = useCallback((d: ProgressData) => update(() => ({ ...EMPTY, ...d })), [update])

  const value = useMemo(() => ({ data, ready, persistent, update, replaceAll }), [data, ready, persistent, update, replaceAll])
  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>
}

export function useProgress() {
  const ctx = useContext(ProgressContext)
  if (!ctx) throw new Error('useProgress outside ProgressProvider')
  return ctx
}

export function validateImport(raw: unknown): ProgressData {
  const d = raw as Partial<ProgressData>
  if (!d || d.version !== 1 || !Array.isArray(d.attempts) || typeof d.cards !== 'object' || !Array.isArray(d.exams))
    throw new Error('This file is not a DEP Prep backup (expected version 1 with attempts, cards and exams).')
  return { ...EMPTY, ...d, labAttempts: Array.isArray(d.labAttempts) ? d.labAttempts : [], activeExam: null }
}
