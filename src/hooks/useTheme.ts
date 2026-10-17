import { useCallback, useEffect, useState } from 'react'
import {
  loadThemeMode,
  saveThemeMode,
  type ThemeMode,
} from '../lib/prefs'

function systemPrefersDark(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return true
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function resolveTheme(mode: ThemeMode): 'dark' | 'light' {
  if (mode === 'system') return systemPrefersDark() ? 'dark' : 'light'
  return mode
}

function applyTheme(resolved: 'dark' | 'light') {
  const root = document.documentElement
  root.setAttribute('data-theme', resolved)
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) {
    meta.setAttribute('content', resolved === 'light' ? '#f4f5f7' : '#0e0e10')
  }
}

export function useTheme() {
  const [mode, setMode] = useState<ThemeMode>(() => loadThemeMode())
  const resolved = resolveTheme(mode)

  useEffect(() => {
    applyTheme(resolved)
  }, [resolved])

  useEffect(() => {
    if (mode !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => applyTheme(resolveTheme('system'))
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [mode])

  const setThemeMode = useCallback((next: ThemeMode) => {
    saveThemeMode(next)
    setMode(next)
  }, [])

  const cycleTheme = useCallback(() => {
    setThemeMode(
      mode === 'dark' ? 'light' : mode === 'light' ? 'system' : 'dark',
    )
  }, [mode, setThemeMode])

  const label =
    mode === 'dark' ? 'ليل' : mode === 'light' ? 'نهار' : 'تلقائي'

  return { mode, resolved, setThemeMode, cycleTheme, label }
}
