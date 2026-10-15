import { describe, expect, it, beforeEach } from 'vitest'
import {
  loadAutoBreakMode,
  loadDefaultFocusSeconds,
  loadHistoryFilter,
  loadNotificationsEnabled,
  loadSoundEnabled,
  loadVibrateEnabled,
  saveAutoBreakMode,
  saveDefaultFocusSeconds,
  saveHistoryFilter,
  saveNotificationsEnabled,
  saveSoundEnabled,
  saveVibrateEnabled,
} from '../src/lib/prefs'

function mockLocalStorage() {
  const store = new Map<string, string>()
  const api = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => {
      store.set(k, v)
    },
    removeItem: (k: string) => {
      store.delete(k)
    },
    clear: () => {
      store.clear()
    },
    key: (i: number) => Array.from(store.keys())[i] ?? null,
    get length() {
      return store.size
    },
  }
  Object.defineProperty(globalThis, 'localStorage', {
    value: api,
    configurable: true,
  })
}

describe('prefs', () => {
  beforeEach(() => {
    mockLocalStorage()
  })

  it('defaults focus to 25 minutes', () => {
    expect(loadDefaultFocusSeconds()).toBe(25 * 60)
  })

  it('persists focus seconds', () => {
    saveDefaultFocusSeconds(45 * 60)
    expect(loadDefaultFocusSeconds()).toBe(45 * 60)
  })

  it('persists history filter', () => {
    expect(loadHistoryFilter()).toBe('all')
    saveHistoryFilter('week')
    expect(loadHistoryFilter()).toBe('week')
  })

  it('defaults sound and vibrate to enabled', () => {
    expect(loadSoundEnabled()).toBe(true)
    expect(loadVibrateEnabled()).toBe(true)
  })

  it('persists sound and vibrate prefs', () => {
    saveSoundEnabled(false)
    saveVibrateEnabled(false)
    expect(loadSoundEnabled()).toBe(false)
    expect(loadVibrateEnabled()).toBe(false)
    saveSoundEnabled(true)
    expect(loadSoundEnabled()).toBe(true)
  })

  it('defaults auto-break off and notifications off', () => {
    expect(loadAutoBreakMode()).toBe('off')
    expect(loadNotificationsEnabled()).toBe(false)
  })

  it('persists auto-break and notifications', () => {
    saveAutoBreakMode('auto')
    saveNotificationsEnabled(true)
    expect(loadAutoBreakMode()).toBe('auto')
    expect(loadNotificationsEnabled()).toBe(true)
  })

  it('accepts focus/break history filters', () => {
    saveHistoryFilter('focus')
    expect(loadHistoryFilter()).toBe('focus')
    saveHistoryFilter('break')
    expect(loadHistoryFilter()).toBe('break')
  })
})
