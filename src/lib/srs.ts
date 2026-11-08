import { createEmptyCard, fsrs, generatorParameters, Rating, State, type Card, type Grade } from 'ts-fsrs'

// FSRS: models each card's memory stability and schedules the next review at ~90% recall probability.
// Limitations and memory items are high-stakes, so we ask for 92% retention instead of the 90% default.
const scheduler = fsrs(generatorParameters({ request_retention: 0.92, enable_fuzz: true, maximum_interval: 180 }))

/** JSON-safe card (Dates as ISO strings) so export/import round-trips. */
export interface StoredCard {
  due: string
  stability: number
  difficulty: number
  elapsed_days: number
  scheduled_days: number
  learning_steps: number
  reps: number
  lapses: number
  state: State
  last_review?: string
}

const toStored = (c: Card): StoredCard => ({
  due: c.due.toISOString(),
  stability: c.stability,
  difficulty: c.difficulty,
  elapsed_days: c.elapsed_days,
  scheduled_days: c.scheduled_days,
  learning_steps: c.learning_steps,
  reps: c.reps,
  lapses: c.lapses,
  state: c.state,
  last_review: c.last_review?.toISOString(),
})

const fromStored = (s: StoredCard): Card => ({
  ...s,
  due: new Date(s.due),
  last_review: s.last_review ? new Date(s.last_review) : undefined,
})

export { Rating, State }
export type { Grade }

export function review(stored: StoredCard | undefined, grade: Grade, now: Date): StoredCard {
  const card = stored ? fromStored(stored) : createEmptyCard(now)
  return toStored(scheduler.next(card, now, grade).card)
}

/** Human label of the interval each grade would produce, e.g. "10m", "3d". */
export function previewIntervals(stored: StoredCard | undefined, now: Date): Record<Grade, string> {
  const card = stored ? fromStored(stored) : createEmptyCard(now)
  const p = scheduler.repeat(card, now)
  const fmt = (d: Date) => {
    const mins = Math.max(1, Math.round((d.getTime() - now.getTime()) / 60000))
    if (mins < 60) return `${mins}m`
    const hrs = Math.round(mins / 60)
    if (hrs < 24) return `${hrs}h`
    const days = Math.round(hrs / 24)
    return days < 31 ? `${days}d` : `${Math.round(days / 30)}mo`
  }
  return {
    [Rating.Again]: fmt(p[Rating.Again].card.due),
    [Rating.Hard]: fmt(p[Rating.Hard].card.due),
    [Rating.Good]: fmt(p[Rating.Good].card.due),
    [Rating.Easy]: fmt(p[Rating.Easy].card.due),
  } as Record<Grade, string>
}

export function isDue(stored: StoredCard | undefined, now: Date): boolean {
  return !stored || new Date(stored.due).getTime() <= now.getTime()
}

/** Due cards first (most overdue first), then new cards, capped per session. */
export function dueQueue(ids: string[], cards: Record<string, StoredCard>, now: Date, newLimit: number): string[] {
  const due = ids
    .filter((id) => cards[id] && isDue(cards[id], now))
    .sort((a, b) => cards[a].due.localeCompare(cards[b].due))
  const fresh = ids.filter((id) => !cards[id]).slice(0, newLimit)
  return [...due, ...fresh]
}
