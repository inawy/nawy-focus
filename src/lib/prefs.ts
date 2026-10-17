/** localStorage preferences — keys prefixed nawy-focus: */

const PREFIX = 'nawy-focus:'

export type HistoryFilter = 'all' | 'today' | 'week' | 'focus' | 'break'

/** After a focus session ends: off | countdown then start break */
export type AutoBreakMode = 'off' | 'auto'

const DEFAULT_FOCUS_SECONDS = 25 * 60
const DEFAULT_BREAK_SECONDS = 5 * 60
const DEFAULT_AUTO_BREAK_DELAY = 5

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
  if (
    raw === 'today' ||
    raw === 'week' ||
    raw === 'all' ||
    raw === 'focus' ||
    raw === 'break'
  ) {
    return raw
  }
  return 'all'
}

export function saveHistoryFilter(filter: HistoryFilter): void {
  write('historyFilter', filter)
}

export function loadSoundEnabled(): boolean {
  const raw = read('soundEnabled')
  if (raw === null) return true
  return raw !== '0' && raw !== 'false'
}

export function saveSoundEnabled(enabled: boolean): void {
  write('soundEnabled', enabled ? '1' : '0')
}

export function loadVibrateEnabled(): boolean {
  const raw = read('vibrateEnabled')
  if (raw === null) return true
  return raw !== '0' && raw !== 'false'
}

export function saveVibrateEnabled(enabled: boolean): void {
  write('vibrateEnabled', enabled ? '1' : '0')
}

export function loadAutoBreakMode(): AutoBreakMode {
  const raw = read('autoBreakMode')
  if (raw === 'auto') return 'auto'
  return 'off'
}

export function saveAutoBreakMode(mode: AutoBreakMode): void {
  write('autoBreakMode', mode)
}

/** Seconds to wait before auto-starting break (3–15). */
export function loadAutoBreakDelaySeconds(): number {
  const raw = read('autoBreakDelaySeconds')
  const n = raw ? Number(raw) : NaN
  if (!Number.isFinite(n) || n < 3 || n > 15) return DEFAULT_AUTO_BREAK_DELAY
  return Math.floor(n)
}

export function saveAutoBreakDelaySeconds(seconds: number): void {
  write(
    'autoBreakDelaySeconds',
    String(Math.max(3, Math.min(15, Math.floor(seconds)))),
  )
}

export function loadNotificationsEnabled(): boolean {
  const raw = read('notificationsEnabled')
  if (raw === null) return false
  return raw === '1' || raw === 'true'
}

export function saveNotificationsEnabled(enabled: boolean): void {
  write('notificationsEnabled', enabled ? '1' : '0')
}

export type ThemeMode = 'dark' | 'light' | 'system'

export function loadThemeMode(): ThemeMode {
  const raw = read('themeMode')
  if (raw === 'light' || raw === 'dark' || raw === 'system') return raw
  return 'dark'
}

export function saveThemeMode(mode: ThemeMode): void {
  write('themeMode', mode)
}

export function loadInstallBannerDismissed(): boolean {
  return read('installBannerDismissed') === '1'
}

export function saveInstallBannerDismissed(dismissed: boolean): void {
  write('installBannerDismissed', dismissed ? '1' : '0')
}
