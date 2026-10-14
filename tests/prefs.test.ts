import { describe, expect, it, beforeEach } from 'vitest'
import {
  loadDefaultFocusSeconds,
  loadHistoryFilter,
  saveDefaultFocusSeconds,
  saveHistoryFilter,
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
})
