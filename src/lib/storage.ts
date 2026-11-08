import { createStore, get, set, del } from 'idb-keyval'

/**
 * Key-value persistence with graceful degradation.
 * IndexedDB can be unavailable (private mode, blocked site data, embedded frames). In that case
 * everything still works in memory for the session and the UI warns that progress will not persist.
 */
let store: ReturnType<typeof createStore> | null = null
const memory = new Map<string, unknown>()
let persistent = true

function idb() {
  if (!store) store = createStore('dep-prep', 'kv')
  return store
}

export async function probeStorage(): Promise<boolean> {
  try {
    if (typeof indexedDB === 'undefined') throw new Error('no indexedDB')
    await set('__probe', 1, idb())
    await del('__probe', idb())
    persistent = true
  } catch {
    persistent = false
  }
  return persistent
}

export async function load<T>(key: string, fallback: T): Promise<T> {
  if (persistent) {
    try {
      const v = await get<T>(key, idb())
      return v === undefined ? fallback : v
    } catch {
      persistent = false
    }
  }
  return (memory.has(key) ? memory.get(key) : fallback) as T
}

export async function save<T>(key: string, value: T): Promise<void> {
  memory.set(key, value)
  if (!persistent) return
  try {
    await set(key, value, idb())
  } catch {
    persistent = false
  }
}

export const isPersistent = () => persistent
