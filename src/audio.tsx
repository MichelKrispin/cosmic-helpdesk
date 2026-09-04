import { useCallback, useEffect, useRef, useState } from 'react'
import type { Locale } from './game'

type AudioSettings = { muted: boolean; narration: boolean; effects: boolean; ambience: boolean; volume: number }
type SpeechState = 'idle' | 'speaking' | 'paused' | 'unavailable'
export type SoundEvent = { key: string; kind: 'incoming' | 'message' | 'warning' | 'module' | 'success' | 'failure' }

const storageKey = 'cosmic-helpdesk-audio-v1'
const defaults: AudioSettings = { muted: false, narration: false, effects: true, ambience: false, volume: 0.45 }

function storedSettings(): AudioSettings {
  try {
    const value = JSON.parse(localStorage.getItem(storageKey) || 'null')
    return value && typeof value === 'object' ? { ...defaults, ...value, volume: Math.max(0, Math.min(1, Number(value.volume) || 0)) } : defaults
  } catch { return defaults }
}

const copy = {
  en: { title: 'AUDIO', mute: 'Mute all', unmute: 'Unmute all', narration: 'Narration', effects: 'Effects', ambience: 'Ambience', volume: 'Volume', play: 'Play narration', pause: 'Pause', resume: 'Resume', stop: 'Stop', unavailable: 'Speech unavailable', incoming: 'Incoming call', message: 'New message', warning: 'Station warning', module: 'Module resolved', success: 'Mission successful', failure: 'Mission failed' },
  de: { title: 'AUDIO', mute: 'Alles stummschalten', unmute: 'Ton einschalten', narration: 'Sprachausgabe', effects: 'Effekte', ambience: 'Atmosphäre', volume: 'Lautstärke', play: 'Sprachausgabe starten', pause: 'Pausieren', resume: 'Fortsetzen', stop: 'Stoppen', unavailable: 'Sprachausgabe nicht verfügbar', incoming: 'Eingehender Anruf', message: 'Neue Nachricht', warning: 'Stationswarnung', module: 'Modul gelöst', success: 'Mission erfolgreich', failure: 'Mission fehlgeschlagen' },
} as const

export function AudioSystem({ language, narrationText, soundEvent }: { language: Locale; narrationText: string; soundEvent?: SoundEvent }) {
  const labels = copy[language]
  const [settings, setSettings] = useState<AudioSettings>(storedSettings)
  const [expanded, setExpanded] = useState(false)
  const [unlocked, setUnlocked] = useState(false)
  const [pageVisible, setPageVisible] = useState(() => !document.hidden)
  const [speechState, setSpeechState] = useState<SpeechState>(() => typeof window !== 'undefined' && 'speechSynthesis' in window ? 'idle' : 'unavailable')
  const [visualCue, setVisualCue] = useState('')
  const contextRef = useRef<AudioContext | null>(null)
  const ambienceRef = useRef<{ oscillator: OscillatorNode; gain: GainNode } | null>(null)
  const lastEventRef = useRef('')

  useEffect(() => { localStorage.setItem(storageKey, JSON.stringify(settings)) }, [settings])

  const unlock = useCallback(() => {
    if (unlocked) return
    try {
      const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (AudioContextClass) {
        contextRef.current ||= new AudioContextClass()
        void contextRef.current.resume()
        setUnlocked(true)
      }
    } catch { /* Audio remains optional. */ }
  }, [unlocked])

  useEffect(() => {
    const activate = () => unlock()
    document.addEventListener('pointerdown', activate, { once: true })
    document.addEventListener('keydown', activate, { once: true })
    return () => { document.removeEventListener('pointerdown', activate); document.removeEventListener('keydown', activate) }
  }, [unlock])
  useEffect(() => {
    const visibility = () => setPageVisible(!document.hidden)
    document.addEventListener('visibilitychange', visibility)
    return () => document.removeEventListener('visibilitychange', visibility)
  }, [])

  const tone = useCallback((frequency: number, duration = 0.08, delay = 0, wave: OscillatorType = 'sine') => {
    const context = contextRef.current
    if (!context || settings.muted || !settings.effects || document.hidden) return
    const oscillator = context.createOscillator(); const gain = context.createGain(); const start = context.currentTime + delay
    oscillator.type = wave; oscillator.frequency.setValueAtTime(frequency, start)
    gain.gain.setValueAtTime(0.0001, start); gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, settings.volume * 0.09), start + 0.01); gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
    oscillator.connect(gain).connect(context.destination); oscillator.start(start); oscillator.stop(start + duration + 0.02)
  }, [settings.effects, settings.muted, settings.volume])

  const playEffect = useCallback((kind: SoundEvent['kind']) => {
    setVisualCue(labels[kind])
    if (kind === 'incoming') { tone(440, 0.12); tone(660, 0.16, 0.14) }
    else if (kind === 'message') { tone(320, 0.025); tone(350, 0.025, 0.06); tone(330, 0.025, 0.12); tone(720, 0.07, 0.2) }
    else if (kind === 'warning') { tone(180, 0.18, 0, 'sawtooth'); tone(150, 0.2, 0.2, 'sawtooth') }
    else if (kind === 'module') { tone(520, 0.09); tone(780, 0.14, 0.1) }
    else if (kind === 'success') { tone(440, 0.1); tone(660, 0.1, 0.11); tone(880, 0.22, 0.22) }
    else { tone(260, 0.16, 0, 'triangle'); tone(170, 0.28, 0.17, 'triangle') }
  }, [labels, tone])

  useEffect(() => {
    if (!soundEvent || soundEvent.key === lastEventRef.current) return
    if (!unlocked) { setVisualCue(labels[soundEvent.kind]); return }
    lastEventRef.current = soundEvent.key
    playEffect(soundEvent.kind)
  }, [labels, playEffect, soundEvent, unlocked])

  useEffect(() => {
    const click = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (target.closest('button') && !target.closest('.audio-controls')) tone(330, 0.035, 0, 'square')
    }
    document.addEventListener('click', click)
    return () => document.removeEventListener('click', click)
  }, [tone])

  useEffect(() => {
    const stopAmbience = () => {
      const ambience = ambienceRef.current
      if (!ambience) return
      try { ambience.gain.gain.setTargetAtTime(0.0001, contextRef.current?.currentTime || 0, 0.08); ambience.oscillator.stop((contextRef.current?.currentTime || 0) + 0.4) } catch { /* already stopped */ }
      ambienceRef.current = null
    }
    if (!unlocked || settings.muted || !settings.ambience || !pageVisible || !contextRef.current) { stopAmbience(); return stopAmbience }
    const context = contextRef.current; const oscillator = context.createOscillator(); const gain = context.createGain()
    oscillator.type = 'sine'; oscillator.frequency.value = 54; gain.gain.value = Math.max(0.0001, settings.volume * 0.018)
    oscillator.connect(gain).connect(context.destination); oscillator.start(); ambienceRef.current = { oscillator, gain }
    return stopAmbience
  }, [pageVisible, settings.ambience, settings.muted, settings.volume, unlocked])

  useEffect(() => {
    window.speechSynthesis?.cancel()
    setSpeechState(current => current === 'unavailable' ? current : 'idle')
  }, [language, narrationText])
  useEffect(() => {
    if (settings.muted || !settings.narration) {
      window.speechSynthesis?.cancel()
      setSpeechState(current => current === 'unavailable' ? current : 'idle')
    }
  }, [settings.muted, settings.narration])

  useEffect(() => () => {
    window.speechSynthesis?.cancel()
    void contextRef.current?.close()
  }, [])

  const playNarration = () => {
    unlock()
    if (!('speechSynthesis' in window) || !narrationText.trim()) { setSpeechState('unavailable'); return }
    setSettings(current => ({ ...current, narration: true, muted: false }))
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(narrationText)
    utterance.lang = language === 'de' ? 'de-DE' : 'en-US'; utterance.volume = settings.volume
    const matchingVoice = window.speechSynthesis.getVoices().find(voice => voice.lang.toLowerCase().startsWith(language))
    if (matchingVoice) utterance.voice = matchingVoice
    utterance.onstart = () => setSpeechState('speaking'); utterance.onend = () => setSpeechState('idle'); utterance.onerror = () => setSpeechState('unavailable')
    window.speechSynthesis.speak(utterance)
  }
  const pause = () => { window.speechSynthesis.pause(); setSpeechState('paused') }
  const resume = () => { window.speechSynthesis.resume(); setSpeechState('speaking') }
  const stop = () => { window.speechSynthesis.cancel(); setSpeechState('idle') }
  const toggle = (key: 'narration' | 'effects' | 'ambience') => setSettings(current => ({ ...current, [key]: !current[key] }))

  return <aside className={`audio-controls ${expanded ? 'expanded' : ''}`} aria-label={labels.title}>
    <button className="audio-toggle" aria-expanded={expanded} onClick={() => { unlock(); setExpanded(value => !value) }}>🔊 <span>{labels.title}</span>
    </button>
    {expanded && <div className="audio-panel">
      <button aria-pressed={settings.muted} onClick={() => setSettings(current => ({ ...current, muted: !current.muted }))}>{settings.muted ? '🔇' : '🔊'} {settings.muted ? labels.unmute : labels.mute}</button>
      <label><input type="checkbox" checked={settings.narration} onChange={() => toggle('narration')} /> {labels.narration}</label>
      <label><input type="checkbox" checked={settings.effects} onChange={() => toggle('effects')} /> {labels.effects}</label>
      <label><input type="checkbox" checked={settings.ambience} onChange={() => { unlock(); toggle('ambience') }} /> {labels.ambience}</label>
      <label>{labels.volume}<input aria-label={labels.volume} type="range" min="0" max="1" step="0.05" value={settings.volume} onChange={event => setSettings(current => ({ ...current, volume: Number(event.target.value) }))} /></label>
      {narrationText && settings.narration && <div className="narration-actions">
        {speechState === 'idle' || speechState === 'unavailable' ? <button onClick={playNarration} disabled={speechState === 'unavailable'}>▶ {speechState === 'unavailable' ? labels.unavailable : labels.play}</button> : speechState === 'paused' ? <button onClick={resume}>▶ {labels.resume}</button> : <button onClick={pause}>⏸ {labels.pause}</button>}
        <button onClick={stop} disabled={speechState === 'idle'}>■ {labels.stop}</button>
      </div>}
    </div>}
    <span className="audio-visual-cue" role="status" aria-live="polite">{visualCue}</span>
  </aside>
}
