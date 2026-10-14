/** localStorage preferences — keys prefixed nawy-focus: */

const PREFIX = 'nawy-focus:'

export type HistoryFilter = 'all' | 'today' | 'week'

const DEFAULT_FOCUS_SECONDS = 25 * 60
const DEFAULT_BREAK_SECONDS = 5 * 60

function read(key: string): string | null {
  try {
    return localStorage.getItem(PREFIX + key)
  } catch {
    return null
  }
}

function write(key: string, value: string): void {
  try {
    localStorage.setItem(PREFIX + key, value)
  } catch {
    // private mode / quota
  }
}

export function loadDefaultFocusSeconds(): number {
  const raw = read('defaultFocusSeconds')
  const n = raw ? Number(raw) : NaN
  if (!Number.isFinite(n) || n < 60 || n > 3 * 60 * 60) return DEFAULT_FOCUS_SECONDS
  return Math.floor(n)
}

export function loadDefaultBreakSeconds(): number {
  const raw = read('defaultBreakSeconds')
  const n = raw ? Number(raw) : NaN
  if (!Number.isFinite(n) || n < 60 || n > 3 * 60 * 60) return DEFAULT_BREAK_SECONDS
  return Math.floor(n)
}

export function saveDefaultFocusSeconds(seconds: number): void {
  write('defaultFocusSeconds', String(Math.floor(seconds)))
}

export function saveDefaultBreakSeconds(seconds: number): void {
  write('defaultBreakSeconds', String(Math.floor(seconds)))
}

export function loadHistoryFilter(): HistoryFilter {
  const raw = read('historyFilter')
  if (raw === 'today' || raw === 'week' || raw === 'all') return raw
  return 'all'
}

export function saveHistoryFilter(filter: HistoryFilter): void {
  write('historyFilter', filter)
}
