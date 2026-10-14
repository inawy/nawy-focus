/** Soft completion chime via Web Audio — no assets, no dependency */

export function playCompletionChime(): void {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!Ctx) return
    const ctx = new Ctx()
    const now = ctx.currentTime

    const note = (freq: number, start: number, dur: number) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0.0001, now + start)
      gain.gain.exponentialRampToValueAtTime(0.12, now + start + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + start + dur)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now + start)
      osc.stop(now + start + dur + 0.02)
    }

    note(523.25, 0, 0.18) // C5
    note(659.25, 0.14, 0.22) // E5
    note(783.99, 0.28, 0.35) // G5

    window.setTimeout(() => void ctx.close(), 800)
  } catch {
    // Autoplay / unsupported — ignore
  }
}
