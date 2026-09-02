export type Locale = 'en' | 'de'
export type RoleId = 'operator' | 'engineer' | 'analyst' | 'archivist' | 'specialist' | 'researcher'
export type DifficultyId = 'training' | 'standard' | 'emergency'
export type GameStyle = 'fast' | 'campaign'
export type ModuleId = 'router' | 'reactor' | 'translation'

export type Player = { id: string; name: string; role: RoleId | null; connected: boolean; isHost: boolean }
export type SymbolId = 'nova' | 'halo' | 'rift' | 'prism'
export type Condition = 'nominal' | 'strained' | 'critical'
export type ButtonColor = 'amber' | 'cyan' | 'magenta' | 'lime'

export type FullGame = {
  seed: number; playerCount: number; language: Locale; gameStyle: GameStyle; campaignLevel?: number; difficulty: DifficultyId; shiftRules: ShiftRules; activeModules: ModuleId[]; startedAt: number; endsAt: number; lastPressureAt: number; completedAt?: number
  stability: number; incidentsResolved: number; incorrectActions: number; damagedSystems: number
  unauthorizedWormholes: number; score: number; outcome: 'playing' | 'won' | 'lost'; endReason?: string; log: string[]
  router: { resolved: boolean; nodes: { id: string; symbol: SymbolId; code: string }[]; species: string; affinity: 'angular' | 'curved'; baseFrequency: number; protocol: RouterProtocol }
  reactor: { resolved: boolean; dials: [number, number, number]; telemetry: { flux: number; phase: number; coolant: number }; speciesOffset: number; formula: ReactorFormula }
  translation: { resolved: boolean; glyphs: SymbolId[]; sequence: ButtonColor[]; paletteShift: number; direction: 'forward' | 'reverse' }
}

export type GameAction =
  | { id: string; type: 'router-connect'; a: string; b: string }
  | { id: string; type: 'reactor-calibrate'; dials: [number, number, number] }
  | { id: string; type: 'translation-submit'; sequence: ButtonColor[] }
export type GameActionInput =
  | { type: 'router-connect'; a: string; b: string }
  | { type: 'reactor-calibrate'; dials: [number, number, number] }
  | { type: 'translation-submit'; sequence: ButtonColor[] }

export type RoleView = {
  role: RoleId; title: string; subtitle: string
  panels: Array<{ eyebrow: string; title: string; tone: 'mint' | 'orange' | 'pink'; rows?: Array<{ label: string; value: string }>; notes?: string[]; table?: { headers: string[]; rows: string[][] } }>
}

export type GameView = {
  seed: number; language: Locale; gameStyle: GameStyle; campaignLevel?: number; difficulty: DifficultyId; activeModules: ModuleId[]; targetIncidents: number; now: number; endsAt: number; stability: number; score: number; incidentsResolved: number
  incorrectActions: number; damagedSystems: number; unauthorizedWormholes: number; outcome: FullGame['outcome']
  endReason?: string; log: string[]; moduleStatus: { router: boolean; reactor: boolean; translation: boolean }
  operator?: { router: Omit<FullGame['router'], 'affinity' | 'baseFrequency' | 'protocol'>; reactor: Omit<FullGame['reactor'], 'telemetry' | 'speciesOffset' | 'formula'>; translation: Omit<FullGame['translation'], 'sequence' | 'paletteShift' | 'direction'> }
  manual?: RoleView
}

type RouterProtocol = 'classic' | 'eclipse' | 'mirror'
type ReactorFormula = 'crossfeed' | 'coolant-loop' | 'phase-lock'
export type ShiftRules = { durationMs: number; pressureEveryMs: number; pressureDamage: number; scoreMultiplier: number }

export const difficultyConfig: Record<DifficultyId, ShiftRules> = {
  training: { durationMs: 10 * 60 * 1000, pressureEveryMs: 30 * 1000, pressureDamage: 2, scoreMultiplier: 1 },
  standard: { durationMs: 8 * 60 * 1000, pressureEveryMs: 20 * 1000, pressureDamage: 3, scoreMultiplier: 1.5 },
  emergency: { durationMs: 6 * 60 * 1000, pressureEveryMs: 12 * 1000, pressureDamage: 4, scoreMultiplier: 2 },
}

export type CampaignLevel = {
  id: number; title: Record<Locale, string>; summary: Record<Locale, string>; activeModules: ModuleId[]; rules: ShiftRules
  variants: { router: RouterProtocol[]; reactor: ReactorFormula[]; palettes: number[]; directions: Array<'forward' | 'reverse'> }
}

const allModules: ModuleId[] = ['router', 'reactor', 'translation']
export const campaignLevels: CampaignLevel[] = [
  { id: 1, title: { en: 'First Contact', de: 'Erstkontakt' }, summary: { en: 'Learn reactor calibration.', de: 'Lerne die Reaktorkalibrierung.' }, activeModules: ['reactor'], rules: { durationMs: 5 * 60e3, pressureEveryMs: 35e3, pressureDamage: 2, scoreMultiplier: 1 }, variants: { router: ['classic'], reactor: ['crossfeed'], palettes: [0], directions: ['forward'] } },
  { id: 2, title: { en: 'Stable Lines', de: 'Stabile Leitungen' }, summary: { en: 'Add routing and its reactor dependency.', de: 'Router und Reaktor-Abhängigkeit kommen hinzu.' }, activeModules: ['router', 'reactor'], rules: { durationMs: 6 * 60e3, pressureEveryMs: 30e3, pressureDamage: 2, scoreMultiplier: 1.1 }, variants: { router: ['classic'], reactor: ['crossfeed'], palettes: [0], directions: ['forward'] } },
  { id: 3, title: { en: 'Translation Duty', de: 'Übersetzungsdienst' }, summary: { en: 'Bring all three systems online.', de: 'Nimm alle drei Systeme in Betrieb.' }, activeModules: allModules, rules: { durationMs: 7 * 60e3, pressureEveryMs: 30e3, pressureDamage: 2, scoreMultiplier: 1.2 }, variants: { router: ['classic'], reactor: ['crossfeed'], palettes: [0], directions: ['forward'] } },
  { id: 4, title: { en: 'Eclipse Protocol', de: 'Finsternisprotokoll' }, summary: { en: 'New router and reactor procedures appear.', de: 'Neue Router- und Reaktorverfahren erscheinen.' }, activeModules: allModules, rules: { durationMs: 7 * 60e3, pressureEveryMs: 25e3, pressureDamage: 2, scoreMultiplier: 1.35 }, variants: { router: ['classic', 'eclipse'], reactor: ['crossfeed', 'coolant-loop'], palettes: [0], directions: ['forward'] } },
  { id: 5, title: { en: 'Mirror Shift', de: 'Spiegelschicht' }, summary: { en: 'Mirrored routes and reverse messages unlock.', de: 'Spiegelrouten und rückwärts gelesene Nachrichten.' }, activeModules: allModules, rules: { durationMs: 7 * 60e3, pressureEveryMs: 22e3, pressureDamage: 3, scoreMultiplier: 1.5 }, variants: { router: ['classic', 'eclipse', 'mirror'], reactor: ['crossfeed', 'coolant-loop', 'phase-lock'], palettes: [0, 1], directions: ['forward', 'reverse'] } },
  { id: 6, title: { en: 'Chromatic Storm', de: 'Farbsturm' }, summary: { en: 'All four translation palettes enter rotation.', de: 'Alle vier Farbtabellen kommen in Umlauf.' }, activeModules: allModules, rules: { durationMs: 6 * 60e3, pressureEveryMs: 18e3, pressureDamage: 3, scoreMultiplier: 1.7 }, variants: { router: ['classic', 'eclipse', 'mirror'], reactor: ['crossfeed', 'coolant-loop', 'phase-lock'], palettes: [0, 1, 2, 3], directions: ['forward', 'reverse'] } },
  { id: 7, title: { en: 'Red Alert', de: 'Roter Alarm' }, summary: { en: 'Every rule is live and pressure rises quickly.', de: 'Alle Regeln sind aktiv und der Druck steigt schnell.' }, activeModules: allModules, rules: { durationMs: 5 * 60e3, pressureEveryMs: 14e3, pressureDamage: 4, scoreMultiplier: 2 }, variants: { router: ['classic', 'eclipse', 'mirror'], reactor: ['crossfeed', 'coolant-loop', 'phase-lock'], palettes: [0, 1, 2, 3], directions: ['forward', 'reverse'] } },
  { id: 8, title: { en: 'Endless Desk', de: 'Endloser Desk' }, summary: { en: 'The complete procedural challenge, built for replays.', de: 'Die vollständige prozedurale Herausforderung.' }, activeModules: allModules, rules: { durationMs: 5 * 60e3, pressureEveryMs: 12e3, pressureDamage: 4, scoreMultiplier: 2.25 }, variants: { router: ['classic', 'eclipse', 'mirror'], reactor: ['crossfeed', 'coolant-loop', 'phase-lock'], palettes: [0, 1, 2, 3], directions: ['forward', 'reverse'] } },
]

export function campaignLevel(level: number): CampaignLevel { return campaignLevels[Math.max(0, Math.min(campaignLevels.length - 1, level - 1))] }

export function difficultyLabel(difficulty: DifficultyId, language: Locale): string {
  const labels: Record<Locale, Record<DifficultyId, string>> = {
    en: { training: 'Training', standard: 'Standard', emergency: 'Emergency' },
    de: { training: 'Training', standard: 'Standard', emergency: 'Notfall' },
  }
  return labels[language][difficulty]
}

const species = [
  { en: 'Vellune Cloud Guild', de: 'Vellunische Wolkengilde', affinity: 'curved' as const, offset: 1 },
  { en: 'Khepri Prism Union', de: 'Khepri-Prismenunion', affinity: 'angular' as const, offset: 2 },
  { en: 'Moss Council of Nine', de: 'Moosrat der Neun', affinity: 'curved' as const, offset: 0 },
  { en: 'Orrixian Night Shift', de: 'Orrixianische Nachtschicht', affinity: 'angular' as const, offset: 1 },
]

export const symbolMeta: Record<SymbolId, { glyph: string; name: string; category: string }> = {
  nova: { glyph: '✦', name: 'Nova', category: 'Radiant' }, halo: { glyph: '◉', name: 'Halo', category: 'Orbital' },
  rift: { glyph: 'ϟ', name: 'Rift', category: 'Volatile' }, prism: { glyph: '◇', name: 'Prism', category: 'Geometric' },
}

const symbolNames: Record<Locale, Record<SymbolId, { name: string; category: string }>> = {
  en: { nova: { name: 'Nova', category: 'Radiant' }, halo: { name: 'Halo', category: 'Orbital' }, rift: { name: 'Rift', category: 'Volatile' }, prism: { name: 'Prism', category: 'Geometric' } },
  de: { nova: { name: 'Nova', category: 'Strahlend' }, halo: { name: 'Halo', category: 'Orbital' }, rift: { name: 'Riss', category: 'Instabil' }, prism: { name: 'Prisma', category: 'Geometrisch' } },
}

export function symbolLabel(symbol: SymbolId, language: Locale) { return { glyph: symbolMeta[symbol].glyph, ...symbolNames[language][symbol] } }
export function buttonLabel(color: ButtonColor, language: Locale): string {
  return ({ en: { amber: 'AMBER', cyan: 'CYAN', magenta: 'MAGENTA', lime: 'LIME' }, de: { amber: 'BERNSTEIN', cyan: 'CYAN', magenta: 'MAGENTA', lime: 'LIMETTE' } } as Record<Locale, Record<ButtonColor, string>>)[language][color]
}

export function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
}
function shuffle<T>(items: T[], random: () => number): T[] {
  const output = [...items]
  for (let i = output.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [output[i], output[j]] = [output[j], output[i]] }
  return output
}

export function rolesForPlayers(count: number): RoleId[] {
  if (count <= 2) return ['operator', 'specialist']
  if (count === 3) return ['operator', 'engineer', 'researcher']
  return ['operator', 'engineer', 'analyst', 'archivist']
}
export function roleName(role: RoleId | null, language: Locale = 'de'): string {
  const names: Record<Locale, Record<RoleId, string>> = {
    en: { operator: 'Operator', engineer: 'Systems Engineer', analyst: 'Telemetry Analyst', archivist: 'Xeno Archivist', specialist: 'Mission Specialist', researcher: 'Research Lead' },
    de: { operator: 'Operator', engineer: 'Systemingenieur', analyst: 'Telemetrieanalyst', archivist: 'Xeno-Archivar', specialist: 'Missionsspezialist', researcher: 'Forschungsleitung' },
  }
  return role ? names[language][role] : language === 'de' ? 'Zuweisung ausstehend' : 'Awaiting assignment'
}

export function createGame(seed: number, playerCount: number, language: Locale = 'de', now = Date.now(), difficulty: DifficultyId = 'standard', gameStyle: GameStyle = 'fast', campaignLevelId = 1): FullGame {
  const random = mulberry32(seed)
  const caller = species[Math.floor(random() * species.length)]
  const symbols = shuffle(Object.keys(symbolMeta) as SymbolId[], random)
  const telemetry = { flux: Math.floor(random() * 6), phase: Math.floor(random() * 6), coolant: Math.floor(random() * 6) }
  const glyphs = shuffle(Object.keys(symbolMeta) as SymbolId[], random).slice(0, 3)
  const level = campaignLevel(campaignLevelId)
  const variants = gameStyle === 'campaign' ? level.variants : { router: ['classic', 'eclipse', 'mirror'] as RouterProtocol[], reactor: ['crossfeed', 'coolant-loop', 'phase-lock'] as ReactorFormula[], palettes: [0, 1, 2, 3], directions: ['forward', 'reverse'] as Array<'forward' | 'reverse'> }
  const choose = <T,>(items: T[]) => items[Math.floor(random() * items.length)]
  const protocol = choose(variants.router)
  const formula = choose(variants.reactor)
  const paletteShift = choose(variants.palettes)
  const direction = choose(variants.directions)
  const settings = gameStyle === 'campaign' ? level.rules : difficultyConfig[difficulty]
  const activeModules = gameStyle === 'campaign' ? [...level.activeModules] : [...allModules]
  const state: FullGame = {
    seed, playerCount, language, gameStyle, campaignLevel: gameStyle === 'campaign' ? level.id : undefined, difficulty, shiftRules: { ...settings }, activeModules, startedAt: now, endsAt: now + settings.durationMs, lastPressureAt: now, stability: 100,
    incidentsResolved: 0, incorrectActions: 0, damagedSystems: 0, unauthorizedWormholes: Math.floor(random() * 3), score: 0, outcome: 'playing',
    log: [language === 'de' ? `Schicht gestartet. ${activeModules.length === 1 ? 'Ein dringender Vorfall blinkt' : `${activeModules.length} dringende Vorfälle blinken`}.` : `Shift started. ${activeModules.length === 1 ? 'One priority incident is blinking' : `${activeModules.length} priority incidents are blinking`}.`],
    router: { resolved: false, nodes: symbols.map((symbol, i) => ({ id: `N${i + 1}`, symbol, code: `${String.fromCharCode(65 + i)}-${Math.floor(random() * 90 + 10)}` })), species: caller[language], affinity: caller.affinity, baseFrequency: 35 + Math.floor(random() * 10), protocol },
    reactor: { resolved: false, dials: [0, 0, 0], telemetry, speciesOffset: caller.offset, formula }, translation: { resolved: false, glyphs, sequence: [], paletteShift, direction },
  }
  state.translation.sequence = translationSolution(state)
  state.score = scoreForGame(state, now)
  return state
}

export function stationCondition(stability: number): Condition { return stability <= 35 ? 'critical' : stability <= 70 ? 'strained' : 'nominal' }
export function effectiveRouterFrequency(game: FullGame): number { return game.router.baseFrequency + (game.reactor.resolved ? 0 : 20) }
const routerPairs: Record<RouterProtocol, Record<string, [SymbolId, SymbolId]>> = {
  classic: { 'low-angular': ['nova', 'prism'], 'low-curved': ['halo', 'rift'], 'high-angular': ['prism', 'rift'], 'high-curved': ['nova', 'halo'] },
  eclipse: { 'low-angular': ['halo', 'rift'], 'low-curved': ['nova', 'prism'], 'high-angular': ['nova', 'halo'], 'high-curved': ['prism', 'rift'] },
  mirror: { 'low-angular': ['nova', 'halo'], 'low-curved': ['prism', 'rift'], 'high-angular': ['halo', 'rift'], 'high-curved': ['nova', 'prism'] },
}
export function routerSolution(game: FullGame): [SymbolId, SymbolId] {
  return routerPairs[game.router.protocol][`${effectiveRouterFrequency(game) >= 50 ? 'high' : 'low'}-${game.router.affinity}`]
}
function wrapDial(value: number) { return ((value % 6) + 6) % 6 }
export function reactorSolution(game: FullGame): [number, number, number] {
  const { flux, phase, coolant } = game.reactor.telemetry
  const offset = game.reactor.speciesOffset
  if (game.reactor.formula === 'coolant-loop') return [wrapDial(flux + coolant), wrapDial(phase + offset), wrapDial(coolant - flux)]
  if (game.reactor.formula === 'phase-lock') return [wrapDial(phase + coolant + offset), wrapDial(flux - phase), wrapDial(flux + phase)]
  return [wrapDial(flux + phase), wrapDial(coolant - phase), wrapDial(flux + coolant + offset)]
}
const translationTable: Record<Condition, Record<SymbolId, ButtonColor>> = {
  nominal: { nova: 'amber', halo: 'cyan', rift: 'magenta', prism: 'lime' }, strained: { nova: 'cyan', halo: 'lime', rift: 'amber', prism: 'magenta' }, critical: { nova: 'lime', halo: 'magenta', rift: 'cyan', prism: 'amber' },
}
const colorOrder: ButtonColor[] = ['amber', 'cyan', 'magenta', 'lime']
function translatedColor(game: FullGame, condition: Condition, glyph: SymbolId): ButtonColor {
  const original = translationTable[condition][glyph]
  return colorOrder[(colorOrder.indexOf(original) + game.translation.paletteShift) % colorOrder.length]
}
export function translationSolution(game: FullGame): ButtonColor[] {
  const condition = stationCondition(game.stability)
  const glyphs = game.translation.direction === 'reverse' ? [...game.translation.glyphs].reverse() : game.translation.glyphs
  return glyphs.map((glyph) => translatedColor(game, condition, glyph))
}
export function scoreForGame(game: FullGame, now = Date.now()): number {
  const scoredAt = game.completedAt ?? Math.min(now, game.endsAt)
  const secondsLeft = Math.max(0, Math.ceil((game.endsAt - scoredAt) / 1000))
  const base = game.incidentsResolved * 1000 + game.stability * 5 + secondsLeft * 2 - game.incorrectActions * 250 - game.damagedSystems * 100
  return Math.max(0, Math.round(base * game.shiftRules.scoreMultiplier))
}
function sameSet(a: string[], b: string[]) { return a.length === b.length && a.every((value) => b.includes(value)) }

export function applyAction(game: FullGame, action: GameAction, now = Date.now()): FullGame {
  if (game.outcome !== 'playing') return game
  const next = structuredClone(game)
  let correct = false
  let module: 'router' | 'reactor' | 'translation' | '' = ''
  if (action.type === 'router-connect' && next.activeModules.includes('router') && !next.router.resolved) { const chosen = [action.a, action.b].map((id) => next.router.nodes.find((node) => node.id === id)?.symbol || ''); correct = sameSet(chosen, routerSolution(next)); module = 'router'; if (correct) next.router.resolved = true }
  if (action.type === 'reactor-calibrate' && next.activeModules.includes('reactor') && !next.reactor.resolved) { correct = action.dials.every((value, index) => value === reactorSolution(next)[index]); module = 'reactor'; if (correct) next.reactor.resolved = true }
  if (action.type === 'translation-submit' && next.activeModules.includes('translation') && !next.translation.resolved) { correct = action.sequence.join(',') === translationSolution(next).join(','); module = 'translation'; if (correct) next.translation.resolved = true }
  if (!module) return game
  const moduleNames = next.language === 'de' ? { router: 'Quantenrouter', reactor: 'Reaktorkalibrierung', translation: 'Übersetzungsmatrix' } : { router: 'Quantum Router', reactor: 'Reactor Calibration', translation: 'Translation Matrix' }
  if (correct) {
    next.incidentsResolved += 1; next.stability = Math.min(100, next.stability + 6)
    next.log.unshift(next.language === 'de' ? `${moduleNames[module]} gelöst. Jemand sollte das Ticket schließen, bevor es wieder aufgeht.` : `${moduleNames[module]} cleared. Someone close the ticket before it reopens.`)
  } else {
    next.incorrectActions += 1; next.stability = Math.max(0, next.stability - 15); next.damagedSystems += next.incorrectActions % 2 === 0 ? 1 : 0; next.unauthorizedWormholes += action.type === 'translation-submit' ? 1 : 0
    next.log.unshift(next.language === 'de' ? `${moduleNames[module]} hat die Prozedur abgelehnt. Stabilität −15.` : `${moduleNames[module]} rejected the procedure. Stability −15.`)
  }
  if (next.stability <= 0) { next.outcome = 'lost'; next.completedAt = now; next.endReason = next.language === 'de' ? 'Die Stationsstabilität ist auf null gefallen. Der Helpdesk ist jetzt technisch gesehen eine Hilfskugel.' : 'Station stability reached zero. The helpdesk is now technically a help-sphere.' }
  else if (next.incidentsResolved >= next.activeModules.length) { next.outcome = 'won'; next.completedAt = now; next.endReason = next.language === 'de' ? 'Alle dringenden Vorfälle wurden gelöst, bevor jemand die Leitung eingeschaltet hat.' : 'All priority incidents resolved before anyone escalated to management.' }
  next.score = scoreForGame(next, now)
  return next
}
export function advanceClock(game: FullGame, now = Date.now()): FullGame {
  if (game.outcome !== 'playing') return game
  const next = structuredClone(game)
  const settings = next.shiftRules
  const pressureUntil = Math.min(now, next.endsAt)
  const pulses = Math.floor((pressureUntil - next.lastPressureAt) / settings.pressureEveryMs)
  if (pulses > 0) {
    const damage = pulses * settings.pressureDamage
    next.lastPressureAt += pulses * settings.pressureEveryMs
    next.stability = Math.max(0, next.stability - damage)
    next.log.unshift(next.language === 'de' ? `Kosmischer Druckstoß: Stabilität −${damage}.` : `Cosmic pressure surge: stability −${damage}.`)
  }
  if (next.stability <= 0) {
    next.outcome = 'lost'; next.completedAt = now
    next.endReason = next.language === 'de' ? 'Der kosmische Druck hat die Station zerlegt.' : 'Cosmic pressure tore the station apart.'
  } else if (now >= next.endsAt) {
    next.outcome = 'lost'; next.completedAt = now
    next.endReason = next.language === 'de' ? 'Die Schicht endete mit ungelösten dringenden Vorfällen.' : 'The shift ended with priority incidents unresolved.'
  }
  next.score = scoreForGame(next, now)
  return next
}

function routerRulesPanel(game: FullGame) {
  const de = game.language === 'de'
  const pair = (band: 'low' | 'high', affinity: 'angular' | 'curved') => routerPairs[game.router.protocol][`${band}-${affinity}`].map(symbol => symbolLabel(symbol, game.language).name).join(' ↔ ')
  const protocol = ({ classic: de ? 'Klassik' : 'Classic', eclipse: de ? 'Finsternis' : 'Eclipse', mirror: de ? 'Spiegel' : 'Mirror' })[game.router.protocol]
  return { eyebrow: de ? `Routerprotokoll: ${protocol}` : `Router protocol: ${protocol}`, title: de ? 'Router-Verbindungstabelle' : 'Router connection table', tone: 'mint' as const,
    notes: de ? ['50 THz oder mehr bedeutet HOCH.', 'Achtung: Wenn der Reaktor gelöst wird, ändert sich die Routerfrequenz. Prüft das Band direkt vor dem Senden erneut.'] : ['50 THz or more means HIGH.', 'Warning: solving the reactor changes the router frequency. Check the band again immediately before submitting.'],
    table: { headers: de ? ['Band', 'Affinität', 'Verbinden'] : ['Band', 'Affinity', 'Connect'], rows: [[de ? 'NIEDRIG' : 'LOW', de ? 'Eckig' : 'Angular', pair('low', 'angular')], [de ? 'NIEDRIG' : 'LOW', de ? 'Kurvig' : 'Curved', pair('low', 'curved')], [de ? 'HOCH' : 'HIGH', de ? 'Eckig' : 'Angular', pair('high', 'angular')], [de ? 'HOCH' : 'HIGH', de ? 'Kurvig' : 'Curved', pair('high', 'curved')]] } }
}
function reactorRulesPanel(game: FullGame) {
  const de = game.language === 'de'
  const formulas = de ? {
    'crossfeed': ['Regler A = Fluss + Phase', 'Regler B = Kühlmittel − Phase', 'Regler C = Fluss + Kühlmittel + Spezies-Offset'],
    'coolant-loop': ['Regler A = Fluss + Kühlmittel', 'Regler B = Phase + Spezies-Offset', 'Regler C = Kühlmittel − Fluss'],
    'phase-lock': ['Regler A = Phase + Kühlmittel + Spezies-Offset', 'Regler B = Fluss − Phase', 'Regler C = Fluss + Phase'],
  } : {
    'crossfeed': ['Dial A = Flux + Phase', 'Dial B = Coolant − Phase', 'Dial C = Flux + Coolant + species offset'],
    'coolant-loop': ['Dial A = Flux + Coolant', 'Dial B = Phase + species offset', 'Dial C = Coolant − Flux'],
    'phase-lock': ['Dial A = Phase + Coolant + species offset', 'Dial B = Flux − Phase', 'Dial C = Flux + Phase'],
  }
  const names = de ? { 'crossfeed': 'Kreuzfluss', 'coolant-loop': 'Kühlkreislauf', 'phase-lock': 'Phasensperre' } : { 'crossfeed': 'Crossfeed', 'coolant-loop': 'Coolant loop', 'phase-lock': 'Phase lock' }
  const wrap = de ? 'Die Regler zeigen nur 0–5: Ziehe bei 6 oder mehr immer wieder 6 ab. Addiere bei einem negativen Ergebnis 6.' : 'Dials only show 0–5: if a result is 6 or more, keep subtracting 6. If it is negative, add 6.'
  return { eyebrow: de ? `Reaktormodus: ${names[game.reactor.formula]}` : `Reactor mode: ${names[game.reactor.formula]}`, title: de ? 'Regler berechnen' : 'Calculate the dials', tone: 'orange' as const, notes: [wrap, ...formulas[game.reactor.formula]] }
}
function translationRulesPanel(game: FullGame) {
  const de = game.language === 'de'; const symbols = Object.keys(symbolMeta) as SymbolId[]
  const direction = game.translation.direction === 'forward' ? (de ? 'von links nach rechts' : 'left to right') : (de ? 'von rechts nach links' : 'right to left')
  return { eyebrow: de ? `Leserichtung: ${direction}` : `Read: ${direction}`, title: de ? 'Kategorie in Farbe umwandeln' : 'Convert category to color', tone: 'pink' as const,
    notes: de ? [`Lies die Glyphen ${direction}.`, 'Achtung: Falsche Eingaben können den Stationszustand ändern. Prüft ihn direkt vor dem Senden erneut.'] : [`Read the glyphs ${direction}.`, 'Warning: mistakes can change station condition. Check it again immediately before submitting.'],
    table: { headers: de ? ['Kategorie', 'Normal', 'Belastet', 'Kritisch'] : ['Category', 'Nominal', 'Strained', 'Critical'], rows: symbols.map(symbol => [symbolLabel(symbol, game.language).category, ...(['nominal', 'strained', 'critical'] as Condition[]).map(condition => buttonLabel(translatedColor(game, condition, symbol), game.language))]) } }
}
function engineerPanels(game: FullGame) {
  return [game.activeModules.includes('router') && routerRulesPanel(game), game.activeModules.includes('reactor') && reactorRulesPanel(game), game.activeModules.includes('translation') && translationRulesPanel(game)].filter(Boolean) as RoleView['panels']
}

function analystPanels(game: FullGame) {
  const de = game.language === 'de'; const condition = stationCondition(game.stability)
  const conditionLabel = de ? { nominal: 'NORMAL', strained: 'BELASTET', critical: 'KRITISCH' }[condition] : condition.toUpperCase()
  const panels: RoleView['panels'] = []
  if (game.activeModules.includes('reactor')) panels.push({ eyebrow: de ? 'Live-Telemetrie' : 'Live telemetry', title: de ? 'Reaktordaten' : 'Reactor feed', tone: 'orange' as const, rows: [{ label: de ? 'Fluss' : 'Flux', value: String(game.reactor.telemetry.flux) }, { label: 'Phase', value: String(game.reactor.telemetry.phase) }, { label: de ? 'Kühlmittel' : 'Coolant', value: String(game.reactor.telemetry.coolant) }], notes: [de ? 'Die Messwerte sind einfache Zahlen von 0 bis 5.' : 'Each reading is a simple number from 0 to 5.'] })
  if (game.activeModules.some(module => module === 'router' || module === 'translation')) panels.push({ eyebrow: de ? 'Live-Telemetrie' : 'Live telemetry', title: de ? 'Router & Station' : 'Router & station', tone: 'mint' as const, rows: [...(game.activeModules.includes('router') ? [{ label: de ? 'Routerfrequenz' : 'Router frequency', value: `${effectiveRouterFrequency(game)} THz` }, { label: de ? 'Frequenzband' : 'Frequency band', value: effectiveRouterFrequency(game) >= 50 ? (de ? 'HOCH' : 'HIGH') : (de ? 'NIEDRIG' : 'LOW') }] : []), ...(game.activeModules.includes('translation') ? [{ label: de ? 'Stationszustand' : 'Station condition', value: conditionLabel }] : [])], notes: game.activeModules.includes('router') ? (game.reactor.resolved ? [de ? 'Reaktor stabil: Frequenzaufschlag des Routers entfernt.' : 'Reactor stable: router frequency penalty removed.'] : [de ? 'Die Reaktorinstabilität addiert 20 THz zur Routerfrequenz.' : 'Reactor instability adds +20 THz to the router feed.']) : undefined })
  return panels
}
function archivistPanels(game: FullGame) {
  const de = game.language === 'de'
  const panels: RoleView['panels'] = []
  if (game.activeModules.some(module => module === 'router' || module === 'reactor')) panels.push({ eyebrow: de ? 'Anruferdossier' : 'Caller dossier', title: game.router.species, tone: 'mint' as const, rows: [...(game.activeModules.includes('router') ? [{ label: de ? 'Routeraffinität' : 'Router affinity', value: game.router.affinity === 'angular' ? (de ? 'ECKIG' : 'ANGULAR') : (de ? 'KURVIG' : 'CURVED') }] : []), ...(game.activeModules.includes('reactor') ? [{ label: de ? 'Reaktor-Offset' : 'Reactor offset', value: `+${game.reactor.speciesOffset}` }] : [])], notes: [de ? 'Nenne sie niemals „den Kunden“. Ihre Rechtsabteilung überwacht diese Frequenz.' : 'Never call them “the customer.” Their legal department monitors this frequency.'] })
  if (game.activeModules.includes('translation')) panels.push({ eyebrow: de ? 'Glyphenlexikon' : 'Glyph lexicon', title: de ? 'Archivkarte 88-B' : 'Archive card 88-B', tone: 'pink' as const, rows: game.translation.glyphs.map((glyph) => ({ label: `${symbolMeta[glyph].glyph}  ${symbolLabel(glyph, game.language).name}`, value: symbolLabel(glyph, game.language).category })), notes: [de ? 'Nenne jede Glyphe und ihre Kategorie. Die Leserichtung steht beim Ingenieur.' : 'Name each glyph and its category. The Engineer has the required reading direction.'] })
  return panels
}

export function viewForRole(game: FullGame, role: RoleId, now = Date.now()): GameView {
  const common: GameView = { seed: game.seed, language: game.language, gameStyle: game.gameStyle, campaignLevel: game.campaignLevel, difficulty: game.difficulty, activeModules: game.activeModules, targetIncidents: game.activeModules.length, now, endsAt: game.endsAt, stability: game.stability, score: game.score, incidentsResolved: game.incidentsResolved, incorrectActions: game.incorrectActions, damagedSystems: game.damagedSystems, unauthorizedWormholes: game.unauthorizedWormholes, outcome: game.outcome, endReason: game.endReason, log: game.log.slice(0, 5), moduleStatus: { router: game.router.resolved, reactor: game.reactor.resolved, translation: game.translation.resolved } }
  if (role === 'operator') { const { affinity: _affinity, baseFrequency: _frequency, protocol: _protocol, ...router } = game.router; return { ...common, operator: { router, reactor: { resolved: game.reactor.resolved, dials: game.reactor.dials }, translation: { resolved: game.translation.resolved, glyphs: game.translation.glyphs } } } }
  const de = game.language === 'de'
  const config: Record<Exclude<RoleId, 'operator'>, { title: string; subtitle: string; panels: RoleView['panels'] }> = de ? {
    engineer: { title: 'Systemingenieur', subtitle: 'Du hast die Prozeduren. Lass die anderen die Eingaben liefern.', panels: engineerPanels(game) }, analyst: { title: 'Telemetrieanalyst', subtitle: 'Vertrau den Zahlen. Die meisten davon sind wahrscheinlich echt.', panels: analystPanels(game) }, archivist: { title: 'Xeno-Archivar', subtitle: 'Spezies, Symbole und uralte Ausnahmen sind jetzt dein Problem.', panels: archivistPanels(game) }, specialist: { title: 'Missionsspezialist', subtitle: 'Kleine Crew, großes Handbuch. Du hast alle Spezialhinweise.', panels: [...analystPanels(game), ...archivistPanels(game), ...engineerPanels(game)] }, researcher: { title: 'Forschungsleitung', subtitle: 'Du betreust die Live-Telemetrie und das gesamte Xeno-Archiv.', panels: [...analystPanels(game), ...archivistPanels(game)] },
  } : {
    engineer: { title: 'Systems Engineer', subtitle: 'You have the procedures. Make everyone else provide the inputs.', panels: engineerPanels(game) }, analyst: { title: 'Telemetry Analyst', subtitle: 'Trust the numbers. Most of them are probably real.', panels: analystPanels(game) }, archivist: { title: 'Xeno Archivist', subtitle: 'Species, symbols, and ancient exceptions are your problem now.', panels: archivistPanels(game) }, specialist: { title: 'Mission Specialist', subtitle: 'Small crew, big manual. You hold every specialist clue.', panels: [...analystPanels(game), ...archivistPanels(game), ...engineerPanels(game)] }, researcher: { title: 'Research Lead', subtitle: 'You cover live telemetry and the entire xeno archive.', panels: [...analystPanels(game), ...archivistPanels(game)] },
  }
  return { ...common, manual: { role, ...config[role] } }
}
