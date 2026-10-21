import Dexie, { type Table } from 'dexie'
import type { FocusSession } from './types'

/**
 * Local-first storage. IndexedDB via Dexie.
 * Never mutate an existing version() — always add version(n+1).
 */
class FocusDatabase extends Dexie {
  sessions!: Table<FocusSession, string>

  constructor() {
    super('nawy-focus-db')

    this.version(1).stores({
      sessions: 'id, startedAt, endedAt, kind, status, createdAt',
    })
  }
}

export const db = new FocusDatabase()

export async function addSession(
  session: Omit<FocusSession, 'id' | 'createdAt'>,
): Promise<string> {
  const id = crypto.randomUUID()
  const row: FocusSession = {
    ...session,
    id,
    createdAt: Date.now(),
  }
  await db.sessions.add(row)
  return id
}

/**
 * Idempotent session persistence for retryable writes.
 * Reusing the same id makes a retry safe if a prior write committed but its
 * promise failed before the caller received confirmation.
 */
export async function saveSession(session: FocusSession): Promise<void> {
  await db.sessions.put(session)
}

export async function listSessions(limit = 50): Promise<FocusSession[]> {
  return db.sessions.orderBy('startedAt').reverse().limit(limit).toArray()
}

/** Focus sessions for insights (newest first, capped). */
export async function listFocusSessionsForInsights(
  limit = 500,
): Promise<FocusSession[]> {
  const rows = await db.sessions.where('kind').equals('focus').toArray()
  rows.sort((a, b) => b.startedAt - a.startedAt)
  return rows.slice(0, limit)
}

export async function totalFocusSeconds(since?: number): Promise<number> {
  let collection = db.sessions.where('kind').equals('focus')
  if (since !== undefined) {
    collection = collection.and((s) => s.startedAt >= since)
  }
  const rows = await collection.toArray()
  return rows.reduce((sum, s) => sum + s.actualSeconds, 0)
}

export async function exportSessions(): Promise<FocusSession[]> {
  return db.sessions.orderBy('startedAt').toArray()
}

/** Safe merge import: skips ids that already exist. Returns inserted count. */
export async function importSessions(rows: FocusSession[]): Promise<number> {
  if (rows.length === 0) return 0
  const existingIds = new Set(await db.sessions.toCollection().primaryKeys())
  const fresh = rows.filter((r) => !existingIds.has(r.id))
  if (fresh.length === 0) return 0
  await db.sessions.bulkAdd(fresh)
  return fresh.length
}

export async function deleteSession(id: string): Promise<void> {
  await db.sessions.delete(id)
}

/** Count focus sessions started since a timestamp. */
export async function countFocusSessions(since?: number): Promise<number> {
  let collection = db.sessions.where('kind').equals('focus')
  if (since !== undefined) {
    collection = collection.and((s) => s.startedAt >= since)
  }
  return collection.count()
}
