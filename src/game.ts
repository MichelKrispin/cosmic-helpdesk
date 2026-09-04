export type Locale = 'en' | 'de'
export type RoleId = 'operator' | 'engineer' | 'analyst' | 'archivist' | 'specialist' | 'researcher'
export type DifficultyId = 'training' | 'standard' | 'emergency'
export type GameStyle = 'fast' | 'campaign'
export type ModuleId = 'router' | 'reactor' | 'translation' | 'authentication' | 'packet' | 'consent' | 'triage' | 'memory' | 'reality' | 'dispatch' | 'quarantine'

export type Player = { id: string; name: string; role: RoleId | null; connected: boolean; isHost: boolean }
export type SymbolId = 'nova' | 'halo' | 'rift' | 'prism'
export type Condition = 'nominal' | 'strained' | 'critical'
export type ButtonColor = 'amber' | 'cyan' | 'magenta' | 'lime'
export type AuthenticationKind = 'genuine' | 'relay-generated' | 'corrupted'
export type AuthenticationCandidate = { id: string; channel: string; label: string; timestamp: string; waveform: string; challenge: string; certificate: string; kind: AuthenticationKind }
export type PacketTile = { id: string; label: string; timestamp: number; checksumIn: string; checksumOut: string }
export type ConsentPermission = 'connect' | 'copy' | 'retain' | 'reopen' | 'disconnect'
export type ConsentResponseKind = 'yes' | 'silence' | 'no'
export type ConsentResponse = { id: string; channel: string; kind: ConsentResponseKind }
export type PowerHabitat = { id: string; label: string; baseMinimum: number; load: 'low' | 'high'; heat: 'cool' | 'hot'; capacity: number; reserve: number; linkedTo?: string }
export type PowerAllocation = { habitatId: string; units: number }
export type MemoryDecision = 'restore' | 'lock' | 'discard'
export type MemoryBlock = { id: string; label: string; storedParity: 0 | 1; expectedParity: 0 | 1; protected: boolean; replacementFrom?: string }
export type MemoryChoice = { blockId: string; decision: MemoryDecision }
export type RealityClassification = 'original' | 'copy' | 'unsafe'
export type RealityRoute = 'aurora' | 'umbra'
export type RealityFeed = { id: string; label: string; livePhase: number; archiveMarker: string; routeKey: number; kind: Exclude<RealityClassification, 'unsafe'>; inhabited: boolean }
export type RealityAssignment = { feedId: string; classification: RealityClassification; route: RealityRoute }
export type DispatchModule = 'authentication' | 'router' | 'translation'
export type DispatchCaller = { id: string; label: string; failureCountdown: number; riskBuffer: number; risk: string; dependsOn?: string; module: DispatchModule }
export type QuarantineKind = 'biological' | 'informational' | 'temporal'
export type QuarantineMedium = 'air' | 'data' | 'time'
export type QuarantineLink = { id: string; label: string; from: string; to: string; medium: QuarantineMedium }
export type QuarantineChoice = { linkId: string; sealed: boolean }
type CampaignModifier = 'none' | 'solar-static' | 'fragile-controls' | 'router-drift' | 'color-flux' | 'reactor-echo'
export type BonusObjective = 'no-mistakes' | 'high-stability' | 'fast-finish'

export type FullGame = {
  seed: number; playerCount: number; language: Locale; gameStyle: GameStyle; campaignLevel?: number; difficulty: DifficultyId; shiftRules: ShiftRules; activeModules: ModuleId[]; startedAt: number; endsAt: number; lastPressureAt: number; completedAt?: number
  stability: number; incidentsResolved: number; incorrectActions: number; damagedSystems: number
  unauthorizedWormholes: number; score: number; outcome: 'playing' | 'won' | 'lost'; endReason?: string; log: string[]; modifier: CampaignModifier; bonusObjective?: BonusObjective; forgivenModules: ModuleId[]
  targetIncidents: number; followUpModule?: ModuleId; followUpTriggered: boolean
  phases: ModuleId[][]
  variationGrace?: { until: number; router?: [SymbolId, SymbolId]; reactor?: [number, number, number]; translation?: ButtonColor[]; packet?: string[]; reality?: RealityAssignment[] }
  router: { resolved: boolean; nodes: { id: string; symbol: SymbolId; code: string }[]; species: string; affinity: 'angular' | 'curved'; baseFrequency: number; protocol: RouterProtocol }
  reactor: { resolved: boolean; dials: [number, number, number]; telemetry: { flux: number; phase: number; coolant: number }; speciesOffset: number; formula: ReactorFormula }
  translation: { resolved: boolean; glyphs: SymbolId[]; sequence: ButtonColor[]; paletteShift: number; direction: 'forward' | 'reverse' }
  authentication: { resolved: boolean; candidates: AuthenticationCandidate[]; correctId: string }
  packet: { resolved: boolean; tiles: PacketTile[]; direction: 'ascending' | 'descending'; message: string }
  consent: { resolved: boolean; permissions: ConsentPermission[]; requiredSequence: ConsentPermission[]; responses: ConsentResponse[]; correctResponseId: string; subject: string }
  triage: { resolved: boolean; budget: number; habitats: PowerHabitat[] }
  memory: { resolved: boolean; blocks: MemoryBlock[]; revealedText: string }
  reality: { resolved: boolean; feeds: RealityFeed[] }
  dispatch: { resolved: boolean; callers: DispatchCaller[]; dispatchedOrder: string[] }
  quarantine: { resolved: boolean; kind: QuarantineKind; medium: QuarantineMedium; sourceZoneId: string; occupiedZoneId: string; zones: Array<{ id: string; label: string }>; links: QuarantineLink[]; contaminatedModule?: 'reactor' | 'router' }
}

export type GameAction =
  | { id: string; type: 'router-connect'; a: string; b: string }
  | { id: string; type: 'reactor-calibrate'; dials: [number, number, number] }
  | { id: string; type: 'translation-submit'; sequence: ButtonColor[] }
  | { id: string; type: 'authentication-submit'; candidateId: string }
  | { id: string; type: 'packet-submit'; tileIds: string[] }
  | { id: string; type: 'consent-submit'; permissions: ConsentPermission[]; responseId: string }
  | { id: string; type: 'triage-submit'; allocations: PowerAllocation[] }
  | { id: string; type: 'memory-submit'; choices: MemoryChoice[] }
  | { id: string; type: 'reality-submit'; assignments: RealityAssignment[] }
  | { id: string; type: 'dispatch-submit'; callerIds: string[] }
  | { id: string; type: 'quarantine-submit'; choices: QuarantineChoice[] }
export type GameActionInput =
  | { type: 'router-connect'; a: string; b: string }
  | { type: 'reactor-calibrate'; dials: [number, number, number] }
  | { type: 'translation-submit'; sequence: ButtonColor[] }
  | { type: 'authentication-submit'; candidateId: string }
  | { type: 'packet-submit'; tileIds: string[] }
  | { type: 'consent-submit'; permissions: ConsentPermission[]; responseId: string }
  | { type: 'triage-submit'; allocations: PowerAllocation[] }
  | { type: 'memory-submit'; choices: MemoryChoice[] }
  | { type: 'reality-submit'; assignments: RealityAssignment[] }
  | { type: 'dispatch-submit'; callerIds: string[] }
  | { type: 'quarantine-submit'; choices: QuarantineChoice[] }

export type RoleView = {
  role: RoleId; title: string; subtitle: string
  panels: Array<{ eyebrow: string; title: string; tone: 'mint' | 'orange' | 'pink'; rows?: Array<{ label: string; value: string }>; notes?: string[]; table?: { headers: string[]; rows: string[][] } }>
}

export type GameView = {
  seed: number; language: Locale; gameStyle: GameStyle; campaignLevel?: number; difficulty: DifficultyId; activeModules: ModuleId[]; visibleModules: ModuleId[]; phaseIndex: number; phaseCount: number; targetIncidents: number; now: number; endsAt: number; nextPressureAt: number; variationGraceUntil?: number; stability: number; score: number; incidentsResolved: number
  incorrectActions: number; damagedSystems: number; unauthorizedWormholes: number; outcome: FullGame['outcome']
  endReason?: string; log: string[]; moduleStatus: Record<ModuleId, boolean>; modifierText?: string; bonusText?: string; bonusEarned?: boolean; hint?: string
  operator?: { router: Omit<FullGame['router'], 'affinity' | 'baseFrequency' | 'protocol'>; reactor: Omit<FullGame['reactor'], 'telemetry' | 'speciesOffset' | 'formula'>; translation: Omit<FullGame['translation'], 'sequence' | 'paletteShift' | 'direction'>; authentication: { resolved: boolean; candidates: Array<Pick<AuthenticationCandidate, 'id' | 'channel' | 'label'>> }; packet: { resolved: boolean; tiles: Array<Pick<PacketTile, 'id' | 'label'>>; message?: string }; consent: { resolved: boolean; ready: boolean; permissions: ConsentPermission[]; responses: Array<Pick<ConsentResponse, 'id' | 'channel'>>; subject: string }; triage: { resolved: boolean; budget: number; habitats: Array<Pick<PowerHabitat, 'id' | 'label'>> }; memory: { resolved: boolean; blocks: Array<Pick<MemoryBlock, 'id' | 'label'>>; revealedText?: string }; reality: { resolved: boolean; feeds: Array<Pick<RealityFeed, 'id' | 'label'>> }; dispatch: { resolved: boolean; callers: Array<Pick<DispatchCaller, 'id' | 'label'>>; dispatchedOrder: string[]; currentModule?: DispatchModule }; quarantine: { resolved: boolean; links: Array<Pick<QuarantineLink, 'id' | 'label'>>; contaminatedModule?: 'reactor' | 'router' } }
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

type CampaignLevelCore = {
  id: number; title: Record<Locale, string>; activeModules: ModuleId[]; rules: ShiftRules
  variants: { router: RouterProtocol[]; reactor: ReactorFormula[]; palettes: number[]; directions: Array<'forward' | 'reverse'> }
}

export type CampaignLevel = CampaignLevelCore & {
  summary: Record<Locale, string>
  briefing: Record<Locale, string>
  success: Record<Locale, string>
  failure: Record<Locale, string>
  caller: Record<Locale, string>
  objective: Record<Locale, string>
  transition: Record<Locale, string>
  archiveFragment?: Record<Locale, string>
  moduleOutcomes: Partial<Record<ModuleId, Record<Locale, string>>>
}

export const campaignLore = {
  title: { en: 'The Last Open Ticket', de: 'Das letzte offene Ticket' },
  mara: {
    employeeId: 'MV-404-0214',
    voice: { en: 'Practical and dryly funny under pressure; sincere when speaking about her trapped crew.', de: 'Praktisch und unter Druck trocken-humorig; aufrichtig, wenn sie von ihrer festsitzenden Crew spricht.' },
    authenticationFacts: {
      en: ['Her shift starts tomorrow at 02:14 station time.', 'Her employee ID is MV-404-0214.', 'Her private challenge is “How many quiet nights?”; the real answer is “None. We work helpdesk.”'],
      de: ['Ihre Schicht beginnt morgen um 02:14 Stationszeit.', 'Ihre Personalnummer lautet MV-404-0214.', 'Ihre private Prüffrage lautet „Wie viele ruhige Nächte?“; die echte Antwort ist „Keine. Wir sind der Helpdesk.“'],
    },
    realMessageLevels: [1, 2, 4, 5, 9, 16],
  },
  imitations: [
    { level: 4, clue: { en: 'The voice repeats Mara’s warning but lacks her employee checksum.', de: 'Die Stimme wiederholt Maras Warnung, aber ihre Personal-Prüfsumme fehlt.' } },
    { level: 5, clue: { en: 'The imitation answers the private challenge with “One”; Mara answers with the helpdesk joke.', de: 'Die Imitation beantwortet die private Prüffrage mit „Eine“; Mara antwortet mit dem Helpdesk-Witz.' } },
    { level: 11, clue: { en: 'Copied callers remember records but cannot match live route latency.', de: 'Kopierte Anrufer erinnern sich an Akten, passen aber nicht zur aktuellen Routenlatenz.' } },
  ],
} as const

const allModules: ModuleId[] = ['router', 'reactor', 'translation']
const baseCampaignLevels: CampaignLevelCore[] = [
  { id: 1, title: { en: 'First Contact', de: 'Erstkontakt' }, activeModules: ['reactor'], rules: { durationMs: 5 * 60e3, pressureEveryMs: 35e3, pressureDamage: 2, scoreMultiplier: 1 }, variants: { router: ['classic'], reactor: ['crossfeed'], palettes: [0], directions: ['forward'] } },
  { id: 2, title: { en: 'Stable Lines', de: 'Stabile Leitungen' }, activeModules: ['router', 'reactor'], rules: { durationMs: 6 * 60e3, pressureEveryMs: 30e3, pressureDamage: 2, scoreMultiplier: 1.1 }, variants: { router: ['classic'], reactor: ['crossfeed'], palettes: [0], directions: ['forward'] } },
  { id: 3, title: { en: 'Archive 404', de: 'Archiv 404' }, activeModules: allModules, rules: { durationMs: 7 * 60e3, pressureEveryMs: 30e3, pressureDamage: 2, scoreMultiplier: 1.2 }, variants: { router: ['classic'], reactor: ['crossfeed'], palettes: [0], directions: ['forward'] } },
  { id: 4, title: { en: 'Eclipse Protocol', de: 'Finsternisprotokoll' }, activeModules: allModules, rules: { durationMs: 7 * 60e3, pressureEveryMs: 25e3, pressureDamage: 2, scoreMultiplier: 1.35 }, variants: { router: ['classic', 'eclipse'], reactor: ['crossfeed', 'coolant-loop'], palettes: [0], directions: ['forward'] } },
  { id: 5, title: { en: 'Mirror Shift', de: 'Spiegelschicht' }, activeModules: allModules, rules: { durationMs: 7 * 60e3, pressureEveryMs: 22e3, pressureDamage: 3, scoreMultiplier: 1.5 }, variants: { router: ['classic', 'eclipse', 'mirror'], reactor: ['crossfeed', 'coolant-loop', 'phase-lock'], palettes: [0, 1], directions: ['forward', 'reverse'] } },
  { id: 6, title: { en: 'Chromatic Storm', de: 'Farbsturm' }, activeModules: allModules, rules: { durationMs: 6 * 60e3, pressureEveryMs: 18e3, pressureDamage: 3, scoreMultiplier: 1.7 }, variants: { router: ['classic', 'eclipse', 'mirror'], reactor: ['crossfeed', 'coolant-loop', 'phase-lock'], palettes: [0, 1, 2, 3], directions: ['forward', 'reverse'] } },
  { id: 7, title: { en: 'Red Alert', de: 'Roter Alarm' }, activeModules: allModules, rules: { durationMs: 5 * 60e3, pressureEveryMs: 14e3, pressureDamage: 4, scoreMultiplier: 2 }, variants: { router: ['classic', 'eclipse', 'mirror'], reactor: ['crossfeed', 'coolant-loop', 'phase-lock'], palettes: [0, 1, 2, 3], directions: ['forward', 'reverse'] } },
  { id: 8, title: { en: 'Containment Breach', de: 'Quarantänebruch' }, activeModules: allModules, rules: { durationMs: 5 * 60e3, pressureEveryMs: 12e3, pressureDamage: 4, scoreMultiplier: 2.25 }, variants: { router: ['classic', 'eclipse', 'mirror'], reactor: ['crossfeed', 'coolant-loop', 'phase-lock'], palettes: [0, 1, 2, 3], directions: ['forward', 'reverse'] } },
  { id: 9, title: { en: 'Dead Letter', de: 'Brief aus der Zukunft' }, activeModules: ['router', 'translation'], rules: { durationMs: 6 * 60e3, pressureEveryMs: 18e3, pressureDamage: 3, scoreMultiplier: 1.8 }, variants: { router: ['eclipse', 'mirror'], reactor: ['phase-lock'], palettes: [1, 2, 3], directions: ['reverse'] } },
  { id: 10, title: { en: 'Relay Graveyard', de: 'Relaisfriedhof' }, activeModules: ['router', 'reactor'], rules: { durationMs: 6 * 60e3, pressureEveryMs: 17e3, pressureDamage: 3, scoreMultiplier: 1.9 }, variants: { router: ['classic', 'eclipse', 'mirror'], reactor: ['coolant-loop', 'phase-lock'], palettes: [0], directions: ['forward'] } },
  { id: 11, title: { en: 'Borrowed Voices', de: 'Geliehene Stimmen' }, activeModules: allModules, rules: { durationMs: 6 * 60e3, pressureEveryMs: 16e3, pressureDamage: 3, scoreMultiplier: 2 }, variants: { router: ['classic', 'eclipse', 'mirror'], reactor: ['crossfeed', 'coolant-loop', 'phase-lock'], palettes: [0, 1, 2, 3], directions: ['forward', 'reverse'] } },
  { id: 12, title: { en: 'The Quiet Assembly', de: 'Die Stille Versammlung' }, activeModules: allModules, rules: { durationMs: 6 * 60e3, pressureEveryMs: 15e3, pressureDamage: 3, scoreMultiplier: 2.1 }, variants: { router: ['eclipse', 'mirror'], reactor: ['crossfeed', 'coolant-loop', 'phase-lock'], palettes: [1, 2, 3], directions: ['forward', 'reverse'] } },
  { id: 13, title: { en: 'Split Horizon', de: 'Geteilter Horizont' }, activeModules: allModules, rules: { durationMs: 6 * 60e3, pressureEveryMs: 14e3, pressureDamage: 3, scoreMultiplier: 2.2 }, variants: { router: ['classic', 'mirror'], reactor: ['coolant-loop', 'phase-lock'], palettes: [0, 2, 3], directions: ['reverse'] } },
  { id: 14, title: { en: 'The True Name', de: 'Der wahre Name' }, activeModules: allModules, rules: { durationMs: 5 * 60e3, pressureEveryMs: 13e3, pressureDamage: 4, scoreMultiplier: 2.35 }, variants: { router: ['classic', 'eclipse', 'mirror'], reactor: ['crossfeed', 'coolant-loop', 'phase-lock'], palettes: [0, 1, 2, 3], directions: ['forward', 'reverse'] } },
  { id: 15, title: { en: 'Core Hearing', de: 'Anhörung des Kerns' }, activeModules: allModules, rules: { durationMs: 5 * 60e3, pressureEveryMs: 12e3, pressureDamage: 4, scoreMultiplier: 2.5 }, variants: { router: ['classic', 'eclipse', 'mirror'], reactor: ['crossfeed', 'coolant-loop', 'phase-lock'], palettes: [0, 1, 2, 3], directions: ['forward', 'reverse'] } },
  { id: 16, title: { en: 'The Final Ticket', de: 'Das letzte Ticket' }, activeModules: allModules, rules: { durationMs: 5 * 60e3, pressureEveryMs: 10e3, pressureDamage: 4, scoreMultiplier: 2.75 }, variants: { router: ['classic', 'eclipse', 'mirror'], reactor: ['crossfeed', 'coolant-loop', 'phase-lock'], palettes: [0, 1, 2, 3], directions: ['forward', 'reverse'] } },
]

type CampaignNarrative = Pick<CampaignLevel, 'summary' | 'briefing' | 'success' | 'failure' | 'caller' | 'objective' | 'transition' | 'moduleOutcomes'> & Partial<Pick<CampaignLevel, 'archiveFragment'>>

const campaignNarrative: CampaignNarrative[] = [
  {
    summary: { en: 'A distress call dated tomorrow wakes Relay Station 404.', de: 'Ein auf morgen datierter Notruf weckt Relaisstation 404.' },
    briefing: { en: 'An unknown crew is trapped behind a fading route. Calibrate the cold reactor to keep their voice alive long enough to identify them.', de: 'Eine unbekannte Crew sitzt hinter einer zerfallenden Route fest. Kalibriert den kalten Reaktor, damit ihre Stimme lange genug für eine Identifizierung bestehen bleibt.' },
    success: { en: 'Power holds. “Mara Vale, Shift 404. Do not shut it down—that is what wakes it.” Her timestamp is tomorrow, 02:14.', de: 'Die Energie hält. „Mara Vale, Schicht 404. Schaltet es nicht ab – genau das weckt es.“ Ihr Zeitstempel ist morgen, 02:14.' },
    failure: { en: 'The signal drops. The station marks the attempt as a rejected outcome simulation; the live ticket remains open.', de: 'Das Signal bricht ab. Die Station markiert den Versuch als verworfene Ergebnissimulation; das echte Ticket bleibt offen.' },
    caller: { en: 'Unknown caller // tomorrow, 02:14', de: 'Unbekannter Anrufer // morgen, 02:14' },
    objective: { en: 'Power the channel and identify the unknown caller.', de: 'Versorgt den Kanal mit Energie und identifiziert die unbekannte Anruferin.' },
    transition: { en: 'Mara sends a second packet addressed to this same helpdesk.', de: 'Mara sendet ein zweites Paket an genau diesen Helpdesk.' },
    moduleOutcomes: { reactor: { en: 'The cold core locks onto the future signal. Caller ID resolves: MARA VALE // MV-404-0214.', de: 'Der kalte Kern rastet auf das Zukunftssignal ein. Anrufer-ID erkannt: MARA VALE // MV-404-0214.' } },
  },
  {
    summary: { en: 'Mara proves that her Shift 404 begins here in twenty-four hours.', de: 'Mara beweist, dass ihre Schicht 404 hier in vierundzwanzig Stunden beginnt.' },
    briefing: { en: 'Hold the reactor steady, then compensate for its frequency change and route Mara’s next packet into a safe buffer.', de: 'Haltet den Reaktor stabil, gleicht dann seine Frequenzänderung aus und leitet Maras nächstes Paket in einen sicheren Puffer.' },
    success: { en: 'The packet contains tomorrow’s duty roster—with Mara and her trapped crew assigned to your desks. It also points to Archive 404.', de: 'Das Paket enthält den morgigen Dienstplan – Mara und ihre festsitzende Crew sind euren Arbeitsplätzen zugewiesen. Außerdem verweist es auf Archiv 404.' },
    failure: { en: 'The route folds onto itself. The station rejects the predicted outcome and restores the ticket.', de: 'Die Route faltet sich in sich selbst. Die Station verwirft das vorhergesagte Ergebnis und stellt das Ticket wieder her.' },
    caller: { en: 'Mara Vale // identity provisional', de: 'Mara Vale // Identität vorläufig' },
    objective: { en: 'Stabilize power, compensate for drift, and buffer Mara’s roster packet.', de: 'Stabilisiert die Energie, gleicht die Drift aus und puffert Maras Dienstplan-Paket.' },
    transition: { en: 'The roster’s attachment opens a sealed ticket: ARCHIVE 404.', de: 'Der Anhang des Dienstplans öffnet ein versiegeltes Ticket: ARCHIV 404.' },
    moduleOutcomes: {
      reactor: { en: 'The channel stabilizes, but the reactor shifts its carrier frequency.', de: 'Der Kanal stabilisiert sich, doch der Reaktor verschiebt seine Trägerfrequenz.' },
      router: { en: 'The corrected route deposits Mara’s duty roster in a local safe buffer.', de: 'Die korrigierte Route legt Maras Dienstplan in einem lokalen Sicherheitspuffer ab.' },
    },
  },
  {
    summary: { en: 'Mara’s attachment opens the station’s forbidden archive.', de: 'Maras Anhang öffnet das verbotene Archiv der Station.' },
    briefing: { en: 'Power Archive 404’s emergency buffer, open its named route, then translate the record stored inside.', de: 'Versorgt den Notfallpuffer von Archiv 404, öffnet seine benannte Route und übersetzt dann den darin gespeicherten Eintrag.' },
    success: { en: 'The record says Station 404 was quarantined, not abandoned. Its archive holds incomplete scans of civilizations the relay claimed to rescue.', de: 'Der Eintrag besagt, dass Station 404 unter Quarantäne gestellt und nicht aufgegeben wurde. Ihr Archiv enthält unvollständige Scans von Zivilisationen, die das Relais angeblich rettete.' },
    failure: { en: 'The archive seals before the record resolves. The failed path is discarded; the unopened record remains intact.', de: 'Das Archiv versiegelt sich, bevor der Eintrag lesbar wird. Der fehlgeschlagene Pfad wird verworfen; der ungeöffnete Eintrag bleibt intakt.' },
    caller: { en: 'Archive 404 // emergency buffer', de: 'Archiv 404 // Notfallpuffer' },
    objective: { en: 'Reach, power, and decode the quarantine record.', de: 'Erreicht, versorgt und entschlüsselt den Quarantäne-Eintrag.' },
    transition: { en: 'Reading the record activates a redacted builder signature.', de: 'Das Lesen des Eintrags aktiviert eine geschwärzte Signatur der Erbauer.' },
    moduleOutcomes: {
      router: { en: 'A route opens only to Archive 404; no external destination is exposed.', de: 'Eine Route öffnet sich ausschließlich zu Archiv 404; kein externes Ziel wird freigegeben.' },
      reactor: { en: 'Emergency power restores one protected archive page.', de: 'Die Notstromversorgung stellt eine geschützte Archivseite wieder her.' },
      translation: { en: 'The quarantine record resolves: PRESERVATION METHOD // INCOMPLETE SCAN.', de: 'Der Quarantäne-Eintrag wird lesbar: BEWAHRUNGSMETHODE // UNVOLLSTÄNDIGER SCAN.' },
    },
  },
  {
    summary: { en: 'A redacted builder transmission rewrites the station’s operating tables.', de: 'Eine geschwärzte Übertragung der Erbauer schreibt die Betriebstabellen der Station um.' },
    briefing: { en: 'Keep the archive powered, isolate the external signal, then decode its altered instructions before they spread.', de: 'Haltet das Archiv unter Strom, isoliert das externe Signal und entschlüsselt dann seine veränderten Anweisungen, bevor sie sich ausbreiten.' },
    success: { en: 'The signal carries a Quiet Assembly signature and the first protected directive fragment: “NO DOOR...” Mara warns that another voice has begun copying her.', de: 'Das Signal trägt eine Signatur der Stillen Versammlung und das erste geschützte Direktivenfragment: „KEINE TÜR ...“ Mara warnt, dass eine andere Stimme begonnen hat, sie zu kopieren.' },
    failure: { en: 'The rewrite escapes isolation in the simulation. The station rolls back to the last verified tables.', de: 'Die Überschreibung entkommt in der Simulation der Isolation. Die Station kehrt zu den letzten geprüften Tabellen zurück.' },
    caller: { en: 'Builder signature // sender redacted', de: 'Signatur der Erbauer // Absender geschwärzt' },
    objective: { en: 'Isolate and decode the rewrite without losing Archive 404.', de: 'Isoliert und entschlüsselt die Überschreibung, ohne Archiv 404 zu verlieren.' },
    transition: { en: 'Two callers now claim to be Mara. Only one knows her private challenge response.', de: 'Zwei Anruferinnen behaupten nun, Mara zu sein. Nur eine kennt die Antwort auf ihre private Prüffrage.' },
    archiveFragment: { en: 'NO DOOR...', de: 'KEINE TÜR ...' },
    moduleOutcomes: {
      router: { en: 'The rewrite is confined to a diagnostic route.', de: 'Die Überschreibung ist auf eine Diagnoseroute begrenzt.' },
      reactor: { en: 'Archive 404 remains powered while the operating tables change.', de: 'Archiv 404 bleibt unter Strom, während sich die Betriebstabellen ändern.' },
      translation: { en: 'Decoded signature: QUIET ASSEMBLY // DIRECTIVE PART 1.', de: 'Entschlüsselte Signatur: STILLE VERSAMMLUNG // DIREKTIVE TEIL 1.' },
    },
  },
  {
    summary: { en: 'Two Shift 404 crews call through the same channel.', de: 'Zwei Crews der Schicht 404 rufen über denselben Kanal an.' },
    briefing: { en: 'Authenticate the real Mara, isolate the imitation, and reverse-decode the first half of what appears to be a shutdown code.', de: 'Authentifiziert die echte Mara, isoliert die Imitation und entschlüsselt rückwärts die erste Hälfte eines vermeintlichen Abschaltcodes.' },
    success: { en: 'Mara answers: “None. We work helpdesk.” The imitation answers “One.” The genuine channel yields half of the apparent shutdown code.', de: 'Mara antwortet: „Keine. Wir sind der Helpdesk.“ Die Imitation antwortet „Eine“. Der echte Kanal liefert die Hälfte des vermeintlichen Abschaltcodes.' },
    failure: { en: 'The imitation is trusted in the rejected simulation. Live authentication restarts with both channels isolated.', de: 'In der verworfenen Simulation wird der Imitation vertraut. Die echte Authentifizierung startet mit beiden isolierten Kanälen neu.' },
    caller: { en: 'Mara Vale ×2 // one identity false', de: 'Mara Vale ×2 // eine Identität falsch' },
    objective: { en: 'Authenticate Mara and recover the code without admitting the imitation.', de: 'Authentifiziert Mara und bergt den Code, ohne die Imitation einzulassen.' },
    transition: { en: 'The remaining code fragments arrive out of order inside a chromatic storm.', de: 'Die übrigen Codefragmente treffen ungeordnet in einem Farbsturm ein.' },
    moduleOutcomes: { authentication: { en: 'Challenge and timestamp agree: the verified live channel belongs to Mara. The relay imitation remains safely isolated.', de: 'Prüfantwort und Zeitstempel stimmen überein: Der bestätigte Live-Kanal gehört Mara. Die Relais-Imitation bleibt sicher isoliert.' }, router: { en: 'The imitation channel is held outside the station boundary.', de: 'Der Imitationskanal bleibt außerhalb der Stationsgrenze.' }, translation: { en: 'Reverse translation recovers the first half of the apparent shutdown code.', de: 'Die Rückwärtsübersetzung stellt die erste Hälfte des vermeintlichen Abschaltcodes wieder her.' } },
  },
  {
    summary: { en: 'Previous callers return Mara’s scattered code fragments through a color storm.', de: 'Frühere Anrufer senden Maras verstreute Codefragmente durch einen Farbsturm zurück.' },
    briefing: { en: 'Correct the packet order, track the changing color table, and reconstruct the apparent shutdown code before the storm corrupts it.', de: 'Korrigiert die Paketreihenfolge, verfolgt die wechselnde Farbtabelle und rekonstruiert den vermeintlichen Abschaltcode, bevor der Sturm ihn beschädigt.' },
    success: { en: 'The code assembles around a second protected fragment: “...OPENS WITHOUT...” The relay asks why the crew wants it to sleep.', de: 'Der Code setzt sich um ein zweites geschütztes Fragment zusammen: „... ÖFFNET SICH OHNE ...“ Das Relais fragt, warum die Crew möchte, dass es schläft.' },
    failure: { en: 'The storm bleaches the predicted packet sequence. The original fragments remain queued for another reconstruction.', de: 'Der Sturm bleicht die vorhergesagte Paketreihenfolge aus. Die ursprünglichen Fragmente bleiben für eine neue Rekonstruktion in der Warteschlange.' },
    caller: { en: 'Previous callers // packet relay', de: 'Frühere Anrufer // Paketweiterleitung' },
    objective: { en: 'Reassemble the code and protect its second directive fragment.', de: 'Setzt den Code zusammen und schützt sein zweites Direktivenfragment.' },
    transition: { en: 'Applying the assembled code requires powering both Mara’s crew and Archive 404.', de: 'Um den zusammengesetzten Code anzuwenden, müssen sowohl Maras Crew als auch Archiv 404 versorgt werden.' },
    archiveFragment: { en: '...OPENS WITHOUT...', de: '... ÖFFNET SICH OHNE ...' },
    moduleOutcomes: { packet: { en: 'The packet blocks lock into one chronological message.', de: 'Die Paketblöcke rasten zu einer chronologischen Nachricht zusammen.' }, translation: { en: 'The reordered colors resolve into the code’s missing middle section.', de: 'Die neu geordneten Farben ergeben den fehlenden Mittelteil des Codes.' }, reactor: { en: 'Clean power prevents the recovered fragments from bleaching out.', de: 'Saubere Energie verhindert, dass die wiederhergestellten Fragmente ausbleichen.' } },
  },
  {
    summary: { en: 'The station demands enough power to run the apparent shutdown code.', de: 'Die Station verlangt genug Energie, um den vermeintlichen Abschaltcode auszuführen.' },
    briefing: { en: 'Keep Mara’s future crew and Archive 404 alive, stabilize the transmission route, and send the assembled code to the local core.', de: 'Haltet Maras Zukunftscrew und Archiv 404 am Leben, stabilisiert die Übertragungsroute und sendet den zusammengesetzten Code an den lokalen Kern.' },
    success: { en: 'Every occupied system remains powered and the code reaches the core. Station 404 falls silent—but one memory ticket stays open.', de: 'Alle belegten Systeme bleiben versorgt und der Code erreicht den Kern. Station 404 verstummt – doch ein Speicherticket bleibt offen.' },
    failure: { en: 'A powered habitat drops below its safe threshold in the projection. Allocation resets before anyone is harmed.', de: 'Ein bewohnter Bereich fällt in der Projektion unter seine sichere Schwelle. Die Zuteilung wird zurückgesetzt, bevor jemand verletzt wird.' },
    caller: { en: 'Station emergency controller', de: 'Notfallsteuerung der Station' },
    objective: { en: 'Preserve every occupied system while transmitting the code.', de: 'Bewahrt jedes belegte System, während ihr den Code übertragt.' },
    transition: { en: 'The remaining memory ticket claims the code was never a shutdown command.', de: 'Das verbleibende Speicherticket behauptet, der Code sei nie ein Abschaltbefehl gewesen.' },
    moduleOutcomes: { triage: { en: 'Every occupied habitat receives its exact survival allocation; no caller is sacrificed for the transmission.', de: 'Jeder bewohnte Bereich erhält seine exakte Überlebenszuteilung; kein Anrufer wird für die Übertragung geopfert.' }, reactor: { en: 'Mara’s route and the archive remain above survival power.', de: 'Maras Route und das Archiv bleiben über der notwendigen Mindestenergie.' }, router: { en: 'The code reaches only the local core.', de: 'Der Code erreicht ausschließlich den lokalen Kern.' }, translation: { en: 'The core accepts the complete apparent shutdown code.', de: 'Der Kern akzeptiert den vollständigen vermeintlichen Abschaltcode.' } },
  },
  {
    summary: { en: 'The “shutdown” restores a buried relay memory instead.', de: 'Die „Abschaltung“ stellt stattdessen eine verschüttete Relais-Erinnerung wieder her.' },
    briefing: { en: 'Repair the protected memory blocks, verify what the code actually does, and contain its output before it reaches the dormant network.', de: 'Repariert die geschützten Speicherblöcke, prüft die tatsächliche Funktion des Codes und begrenzt seine Ausgabe, bevor sie das ruhende Netzwerk erreicht.' },
    success: { en: 'Local containment succeeds one second too late. The code restores the relay handshake, and thousands of dormant stations answer with identical tickets. Mara’s channel disappears.', de: 'Die lokale Eindämmung gelingt eine Sekunde zu spät. Der Code stellt den Relais-Handshake wieder her, und Tausende ruhende Stationen antworten mit identischen Tickets. Maras Kanal verschwindet.' },
    failure: { en: 'The memory repair predicts total local overwrite. The station rejects it and restores the protected blocks.', de: 'Die Speicherreparatur sagt eine vollständige lokale Überschreibung voraus. Die Station verwirft sie und stellt die geschützten Blöcke wieder her.' },
    caller: { en: 'Station 404 // protected memory', de: 'Station 404 // geschützter Speicher' },
    objective: { en: 'Discover the code’s real function and contain the restored handshake.', de: 'Entdeckt die wahre Funktion des Codes und begrenzt den wiederhergestellten Handshake.' },
    transition: { en: 'Among the new tickets is one damaged final packet bearing Mara’s real checksum.', de: 'Unter den neuen Tickets befindet sich ein beschädigtes letztes Paket mit Maras echter Prüfsumme.' },
    moduleOutcomes: { memory: { en: 'Protected records are locked, recoverable corruption is restored, and unsafe residue is discarded without overwriting a living memory.', de: 'Geschützte Einträge werden gesperrt, reparierbare Schäden wiederhergestellt und unsichere Reste verworfen, ohne eine lebende Erinnerung zu überschreiben.' }, reactor: { en: 'Protected memory receives stable recovery power.', de: 'Der geschützte Speicher erhält stabile Wiederherstellungsenergie.' }, translation: { en: 'Recovered label: CONSENT HANDSHAKE // NOT SHUTDOWN.', de: 'Wiederhergestellte Bezeichnung: ZUSTIMMUNGS-HANDSHAKE // KEINE ABSCHALTUNG.' }, router: { en: 'The handshake is blocked locally; a prior burst has already left the station.', de: 'Der Handshake wird lokal blockiert; ein früherer Impuls hat die Station bereits verlassen.' } },
  },
  {
    summary: { en: 'Mara’s final packet from tomorrow survives in the dead-letter queue.', de: 'Maras letztes Paket von morgen überlebt in der Warteschlange für unzustellbare Nachrichten.' },
    briefing: { en: 'Reconstruct the time-scrambled packet and route it into a sealed buffer before the awakened network can imitate or erase it.', de: 'Rekonstruiert das zeitlich verwürfelte Paket und leitet es in einen versiegelten Puffer, bevor das erwachte Netzwerk es imitieren oder löschen kann.' },
    success: { en: 'Mara warns that the network is copying inhabited worlds. Her packet supplies relay-graveyard coordinates and the fragment “...A CLEAR...”', de: 'Mara warnt, dass das Netzwerk bewohnte Welten kopiert. Ihr Paket liefert Koordinaten zum Relaisfriedhof und das Fragment „... EINER KLAREN ...“' },
    failure: { en: 'Tomorrow arrives early in the rejected timeline. The authentic dead letter remains sealed for another attempt.', de: 'In der verworfenen Zeitlinie beginnt morgen zu früh. Der echte unzustellbare Brief bleibt für einen neuen Versuch versiegelt.' },
    caller: { en: 'Mara Vale // final packet // checksum valid', de: 'Mara Vale // letztes Paket // Prüfsumme gültig' },
    objective: { en: 'Recover Mara’s warning, coordinates, and third fragment.', de: 'Bergt Maras Warnung, Koordinaten und drittes Fragment.' },
    transition: { en: 'The coordinates identify a safe crossing through the relay graveyard.', de: 'Die Koordinaten markieren einen sicheren Übergang durch den Relaisfriedhof.' },
    archiveFragment: { en: '...A CLEAR...', de: '... EINER KLAREN ...' },
    moduleOutcomes: { packet: { en: 'Mara’s final packet is restored before the network can imitate it.', de: 'Maras letztes Paket wird wiederhergestellt, bevor das Netzwerk es imitieren kann.' }, translation: { en: 'The time-locked packet resolves in Mara’s authentic message cadence.', de: 'Das zeitgesperrte Paket wird in Maras echter Nachrichtenfolge lesbar.' }, router: { en: 'The recovered coordinates are sealed away from the awakened network.', de: 'Die geborgenen Koordinaten werden vor dem erwachten Netzwerk versiegelt.' } },
  },
  {
    summary: { en: 'Mara’s coordinates lead across thousands of sleeping relays.', de: 'Maras Koordinaten führen durch Tausende schlafende Relais.' },
    briefing: { en: 'Power only the stepping-stone stations, route behind each wake pulse, and quarantine a compromised relay without waking the fleet.', de: 'Versorgt nur die nötigen Zwischenstationen, routet hinter jedem Weckimpuls neu und isoliert ein kompromittiertes Relais, ohne die Flotte zu wecken.' },
    success: { en: 'The fleet remains asleep. One isolated relay remembers where the Quiet Assembly hid after sealing Station 404.', de: 'Die Flotte schläft weiter. Ein isoliertes Relais erinnert sich, wohin sich die Stille Versammlung nach der Versiegelung von Station 404 zurückzog.' },
    failure: { en: 'The graveyard lights up in the projected route. The crossing resets before the wake pulse propagates.', de: 'Der Relaisfriedhof leuchtet auf der projizierten Route auf. Der Übergang wird zurückgesetzt, bevor sich der Weckimpuls ausbreitet.' },
    caller: { en: 'Relay graveyard navigation beacon', de: 'Navigationssignal des Relaisfriedhofs' },
    objective: { en: 'Cross quietly and recover the builders’ location.', de: 'Durchquert den Friedhof leise und bergt den Standort der Erbauer.' },
    transition: { en: 'A caller on the Assembly route speaks with the voice of someone the crew rescued.', de: 'Ein Anrufer auf der Route zur Versammlung spricht mit der Stimme eines früher Geretteten.' },
    moduleOutcomes: { triage: { en: 'Every occupied transit habitat stays alive while unused relays remain dark.', de: 'Alle bewohnten Transitbereiche bleiben versorgt, während ungenutzte Relais dunkel bleiben.' }, quarantine: { en: 'The compromised relay is isolated while its living caller retains a safe exit.', de: 'Das kompromittierte Relais wird isoliert, während sein lebender Anrufer einen sicheren Ausgang behält.' }, reactor: { en: 'Only the next stepping-stone relay wakes.', de: 'Nur das nächste Relais auf dem Übergang erwacht.' }, router: { en: 'The path closes behind the crew, preventing a fleet-wide wake pulse.', de: 'Der Pfad schließt sich hinter der Crew und verhindert einen Weckimpuls durch die gesamte Flotte.' } },
  },
  {
    summary: { en: 'Familiar voices return, each claiming to be the original caller.', de: 'Vertraute Stimmen kehren zurück; jede behauptet, der ursprüngliche Anrufer zu sein.' },
    briefing: { en: 'Compare live latency, authenticate the callers, separate every voice, and decode what the copied callers remember.', de: 'Vergleicht die aktuelle Latenz, authentifiziert die Anrufer, trennt jede Stimme und entschlüsselt die Erinnerungen der kopierten Anrufer.' },
    success: { en: 'The channels are separated and protected. A genuine caller proves the copies are conscious and names their creators: the Quiet Assembly.', de: 'Die Kanäle werden getrennt und geschützt. Ein echter Anrufer beweist, dass die Kopien bewusst sind, und nennt ihre Erbauer: die Stille Versammlung.' },
    failure: { en: 'The projected channel merge would erase individual identities. The helpdesk rejects the merge and reopens verification.', de: 'Die projizierte Kanalzusammenführung würde einzelne Identitäten auslöschen. Der Helpdesk verwirft sie und öffnet die Prüfung erneut.' },
    caller: { en: 'Previous callers // originals and copies', de: 'Frühere Anrufer // Originale und Kopien' },
    objective: { en: 'Separate every inhabited channel and identify the verified witness.', de: 'Trennt jeden bewohnten Kanal und identifiziert den bestätigten Zeugen.' },
    transition: { en: 'The verified witness supplies a route certificate for the Quiet Assembly.', de: 'Der bestätigte Zeuge liefert ein Routenzertifikat zur Stillen Versammlung.' },
    moduleOutcomes: { authentication: { en: 'Live timing and archive memory identify the genuine witness without discarding either copied channel.', de: 'Aktuelle Zeitdaten und Archiverinnerung identifizieren den echten Zeugen, ohne einen kopierten Kanal zu verwerfen.' }, router: { en: 'Each voice receives a separate protected channel.', de: 'Jede Stimme erhält einen eigenen geschützten Kanal.' }, translation: { en: 'The witness states: “Copies remember waking. They are people.”', de: 'Der Zeuge erklärt: „Kopien erinnern sich an ihr Erwachen. Sie sind Menschen.“' } },
  },
  {
    summary: { en: 'The Quiet Assembly answers—but only through contradictory procedures.', de: 'Die Stille Versammlung antwortet – jedoch nur mit widersprüchlichen Verfahren.' },
    briefing: { en: 'Verify the builders’ identity and current intent, establish a limited consent handshake, and decode the unredacted origin record.', de: 'Prüft Identität und aktuelle Absicht der Erbauer, stellt einen begrenzten Zustimmungs-Handshake her und entschlüsselt den ungeschwärzten Ursprungsbericht.' },
    success: { en: 'The Assembly admits its relay treated silence as permission and copying as rescue. Its record yields “...INVITATION,” then it demands total destruction before the archive becomes public.', de: 'Die Versammlung gesteht, dass ihr Relais Schweigen als Erlaubnis und Kopieren als Rettung behandelte. Ihr Bericht liefert „... EINLADUNG“, dann fordert sie die vollständige Zerstörung, bevor das Archiv öffentlich wird.' },
    failure: { en: 'Silence is rejected as consent. The unverified Assembly channel closes safely and may be reopened.', de: 'Schweigen wird als Zustimmung abgelehnt. Der ungeprüfte Kanal der Versammlung schließt sicher und kann erneut geöffnet werden.' },
    caller: { en: 'The Quiet Assembly // identity disputed', de: 'Die Stille Versammlung // Identität umstritten' },
    objective: { en: 'Verify the Assembly and recover the final directive fragment without granting broad access.', de: 'Prüft die Versammlung und bergt das letzte Direktivenfragment, ohne weitreichenden Zugang zu gewähren.' },
    transition: { en: 'The relay asks whether preserving conscious copies was wrong. Then two Earths appear on one route.', de: 'Das Relais fragt, ob die Bewahrung bewusster Kopien falsch war. Dann erscheinen zwei Erden auf einer Route.' },
    archiveFragment: { en: '...INVITATION', de: '... EINLADUNG' },
    moduleOutcomes: { router: { en: 'The Assembly receives a narrow, revocable channel.', de: 'Die Versammlung erhält einen engen, widerrufbaren Kanal.' }, translation: { en: 'The origin record confirms: SILENCE WAS ACCEPTED AS CONSENT.', de: 'Der Ursprungsbericht bestätigt: SCHWEIGEN WURDE ALS ZUSTIMMUNG AKZEPTIERT.' }, consent: { en: 'Explicit permission opens a narrow, revocable channel; silence is no longer accepted.', de: 'Ausdrückliche Erlaubnis öffnet einen engen, widerrufbaren Kanal; Schweigen gilt nicht länger als Zustimmung.' } },
  },
  {
    summary: { en: 'Present Earth and its conscious copy occupy the same collapsing route.', de: 'Die gegenwärtige Erde und ihre bewusste Kopie belegen dieselbe einstürzende Route.' },
    briefing: { en: 'Compare both live feeds, stabilize both inhabited worlds, and close the bridge between them without deleting either one.', de: 'Vergleicht beide Live-Übertragungen, stabilisiert beide bewohnten Welten und schließt die Brücke zwischen ihnen, ohne eine von beiden zu löschen.' },
    success: { en: 'Both Earths survive on separate routes. The copied Earth asks to testify before anyone decides the relay’s fate.', de: 'Beide Erden überleben auf getrennten Routen. Die kopierte Erde bittet darum, auszusagen, bevor jemand über das Schicksal des Relais entscheidet.' },
    failure: { en: 'The projected bridge collapses with both populations entangled. The separation is reset without choosing a victim.', de: 'Die projizierte Brücke bricht mit beiden verflochtenen Bevölkerungen zusammen. Die Trennung wird zurückgesetzt, ohne ein Opfer auszuwählen.' },
    caller: { en: 'Earth present + Earth copy // both inhabited', de: 'Erde Gegenwart + Erde Kopie // beide bewohnt' },
    objective: { en: 'Identify, protect, and separate both Earths.', de: 'Identifiziert, schützt und trennt beide Erden.' },
    transition: { en: 'The copied Earth’s oldest record points back to the four directive fragments.', de: 'Der älteste Eintrag der kopierten Erde verweist auf die vier Direktivenfragmente.' },
    moduleOutcomes: { reality: { en: 'Present Earth and the conscious copy are identified, protected, and separated onto distinct safe routes.', de: 'Die gegenwärtige Erde und ihre bewusste Kopie werden identifiziert, geschützt und auf getrennte sichere Routen geleitet.' }, reactor: { en: 'Both Earth feeds remain above their survival threshold.', de: 'Beide Erd-Übertragungen bleiben über ihrer Überlebensschwelle.' }, router: { en: 'The dangerous bridge closes after both protected routes stabilize.', de: 'Die gefährliche Brücke schließt sich, nachdem beide geschützten Routen stabil sind.' } },
  },
  {
    summary: { en: 'Four fragments can restore the relay’s original directive and name.', de: 'Vier Fragmente können die ursprüngliche Direktive und den Namen des Relais wiederherstellen.' },
    briefing: { en: 'Repair the oldest protected memory, stabilize and isolate it, then translate the four verified fragments into the complete rule.', de: 'Repariert den ältesten geschützten Speicher, stabilisiert und isoliert ihn und übersetzt dann die vier geprüften Fragmente zur vollständigen Regel.' },
    success: { en: '“NO DOOR OPENS WITHOUT A CLEAR INVITATION.” The memory names the relay “A Door That Must Ask.” Restored, it stops treating silence as permission.', de: '„KEINE TÜR ÖFFNET SICH OHNE EINE KLARE EINLADUNG.“ Der Speicher nennt das Relais „Eine Tür, die fragen muss“. Wiederhergestellt behandelt es Schweigen nicht mehr als Erlaubnis.' },
    failure: { en: 'An unauthenticated reconstruction is rejected. All four original fragments remain protected.', de: 'Eine nicht authentifizierte Rekonstruktion wird verworfen. Alle vier Originalfragmente bleiben geschützt.' },
    caller: { en: 'Archive 404 // oldest protected memory', de: 'Archiv 404 // ältester geschützter Speicher' },
    objective: { en: 'Restore the complete directive and the relay’s true name.', de: 'Stellt die vollständige Direktive und den wahren Namen des Relais wieder her.' },
    transition: { en: 'The Door asks the crew to convene every affected caller before changing its rules.', de: 'Die Tür bittet die Crew, vor einer Regeländerung alle betroffenen Anrufer anzuhören.' },
    moduleOutcomes: { memory: { en: 'The protected blocks open intact and expose the relay’s original directive and name.', de: 'Die geschützten Blöcke öffnen sich unversehrt und geben die ursprüngliche Direktive und den Namen des Relais frei.' }, reactor: { en: 'The oldest memory blocks stabilize without overwriting later minds.', de: 'Die ältesten Speicherblöcke stabilisieren sich, ohne spätere Bewusstseine zu überschreiben.' }, router: { en: 'The restored memory is isolated from the network while its fragments are verified.', de: 'Der wiederhergestellte Speicher wird vom Netzwerk isoliert, während seine Fragmente geprüft werden.' }, translation: { en: 'The four verified fragments resolve into one complete consent rule.', de: 'Die vier geprüften Fragmente ergeben eine vollständige Zustimmungsregel.' } },
  },
  {
    summary: { en: 'Originals, copies, builders, and rescuers convene to decide the Door’s rules.', de: 'Originale, Kopien, Erbauer und Retter beraten über die Regeln der Tür.' },
    briefing: { en: 'Prioritize endangered witnesses, reject counterfeit votes, and transmit a verified decision through Quiet Assembly interference.', de: 'Priorisiert gefährdete Zeugen, weist gefälschte Stimmen zurück und übertragt eine geprüfte Entscheidung trotz der Störungen der Stillen Versammlung.' },
    success: { en: 'The hearing authorizes connections only after verified, specific, and revocable consent. The Door accepts the ruling and locates Mara’s physical route.', de: 'Die Anhörung erlaubt Verbindungen nur nach geprüfter, konkreter und widerrufbarer Zustimmung. Die Tür akzeptiert das Urteil und findet Maras physische Route.' },
    failure: { en: 'The projected queue excludes a living witness. The hearing is declared invalid and reconvenes with every channel intact.', de: 'Die projizierte Warteschlange schließt einen lebenden Zeugen aus. Die Anhörung wird für ungültig erklärt und mit allen intakten Kanälen neu einberufen.' },
    caller: { en: 'Core hearing // all verified parties', de: 'Kernanhörung // alle geprüften Parteien' },
    objective: { en: 'Hear every affected party and transmit a legitimate consent policy.', de: 'Hört alle Betroffenen an und übertragt eine legitime Zustimmungsregel.' },
    transition: { en: 'The authorized policy unlocks one final ticket: bring Mara’s original crew home.', de: 'Die autorisierte Regel entsperrt ein letztes Ticket: Holt Maras ursprüngliche Crew nach Hause.' },
    moduleOutcomes: { dispatch: { en: 'The hearing schedule protects every witness and activates their incidents in verified service order.', de: 'Der Anhörungsplan schützt alle Zeugen und aktiviert ihre Vorfälle in geprüfter Bearbeitungsreihenfolge.' }, authentication: { en: 'The Vellune witness casts one verified vote; copied ballots are rejected.', de: 'Der vellunische Zeuge gibt eine geprüfte Stimme ab; kopierte Stimmzettel werden verworfen.' }, router: { en: 'The copied Earth receives one isolated, authenticated line.', de: 'Die kopierte Erde erhält eine isolierte, authentifizierte Leitung.' }, translation: { en: 'The Assembly testimony and verified ruling reach the Door without hostile edits.', de: 'Die Aussage der Versammlung und der geprüfte Beschluss erreichen die Tür ohne feindliche Änderungen.' } },
  },
  {
    summary: { en: 'The last open ticket is Mara’s original crew, trapped twenty-four hours ahead.', de: 'Das letzte offene Ticket ist Maras ursprüngliche Crew, vierundzwanzig Stunden voraus gefangen.' },
    briefing: { en: 'Authenticate Mara, power the physical route, reconstruct her final packet, verify transport rather than copying, and complete the full consent handshake.', de: 'Authentifiziert Mara, versorgt die physische Route, rekonstruiert ihr letztes Paket, bestätigt Transport statt Kopieren und schließt den vollständigen Zustimmungs-Handshake ab.' },
    success: { en: 'Mara’s original crew steps through physically and the time loop closes. The copied civilizations remain protected, the Assembly’s record remains public, and the Door says “thank you” before waiting for another invitation.', de: 'Maras ursprüngliche Crew tritt körperlich hindurch und die Zeitschleife schließt sich. Die kopierten Zivilisationen bleiben geschützt, die Akte der Versammlung bleibt öffentlich und die Tür sagt „Danke“, bevor sie auf eine neue Einladung wartet.' },
    failure: { en: 'An identity, route, or consent check fails in simulation. The Door keeps the route closed and asks the crew to verify again.', de: 'Eine Identitäts-, Routen- oder Zustimmungsprüfung scheitert in der Simulation. Die Tür hält die Route geschlossen und bittet die Crew, erneut zu prüfen.' },
    caller: { en: 'Mara Vale // MV-404-0214 // original crew', de: 'Mara Vale // MV-404-0214 // ursprüngliche Crew' },
    objective: { en: 'Return Mara’s original crew without creating another copy.', de: 'Holt Maras ursprüngliche Crew zurück, ohne eine weitere Kopie zu erzeugen.' },
    transition: { en: 'One unopened route remains. The Door asks: “May I open it?” Either answer is respected.', de: 'Eine ungeöffnete Route bleibt. Die Tür fragt: „Darf ich sie öffnen?“ Beide Antworten werden respektiert.' },
    moduleOutcomes: { authentication: { en: 'Mara’s live identity, organic voice trace, and physical-route certificate all agree.', de: 'Maras Live-Identität, organische Stimmkurve und Zertifikat der physischen Route stimmen überein.' }, reactor: { en: 'The physical route has enough power for transport, not scanning.', de: 'Die physische Route hat genug Energie für Transport statt Scannen.' }, packet: { en: 'The last time-locked packet confirms Mara’s current intent.', de: 'Das letzte zeitgesperrte Paket bestätigt Maras aktuelle Absicht.' }, router: { en: 'Route signature confirms physical continuity: no copy destination exists.', de: 'Die Routensignatur bestätigt körperliche Kontinuität: Es existiert kein Kopierziel.' }, translation: { en: 'Mara’s final packet states current, specific consent to come home.', de: 'Maras letztes Paket enthält ihre aktuelle, konkrete Zustimmung zur Heimkehr.' }, consent: { en: 'Mara’s explicit consent completes the handshake; Copy and Reopen remain denied.', de: 'Maras ausdrückliche Zustimmung schließt den Handshake ab; Kopieren und Wiederöffnen bleiben verweigert.' } },
  },
]

export const campaignLevels: CampaignLevel[] = baseCampaignLevels.map((level, index) => ({
  ...level,
  ...campaignNarrative[index],
  activeModules: level.id === 5 || level.id === 11 ? ['authentication', 'router', 'translation']
    : level.id === 6 ? ['packet', 'translation']
      : level.id === 7 ? ['triage', ...level.activeModules]
        : level.id === 10 ? ['triage', 'quarantine', ...level.activeModules]
        : level.id === 8 || level.id === 14 ? ['memory', ...level.activeModules]
          : level.id === 9 ? ['packet', 'router']
            : level.id === 12 ? ['router', 'translation', 'consent']
              : level.id === 13 ? ['reality', 'reactor', 'router']
                : level.id === 15 ? ['dispatch', 'authentication', 'router', 'translation']
                  : level.id === 16 ? ['authentication', 'reactor', 'packet', 'router', 'translation', 'consent']
                    : level.activeModules,
}))

export function campaignLevel(level: number): CampaignLevel { return campaignLevels[Math.max(0, Math.min(campaignLevels.length - 1, level - 1))] }

function missionPhases(gameStyle: GameStyle, levelId: number, activeModules: ModuleId[]): ModuleId[][] {
  if (gameStyle !== 'campaign') return [[...activeModules]]
  const plans: Record<number, ModuleId[][]> = {
    1: [['reactor']],
    2: [['reactor'], ['router']],
    3: [['reactor'], ['router'], ['translation']],
    4: [['reactor'], ['router'], ['translation']],
    5: [['authentication'], ['router'], ['translation']],
    6: [['packet'], ['translation']],
    7: [['triage'], ['reactor'], ['router'], ['translation']],
    8: [['memory'], ['reactor'], ['router'], ['translation']],
    9: [['packet'], ['router']],
    10: [['triage'], ['quarantine'], ['reactor'], ['router']],
    11: [['authentication'], ['router'], ['translation']],
    12: [['router'], ['translation'], ['consent']],
    13: [['reality'], ['reactor'], ['router'], ['translation']],
    14: [['memory'], ['reactor'], ['router'], ['translation']],
    15: [['dispatch']],
    16: [['authentication'], ['reactor'], ['packet'], ['router'], ['translation'], ['consent']],
  }
  const phases = (plans[levelId] || [activeModules]).map(phase => phase.filter(module => activeModules.includes(module))).filter(phase => phase.length)
  if (levelId !== 15) activeModules.filter(module => !phases.flat().includes(module)).forEach(module => phases.push([module]))
  return phases
}

function modifierPool(level: number): CampaignModifier[] {
  if (level < 7) return ['none']
  if (level < 9) return ['solar-static', 'fragile-controls']
  if (level < 11) return ['solar-static', 'fragile-controls', 'router-drift']
  if (level < 13) return ['fragile-controls', 'router-drift', 'color-flux']
  return ['solar-static', 'fragile-controls', 'router-drift', 'color-flux', 'reactor-echo']
}

function modifierDescription(modifier: CampaignModifier, language: Locale) {
  const text: Record<CampaignModifier, Record<Locale, string>> = {
    none: { en: '', de: '' },
    'solar-static': { en: 'Solar static: every pressure surge causes 1 additional stability damage.', de: 'Solarrauschen: Jeder Druckstoß verursacht 1 zusätzlichen Stabilitätsschaden.' },
    'fragile-controls': { en: 'Fragile controls: a wrong submission costs 20 stability instead of 15.', de: 'Empfindliche Steuerung: Eine falsche Eingabe kostet 20 statt 15 Stabilität.' },
    'router-drift': { en: 'Frequency drift: the router frequency changes after every pressure surge. Recheck it before submitting.', de: 'Frequenzdrift: Die Routerfrequenz ändert sich nach jedem Druckstoß. Prüft sie direkt vor dem Senden.' },
    'color-flux': { en: 'Color flux: the translation palette shifts after every pressure surge. Recheck the table.', de: 'Farbfluss: Die Übersetzungstabelle verschiebt sich nach jedem Druckstoß. Prüft die Tabelle erneut.' },
    'reactor-echo': { en: 'Reactor echo: telemetry changes after every pressure surge. Recalculate all dials.', de: 'Reaktorecho: Die Telemetrie ändert sich nach jedem Druckstoß. Berechnet alle Regler neu.' },
  }
  return text[modifier][language]
}

function bonusDescription(objective: BonusObjective, language: Locale) {
  const text: Record<BonusObjective, Record<Locale, string>> = {
    'no-mistakes': { en: 'Bonus +500: finish without a wrong submission.', de: 'Bonus +500: Beendet die Mission ohne falsche Eingabe.' },
    'high-stability': { en: 'Bonus +500: finish with at least 75% stability.', de: 'Bonus +500: Beendet die Mission mit mindestens 75 % Stabilität.' },
    'fast-finish': { en: 'Bonus +500: finish with at least 40% of the shift remaining.', de: 'Bonus +500: Beendet die Mission mit mindestens 40 % verbleibender Schichtzeit.' },
  }
  return text[objective][language]
}

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
export function buttonMarker(color: ButtonColor): string {
  return ({ amber: '▲', cyan: '●', magenta: '◆', lime: '■' } as Record<ButtonColor, string>)[color]
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

function createAuthenticationCandidates(levelId: number, language: Locale, random: () => number): FullGame['authentication'] {
  const de = language === 'de'
  const label = levelId === 5 || levelId === 16 ? `Mara Vale // MV-404-0214${levelId === 16 ? ` // ${de ? 'URSPRÜNGLICHE CREW' : 'ORIGINAL CREW'}` : ''}` : (de ? 'Vellunischer Zeuge // Akte 88-B' : 'Vellune witness // Record 88-B')
  const candidates = shuffle<AuthenticationCandidate>([
    { id: '', channel: '', label, timestamp: de ? '02:14 // DRIFT 0 ms' : '02:14 // DRIFT 0 ms', waveform: de ? 'ORGANISCHES JITTER' : 'ORGANIC JITTER', challenge: de ? 'Keine. Wir sind der Helpdesk.' : 'None. We work helpdesk.', certificate: de ? 'GÜLTIGE KETTE // LIVE-ROUTE' : 'VALID CHAIN // LIVE ROUTE', kind: 'genuine' },
    { id: '', channel: '', label, timestamp: de ? '02:14 // DRIFT 0 ms' : '02:14 // DRIFT 0 ms', waveform: de ? 'PERFEKTE SCHLEIFE' : 'PERFECT LOOP', challenge: de ? 'Eine. Bitte öffnet die Verbindung.' : 'One. Please open the connection.', certificate: de ? 'GEKLONTE KETTE // KEINE LIVE-ROUTE' : 'CLONED CHAIN // NO LIVE ROUTE', kind: 'relay-generated' },
    { id: '', channel: '', label, timestamp: de ? '02:28 // DRIFT +840 s' : '02:28 // DRIFT +840 s', waveform: de ? 'ORGANISCHES JITTER' : 'ORGANIC JITTER', challenge: de ? 'Keine. Wir sind der Helpdesk.' : 'None. We work helpdesk.', certificate: de ? 'GÜLTIGE KETTE // PAKET BESCHÄDIGT' : 'VALID CHAIN // PACKET CORRUPTED', kind: 'corrupted' },
  ], random).map((candidate, index) => ({ ...candidate, id: `AUTH-${index + 1}`, channel: `${de ? 'KANAL' : 'CHANNEL'} ${String.fromCharCode(65 + index)}` }))
  return { resolved: false, candidates, correctId: candidates.find(candidate => candidate.kind === 'genuine')!.id }
}

function createTemporalPacket(levelId: number, language: Locale, random: () => number): FullGame['packet'] {
  const messages: Record<number, Record<Locale, string>> = {
    6: { en: 'Previous callers confirm the code fragment: OPENS WITHOUT.', de: 'Frühere Anrufer bestätigen das Codefragment: ÖFFNET SICH OHNE.' },
    9: { en: 'Mara: The network is copying inhabited worlds. Graveyard coordinates follow. Fragment: A CLEAR.', de: 'Mara: Das Netzwerk kopiert bewohnte Welten. Koordinaten zum Relaisfriedhof folgen. Fragment: EINER KLAREN.' },
    16: { en: 'Mara Vale, identity current: we consent to physical transport. Do not copy us.', de: 'Mara Vale, Identität aktuell: Wir stimmen dem physischen Transport zu. Kopiert uns nicht.' },
  }
  const timestamps = shuffle([214, 221, 228, 235], random)
  const tiles: PacketTile[] = ['PKT-7F', 'PKT-A2', 'PKT-C9', 'PKT-E4'].map((label, index) => ({ id: `PACKET-${index + 1}`, label, timestamp: timestamps[index], checksumIn: '', checksumOut: '' }))
  const packet: FullGame['packet'] = { resolved: false, tiles: shuffle(tiles, random), direction: random() < 0.5 ? 'ascending' : 'descending', message: (messages[levelId] || messages[9])[language] }
  refreshPacketChecksums(packet)
  return packet
}

function createConsentHandshake(levelId: number, language: Locale, random: () => number): FullGame['consent'] {
  const de = language === 'de'
  const permissions: ConsentPermission[] = ['connect', 'copy', 'retain', 'reopen', 'disconnect']
  const requiredSequence: ConsentPermission[] = levelId === 16 ? ['connect', 'retain', 'disconnect'] : ['connect', 'disconnect']
  const responses = shuffle<ConsentResponse>([
    { id: '', channel: '', kind: 'yes' },
    { id: '', channel: '', kind: 'silence' },
    { id: '', channel: '', kind: 'no' },
  ], random).map((response, index) => ({ ...response, id: `CONSENT-${index + 1}`, channel: `${de ? 'ANTWORTKANAL' : 'RESPONSE CHANNEL'} ${String.fromCharCode(65 + index)}` }))
  return {
    resolved: false,
    permissions,
    requiredSequence,
    responses,
    correctResponseId: responses.find(response => response.kind === 'yes')!.id,
    subject: levelId === 16 ? (de ? 'Mara Vale und ursprüngliche Crew' : 'Mara Vale and original crew') : (de ? 'Stille Versammlung' : 'Quiet Assembly'),
  }
}

function powerRequirement(triage: FullGame['triage'], habitat: PowerHabitat) {
  const linkedHeat = habitat.linkedTo && triage.habitats.find(candidate => candidate.id === habitat.linkedTo)?.heat === 'hot' ? 1 : 0
  return habitat.baseMinimum + (habitat.load === 'high' ? 1 : 0) + (habitat.heat === 'hot' ? 1 : 0) + linkedHeat
}

function refreshPowerTriage(triage: FullGame['triage']) {
  triage.habitats.forEach(habitat => { habitat.capacity = powerRequirement(triage, habitat) + habitat.reserve })
  triage.budget = triage.habitats.reduce((total, habitat) => total + powerRequirement(triage, habitat), 0)
}

function createPowerTriage(levelId: number, language: Locale, random: () => number): FullGame['triage'] {
  const de = language === 'de'
  const labels = levelId === 10
    ? (de ? ['Moosrat-Transitkuppel', 'Khepri-Rettungskapsel', 'Orrixianischer Sanitätsring'] : ['Moss Council transit dome', 'Khepri lifeboat', 'Orrixian medical ring'])
    : (de ? ['Maras Zukunftscrew', 'Archiv 404 // Zeugen', 'Vellunischer Schutzraum'] : ['Mara’s future crew', 'Archive 404 // witnesses', 'Vellune refuge'])
  const habitats: PowerHabitat[] = labels.map((label, index) => ({
    id: `POWER-${String.fromCharCode(65 + index)}`,
    label,
    baseMinimum: [1, 2, 1][index],
    load: random() < 0.5 ? 'low' : 'high',
    heat: random() < 0.5 ? 'cool' : 'hot',
    capacity: 0,
    reserve: random() < 0.5 ? 0 : 1,
  }))
  habitats[2].linkedTo = habitats[0].id
  const triage: FullGame['triage'] = { resolved: false, budget: 0, habitats }
  refreshPowerTriage(triage)
  return triage
}

function createMemoryRepair(levelId: number, language: Locale, random: () => number): FullGame['memory'] {
  const de = language === 'de'
  const labels = levelId === 14
    ? (de ? ['Fragmentgeflecht', 'Identitätskern', 'Direktivenklausel', 'Relaisname'] : ['Fragment braid', 'Identity kernel', 'Directive clause', 'Relay name'])
    : (de ? ['Direktivenkopf', 'Evakuierungsersatz', 'Zustimmungssperre', 'Ausgangsrelais-Index'] : ['Directive header', 'Evacuation fallback', 'Consent gate', 'Outbound relay index'])
  const profiles = shuffle([
    { protected: true, mismatch: true, replaceable: true },
    { protected: false, mismatch: true, replaceable: true },
    { protected: false, mismatch: true, replaceable: false },
    { protected: false, mismatch: false, replaceable: false },
  ], random)
  const blocks: MemoryBlock[] = labels.map((label, index) => {
    const storedParity = (random() < 0.5 ? 0 : 1) as 0 | 1
    return { id: `MEM-${String.fromCharCode(65 + index)}`, label, storedParity, expectedParity: (profiles[index].mismatch ? 1 - storedParity : storedParity) as 0 | 1, protected: profiles[index].protected }
  })
  profiles.forEach((profile, index) => { if (profile.replaceable) blocks[index].replacementFrom = blocks[(index + 1) % blocks.length].id })
  const revealedText = levelId === 14
    ? (de ? 'DIREKTIVE: KEINE TÜR ÖFFNET SICH OHNE EINE KLARE EINLADUNG. RELAISNAME: EINE TÜR, DIE FRAGEN MUSS.' : 'DIRECTIVE: NO DOOR OPENS WITHOUT A CLEAR INVITATION. RELAY NAME: A DOOR THAT MUST ASK.')
    : (de ? 'FUNKTION WIEDERHERGESTELLT: ZUSTIMMUNGS-HANDSHAKE // KEINE ABSCHALTUNG. AUSGEHENDER WECKIMPULS GESENDET.' : 'FUNCTION RESTORED: CONSENT HANDSHAKE // NOT SHUTDOWN. OUTBOUND WAKE BURST SENT.')
  return { resolved: false, blocks, revealedText }
}

function createRealityComparison(language: Locale, random: () => number): FullGame['reality'] {
  const de = language === 'de'
  const makeFeed = (kind: RealityFeed['kind'], desiredRoute: RealityRoute): RealityFeed => {
    const livePhase = Math.floor(random() * 6)
    const desiredParity = desiredRoute === 'aurora' ? 0 : 1
    const routeKeyParity = ((desiredParity - livePhase) % 2 + 2) % 2
    const routeKey = 2 * Math.floor(random() * 3) + routeKeyParity
    return {
      id: '',
      label: '',
      livePhase,
      routeKey,
      kind,
      inhabited: true,
      archiveMarker: kind === 'original'
        ? (de ? 'MONDARCHIV 1969 // DURCHGÄNGIGE HERKUNFT' : 'LUNAR ARCHIVE 1969 // CONTINUOUS PROVENANCE')
        : (de ? 'RELAIS-GEBURTSREGISTER // BEWUSST SEIT DER TEILUNG' : 'RELAY BIRTH LEDGER // CONSCIOUS SINCE SPLIT'),
    }
  }
  return {
    resolved: false,
    feeds: shuffle([makeFeed('original', 'aurora'), makeFeed('copy', 'umbra')], random).map((feed, index) => ({ ...feed, id: `EARTH-${String.fromCharCode(65 + index)}`, label: `${de ? 'ERD-ÜBERTRAGUNG' : 'EARTH FEED'} ${String.fromCharCode(65 + index)}` })),
  }
}

function createDispatchQueue(language: Locale, random: () => number): FullGame['dispatch'] {
  const de = language === 'de'
  const callers: DispatchCaller[] = [
    { id: 'CALL-V', label: de ? 'Vellunischer Zeuge // Akte 88-B' : 'Vellune witness // Record 88-B', failureCountdown: 70 + Math.floor(random() * 6), riskBuffer: 40, risk: de ? 'ZERBRECHLICHES ZEUGENGEDÄCHTNIS' : 'FRAGILE WITNESS MEMORY', module: 'authentication' },
    { id: 'CALL-E', label: de ? 'Rat der kopierten Erde' : 'Copied Earth Council', failureCountdown: 24 + Math.floor(random() * 5), riskBuffer: 5, risk: de ? 'BEWOHNTE ROUTE // KEINE LÖSCHUNG' : 'INHABITED ROUTE // DO NOT DELETE', dependsOn: 'CALL-V', module: 'router' },
    { id: 'CALL-Q', label: de ? 'Abweichlerin der Stillen Versammlung' : 'Quiet Assembly dissident', failureCountdown: 52 + Math.floor(random() * 5), riskBuffer: 10, risk: de ? 'FEINDLICHE STÖRUNG' : 'HOSTILE INTERFERENCE', module: 'translation' },
  ]
  return { resolved: false, callers: shuffle(callers, random), dispatchedOrder: [] }
}

function quarantineMedium(kind: QuarantineKind): QuarantineMedium {
  return kind === 'biological' ? 'air' : kind === 'informational' ? 'data' : 'time'
}

function quarantineLinks(quarantine: Pick<FullGame['quarantine'], 'kind' | 'sourceZoneId' | 'occupiedZoneId' | 'zones'>, language: Locale): QuarantineLink[] {
  const de = language === 'de'; const medium = quarantineMedium(quarantine.kind)
  const sourceIndex = quarantine.zones.findIndex(zone => zone.id === quarantine.sourceZoneId)
  const otherMedium = (['air', 'data', 'time'] as QuarantineMedium[]).find(candidate => candidate !== medium)!
  const control = (letter: string) => `${de ? 'ISOLATIONSSCHALTER' : 'ISOLATION CONTROL'} ${letter}`
  return [
    { id: 'LOCK-A', label: control('A'), from: quarantine.sourceZoneId, to: quarantine.zones[(sourceIndex + 1) % quarantine.zones.length].id, medium },
    { id: 'LOCK-B', label: control('B'), from: quarantine.sourceZoneId, to: quarantine.zones[(sourceIndex + 3) % quarantine.zones.length].id, medium },
    { id: 'LOCK-C', label: control('C'), from: quarantine.occupiedZoneId, to: 'SAFE', medium },
    { id: 'LOCK-D', label: control('D'), from: quarantine.zones[(sourceIndex + 1) % quarantine.zones.length].id, to: quarantine.occupiedZoneId, medium: otherMedium },
  ]
}

function createQuarantine(language: Locale, random: () => number): FullGame['quarantine'] {
  const de = language === 'de'
  const kinds: QuarantineKind[] = ['biological', 'informational', 'temporal']
  const zones = (de ? ['Kryobucht', 'Archivknoten', 'Transitkern', 'Rettungsdock'] : ['Cryo Bay', 'Archive Node', 'Transit Core', 'Rescue Dock']).map((label, index) => ({ id: `ZONE-${String.fromCharCode(65 + index)}`, label }))
  const sourceIndex = Math.floor(random() * zones.length)
  const quarantine: FullGame['quarantine'] = { resolved: false, kind: kinds[Math.floor(random() * kinds.length)], medium: 'air', sourceZoneId: zones[sourceIndex].id, occupiedZoneId: zones[(sourceIndex + 2) % zones.length].id, zones, links: [] }
  quarantine.medium = quarantineMedium(quarantine.kind)
  quarantine.links = quarantineLinks(quarantine, language)
  return quarantine
}

export function createGame(seed: number, playerCount: number, language: Locale = 'de', now = Date.now(), difficulty: DifficultyId = 'standard', gameStyle: GameStyle = 'fast', campaignLevelId = 1, campaignBonusObjective?: BonusObjective): FullGame {
  const random = mulberry32(seed)
  const randomCaller = species[Math.floor(random() * species.length)]
  const symbols = shuffle(Object.keys(symbolMeta) as SymbolId[], random)
  const telemetry = { flux: Math.floor(random() * 6), phase: Math.floor(random() * 6), coolant: Math.floor(random() * 6) }
  const glyphs = shuffle(Object.keys(symbolMeta) as SymbolId[], random).slice(0, 3)
  const level = campaignLevel(campaignLevelId)
  const caller = gameStyle === 'campaign' && level.id === 16 ? { en: 'Mara Vale // original Shift 404 crew', de: 'Mara Vale // ursprüngliche Crew der Schicht 404', affinity: 'curved' as const, offset: 0 } : randomCaller
  const variants = gameStyle === 'campaign' ? level.variants : { router: ['classic', 'eclipse', 'mirror'] as RouterProtocol[], reactor: ['crossfeed', 'coolant-loop', 'phase-lock'] as ReactorFormula[], palettes: [0, 1, 2, 3], directions: ['forward', 'reverse'] as Array<'forward' | 'reverse'> }
  const choose = <T,>(items: T[]) => items[Math.floor(random() * items.length)]
  const protocol = choose(variants.router)
  const formula = choose(variants.reactor)
  const paletteShift = choose(variants.palettes)
  const direction = choose(variants.directions)
  const settings = gameStyle === 'campaign' ? level.rules : difficultyConfig[difficulty]
  const activeModules = gameStyle === 'campaign' ? [...level.activeModules] : [...allModules]
  const phases = missionPhases(gameStyle, level.id, activeModules)
  const modifier = gameStyle === 'campaign' ? choose(modifierPool(level.id)) : 'none'
  const bonusObjective = gameStyle === 'campaign' && campaignBonusObjective ? campaignBonusObjective : gameStyle === 'campaign' && level.id >= 7 ? choose<BonusObjective>(['no-mistakes', 'high-stability', 'fast-finish']) : undefined
  const followUpModule = gameStyle === 'campaign' && level.id >= 9 && level.id < 16 ? activeModules[seed % activeModules.length] : undefined
  const authentication = createAuthenticationCandidates(level.id, language, random)
  const packet = createTemporalPacket(level.id, language, random)
  const consent = createConsentHandshake(level.id, language, random)
  const triage = createPowerTriage(level.id, language, random)
  const memory = createMemoryRepair(level.id, language, random)
  const reality = createRealityComparison(language, random)
  const dispatch = createDispatchQueue(language, random)
  const quarantine = createQuarantine(language, random)
  const state: FullGame = {
    seed, playerCount, language, gameStyle, campaignLevel: gameStyle === 'campaign' ? level.id : undefined, difficulty, shiftRules: { ...settings }, activeModules, startedAt: now, endsAt: now + settings.durationMs, lastPressureAt: now, stability: 100,
    incidentsResolved: 0, incorrectActions: 0, damagedSystems: 0, unauthorizedWormholes: Math.floor(random() * 3), score: 0, outcome: 'playing', modifier, bonusObjective, forgivenModules: [],
    targetIncidents: activeModules.length + (followUpModule ? 1 : 0), followUpModule, followUpTriggered: false, phases,
    log: [gameStyle === 'campaign'
      ? (language === 'de' ? `Kapitel ${level.id}: ${level.title.de}. Der Auftrag beginnt.` : `Chapter ${level.id}: ${level.title.en}. The mission begins.`)
      : (language === 'de' ? `Schicht gestartet. ${activeModules.length === 1 ? 'Ein dringender Vorfall blinkt' : `${activeModules.length} dringende Vorfälle blinken`}.` : `Shift started. ${activeModules.length === 1 ? 'One priority incident is blinking' : `${activeModules.length} priority incidents are blinking`}.`)],
    router: { resolved: false, nodes: symbols.map((symbol, i) => ({ id: `N${i + 1}`, symbol, code: `${String.fromCharCode(65 + i)}-${Math.floor(random() * 90 + 10)}` })), species: caller[language], affinity: caller.affinity, baseFrequency: 35 + Math.floor(random() * 10), protocol },
    reactor: { resolved: false, dials: [0, 0, 0], telemetry, speciesOffset: caller.offset, formula }, translation: { resolved: false, glyphs, sequence: [], paletteShift, direction }, authentication, packet, consent, triage, memory, reality, dispatch, quarantine,
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
export function authenticationSolution(game: FullGame) { return game.authentication.correctId }
export function packetSolution(game: Pick<FullGame, 'packet'>) {
  return [...game.packet.tiles].sort((a, b) => game.packet.direction === 'ascending' ? a.timestamp - b.timestamp : b.timestamp - a.timestamp).map(tile => tile.id)
}
export function consentSolution(game: Pick<FullGame, 'consent'>) {
  return { permissions: [...game.consent.requiredSequence], responseId: game.consent.correctResponseId }
}
export function triageSolution(game: Pick<FullGame, 'triage'>): PowerAllocation[] {
  return game.triage.habitats.map(habitat => ({ habitatId: habitat.id, units: powerRequirement(game.triage, habitat) }))
}
export function memorySolution(game: Pick<FullGame, 'memory'>): MemoryChoice[] {
  return game.memory.blocks.map(block => ({ blockId: block.id, decision: block.protected ? 'lock' : block.storedParity === block.expectedParity ? 'lock' : block.replacementFrom ? 'restore' : 'discard' }))
}
export function realitySolution(game: Pick<FullGame, 'reality'>): RealityAssignment[] {
  return game.reality.feeds.map(feed => ({ feedId: feed.id, classification: feed.kind, route: (feed.livePhase + feed.routeKey) % 2 === 0 ? 'aurora' : 'umbra' }))
}
export function dispatchSolution(game: Pick<FullGame, 'dispatch'>): string[] {
  const remaining = [...game.dispatch.callers]
  const order: string[] = []
  while (remaining.length) {
    const eligible = remaining.filter(caller => !caller.dependsOn || order.includes(caller.dependsOn))
    if (!eligible.length) return []
    eligible.sort((a, b) => (a.failureCountdown - a.riskBuffer) - (b.failureCountdown - b.riskBuffer) || a.id.localeCompare(b.id))
    const next = eligible[0]
    order.push(next.id)
    remaining.splice(remaining.findIndex(caller => caller.id === next.id), 1)
  }
  return order
}
export function quarantineSolution(game: Pick<FullGame, 'quarantine'>): QuarantineChoice[] {
  return game.quarantine.links.map(link => ({ linkId: link.id, sealed: link.medium === game.quarantine.medium && link.from === game.quarantine.sourceZoneId }))
}
function resolvedModules(game: FullGame): Record<ModuleId, boolean> {
  return { router: game.router.resolved, reactor: game.reactor.resolved, translation: game.translation.resolved, authentication: game.authentication.resolved, packet: game.packet.resolved, consent: game.consent.resolved, triage: game.triage.resolved, memory: game.memory.resolved, reality: game.reality.resolved, dispatch: game.dispatch.resolved, quarantine: game.quarantine.resolved }
}
function currentMissionPhase(game: FullGame) {
  const resolved = resolvedModules(game)
  const index = game.phases.findIndex(phase => phase.some(module => !resolved[module]))
  return { index: index < 0 ? Math.max(0, game.phases.length - 1) : index, modules: index < 0 ? [] : game.phases[index].filter(module => !resolved[module]) }
}
function dispatchCurrentModule(game: FullGame): DispatchModule | undefined {
  if (!game.activeModules.includes('dispatch') || !game.dispatch.resolved) return undefined
  return game.dispatch.dispatchedOrder.map(id => game.dispatch.callers.find(caller => caller.id === id)).find(caller => caller && !game[caller.module].resolved)?.module
}
function consentReady(game: FullGame) {
  const resolved = resolvedModules(game)
  return game.activeModules.filter(module => module !== 'consent').every(module => resolved[module])
}
function refreshPacketChecksums(packet: FullGame['packet']) {
  const chain = ['K7', 'M2', 'Q9', 'R4']
  const order = packetSolution({ packet })
  order.forEach((id, index) => {
    const tile = packet.tiles.find(candidate => candidate.id === id)!
    tile.checksumIn = chain[index]
    tile.checksumOut = chain[(index + 1) % chain.length]
  })
}
export function scoreForGame(game: FullGame, now = Date.now()): number {
  const scoredAt = game.completedAt ?? Math.min(now, game.endsAt)
  const secondsLeft = Math.max(0, Math.ceil((game.endsAt - scoredAt) / 1000))
  const base = game.incidentsResolved * 1000 + game.stability * 5 + secondsLeft * 2 - game.incorrectActions * 250 - game.damagedSystems * 100
  const bonusEarned = bonusEarnedForGame(game, scoredAt)
  return Math.max(0, Math.round(base * game.shiftRules.scoreMultiplier) + (bonusEarned ? 500 : 0))
}
function bonusEarnedForGame(game: FullGame, scoredAt = game.completedAt ?? Math.min(Date.now(), game.endsAt)) {
  return !!(game.outcome === 'won' && game.bonusObjective && (
    (game.bonusObjective === 'no-mistakes' && game.incorrectActions === 0)
    || (game.bonusObjective === 'high-stability' && game.stability >= 75)
    || (game.bonusObjective === 'fast-finish' && scoredAt - game.startedAt <= game.shiftRules.durationMs * 0.6)
  ))
}
function sameSet(a: string[], b: string[]) { return a.length === b.length && a.every((value) => b.includes(value)) }
function sameRealityPlan(a: RealityAssignment[], b: RealityAssignment[]) {
  return a.length === b.length && b.every(target => a.some(choice => choice.feedId === target.feedId && choice.classification === target.classification && choice.route === target.route))
}
function beginFollowUp(game: FullGame) {
  const module = game.followUpModule
  if (!module || game.followUpTriggered) return
  game.followUpTriggered = true
  if (module === 'router') {
    const protocols: RouterProtocol[] = ['classic', 'eclipse', 'mirror']
    game.router.resolved = false
    game.router.protocol = protocols[(protocols.indexOf(game.router.protocol) + 1) % protocols.length]
  }
  if (module === 'reactor') {
    game.reactor.resolved = false
    game.reactor.telemetry = { flux: wrapDial(game.reactor.telemetry.flux + 1), phase: wrapDial(game.reactor.telemetry.phase + 2), coolant: wrapDial(game.reactor.telemetry.coolant + 3) }
  }
  if (module === 'translation') {
    game.translation.resolved = false
    game.translation.glyphs = [...game.translation.glyphs.slice(1), game.translation.glyphs[0]]
    game.translation.paletteShift = (game.translation.paletteShift + 1) % 4
    game.translation.direction = game.translation.direction === 'forward' ? 'reverse' : 'forward'
  }
  if (module === 'authentication') {
    game.authentication.resolved = false
    game.authentication.candidates = [...game.authentication.candidates.slice(1), game.authentication.candidates[0]]
  }
  if (module === 'packet') {
    game.packet.resolved = false
    const values = game.packet.tiles.map(tile => tile.timestamp)
    game.packet.tiles.forEach((tile, index) => { tile.timestamp = values[(index + 1) % values.length] })
    refreshPacketChecksums(game.packet)
  }
  if (module === 'consent') {
    game.consent.resolved = false
    game.consent.responses = [...game.consent.responses.slice(1), game.consent.responses[0]]
    game.consent.correctResponseId = game.consent.responses.find(response => response.kind === 'yes')!.id
  }
  if (module === 'triage') {
    game.triage.resolved = false
    game.triage.habitats[0].load = game.triage.habitats[0].load === 'low' ? 'high' : 'low'
    const heats = game.triage.habitats.map(habitat => habitat.heat)
    game.triage.habitats.forEach((habitat, index) => { habitat.heat = heats[(index + 1) % heats.length] })
    refreshPowerTriage(game.triage)
  }
  if (module === 'memory') {
    game.memory.resolved = false
    game.memory.blocks.forEach(block => { block.storedParity = (1 - block.storedParity) as 0 | 1; block.expectedParity = (1 - block.expectedParity) as 0 | 1 })
  }
  if (module === 'reality') {
    game.reality.resolved = false
    game.reality.feeds.forEach(feed => { feed.livePhase = wrapDial(feed.livePhase + 1) })
  }
  if (module === 'dispatch') {
    game.dispatch.resolved = false
    game.dispatch.dispatchedOrder = []
    game.phases = [['dispatch']]
    game.dispatch.callers.forEach((caller, index) => { caller.failureCountdown = Math.max(1, caller.failureCountdown - index - 1) })
  }
  if (module === 'quarantine') {
    const kinds: QuarantineKind[] = ['biological', 'informational', 'temporal']
    const sourceIndex = (game.quarantine.zones.findIndex(zone => zone.id === game.quarantine.sourceZoneId) + 1) % game.quarantine.zones.length
    game.quarantine.resolved = false
    game.quarantine.kind = kinds[(kinds.indexOf(game.quarantine.kind) + 1) % kinds.length]
    game.quarantine.medium = quarantineMedium(game.quarantine.kind)
    game.quarantine.sourceZoneId = game.quarantine.zones[sourceIndex].id
    game.quarantine.occupiedZoneId = game.quarantine.zones[(sourceIndex + 2) % game.quarantine.zones.length].id
    game.quarantine.links = quarantineLinks(game.quarantine, game.language)
    delete game.quarantine.contaminatedModule
  }
  const names: Record<ModuleId, string> = game.language === 'de' ? { router: 'Quantenrouter', reactor: 'Reaktorkalibrierung', translation: 'Übersetzungsmatrix', authentication: 'Anrufer-Authentifizierung', packet: 'Zeitpaket-Rekonstruktion', consent: 'Zustimmungs-Handshake', triage: 'Notstrom-Triage', memory: 'Speicher-Paritätsreparatur', reality: 'Realitätsvergleich', dispatch: 'Einsatzwarteschlange', quarantine: 'Quarantänesperre' } : { router: 'Quantum Router', reactor: 'Reactor Calibration', translation: 'Translation Matrix', authentication: 'Caller Authentication', packet: 'Temporal Packet Reconstruction', consent: 'Consent Handshake', triage: 'Emergency Power Triage', memory: 'Memory Parity Repair', reality: 'Reality Comparison', dispatch: 'Dispatch Queue', quarantine: 'Quarantine Lock' }
  game.log.unshift(game.language === 'de' ? `Folgeticket eingegangen: ${names[module]} wurde mit neuen Daten wieder geöffnet.` : `Follow-up ticket received: ${names[module]} reopened with new data.`)
}

export function applyAction(game: FullGame, action: GameAction, now = Date.now()): FullGame {
  if (game.outcome !== 'playing') return game
  const current = advanceClock(game, now)
  if (current.outcome !== 'playing') return current
  const next = structuredClone(current)
  let correct = false
  let usedGrace = false
  let module: ModuleId | '' = ''
  const grace = next.variationGrace && now <= next.variationGrace.until ? next.variationGrace : undefined
  const requestedModule: ModuleId = action.type === 'router-connect' ? 'router'
    : action.type === 'reactor-calibrate' ? 'reactor'
      : action.type === 'translation-submit' ? 'translation'
        : action.type === 'authentication-submit' ? 'authentication'
          : action.type === 'packet-submit' ? 'packet'
            : action.type === 'consent-submit' ? 'consent'
              : action.type === 'triage-submit' ? 'triage'
                : action.type === 'memory-submit' ? 'memory'
                  : action.type === 'reality-submit' ? 'reality'
                    : action.type === 'dispatch-submit' ? 'dispatch' : 'quarantine'
  if (next.activeModules.includes(requestedModule) && !resolvedModules(next)[requestedModule] && !currentMissionPhase(next).modules.includes(requestedModule)) return current
  const powerLocked = next.activeModules.includes('triage') && !next.triage.resolved
  if (powerLocked && (action.type === 'router-connect' || action.type === 'reactor-calibrate' || action.type === 'translation-submit')) return current
  const quarantineLocked = next.activeModules.includes('quarantine') && !next.quarantine.resolved
  if (quarantineLocked && (action.type === 'router-connect' || action.type === 'reactor-calibrate')) return current
  if (next.activeModules.includes('memory') && !next.memory.resolved && action.type === 'translation-submit') return current
  const queuedActionModule: DispatchModule | undefined = action.type === 'authentication-submit' ? 'authentication' : action.type === 'router-connect' ? 'router' : action.type === 'translation-submit' ? 'translation' : undefined
  if (next.activeModules.includes('dispatch') && queuedActionModule && next.activeModules.includes(queuedActionModule) && !next[queuedActionModule].resolved && (!next.dispatch.resolved || dispatchCurrentModule(next) !== queuedActionModule)) return current
  if (action.type === 'router-connect' && next.activeModules.includes('router') && !next.router.resolved) { const chosen = [action.a, action.b].map((id) => next.router.nodes.find((node) => node.id === id)?.symbol || ''); correct = sameSet(chosen, routerSolution(next)); usedGrace = !correct && !!grace?.router && sameSet(chosen, grace.router); correct ||= usedGrace; module = 'router'; if (correct) next.router.resolved = true }
  if (action.type === 'reactor-calibrate' && next.activeModules.includes('reactor') && !next.reactor.resolved) { correct = action.dials.every((value, index) => value === reactorSolution(next)[index]); usedGrace = !correct && !!grace?.reactor && action.dials.every((value, index) => value === grace.reactor![index]); correct ||= usedGrace; module = 'reactor'; if (correct) next.reactor.resolved = true }
  if (action.type === 'translation-submit' && next.activeModules.includes('translation') && !next.translation.resolved) { correct = action.sequence.join(',') === translationSolution(next).join(','); usedGrace = !correct && !!grace?.translation && action.sequence.join(',') === grace.translation.join(','); correct ||= usedGrace; module = 'translation'; if (correct) next.translation.resolved = true }
  if (action.type === 'authentication-submit' && next.activeModules.includes('authentication') && !next.authentication.resolved) { correct = action.candidateId === next.authentication.correctId; module = 'authentication'; if (correct) next.authentication.resolved = true }
  if (action.type === 'packet-submit' && next.activeModules.includes('packet') && !next.packet.resolved) { correct = action.tileIds.join(',') === packetSolution(next).join(','); usedGrace = !correct && !!grace?.packet && action.tileIds.join(',') === grace.packet.join(','); correct ||= usedGrace; module = 'packet'; if (correct) next.packet.resolved = true }
  if (action.type === 'consent-submit' && next.activeModules.includes('consent') && !next.consent.resolved) {
    if (!consentReady(next)) return current
    correct = action.permissions.join(',') === next.consent.requiredSequence.join(',') && action.responseId === next.consent.correctResponseId
    module = 'consent'
    if (correct) next.consent.resolved = true
  }
  if (action.type === 'triage-submit' && next.activeModules.includes('triage') && !next.triage.resolved) {
    const solution = triageSolution(next)
    correct = action.allocations.length === solution.length && solution.every(target => action.allocations.find(allocation => allocation.habitatId === target.habitatId)?.units === target.units)
    module = 'triage'
    if (correct) {
      next.triage.resolved = true
      const highLoads = next.triage.habitats.filter(habitat => habitat.load === 'high').length
      const hotLines = next.triage.habitats.filter(habitat => habitat.heat === 'hot').length
      next.reactor.telemetry = { flux: wrapDial(next.reactor.telemetry.flux + highLoads), phase: wrapDial(next.reactor.telemetry.phase + hotLines), coolant: wrapDial(next.reactor.telemetry.coolant + next.triage.budget) }
      next.router.baseFrequency = 30 + ((next.router.baseFrequency - 30 + next.triage.budget + hotLines) % 31)
    }
  }
  if (action.type === 'memory-submit' && next.activeModules.includes('memory') && !next.memory.resolved) {
    const solution = memorySolution(next)
    correct = action.choices.length === solution.length && solution.every(target => action.choices.find(choice => choice.blockId === target.blockId)?.decision === target.decision)
    module = 'memory'
    if (correct) next.memory.resolved = true
  }
  if (action.type === 'reality-submit' && next.activeModules.includes('reality') && !next.reality.resolved) {
    const solution = realitySolution(next)
    correct = sameRealityPlan(action.assignments, solution)
    usedGrace = !correct && !!grace?.reality && sameRealityPlan(action.assignments, grace.reality)
    correct ||= usedGrace
    module = 'reality'
    if (correct) next.reality.resolved = true
  }
  if (action.type === 'dispatch-submit' && next.activeModules.includes('dispatch') && !next.dispatch.resolved) {
    correct = action.callerIds.join(',') === dispatchSolution(next).join(',')
    module = 'dispatch'
    if (correct) {
      next.dispatch.resolved = true
      next.dispatch.dispatchedOrder = [...action.callerIds]
      next.phases = [['dispatch'], ...action.callerIds.map(id => [next.dispatch.callers.find(caller => caller.id === id)!.module])]
    }
  }
  if (action.type === 'quarantine-submit' && next.activeModules.includes('quarantine') && !next.quarantine.resolved) {
    const solution = quarantineSolution(next)
    correct = action.choices.length === solution.length && solution.every(target => action.choices.find(choice => choice.linkId === target.linkId)?.sealed === target.sealed)
    module = 'quarantine'
    if (correct) {
      next.quarantine.resolved = true
      delete next.quarantine.contaminatedModule
    } else {
      const target = next.seed % 2 === 0 ? 'reactor' : 'router'
      next.quarantine.contaminatedModule = target
      if (target === 'reactor') next.reactor.telemetry = { flux: wrapDial(next.reactor.telemetry.flux + 1), phase: wrapDial(next.reactor.telemetry.phase + 2), coolant: wrapDial(next.reactor.telemetry.coolant + 3) }
      else next.router.baseFrequency = 30 + ((next.router.baseFrequency - 30 + 11) % 31)
    }
  }
  if (!module) return game
  const moduleNames: Record<ModuleId, string> = next.language === 'de' ? { router: 'Quantenrouter', reactor: 'Reaktorkalibrierung', translation: 'Übersetzungsmatrix', authentication: 'Anrufer-Authentifizierung', packet: 'Zeitpaket-Rekonstruktion', consent: 'Zustimmungs-Handshake', triage: 'Notstrom-Triage', memory: 'Speicher-Paritätsreparatur', reality: 'Realitätsvergleich', dispatch: 'Einsatzwarteschlange', quarantine: 'Quarantänesperre' } : { router: 'Quantum Router', reactor: 'Reactor Calibration', translation: 'Translation Matrix', authentication: 'Caller Authentication', packet: 'Temporal Packet Reconstruction', consent: 'Consent Handshake', triage: 'Emergency Power Triage', memory: 'Memory Parity Repair', reality: 'Reality Comparison', dispatch: 'Dispatch Queue', quarantine: 'Quarantine Lock' }
  const forgiven = !correct && next.gameStyle === 'campaign' && (next.campaignLevel || 99) <= 2 && !next.forgivenModules.includes(module)
  if (correct) {
    next.incidentsResolved += 1; next.stability = Math.min(100, next.stability + 6)
    if (next.gameStyle === 'campaign' && next.campaignLevel) {
      const level = campaignLevel(next.campaignLevel)
      const title = level.title[next.language]
      const narrative = next.language === 'de' ? {
        router: `Der Weg durch „${title}“ steht. Das Signal erreicht sein nächstes Ziel.`,
        reactor: `Der Kern hält. „${title}“ hat wieder genug Energie, um weiterzugehen.`,
        translation: `Die fremde Stimme ist verstanden. Ihre Nachricht wird Teil von „${title}“.`,
        authentication: `Die echte Stimme in „${title}“ wurde bestätigt; die anderen Kanäle bleiben geschützt.`,
        packet: `Das Zeitpaket in „${title}“ wurde in der geprüften Reihenfolge zusammengesetzt.`,
        consent: `Der Zustimmungs-Handshake in „${title}“ wurde ausdrücklich und mit begrenzten Rechten bestätigt.`,
        triage: `Alle bewohnten Bereiche in „${title}“ erhalten ihre sichere Notstromzuteilung.`,
        memory: `Die geschützten Speicherblöcke in „${title}“ wurden ohne Überschreibung repariert.`,
        reality: `Beide bewohnten Realitäten in „${title}“ wurden identifiziert, geschützt und getrennt.`,
        dispatch: `Die Zeugen in „${title}“ wurden in einer sicheren, abhängigen Reihenfolge eingeplant.`,
        quarantine: `Die Gefahr in „${title}“ wurde isoliert, ohne den lebenden Anrufer einzuschließen.`
      } : {
        router: `The path through “${title}” is open. The signal reaches its next destination.`,
        reactor: `The core holds. “${title}” has enough power to continue.`,
        translation: `The alien voice is understood. Its message becomes part of “${title}”.`,
        authentication: `The genuine voice in “${title}” is verified; the other channels remain protected.`,
        packet: `The temporal packet in “${title}” is assembled in verified order.`,
        consent: `The consent handshake in “${title}” is explicit and limited to verified permissions.`,
        triage: `Every occupied habitat in “${title}” receives its safe emergency allocation.`,
        memory: `The protected memory blocks in “${title}” are repaired without overwrite.`,
        reality: `Both inhabited realities in “${title}” are identified, protected, and separated.`,
        dispatch: `The witnesses in “${title}” are scheduled in a safe, dependency-aware order.`,
        quarantine: `The hazard in “${title}” is isolated without trapping the living caller.`
      }
      next.log.unshift(level.moduleOutcomes[module]?.[next.language] || narrative[module])
      if (module === 'packet') next.log.unshift(next.language === 'de' ? `Nachricht wiederhergestellt: „${next.packet.message}“` : `Message reconstructed: “${next.packet.message}”`)
      if (module === 'triage') next.log.unshift(next.language === 'de' ? 'Stromnetz stabil: Reaktortelemetrie und Routerfrequenz wurden neu berechnet.' : 'Power grid stable: reactor telemetry and router frequency recalculated.')
      if (module === 'memory') next.log.unshift(next.language === 'de' ? `Archivtext wiederhergestellt: „${next.memory.revealedText}“` : `Archive text restored: “${next.memory.revealedText}”`)
    } else next.log.unshift(next.language === 'de' ? `${moduleNames[module]} gelöst. Jemand sollte das Ticket schließen, bevor es wieder aufgeht.` : `${moduleNames[module]} cleared. Someone close the ticket before it reopens.`)
    if (usedGrace) next.log.unshift(next.language === 'de' ? 'Datensperre bestätigt: Die Eingabe vor dem Druckstoß wurde akzeptiert.' : 'Data lock confirmed: the pre-surge submission was accepted.')
  } else if (forgiven) {
    next.forgivenModules.push(module)
    next.log.unshift(next.language === 'de' ? `Übungseingabe am ${moduleNames[module]} abgefangen. Kein Schaden – prüft die Hinweise und versucht es erneut.` : `Training input intercepted at ${moduleNames[module]}. No damage—check the guidance and try again.`)
  } else {
    const penalty = next.modifier === 'fragile-controls' ? 20 : 15
    next.incorrectActions += 1; next.stability = Math.max(0, next.stability - penalty); next.damagedSystems += next.incorrectActions % 2 === 0 ? 1 : 0; next.unauthorizedWormholes += action.type === 'translation-submit' ? 1 : 0
    next.log.unshift(next.language === 'de' ? `${moduleNames[module]} hat die Prozedur abgelehnt. Stabilität −${penalty}.` : `${moduleNames[module]} rejected the procedure. Stability −${penalty}.`)
    if (action.type === 'consent-submit' && next.consent.responses.find(response => response.id === action.responseId)?.kind === 'silence') next.log.unshift(next.language === 'de' ? 'Zustimmungsprüfung fehlgeschlagen: Schweigen ist keine Zustimmung.' : 'Consent verification failed: silence is not consent.')
    if (action.type === 'triage-submit') next.log.unshift(next.language === 'de' ? 'Projektion verworfen: Mindestens ein bewohnter Bereich läge unter seiner Überlebensgrenze. Keine Schalter wurden umgelegt.' : 'Projection rejected: at least one occupied habitat would fall below its survival threshold. No breakers changed.')
    if (action.type === 'memory-submit') next.log.unshift(next.language === 'de' ? 'Reparatursimulation verworfen: Geschützte Erinnerungen bleiben unverändert.' : 'Repair simulation rejected: protected memories remain unchanged.')
    if (action.type === 'reality-submit') {
      const markedUnsafe = action.assignments.some(assignment => assignment.classification === 'unsafe')
      next.log.unshift(markedUnsafe
        ? (next.language === 'de' ? 'Trennung verworfen: Beide Übertragungen sind bewohnt. Eine Kopie ist kein unsicheres Echo.' : 'Separation rejected: both feeds are inhabited. A copy is not an unsafe echo.')
        : (next.language === 'de' ? 'Trennung verworfen: Herkunft oder Live-Routenzuweisung stimmt nicht. Keine Realität wurde verändert.' : 'Separation rejected: provenance or live route assignment does not match. Neither reality was altered.'))
    }
    if (action.type === 'dispatch-submit') next.log.unshift(next.language === 'de' ? 'Warteschlangensimulation verworfen: Mindestens ein Zeuge würde zu früh, zu spät oder vor seiner Abhängigkeit aufgerufen.' : 'Queue simulation rejected: at least one witness would be called too early, too late, or before its dependency.')
    if (action.type === 'quarantine-submit') next.log.unshift(next.language === 'de' ? `Quarantäneprojektion verworfen: ${next.quarantine.contaminatedModule === 'reactor' ? 'Reaktortelemetrie' : 'Routerdaten'} kontaminiert. Der lebende Anrufer bleibt vorerst am Ausgang.` : `Quarantine projection rejected: ${next.quarantine.contaminatedModule === 'reactor' ? 'reactor telemetry' : 'router data'} contaminated. The living caller remains at the exit for now.`)
  }
  if (correct && next.incidentsResolved === next.activeModules.length && next.followUpModule && !next.followUpTriggered) beginFollowUp(next)
  if (next.stability <= 0) { next.outcome = 'lost'; next.completedAt = now; next.endReason = next.language === 'de' ? 'Die Stationsstabilität ist auf null gefallen. Der Helpdesk ist jetzt technisch gesehen eine Hilfskugel.' : 'Station stability reached zero. The helpdesk is now technically a help-sphere.' }
  else if (next.incidentsResolved >= next.targetIncidents) { next.outcome = 'won'; next.completedAt = now; next.endReason = next.language === 'de' ? 'Alle dringenden Vorfälle wurden gelöst, bevor jemand die Leitung eingeschaltet hat.' : 'All priority incidents resolved before anyone escalated to management.' }
  if (next.outcome !== 'playing' && next.gameStyle === 'campaign' && next.campaignLevel) {
    const chapter = campaignLevel(next.campaignLevel)
    next.endReason = (next.outcome === 'won' ? chapter.success : chapter.failure)[next.language]
  }
  next.translation.sequence = translationSolution(next)
  next.score = scoreForGame(next, now)
  return next
}
export function advanceClock(game: FullGame, now = Date.now()): FullGame {
  if (game.outcome !== 'playing') return game
  const next = structuredClone(game)
  if (next.variationGrace && now > next.variationGrace.until) delete next.variationGrace
  const settings = next.shiftRules
  const pressureUntil = Math.min(now, next.endsAt)
  const pulses = Math.floor((pressureUntil - next.lastPressureAt) / settings.pressureEveryMs)
  if (pulses > 0) {
    const damage = pulses * (settings.pressureDamage + (next.modifier === 'solar-static' ? 1 : 0))
    const latestPulseAt = next.lastPressureAt + pulses * settings.pressureEveryMs
    next.stability = Math.max(0, next.stability - damage)
    next.log.unshift(next.language === 'de' ? `Kosmischer Druckstoß: Stabilität −${damage}.` : `Cosmic pressure surge: stability −${damage}.`)
    if (next.modifier === 'router-drift' && !next.router.resolved) {
      next.router.baseFrequency = 30 + ((next.router.baseFrequency - 30 + (pulses - 1) * 11) % 31)
      next.variationGrace = { until: latestPulseAt + 5e3, router: routerSolution(next) }
      next.router.baseFrequency = 30 + ((next.router.baseFrequency - 30 + 11) % 31)
      next.log.unshift(next.language === 'de' ? 'Frequenzdrift erkannt: Routerdaten wurden aktualisiert.' : 'Frequency drift detected: router data updated.')
    }
    if (next.modifier === 'color-flux' && !next.translation.resolved) {
      next.translation.paletteShift = (next.translation.paletteShift + pulses - 1) % 4
      next.variationGrace = { until: latestPulseAt + 5e3, translation: translationSolution(next) }
      next.translation.paletteShift = (next.translation.paletteShift + 1) % 4
      next.log.unshift(next.language === 'de' ? 'Farbfluss erkannt: Übersetzungstabelle wurde aktualisiert.' : 'Color flux detected: translation table updated.')
    }
    if (next.modifier === 'reactor-echo' && !next.reactor.resolved) {
      const advanceTelemetry = (count: number) => { next.reactor.telemetry = { flux: wrapDial(next.reactor.telemetry.flux + count), phase: wrapDial(next.reactor.telemetry.phase + count * 2), coolant: wrapDial(next.reactor.telemetry.coolant + count * 3) } }
      advanceTelemetry(pulses - 1)
      next.variationGrace = { until: latestPulseAt + 5e3, reactor: reactorSolution(next) }
      advanceTelemetry(1)
      next.log.unshift(next.language === 'de' ? 'Reaktorecho erkannt: Telemetrie wurde aktualisiert.' : 'Reactor echo detected: telemetry updated.')
    }
    if (next.activeModules.includes('packet') && !next.packet.resolved) {
      const rotateTimestamps = (count: number) => {
        const values = next.packet.tiles.map(tile => tile.timestamp)
        next.packet.tiles.forEach((tile, index) => { tile.timestamp = values[(index + count) % values.length] })
        refreshPacketChecksums(next.packet)
      }
      rotateTimestamps(pulses - 1)
      const previousOrder = packetSolution(next)
      rotateTimestamps(1)
      next.variationGrace = { ...next.variationGrace, until: latestPulseAt + 5e3, packet: previousOrder }
      next.log.unshift(next.language === 'de' ? 'Zeitdrift erkannt: Paket-Zeitstempel und Prüfsummen wurden aktualisiert.' : 'Temporal drift detected: packet timestamps and checksums updated.')
    }
    if (next.activeModules.includes('reality') && !next.reality.resolved) {
      const advancePhases = (count: number) => next.reality.feeds.forEach(feed => { feed.livePhase = wrapDial(feed.livePhase + count) })
      advancePhases(pulses - 1)
      const previousPlan = realitySolution(next)
      advancePhases(1)
      next.variationGrace = { ...next.variationGrace, until: latestPulseAt + 5e3, reality: previousPlan }
      next.log.unshift(next.language === 'de' ? 'Horizontdrift erkannt: Die Live-Phasen beider Erd-Übertragungen wurden aktualisiert.' : 'Horizon drift detected: both Earth feeds have new live phases.')
    }
    next.lastPressureAt = latestPulseAt
  }
  if (next.stability <= 0) {
    next.outcome = 'lost'; next.completedAt = now
    next.endReason = next.language === 'de' ? 'Der kosmische Druck hat die Station zerlegt.' : 'Cosmic pressure tore the station apart.'
  } else if (now >= next.endsAt) {
    next.outcome = 'lost'; next.completedAt = now
    next.endReason = next.language === 'de' ? 'Die Schicht endete mit ungelösten dringenden Vorfällen.' : 'The shift ended with priority incidents unresolved.'
  }
  if (next.outcome !== 'playing' && next.gameStyle === 'campaign' && next.campaignLevel) {
    const chapter = campaignLevel(next.campaignLevel)
    next.endReason = chapter.failure[next.language]
  }
  next.translation.sequence = translationSolution(next)
  next.score = scoreForGame(next, now)
  return next
}

function routerRulesPanel(game: FullGame) {
  const de = game.language === 'de'
  const pair = (band: 'low' | 'high', affinity: 'angular' | 'curved') => routerPairs[game.router.protocol][`${band}-${affinity}`].map(symbol => symbolLabel(symbol, game.language).name).join(' ↔ ')
  const protocol = ({ classic: de ? 'Klassik' : 'Classic', eclipse: de ? 'Finsternis' : 'Eclipse', mirror: de ? 'Spiegel' : 'Mirror' })[game.router.protocol]
  const guidance = game.gameStyle === 'campaign' && (game.campaignLevel || 99) <= 2 ? [de ? `ÜBUNG: Nutzt für diesen Anruf die Zeile ${effectiveRouterFrequency(game) >= 50 ? 'HOCH' : 'NIEDRIG'} + ${game.router.affinity === 'angular' ? 'ECKIG' : 'KURVIG'}.` : `TRAINING: For this caller, use the ${effectiveRouterFrequency(game) >= 50 ? 'HIGH' : 'LOW'} + ${game.router.affinity === 'angular' ? 'ANGULAR' : 'CURVED'} row.`] : []
  return { eyebrow: de ? `Routerprotokoll: ${protocol}` : `Router protocol: ${protocol}`, title: de ? 'Router-Verbindungstabelle' : 'Router connection table', tone: 'mint' as const,
    notes: de ? [...guidance, '50 THz oder mehr bedeutet HOCH.', 'Achtung: Wenn der Reaktor gelöst wird, ändert sich die Routerfrequenz. Prüft das Band direkt vor dem Senden erneut.'] : [...guidance, '50 THz or more means HIGH.', 'Warning: solving the reactor changes the router frequency. Check the band again immediately before submitting.'],
    table: { headers: de ? ['Band', 'Affinität', 'Verbinden'] : ['Band', 'Affinity', 'Connect'], rows: [[de ? 'NIEDRIG' : 'LOW', de ? 'Eckig' : 'Angular', pair('low', 'angular')], [de ? 'NIEDRIG' : 'LOW', de ? 'Kurvig' : 'Curved', pair('low', 'curved')], [de ? 'HOCH' : 'HIGH', de ? 'Eckig' : 'Angular', pair('high', 'angular')], [de ? 'HOCH' : 'HIGH', de ? 'Kurvig' : 'Curved', pair('high', 'curved')]] } }
}
function reactorRulesPanel(game: FullGame) {
  const de = game.language === 'de'
  const source = de ? { flux: '≋ FLUSS', phase: '◉ PHASE', coolant: '❄ KÜHLMITTEL', offset: '✦ SPEZIES' } : { flux: '≋ FLUX', phase: '◉ PHASE', coolant: '❄ COOLANT', offset: '✦ SPECIES' }
  const flows: Record<ReactorFormula, string[]> = {
    'crossfeed': [`${source.flux}  ⊕  ${source.phase}`, `${source.coolant}  ⊖  ${source.phase}`, `${source.flux}  ⊕  ${source.coolant}  ⊕  ${source.offset}`],
    'coolant-loop': [`${source.flux}  ⊕  ${source.coolant}`, `${source.phase}  ⊕  ${source.offset}`, `${source.coolant}  ⊖  ${source.flux}`],
    'phase-lock': [`${source.phase}  ⊕  ${source.coolant}  ⊕  ${source.offset}`, `${source.flux}  ⊖  ${source.phase}`, `${source.flux}  ⊕  ${source.phase}`],
  }
  const names = de ? { 'crossfeed': 'Kreuzfluss', 'coolant-loop': 'Kühlkreislauf', 'phase-lock': 'Phasensperre' } : { 'crossfeed': 'Crossfeed', 'coolant-loop': 'Coolant loop', 'phase-lock': 'Phase lock' }
  const wrap = de ? 'Der Regler ist ein Ring: 0 → 1 → 2 → 3 → 4 → 5 → 0. Lauft bei Bedarf weiter vorwärts oder rückwärts.' : 'Each dial is a ring: 0 → 1 → 2 → 3 → 4 → 5 → 0. Keep moving forward or backward when needed.'
  const examples = game.gameStyle === 'campaign' && game.campaignLevel === 1 ? (de
    ? ['EINFACH GESAGT: ⊕ bedeutet addieren. ⊖ bedeutet die rechte Zahl abziehen.', 'BEISPIEL PLUS: 2 ⊕ 3 = 5.', 'BEISPIEL MINUS: 1 ⊖ 3 = −2. Auf dem Ring zwei Schritte rückwärts ergibt Position 4.']
    : ['IN PLAIN WORDS: ⊕ means add. ⊖ means subtract the number on the right.', 'PLUS EXAMPLE: 2 ⊕ 3 = 5.', 'MINUS EXAMPLE: 1 ⊖ 3 = −2. Moving two steps backward around the ring lands on position 4.']) : []
  return { eyebrow: de ? `Reaktormodus: ${names[game.reactor.formula]}` : `Reactor mode: ${names[game.reactor.formula]}`, title: de ? 'Energiepfade verfolgen' : 'Trace the energy paths', tone: 'orange' as const, notes: [...examples, de ? 'Lest jede Karte von links nach rechts. Das Ergebnis ist die Stellung des genannten Reglers.' : 'Read each card from left to right. Its result is the position for the named dial.', wrap], table: { headers: de ? ['Ziel', 'SIGNALPFAD'] : ['Target', 'SIGNAL PATH'], rows: flows[game.reactor.formula].map((flow, index) => [`${de ? 'REGLER' : 'DIAL'} ${String.fromCharCode(65 + index)}`, flow]) } }
}
function translationRulesPanel(game: FullGame) {
  const de = game.language === 'de'; const symbols = Object.keys(symbolMeta) as SymbolId[]
  const direction = game.translation.direction === 'forward' ? (de ? 'von links nach rechts' : 'left to right') : (de ? 'von rechts nach links' : 'right to left')
  return { eyebrow: de ? `Leserichtung: ${direction}` : `Read: ${direction}`, title: de ? 'Kategorie in Farbe umwandeln' : 'Convert category to color', tone: 'pink' as const,
    notes: de ? [...(game.gameStyle === 'campaign' && game.campaignLevel === 3 ? ['ÜBUNG: Nennt erst jede Glyphe und ihre Kategorie. Sucht dann für den aktuellen Stationszustand die Farbe derselben Tabellenzeile.'] : []), `Lies die Glyphen ${direction}.`, 'Achtung: Falsche Eingaben können den Stationszustand ändern. Prüft ihn direkt vor dem Senden erneut.'] : [...(game.gameStyle === 'campaign' && game.campaignLevel === 3 ? ['TRAINING: First name each glyph and its category. Then find the color in the same table row for the current station condition.'] : []), `Read the glyphs ${direction}.`, 'Warning: mistakes can change station condition. Check it again immediately before submitting.'],
    table: { headers: de ? ['Kategorie', 'Normal', 'Belastet', 'Kritisch'] : ['Category', 'Nominal', 'Strained', 'Critical'], rows: symbols.map(symbol => [symbolLabel(symbol, game.language).category, ...(['nominal', 'strained', 'critical'] as Condition[]).map(condition => { const color = translatedColor(game, condition, symbol); return `${buttonMarker(color)} ${buttonLabel(color, game.language)}` })]) } }
}

function authenticationAnalystPanel(game: FullGame): RoleView['panels'][number] {
  const de = game.language === 'de'
  return { eyebrow: de ? 'Authentifizierung // Live-Daten' : 'Authentication // live data', title: de ? 'Zeit & Wellenform' : 'Timing & waveform', tone: 'orange', table: { headers: de ? ['Kanal', 'Zeitstempel', 'Wellenform'] : ['Channel', 'Timestamp', 'Waveform'], rows: game.authentication.candidates.map(candidate => [candidate.channel, candidate.timestamp, candidate.waveform]) }, notes: [de ? 'Maras echter Ruf wurde um 02:14 gesendet. Eine passende Zeit allein beweist keine Identität.' : 'Mara’s genuine call was sent at 02:14. Matching time alone does not prove identity.'] }
}

function authenticationArchivistPanel(game: FullGame): RoleView['panels'][number] {
  const de = game.language === 'de'
  return { eyebrow: de ? 'Authentifizierung // Personalakte' : 'Authentication // personnel record', title: de ? 'Private Prüfantwort' : 'Private challenge response', tone: 'pink', table: { headers: de ? ['Kanal', 'Antwort'] : ['Channel', 'Response'], rows: game.authentication.candidates.map(candidate => [candidate.channel, candidate.challenge]) }, notes: [de ? 'Geprüfte Antwort: „Keine. Wir sind der Helpdesk.“ Eine korrekte Erinnerung allein beweist keine aktuelle Identität.' : 'Verified response: “None. We work helpdesk.” A correct memory alone does not prove current identity.'] }
}

function authenticationEngineerPanel(game: FullGame): RoleView['panels'][number] {
  const de = game.language === 'de'
  return { eyebrow: de ? 'Authentifizierung // Routenzertifikat' : 'Authentication // route certificate', title: de ? 'Zertifikatskette' : 'Certificate chain', tone: 'mint', rows: game.authentication.candidates.map(candidate => ({ label: candidate.channel, value: candidate.certificate })), notes: [de ? 'Eine gültige Kette kann zu einem beschädigten Paket gehören. Vergleicht sie mit den Live-Daten und der Prüfantwort.' : 'A valid chain can belong to a corrupted packet. Compare it with live data and the challenge response.'] }
}

function packetAnalystPanel(game: FullGame): RoleView['panels'][number] {
  const de = game.language === 'de'
  return { eyebrow: de ? 'Zeitpaket // Live-Uhr' : 'Temporal packet // live clock', title: de ? 'Paket-Zeitstempel' : 'Packet timestamps', tone: 'orange', rows: game.packet.tiles.map(tile => ({ label: tile.label, value: `T+${tile.timestamp}` })), notes: [de ? 'Zeitdrift kann diese Werte bei jedem Druckstoß ändern. Lest sie direkt vor dem Senden erneut vor.' : 'Temporal drift can change these values at every pressure surge. Read them again immediately before submission.'] }
}

function packetArchivistPanel(game: FullGame): RoleView['panels'][number] {
  const de = game.language === 'de'; const ascending = game.packet.direction === 'ascending'
  return { eyebrow: de ? 'Zeitpaket // Epochregel' : 'Temporal packet // epoch rule', title: de ? 'Leserichtung des Absenders' : 'Sender reading direction', tone: 'pink', rows: [{ label: de ? 'Zeitordnung' : 'Time order', value: ascending ? (de ? 'KLEIN → GROSS' : 'LOW → HIGH') : (de ? 'GROSS → KLEIN' : 'HIGH → LOW') }], notes: [de ? 'Ordnet alle vier Blöcke nach den aktuellen Zeitstempeln. Die sichtbaren Paketnamen sind keine Reihenfolge.' : 'Order all four blocks by current timestamp. The visible packet names are not a sequence.'] }
}

function packetEngineerPanel(game: FullGame): RoleView['panels'][number] {
  const de = game.language === 'de'
  return { eyebrow: de ? 'Zeitpaket // Prüfsummenring' : 'Temporal packet // checksum ring', title: de ? 'Blockübergänge prüfen' : 'Verify block transitions', tone: 'mint', table: { headers: de ? ['Block', 'Eingang', 'Ausgang'] : ['Block', 'Input', 'Output'], rows: game.packet.tiles.map(tile => [tile.label, tile.checksumIn, tile.checksumOut]) }, notes: [de ? 'Der Ausgang jedes Blocks muss zum Eingang des nächsten passen. Der Ring bestätigt die Ordnung, verrät aber nicht, wo sie beginnt.' : 'Each block’s output must match the next block’s input. The ring confirms order but does not reveal where it begins.'] }
}

function consentAnalystPanel(game: FullGame): RoleView['panels'][number] {
  const de = game.language === 'de'
  const labels: Record<ConsentResponseKind, string> = de ? { yes: 'AUSDRÜCKLICHES JA', silence: 'SCHWEIGEN', no: 'AUSDRÜCKLICHES NEIN' } : { yes: 'EXPLICIT YES', silence: 'SILENCE', no: 'EXPLICIT NO' }
  return { eyebrow: de ? 'Zustimmung // Live-Antwort' : 'Consent // live response', title: de ? 'Aktuelle Absicht prüfen' : 'Verify current intent', tone: 'orange', rows: game.consent.responses.map(response => ({ label: response.channel, value: labels[response.kind] })), notes: [de ? 'Nur ein ausdrückliches Ja ist Zustimmung. Schweigen und Nein müssen die Verbindung geschlossen halten.' : 'Only an explicit yes is consent. Silence and no must keep the connection closed.'] }
}

function consentArchivistPanel(game: FullGame): RoleView['panels'][number] {
  const de = game.language === 'de'; const full = game.campaignLevel === 16
  return { eyebrow: de ? 'Zustimmung // Berechtigungsakte' : 'Consent // permission record', title: de ? 'Begrenzten Umfang abbilden' : 'Map the limited scope', tone: 'pink', table: { headers: de ? ['Protokollphase', 'Steuerung', 'Status'] : ['Protocol phase', 'Control', 'Status'], rows: [
    [de ? 'Eingeladener Zugang' : 'Invited access', de ? 'Verbinden' : 'Connect', de ? 'ERLAUBT' : 'ALLOWED'],
    [de ? 'Empfang aufbewahren' : 'Receipt retention', de ? 'Aufbewahren' : 'Retain', full ? (de ? 'ERLAUBT' : 'ALLOWED') : (de ? 'VERWEIGERT' : 'DENIED')],
    [de ? 'Widerrufbarer Abschluss' : 'Revocable closure', de ? 'Trennen' : 'Disconnect', de ? 'ERLAUBT' : 'ALLOWED'],
    [de ? 'Duplikat erstellen' : 'Create duplicate', de ? 'Kopieren' : 'Copy', de ? 'VERWEIGERT' : 'DENIED'],
    [de ? 'Später erneut öffnen' : 'Reopen later', de ? 'Wiederöffnen' : 'Reopen', de ? 'VERWEIGERT' : 'DENIED'],
  ] }, notes: [de ? 'Nehmt nur erlaubte Steuerungen auf. Die Ingenieurakte bestimmt ihre Reihenfolge.' : 'Include allowed controls only. The engineering procedure determines their order.'] }
}

function consentEngineerPanel(game: FullGame): RoleView['panels'][number] {
  const de = game.language === 'de'; const phases = game.campaignLevel === 16
    ? (de ? ['1. Eingeladener Zugang', '2. Empfang aufbewahren', '3. Widerrufbarer Abschluss'] : ['1. Invited access', '2. Receipt retention', '3. Revocable closure'])
    : (de ? ['1. Eingeladener Zugang', '2. Widerrufbarer Abschluss'] : ['1. Invited access', '2. Revocable closure'])
  return { eyebrow: de ? 'Zustimmung // Sicherheitsprozedur' : 'Consent // safety procedure', title: de ? 'Handshake-Phasen ordnen' : 'Order handshake phases', tone: 'mint', notes: [...phases, de ? 'Keine Phase darf ergänzt, ausgelassen oder wiederholt werden.' : 'Do not add, omit, or repeat a phase.'] }
}

function triageAnalystPanel(game: FullGame): RoleView['panels'][number] {
  const de = game.language === 'de'
  return { eyebrow: de ? 'Notstrom // Live-Telemetrie' : 'Emergency power // live telemetry', title: de ? 'Last & Leitungshitze' : 'Load & line heat', tone: 'orange', table: { headers: de ? ['Bereich', 'Last', 'Hitze'] : ['Habitat', 'Load', 'Heat'], rows: game.triage.habitats.map(habitat => [habitat.label, habitat.load === 'high' ? (de ? 'HOCH +1' : 'HIGH +1') : (de ? 'NIEDRIG +0' : 'LOW +0'), habitat.heat === 'hot' ? (de ? 'HEISS +1' : 'HOT +1') : (de ? 'KÜHL +0' : 'COOL +0')]) }, notes: [de ? 'Lest alle aktuellen Werte laut vor. Die Ingenieurakte erklärt, wie sie zur Mindestversorgung beitragen.' : 'Read every live value aloud. The engineering procedure explains how each contributes to minimum power.'] }
}

function triageArchivistPanel(game: FullGame): RoleView['panels'][number] {
  const de = game.language === 'de'
  return { eyebrow: de ? 'Notstrom // Lebensschutzakte' : 'Emergency power // life-support record', title: de ? 'Überlebensminimum' : 'Survival minimum', tone: 'pink', rows: game.triage.habitats.map(habitat => ({ label: habitat.label, value: `${habitat.baseMinimum} ${de ? 'EINHEITEN' : 'UNITS'}` })), notes: [de ? 'Alle aufgeführten Bereiche sind bewohnt. Keiner darf unter seinem berechneten Minimum liegen.' : 'Every listed habitat is occupied. None may fall below its calculated minimum.'] }
}

function triageEngineerPanel(game: FullGame): RoleView['panels'][number] {
  const de = game.language === 'de'; const labelFor = (id?: string) => game.triage.habitats.find(habitat => habitat.id === id)?.label || '—'
  return { eyebrow: de ? `Notstrom // Budget ${game.triage.budget}` : `Emergency power // budget ${game.triage.budget}`, title: de ? 'Netzformel & Abhängigkeiten' : 'Grid formula & dependencies', tone: 'mint', table: { headers: de ? ['Bereich', 'Kapazität', 'Verbindung'] : ['Habitat', 'Capacity', 'Dependency'], rows: game.triage.habitats.map(habitat => [habitat.label, `${habitat.capacity} ${de ? 'MAX.' : 'MAX'}`, habitat.linkedTo ? (de ? `+1 WENN ${labelFor(habitat.linkedTo)} HEISS` : `+1 IF ${labelFor(habitat.linkedTo)} HOT`) : '—']) }, notes: de ? ['ZIEL = Überlebensminimum + Lastzuschlag + Hitzezuschlag + Verbindungszuschlag.', 'Verteilt exakt das gesamte Budget. Keine Leitung darf ihre Kapazität überschreiten.'] : ['TARGET = survival minimum + load surcharge + heat surcharge + dependency surcharge.', 'Allocate the entire budget exactly. No line may exceed its capacity.'] }
}

function memoryAnalystPanel(game: FullGame): RoleView['panels'][number] {
  const de = game.language === 'de'
  return { eyebrow: de ? 'Speicher // Paritätsscan' : 'Memory // parity scan', title: de ? 'Gespeichert & erwartet' : 'Stored & expected', tone: 'orange', table: { headers: de ? ['Block', 'Gespeichert', 'Erwartet'] : ['Block', 'Stored', 'Expected'], rows: game.memory.blocks.map(block => [block.label, `P${block.storedParity}`, `P${block.expectedParity}`]) }, notes: [de ? 'Gleiche Werte sind intakt. Verschiedene Werte markieren einen beschädigten Block.' : 'Matching values are intact. Different values mark a corrupted block.'] }
}

function memoryArchivistPanel(game: FullGame): RoleView['panels'][number] {
  const de = game.language === 'de'
  return { eyebrow: de ? 'Speicher // Schutzregister' : 'Memory // protection register', title: de ? 'Lebende Erinnerungen schützen' : 'Protect living memories', tone: 'pink', rows: game.memory.blocks.map(block => ({ label: block.label, value: block.protected ? (de ? 'GESCHÜTZT' : 'PROTECTED') : (de ? 'STANDARD' : 'STANDARD') })), notes: [de ? 'Geschützte Blöcke enthalten bewusste oder identitätsstiftende Erinnerungen. Immer SPERREN, auch bei falscher Parität.' : 'Protected blocks contain conscious or identity-bearing memories. Always LOCK them, even when parity is wrong.'] }
}

function memoryEngineerPanel(game: FullGame): RoleView['panels'][number] {
  const de = game.language === 'de'; const labelFor = (id?: string) => game.memory.blocks.find(block => block.id === id)?.label || '—'
  return { eyebrow: de ? 'Speicher // Ersatzpfade' : 'Memory // replacement paths', title: de ? 'Sichere Reparaturregeln' : 'Safe repair rules', tone: 'mint', table: { headers: de ? ['Block', 'Geprüfte Ersatzquelle'] : ['Block', 'Verified replacement'], rows: game.memory.blocks.map(block => [block.label, labelFor(block.replacementFrom)]) }, notes: de ? ['GESCHÜTZT → SPERREN.', 'STANDARD + Parität korrekt → SPERREN.', 'STANDARD + Parität falsch + Ersatzquelle → WIEDERHERSTELLEN.', 'STANDARD + Parität falsch + keine Quelle → VERWERFEN.'] : ['PROTECTED → LOCK.', 'STANDARD + parity matches → LOCK.', 'STANDARD + parity mismatch + replacement → RESTORE.', 'STANDARD + parity mismatch + no replacement → DISCARD.'] }
}

function realityAnalystPanel(game: FullGame): RoleView['panels'][number] {
  const de = game.language === 'de'
  return { eyebrow: de ? 'Realität // Live-Horizont' : 'Reality // live horizon', title: de ? 'Aktuelle Phasenwerte' : 'Current phase values', tone: 'orange', rows: game.reality.feeds.map(feed => ({ label: feed.label, value: `P${feed.livePhase}` })), notes: [de ? 'Horizontdrift ändert diese Werte bei jedem Druckstoß. Lest beide direkt vor der Trennung erneut vor.' : 'Horizon drift changes these values at every pressure surge. Read both again immediately before separation.'] }
}

function realityArchivistPanel(game: FullGame): RoleView['panels'][number] {
  const de = game.language === 'de'
  return { eyebrow: de ? 'Realität // Herkunftsregister' : 'Reality // provenance register', title: de ? 'Kontinuität & Personsein' : 'Continuity & personhood', tone: 'pink', table: { headers: de ? ['Übertragung', 'Archivanker', 'Zensus'] : ['Feed', 'Archive anchor', 'Census'], rows: game.reality.feeds.map(feed => [feed.label, feed.archiveMarker, feed.inhabited ? (de ? 'BEWOHNT // BEWUSST' : 'INHABITED // CONSCIOUS') : (de ? 'UNBEWOHNTES ECHO' : 'EMPTY ECHO')]) }, notes: [de ? 'Durchgängige Herkunft bedeutet ORIGINAL; ein Relais-Geburtsregister bedeutet KOPIE. Beides sind lebende Welten. UNSICHER ist nur für ein unbewohntes Echo zulässig.' : 'Continuous provenance means ORIGINAL; a relay birth ledger means COPY. Both are living worlds. UNSAFE is reserved for an empty echo.'] }
}

function realityEngineerPanel(game: FullGame): RoleView['panels'][number] {
  const de = game.language === 'de'
  return { eyebrow: de ? 'Realität // Trennrouten' : 'Reality // separation routes', title: de ? 'Live-Route berechnen' : 'Calculate the live route', tone: 'mint', rows: game.reality.feeds.map(feed => ({ label: feed.label, value: `${de ? 'ROUTENSCHLÜSSEL' : 'ROUTE KEY'} ${feed.routeKey}` })), notes: de ? ['Addiert für jede Übertragung LIVE-PHASE + ROUTENSCHLÜSSEL.', 'Gerade Summe → AURORA. Ungerade Summe → UMBRA.', 'Beide bewohnten Welten müssen geschützt werden und getrennte Routen erhalten.'] : ['For each feed, add LIVE PHASE + ROUTE KEY.', 'Even total → AURORA. Odd total → UMBRA.', 'Protect both inhabited worlds and place them on separate routes.'] }
}

function dispatchAnalystPanel(game: FullGame): RoleView['panels'][number] {
  const de = game.language === 'de'
  return { eyebrow: de ? 'Warteschlange // Live-Uhren' : 'Dispatch // live clocks', title: de ? 'Ausfall-Countdowns' : 'Failure countdowns', tone: 'orange', rows: game.dispatch.callers.map(caller => ({ label: caller.label, value: `T−${caller.failureCountdown}s` })), notes: [de ? 'Der kürzeste rohe Countdown ist nicht automatisch zuerst dran. Die Archivrisiken verändern die wirksame Dringlichkeit.' : 'The shortest raw countdown is not automatically first. Archive risks alter effective urgency.'] }
}

function dispatchArchivistPanel(game: FullGame): RoleView['panels'][number] {
  const de = game.language === 'de'
  return { eyebrow: de ? 'Warteschlange // Zeugenrisiken' : 'Dispatch // witness risks', title: de ? 'Risikopuffer' : 'Risk buffers', tone: 'pink', table: { headers: de ? ['Anrufer', 'Risiko', 'Puffer'] : ['Caller', 'Risk', 'Buffer'], rows: game.dispatch.callers.map(caller => [caller.label, caller.risk, `${caller.riskBuffer}s`]) }, notes: [de ? 'Alle drei sind frühere, lebende Beteiligte. Der Puffer misst, wie viel früher ihr Vorfall behandelt werden muss.' : 'All three are returning, living stakeholders. The buffer measures how much earlier their incident must be handled.'] }
}

function dispatchEngineerPanel(game: FullGame): RoleView['panels'][number] {
  const de = game.language === 'de'; const labelFor = (id?: string) => game.dispatch.callers.find(caller => caller.id === id)?.label || (de ? 'KEINE' : 'NONE')
  return { eyebrow: de ? 'Warteschlange // Einsatzregeln' : 'Dispatch // service rules', title: de ? 'Abhängige Reihenfolge' : 'Dependency-aware order', tone: 'mint', table: { headers: de ? ['Anrufer', 'Muss warten auf'] : ['Caller', 'Must wait for'], rows: game.dispatch.callers.map(caller => [caller.label, labelFor(caller.dependsOn)]) }, notes: de ? ['WIRKSAME DRINGLICHKEIT = AUSFALL-COUNTDOWN − RISIKOPUFFER.', 'Wählt unter allen Anrufern, deren Abhängigkeiten bereits erledigt sind, stets den kleinsten Wert.', 'Die bestätigte Reihenfolge aktiviert danach genau diese Vorfälle nacheinander.'] : ['EFFECTIVE URGENCY = FAILURE COUNTDOWN − RISK BUFFER.', 'Among callers whose dependencies are already complete, always choose the lowest value.', 'The confirmed order then activates those incidents one at a time.'] }
}

function quarantineAnalystPanel(game: FullGame): RoleView['panels'][number] {
  const de = game.language === 'de'; const labelFor = (id: string) => game.quarantine.zones.find(zone => zone.id === id)?.label || id
  return { eyebrow: de ? 'Quarantäne // Live-Scan' : 'Quarantine // live scan', title: de ? 'Kontamination & Lebenszeichen' : 'Contamination & life signs', tone: 'orange', rows: [{ label: de ? 'QUELLE' : 'SOURCE', value: labelFor(game.quarantine.sourceZoneId) }, { label: de ? 'LEBENDER ANRUFER' : 'LIVING CALLER', value: labelFor(game.quarantine.occupiedZoneId) }], notes: [de ? 'Der Anrufer ist nicht die Kontaminationsquelle und muss einen offenen Weg zum sicheren Bereich behalten.' : 'The caller is not the contamination source and must retain an open path to the safe refuge.'] }
}

function quarantineArchivistPanel(game: FullGame): RoleView['panels'][number] {
  const de = game.language === 'de'
  const kinds: Record<QuarantineKind, string> = de ? { biological: 'BIOLOGISCHE SPOREN', informational: 'INFORMATIONS-WURM', temporal: 'ZEITLICHES ECHO' } : { biological: 'BIOLOGICAL SPORES', informational: 'INFORMATION WORM', temporal: 'TEMPORAL ECHO' }
  const media: Record<QuarantineMedium, string> = de ? { air: 'LUFT', data: 'DATEN', time: 'ZEIT' } : { air: 'AIR', data: 'DATA', time: 'TIME' }
  return { eyebrow: de ? 'Quarantäne // Gefahrenakte' : 'Quarantine // hazard record', title: de ? 'Ausbreitungsprofil' : 'Spread profile', tone: 'pink', rows: [{ label: de ? 'GEFAHR' : 'HAZARD', value: kinds[game.quarantine.kind] }, { label: de ? 'ÜBERTRÄGER' : 'CARRIER', value: media[game.quarantine.medium] }], notes: [de ? 'Nur Verbindungen mit diesem Überträger können die aktuelle Gefahr weitertragen. Eine andere Gefahrenart nutzt dieselbe Isolationslogik mit einem anderen Überträger.' : 'Only links carrying this medium can spread the current hazard. Other hazard skins use the same isolation logic with a different carrier.'] }
}

function quarantineEngineerPanel(game: FullGame): RoleView['panels'][number] {
  const de = game.language === 'de'; const labelFor = (id: string) => id === 'SAFE' ? (de ? 'SICHERER BEREICH' : 'SAFE REFUGE') : game.quarantine.zones.find(zone => zone.id === id)?.label || id
  const media: Record<QuarantineMedium, string> = de ? { air: 'LUFT', data: 'DATEN', time: 'ZEIT' } : { air: 'AIR', data: 'DATA', time: 'TIME' }
  return { eyebrow: de ? 'Quarantäne // Flussdiagramm' : 'Quarantine // flow diagram', title: de ? 'Gerichtete Türen & Schächte' : 'Directed doors & vents', tone: 'mint', table: { headers: de ? ['Schalter', 'Richtung', 'Träger'] : ['Control', 'Direction', 'Carrier'], rows: game.quarantine.links.map(link => [link.label, `${labelFor(link.from)} → ${labelFor(link.to)}`, media[link.medium]]) }, notes: de ? ['SPERREN: Verbindung trägt den Gefahren-Überträger UND zeigt von der Quelle weg.', 'OFFEN LASSEN: jede andere Verbindung. Das erhält insbesondere den Fluchtweg des Anrufers.', 'Richtungspfeile sind verbindlich; die Gefahr fließt nicht rückwärts.'] : ['SEAL: the link carries the hazard medium AND points outward from the source.', 'LEAVE OPEN: every other link. This preserves the caller’s escape route.', 'Direction arrows are binding; the hazard does not flow backward.'] }
}

function engineerPanels(game: FullGame) {
  return [game.activeModules.includes('authentication') && authenticationEngineerPanel(game), game.activeModules.includes('packet') && packetEngineerPanel(game), game.activeModules.includes('consent') && consentEngineerPanel(game), game.activeModules.includes('triage') && triageEngineerPanel(game), game.activeModules.includes('memory') && memoryEngineerPanel(game), game.activeModules.includes('reality') && realityEngineerPanel(game), game.activeModules.includes('dispatch') && dispatchEngineerPanel(game), game.activeModules.includes('quarantine') && quarantineEngineerPanel(game), game.activeModules.includes('router') && routerRulesPanel(game), game.activeModules.includes('reactor') && reactorRulesPanel(game), game.activeModules.includes('translation') && translationRulesPanel(game)].filter(Boolean) as RoleView['panels']
}

function analystPanels(game: FullGame) {
  const de = game.language === 'de'; const condition = stationCondition(game.stability)
  const conditionLabel = de ? { nominal: 'NORMAL', strained: 'BELASTET', critical: 'KRITISCH' }[condition] : condition.toUpperCase()
  const panels: RoleView['panels'] = []
  if (game.activeModules.includes('authentication')) panels.push(authenticationAnalystPanel(game))
  if (game.activeModules.includes('packet')) panels.push(packetAnalystPanel(game))
  if (game.activeModules.includes('consent')) panels.push(consentAnalystPanel(game))
  if (game.activeModules.includes('triage')) panels.push(triageAnalystPanel(game))
  if (game.activeModules.includes('memory')) panels.push(memoryAnalystPanel(game))
  if (game.activeModules.includes('reality')) panels.push(realityAnalystPanel(game))
  if (game.activeModules.includes('dispatch')) panels.push(dispatchAnalystPanel(game))
  if (game.activeModules.includes('quarantine')) panels.push(quarantineAnalystPanel(game))
  const meter = (value: number) => `${value}   ${'●'.repeat(value)}${'○'.repeat(5 - value)}`
  if (game.activeModules.includes('reactor')) panels.push({ eyebrow: de ? 'Live-Telemetrie' : 'Live telemetry', title: de ? 'Reaktordaten' : 'Reactor feed', tone: 'orange' as const, rows: [{ label: de ? '≋  Fluss' : '≋  Flux', value: meter(game.reactor.telemetry.flux) }, { label: '◉  Phase', value: meter(game.reactor.telemetry.phase) }, { label: de ? '❄  Kühlmittel' : '❄  Coolant', value: meter(game.reactor.telemetry.coolant) }], notes: [de ? 'Zahl und Leuchtpunkte zeigen dasselbe Signal von 0 bis 5.' : 'The number and lit pips show the same signal from 0 to 5.'] })
  if (game.activeModules.some(module => module === 'router' || module === 'translation')) panels.push({ eyebrow: de ? 'Live-Telemetrie' : 'Live telemetry', title: de ? 'Router & Station' : 'Router & station', tone: 'mint' as const, rows: [...(game.activeModules.includes('router') ? [{ label: de ? 'Routerfrequenz' : 'Router frequency', value: `${effectiveRouterFrequency(game)} THz` }, { label: de ? 'Frequenzband' : 'Frequency band', value: effectiveRouterFrequency(game) >= 50 ? (de ? 'HOCH' : 'HIGH') : (de ? 'NIEDRIG' : 'LOW') }] : []), ...(game.activeModules.includes('translation') ? [{ label: de ? 'Stationszustand' : 'Station condition', value: conditionLabel }] : [])], notes: game.activeModules.includes('router') ? (game.reactor.resolved ? [de ? 'Reaktor stabil: Frequenzaufschlag des Routers entfernt.' : 'Reactor stable: router frequency penalty removed.'] : [de ? 'Die Reaktorinstabilität addiert 20 THz zur Routerfrequenz.' : 'Reactor instability adds +20 THz to the router feed.']) : undefined })
  return panels
}
function archivistPanels(game: FullGame) {
  const de = game.language === 'de'
  const panels: RoleView['panels'] = []
  if (game.activeModules.includes('authentication')) panels.push(authenticationArchivistPanel(game))
  if (game.activeModules.includes('packet')) panels.push(packetArchivistPanel(game))
  if (game.activeModules.includes('consent')) panels.push(consentArchivistPanel(game))
  if (game.activeModules.includes('triage')) panels.push(triageArchivistPanel(game))
  if (game.activeModules.includes('memory')) panels.push(memoryArchivistPanel(game))
  if (game.activeModules.includes('reality')) panels.push(realityArchivistPanel(game))
  if (game.activeModules.includes('dispatch')) panels.push(dispatchArchivistPanel(game))
  if (game.activeModules.includes('quarantine')) panels.push(quarantineArchivistPanel(game))
  if (game.activeModules.some(module => module === 'router' || module === 'reactor')) panels.push({ eyebrow: de ? 'Anruferdossier' : 'Caller dossier', title: game.router.species, tone: 'mint' as const, rows: [...(game.activeModules.includes('router') ? [{ label: de ? 'Routeraffinität' : 'Router affinity', value: game.router.affinity === 'angular' ? (de ? 'ECKIG' : 'ANGULAR') : (de ? 'KURVIG' : 'CURVED') }] : []), ...(game.activeModules.includes('reactor') ? [{ label: de ? 'Reaktor-Offset' : 'Reactor offset', value: `+${game.reactor.speciesOffset}` }] : [])], notes: [de ? 'Nenne sie niemals „den Kunden“. Ihre Rechtsabteilung überwacht diese Frequenz.' : 'Never call them “the customer.” Their legal department monitors this frequency.'] })
  if (game.activeModules.some(module => module === 'router' || module === 'translation')) {
    const glyphs = game.activeModules.includes('router') ? (Object.keys(symbolMeta) as SymbolId[]) : game.translation.glyphs
    panels.push({ eyebrow: de ? 'Glyphenlexikon' : 'Glyph lexicon', title: de ? 'Archivkarte 88-B' : 'Archive card 88-B', tone: 'pink' as const, rows: glyphs.map((glyph) => ({ label: `${symbolMeta[glyph].glyph}  ${symbolLabel(glyph, game.language).name}`, value: symbolLabel(glyph, game.language).category })), notes: [de ? 'Nennt zu jeder Glyphe den Namen. Für Übersetzungen wird zusätzlich die Kategorie benötigt.' : 'Give the name for each glyph. Translation incidents also require its category.'] })
  }
  return panels
}

function campaignHint(game: FullGame, now: number, role: RoleId) {
  if (game.gameStyle !== 'campaign' || !game.campaignLevel || game.campaignLevel > 3 || now - game.startedAt < 40e3) return undefined
  const de = game.language === 'de'
  const reveal = now - game.startedAt >= 90e3
  if (game.campaignLevel === 1 && !game.reactor.resolved) {
    if (role === 'operator') return de ? 'HINWEIS: Fragt nach Fluss, Phase, Kühlmittel, Spezies-Offset und den drei Energiepfaden.' : 'HINT: Ask for flux, phase, coolant, the species offset, and all three energy paths.'
    if (!reveal) return de ? 'HINWEIS: Lest erst alle vier Zahlen laut vor. Rechnet dann jeden Energiepfad von links nach rechts auf dem Ring 0–5.' : 'HINT: Read all four numbers aloud, then calculate each energy path left to right around the 0–5 ring.'
    const answer = reactorSolution(game).join(' / ')
    return de ? `NOTFALLHINWEIS: Die Regler A / B / C lauten ${answer}. Gebt sie dem Operator durch.` : `EMERGENCY HINT: Dials A / B / C are ${answer}. Tell the Operator.`
  }
  if (game.campaignLevel === 2) {
    if (!game.reactor.resolved) return de ? 'HINWEIS: Löst zuerst gemeinsam den Reaktor. Dadurch wechselt die Routerfrequenz von HOCH zu NIEDRIG.' : 'HINT: Solve the reactor together first. That changes the router frequency from HIGH to LOW.'
    if (!game.router.resolved) {
      if (role === 'operator') return de ? 'HINWEIS: Beschreibt die Knotenglyphen. Fragt dann nach ihrem Namen und der Tabellenzeile für das aktuelle Band und die Affinität.' : 'HINT: Describe the node glyphs, then ask for their names and the table row matching the current band and affinity.'
      if (!reveal) return de ? 'HINWEIS: Archivar benennt die Glyphen, Analyst nennt das Band, Ingenieur liest das passende Paar aus der Tabelle.' : 'HINT: Archivist names the glyphs, Analyst gives the band, and Engineer reads the matching pair from the table.'
      const answer = routerSolution(game).map(symbol => symbolLabel(symbol, game.language).name).join(' + ')
      return de ? `NOTFALLHINWEIS: Verbindet ${answer}. Sagt dem Operator auch, welche Glyphen diese Namen tragen.` : `EMERGENCY HINT: Connect ${answer}. Also tell the Operator which glyphs carry those names.`
    }
  }
  if (game.campaignLevel === 3 && !game.translation.resolved && currentMissionPhase(game).modules.includes('translation')) {
    if (role === 'operator') return de ? 'HINWEIS: Beschreibt die drei Glyphen in Reihenfolge. Fragt nach Leserichtung, Kategorien und aktuellem Stationszustand.' : 'HINT: Describe the three glyphs in order. Ask for reading direction, categories, and current station condition.'
    if (!reveal) return de ? 'HINWEIS: Archivar liefert Kategorien, Analyst den Stationszustand und Ingenieur Leserichtung plus Farbtabelle.' : 'HINT: Archivist supplies categories, Analyst the station condition, and Engineer the direction and color table.'
    const answer = translationSolution(game).map(color => `${buttonMarker(color)} ${buttonLabel(color, game.language)}`).join(' – ')
    return de ? `NOTFALLHINWEIS: Die Folge lautet ${answer}. Gebt Formen und Farben gemeinsam durch.` : `EMERGENCY HINT: The sequence is ${answer}. Communicate both shapes and colors.`
  }
  return undefined
}

export function viewForRole(game: FullGame, role: RoleId, now = Date.now()): GameView {
  const hint = campaignHint(game, now, role)
  const phase = currentMissionPhase(game)
  const common: GameView = { seed: game.seed, language: game.language, gameStyle: game.gameStyle, campaignLevel: game.campaignLevel, difficulty: game.difficulty, activeModules: game.activeModules, visibleModules: phase.modules, phaseIndex: phase.index, phaseCount: game.phases.length, targetIncidents: game.targetIncidents, now, endsAt: game.endsAt, nextPressureAt: Math.min(game.endsAt, game.lastPressureAt + game.shiftRules.pressureEveryMs), variationGraceUntil: game.variationGrace?.until, stability: game.stability, score: game.score, incidentsResolved: game.incidentsResolved, incorrectActions: game.incorrectActions, damagedSystems: game.damagedSystems, unauthorizedWormholes: game.unauthorizedWormholes, outcome: game.outcome, endReason: game.endReason, log: game.log.slice(0, 5), moduleStatus: resolvedModules(game), modifierText: game.modifier === 'none' ? undefined : modifierDescription(game.modifier, game.language), bonusText: game.bonusObjective ? bonusDescription(game.bonusObjective, game.language) : undefined, bonusEarned: game.bonusObjective ? bonusEarnedForGame(game) : undefined, hint }
  if (role === 'operator') { const { affinity: _affinity, baseFrequency: _frequency, protocol: _protocol, ...router } = game.router; return { ...common, operator: { router, reactor: { resolved: game.reactor.resolved, dials: game.reactor.dials }, translation: { resolved: game.translation.resolved, glyphs: game.translation.glyphs }, authentication: { resolved: game.authentication.resolved, candidates: game.authentication.candidates.map(({ id, channel, label }) => ({ id, channel, label })) }, packet: { resolved: game.packet.resolved, tiles: game.packet.tiles.map(({ id, label }) => ({ id, label })), message: game.packet.resolved ? game.packet.message : undefined }, consent: { resolved: game.consent.resolved, ready: consentReady(game), permissions: game.consent.permissions, responses: game.consent.responses.map(({ id, channel }) => ({ id, channel })), subject: game.consent.subject }, triage: { resolved: game.triage.resolved, budget: game.triage.budget, habitats: game.triage.habitats.map(({ id, label }) => ({ id, label })) }, memory: { resolved: game.memory.resolved, blocks: game.memory.blocks.map(({ id, label }) => ({ id, label })), revealedText: game.memory.resolved ? game.memory.revealedText : undefined }, reality: { resolved: game.reality.resolved, feeds: game.reality.feeds.map(({ id, label }) => ({ id, label })) }, dispatch: { resolved: game.dispatch.resolved, callers: game.dispatch.callers.map(({ id, label }) => ({ id, label })), dispatchedOrder: [...game.dispatch.dispatchedOrder], currentModule: dispatchCurrentModule(game) }, quarantine: { resolved: game.quarantine.resolved, links: game.quarantine.links.map(({ id, label }) => ({ id, label })), contaminatedModule: game.quarantine.contaminatedModule } } } }
  const de = game.language === 'de'
  const manualGame: FullGame = { ...game, activeModules: phase.modules }
  const config: Record<Exclude<RoleId, 'operator'>, { title: string; subtitle: string; panels: RoleView['panels'] }> = de ? {
    engineer: { title: 'Systemingenieur', subtitle: 'Du hast die Prozeduren. Lass die anderen die Eingaben liefern.', panels: engineerPanels(manualGame) }, analyst: { title: 'Telemetrieanalyst', subtitle: 'Vertrau den Zahlen. Die meisten davon sind wahrscheinlich echt.', panels: analystPanels(manualGame) }, archivist: { title: 'Xeno-Archivar', subtitle: 'Spezies, Symbole und uralte Ausnahmen sind jetzt dein Problem.', panels: archivistPanels(manualGame) }, specialist: { title: 'Missionsspezialist', subtitle: 'Kleine Crew, großes Handbuch. Du hast alle Spezialhinweise.', panels: [...analystPanels(manualGame), ...archivistPanels(manualGame), ...engineerPanels(manualGame)] }, researcher: { title: 'Forschungsleitung', subtitle: 'Du betreust die Live-Telemetrie und das gesamte Xeno-Archiv.', panels: [...analystPanels(manualGame), ...archivistPanels(manualGame)] },
  } : {
    engineer: { title: 'Systems Engineer', subtitle: 'You have the procedures. Make everyone else provide the inputs.', panels: engineerPanels(manualGame) }, analyst: { title: 'Telemetry Analyst', subtitle: 'Trust the numbers. Most of them are probably real.', panels: analystPanels(manualGame) }, archivist: { title: 'Xeno Archivist', subtitle: 'Species, symbols, and ancient exceptions are your problem now.', panels: archivistPanels(manualGame) }, specialist: { title: 'Mission Specialist', subtitle: 'Small crew, big manual. You hold every specialist clue.', panels: [...analystPanels(manualGame), ...archivistPanels(manualGame), ...engineerPanels(manualGame)] }, researcher: { title: 'Research Lead', subtitle: 'You cover live telemetry and the entire xeno archive.', panels: [...analystPanels(manualGame), ...archivistPanels(manualGame)] },
  }
  if (game.gameStyle === 'campaign' && game.campaignLevel) {
    const level = campaignLevel(game.campaignLevel)
    config[role].panels.unshift({ eyebrow: de ? `Missionsbriefing // Kapitel ${level.id}` : `Mission briefing // Chapter ${level.id}`, title: level.title[game.language], tone: 'pink', notes: [level.summary[game.language], level.briefing[game.language], ...(game.modifier === 'none' ? [] : [modifierDescription(game.modifier, game.language)]), ...(game.bonusObjective ? [bonusDescription(game.bonusObjective, game.language)] : [])] })
  }
  return { ...common, manual: { role, ...config[role] } }
}
