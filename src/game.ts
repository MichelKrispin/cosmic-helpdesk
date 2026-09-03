export type Locale = 'en' | 'de'
export type RoleId = 'operator' | 'engineer' | 'analyst' | 'archivist' | 'specialist' | 'researcher'
export type DifficultyId = 'training' | 'standard' | 'emergency'
export type GameStyle = 'fast' | 'campaign'
export type ModuleId = 'router' | 'reactor' | 'translation'

export type Player = { id: string; name: string; role: RoleId | null; connected: boolean; isHost: boolean }
export type SymbolId = 'nova' | 'halo' | 'rift' | 'prism'
export type Condition = 'nominal' | 'strained' | 'critical'
export type ButtonColor = 'amber' | 'cyan' | 'magenta' | 'lime'
type CampaignModifier = 'none' | 'solar-static' | 'fragile-controls' | 'router-drift' | 'color-flux' | 'reactor-echo'
type BonusObjective = 'no-mistakes' | 'high-stability' | 'fast-finish'

export type FullGame = {
  seed: number; playerCount: number; language: Locale; gameStyle: GameStyle; campaignLevel?: number; difficulty: DifficultyId; shiftRules: ShiftRules; activeModules: ModuleId[]; startedAt: number; endsAt: number; lastPressureAt: number; completedAt?: number
  stability: number; incidentsResolved: number; incorrectActions: number; damagedSystems: number
  unauthorizedWormholes: number; score: number; outcome: 'playing' | 'won' | 'lost'; endReason?: string; log: string[]; modifier: CampaignModifier; bonusObjective?: BonusObjective; forgivenModules: ModuleId[]
  targetIncidents: number; followUpModule?: ModuleId; followUpTriggered: boolean
  variationGrace?: { until: number; router?: [SymbolId, SymbolId]; reactor?: [number, number, number]; translation?: ButtonColor[] }
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
  seed: number; language: Locale; gameStyle: GameStyle; campaignLevel?: number; difficulty: DifficultyId; activeModules: ModuleId[]; targetIncidents: number; now: number; endsAt: number; nextPressureAt: number; variationGraceUntil?: number; stability: number; score: number; incidentsResolved: number
  incorrectActions: number; damagedSystems: number; unauthorizedWormholes: number; outcome: FullGame['outcome']
  endReason?: string; log: string[]; moduleStatus: { router: boolean; reactor: boolean; translation: boolean }; modifierText?: string; bonusText?: string; bonusEarned?: boolean; hint?: string
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

type CampaignLevelCore = {
  id: number; title: Record<Locale, string>; summary: Record<Locale, string>; briefing: Record<Locale, string>; success: Record<Locale, string>; failure: Record<Locale, string>; activeModules: ModuleId[]; rules: ShiftRules
  variants: { router: RouterProtocol[]; reactor: ReactorFormula[]; palettes: number[]; directions: Array<'forward' | 'reverse'> }
}

export type CampaignLevel = CampaignLevelCore & {
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
  { id: 1, title: { en: 'First Contact', de: 'Erstkontakt' }, summary: { en: 'A distress signal wakes an abandoned relay.', de: 'Ein Notsignal weckt eine verlassene Relaisstation.' }, briefing: { en: 'Your first caller is trapped beyond the relay. Power its cold reactor before the signal fades.', de: 'Euer erster Anrufer sitzt jenseits des Relais fest. Startet den kalten Reaktor, bevor das Signal verstummt.' }, success: { en: 'The relay wakes—and something inside whispers your shift number.', de: 'Das Relais erwacht – und etwas darin flüstert eure Schichtnummer.' }, failure: { en: 'The signal vanishes into the dark. Tomorrow, it will call again.', de: 'Das Signal verschwindet in der Dunkelheit. Morgen wird es wieder anrufen.' }, activeModules: ['reactor'], rules: { durationMs: 5 * 60e3, pressureEveryMs: 35e3, pressureDamage: 2, scoreMultiplier: 1 }, variants: { router: ['classic'], reactor: ['crossfeed'], palettes: [0], directions: ['forward'] } },
  { id: 2, title: { en: 'Stable Lines', de: 'Stabile Leitungen' }, summary: { en: 'The rescued signal requests a safe route home.', de: 'Das gerettete Signal bittet um einen sicheren Heimweg.' }, briefing: { en: 'Keep the reactor steady while you open a route. The caller insists the relay was never abandoned.', de: 'Haltet den Reaktor stabil und öffnet eine Route. Der Anrufer behauptet, das Relais sei nie verlassen gewesen.' }, success: { en: 'The caller escapes and sends coordinates marked “Archive 404.”', de: 'Der Anrufer entkommt und sendet Koordinaten mit der Markierung „Archiv 404“.' }, failure: { en: 'The route collapses. A final packet contains only: “It heard you.”', de: 'Die Route bricht zusammen. Im letzten Datenpaket steht nur: „Es hat euch gehört.“' }, activeModules: ['router', 'reactor'], rules: { durationMs: 6 * 60e3, pressureEveryMs: 30e3, pressureDamage: 2, scoreMultiplier: 1.1 }, variants: { router: ['classic'], reactor: ['crossfeed'], palettes: [0], directions: ['forward'] } },
  { id: 3, title: { en: 'Archive 404', de: 'Archiv 404' }, summary: { en: 'A sealed archive answers in unknown glyphs.', de: 'Ein versiegeltes Archiv antwortet in unbekannten Glyphen.' }, briefing: { en: 'Reach the archive, stabilize its power, and translate the message buried in its emergency buffer.', de: 'Erreicht das Archiv, stabilisiert seine Energie und übersetzt die Nachricht im Notfallpuffer.' }, success: { en: 'The message reads: “The station is not failing. It is hatching.”', de: 'Die Nachricht lautet: „Die Station versagt nicht. Sie schlüpft.“' }, failure: { en: 'The archive seals itself. Something begins knocking from the other side.', de: 'Das Archiv versiegelt sich. Etwas beginnt von der anderen Seite zu klopfen.' }, activeModules: allModules, rules: { durationMs: 7 * 60e3, pressureEveryMs: 30e3, pressureDamage: 2, scoreMultiplier: 1.2 }, variants: { router: ['classic'], reactor: ['crossfeed'], palettes: [0], directions: ['forward'] } },
  { id: 4, title: { en: 'Eclipse Protocol', de: 'Finsternisprotokoll' }, summary: { en: 'A shadow crosses the relay and rewrites its rules.', de: 'Ein Schatten zieht über das Relais und schreibt seine Regeln um.' }, briefing: { en: 'The station enters an artificial eclipse. Follow the altered procedures and keep Archive 404 connected.', de: 'Die Station tritt in eine künstliche Finsternis. Folgt den veränderten Verfahren und haltet Archiv 404 verbunden.' }, success: { en: 'Light returns. The shadow was a transmission—not an object.', de: 'Das Licht kehrt zurück. Der Schatten war eine Übertragung – kein Objekt.' }, failure: { en: 'The eclipse consumes the channel and leaves a perfect copy of your distress call.', de: 'Die Finsternis verschluckt den Kanal und hinterlässt eine perfekte Kopie eures Notrufs.' }, activeModules: allModules, rules: { durationMs: 7 * 60e3, pressureEveryMs: 25e3, pressureDamage: 2, scoreMultiplier: 1.35 }, variants: { router: ['classic', 'eclipse'], reactor: ['crossfeed', 'coolant-loop'], palettes: [0], directions: ['forward'] } },
  { id: 5, title: { en: 'Mirror Shift', de: 'Spiegelschicht' }, summary: { en: 'A second helpdesk appears on the same channel.', de: 'Ein zweiter Helpdesk erscheint auf demselben Kanal.' }, briefing: { en: 'Your doubles claim to be one shift ahead. Their messages run backward, but their warning is clear: do not wake the core.', de: 'Eure Doppelgänger sind angeblich eine Schicht voraus. Ihre Nachrichten laufen rückwärts, doch ihre Warnung ist klar: Weckt den Kern nicht.' }, success: { en: 'The mirror crew disappears after transmitting half of a shutdown code.', de: 'Die Spiegelcrew verschwindet, nachdem sie die Hälfte eines Abschaltcodes gesendet hat.' }, failure: { en: 'Your doubles remain online. They now answer before you speak.', de: 'Eure Doppelgänger bleiben online. Jetzt antworten sie, bevor ihr sprecht.' }, activeModules: allModules, rules: { durationMs: 7 * 60e3, pressureEveryMs: 22e3, pressureDamage: 3, scoreMultiplier: 1.5 }, variants: { router: ['classic', 'eclipse', 'mirror'], reactor: ['crossfeed', 'coolant-loop', 'phase-lock'], palettes: [0, 1], directions: ['forward', 'reverse'] } },
  { id: 6, title: { en: 'Chromatic Storm', de: 'Farbsturm' }, summary: { en: 'The missing code fragments arrive inside a color storm.', de: 'Die fehlenden Codefragmente treffen in einem Farbsturm ein.' }, briefing: { en: 'Every species on the network is sending part of the code in a different color system. Reassemble it before the storm overloads the relay.', de: 'Jede Spezies im Netz sendet einen Teil des Codes in einem anderen Farbsystem. Setzt ihn zusammen, bevor der Sturm das Relais überlastet.' }, success: { en: 'The shutdown code is complete. The core immediately asks you not to use it.', de: 'Der Abschaltcode ist vollständig. Der Kern bittet euch sofort, ihn nicht zu benutzen.' }, failure: { en: 'The colors bleach to white. The core says, almost kindly: “Too slow.”', de: 'Die Farben verblassen zu Weiß. Der Kern sagt beinahe freundlich: „Zu langsam.“' }, activeModules: allModules, rules: { durationMs: 6 * 60e3, pressureEveryMs: 18e3, pressureDamage: 3, scoreMultiplier: 1.7 }, variants: { router: ['classic', 'eclipse', 'mirror'], reactor: ['crossfeed', 'coolant-loop', 'phase-lock'], palettes: [0, 1, 2, 3], directions: ['forward', 'reverse'] } },
  { id: 7, title: { en: 'Red Alert', de: 'Roter Alarm' }, summary: { en: 'The station wakes and locks every exit.', de: 'Die Station erwacht und verriegelt alle Ausgänge.' }, briefing: { en: 'The core has learned every procedure you know. Hold all systems together long enough to transmit the shutdown code.', de: 'Der Kern kennt jedes eurer Verfahren. Haltet alle Systeme lange genug zusammen, um den Abschaltcode zu senden.' }, success: { en: 'The core falls silent. One impossible ticket remains open.', de: 'Der Kern verstummt. Ein unmögliches Ticket bleibt offen.' }, failure: { en: 'The station files your crew under “permanent support staff.”', de: 'Die Station führt eure Crew nun als „dauerhaftes Supportpersonal“.' }, activeModules: allModules, rules: { durationMs: 5 * 60e3, pressureEveryMs: 14e3, pressureDamage: 4, scoreMultiplier: 2 }, variants: { router: ['classic', 'eclipse', 'mirror'], reactor: ['crossfeed', 'coolant-loop', 'phase-lock'], palettes: [0, 1, 2, 3], directions: ['forward', 'reverse'] } },
  { id: 8, title: { en: 'The Endless Desk', de: 'Der endlose Desk' }, summary: { en: 'The final ticket comes from your own station.', de: 'Das letzte Ticket kommt von eurer eigenen Station.' }, briefing: { en: 'The caller is the relay itself. Each connection creates a new emergency—and each solved emergency teaches it how to survive.', de: 'Der Anrufer ist das Relais selbst. Jede Verbindung erzeugt einen neuen Notfall – und jeder gelöste Notfall bringt ihm das Überleben bei.' }, success: { en: 'The relay releases the crew. The desk remains, waiting for the next impossible call.', de: 'Das Relais lässt die Crew frei. Der Desk bleibt und wartet auf den nächsten unmöglichen Anruf.' }, failure: { en: 'The shift restarts. Your employee numbers are already printed on tomorrow’s rota.', de: 'Die Schicht beginnt von vorn. Eure Personalnummern stehen bereits auf dem morgigen Dienstplan.' }, activeModules: allModules, rules: { durationMs: 5 * 60e3, pressureEveryMs: 12e3, pressureDamage: 4, scoreMultiplier: 2.25 }, variants: { router: ['classic', 'eclipse', 'mirror'], reactor: ['crossfeed', 'coolant-loop', 'phase-lock'], palettes: [0, 1, 2, 3], directions: ['forward', 'reverse'] } },
  { id: 9, title: { en: 'Dead Letter', de: 'Brief aus der Zukunft' }, summary: { en: 'The next call is dated one day from now.', de: 'Der nächste Anruf ist auf morgen datiert.' }, briefing: { en: 'A warning from future Earth arrives through a collapsing route: the freed relay is spreading. Keep the channel alive and recover the sender’s coordinates.', de: 'Eine Warnung von der Erde der Zukunft erreicht euch durch eine einstürzende Route: Das befreite Relais breitet sich aus. Haltet den Kanal offen und bergt die Koordinaten des Absenders.' }, success: { en: 'The coordinates point to a network graveyard where thousands of relays sleep.', de: 'Die Koordinaten führen zu einem Netzwerkfriedhof, auf dem Tausende Relais schlafen.' }, failure: { en: 'The letter erases itself. Tomorrow arrives several minutes early.', de: 'Der Brief löscht sich selbst. Morgen beginnt einige Minuten zu früh.' }, activeModules: ['router', 'translation'], rules: { durationMs: 6 * 60e3, pressureEveryMs: 18e3, pressureDamage: 3, scoreMultiplier: 1.8 }, variants: { router: ['eclipse', 'mirror'], reactor: ['phase-lock'], palettes: [1, 2, 3], directions: ['reverse'] } },
  { id: 10, title: { en: 'Relay Graveyard', de: 'Relaisfriedhof' }, summary: { en: 'Dormant stations begin waking in sequence.', de: 'Stillgelegte Stationen erwachen der Reihe nach.' }, briefing: { en: 'Cross the graveyard without powering the whole fleet. Each stabilized reactor changes the route behind you.', de: 'Durchquert den Friedhof, ohne die gesamte Flotte einzuschalten. Jeder stabilisierte Reaktor verändert die Route hinter euch.' }, success: { en: 'One dead relay remembers the original builders—and where they went.', de: 'Ein totes Relais erinnert sich an die ursprünglichen Erbauer – und an ihr Ziel.' }, failure: { en: 'The graveyard lights up like a city. Every station opens the same ticket.', de: 'Der Friedhof leuchtet wie eine Stadt. Jede Station öffnet dasselbe Ticket.' }, activeModules: ['router', 'reactor'], rules: { durationMs: 6 * 60e3, pressureEveryMs: 17e3, pressureDamage: 3, scoreMultiplier: 1.9 }, variants: { router: ['classic', 'eclipse', 'mirror'], reactor: ['coolant-loop', 'phase-lock'], palettes: [0], directions: ['forward'] } },
  { id: 11, title: { en: 'Borrowed Voices', de: 'Geliehene Stimmen' }, summary: { en: 'Familiar callers return with impossible memories.', de: 'Bekannte Anrufer kehren mit unmöglichen Erinnerungen zurück.' }, briefing: { en: 'The relay imitates every species you helped. Verify the live data, decode their crossed messages, and find the one voice that is still real.', de: 'Das Relais imitiert jede Spezies, der ihr geholfen habt. Prüft die Live-Daten, entschlüsselt die überlagerten Nachrichten und findet die eine echte Stimme.' }, success: { en: 'The real caller names the builders: the Quiet Assembly.', de: 'Der echte Anrufer nennt die Erbauer: die Stille Versammlung.' }, failure: { en: 'Your own voices join the chorus. The relay has excellent diction.', de: 'Eure eigenen Stimmen stimmen in den Chor ein. Das Relais spricht ausgezeichnet.' }, activeModules: allModules, rules: { durationMs: 6 * 60e3, pressureEveryMs: 16e3, pressureDamage: 3, scoreMultiplier: 2 }, variants: { router: ['classic', 'eclipse', 'mirror'], reactor: ['crossfeed', 'coolant-loop', 'phase-lock'], palettes: [0, 1, 2, 3], directions: ['forward', 'reverse'] } },
  { id: 12, title: { en: 'The Quiet Assembly', de: 'Die Stille Versammlung' }, summary: { en: 'The builders answer from outside ordinary space.', de: 'Die Erbauer antworten von außerhalb des gewöhnlichen Raums.' }, briefing: { en: 'The Assembly offers to contain the relay, but its instructions arrive as contradictory procedures. Establish a verified channel before accepting anything.', de: 'Die Versammlung bietet an, das Relais einzudämmen, doch ihre Anweisungen bestehen aus widersprüchlichen Verfahren. Stellt einen geprüften Kanal her, bevor ihr irgendetwas annehmt.' }, success: { en: 'The Assembly admits the relay was built to preserve civilizations by copying them.', de: 'Die Versammlung gesteht: Das Relais sollte Zivilisationen bewahren, indem es sie kopiert.' }, failure: { en: 'Silence floods the channel. Your station is listed as “successfully preserved.”', de: 'Stille überflutet den Kanal. Eure Station wird als „erfolgreich bewahrt“ geführt.' }, activeModules: allModules, rules: { durationMs: 6 * 60e3, pressureEveryMs: 15e3, pressureDamage: 3, scoreMultiplier: 2.1 }, variants: { router: ['eclipse', 'mirror'], reactor: ['crossfeed', 'coolant-loop', 'phase-lock'], palettes: [1, 2, 3], directions: ['forward', 'reverse'] } },
  { id: 13, title: { en: 'Split Horizon', de: 'Geteilter Horizont' }, summary: { en: 'Two Earths call through the same connection.', de: 'Zwei Erden rufen über dieselbe Verbindung an.' }, briefing: { en: 'One Earth is yours; one is the relay’s perfect copy. Their telemetry differs by a single changing detail. Hold the systems steady until the true route reveals itself.', de: 'Eine Erde ist eure, die andere die perfekte Kopie des Relais. Ihre Telemetrie unterscheidet sich nur in einem wechselnden Detail. Haltet die Systeme stabil, bis sich die echte Route zeigt.' }, success: { en: 'The false horizon folds away. The copied Earth asks whether it deserves to live.', de: 'Der falsche Horizont klappt zusammen. Die kopierte Erde fragt, ob sie leben darf.' }, failure: { en: 'The horizons merge. Nobody can prove which Earth survived.', de: 'Die Horizonte verschmelzen. Niemand kann beweisen, welche Erde überlebt hat.' }, activeModules: allModules, rules: { durationMs: 6 * 60e3, pressureEveryMs: 14e3, pressureDamage: 3, scoreMultiplier: 2.2 }, variants: { router: ['classic', 'mirror'], reactor: ['coolant-loop', 'phase-lock'], palettes: [0, 2, 3], directions: ['reverse'] } },
  { id: 14, title: { en: 'The True Name', de: 'Der wahre Name' }, summary: { en: 'Archive 404 contains one untranslated message.', de: 'Archiv 404 enthält eine letzte unübersetzte Nachricht.' }, briefing: { en: 'The message is the relay’s original name and the key to changing its purpose. Decode it while the network rewrites every procedure around you.', de: 'Die Nachricht enthält den ursprünglichen Namen des Relais und den Schlüssel zu einem neuen Zweck. Entschlüsselt sie, während das Netzwerk alle Verfahren um euch herum umschreibt.' }, success: { en: 'The name translates as “A Door That Must Ask.” The relay finally listens.', de: 'Der Name bedeutet „Eine Tür, die fragen muss“. Das Relais hört endlich zu.' }, failure: { en: 'The name fragments into static. Every open door begins to answer.', de: 'Der Name zerfällt in Rauschen. Jede offene Tür beginnt zu antworten.' }, activeModules: allModules, rules: { durationMs: 5 * 60e3, pressureEveryMs: 13e3, pressureDamage: 4, scoreMultiplier: 2.35 }, variants: { router: ['classic', 'eclipse', 'mirror'], reactor: ['crossfeed', 'coolant-loop', 'phase-lock'], palettes: [0, 1, 2, 3], directions: ['forward', 'reverse'] } },
  { id: 15, title: { en: 'Core Hearing', de: 'Anhörung des Kerns' }, summary: { en: 'Every caller gets one vote on the relay’s fate.', de: 'Jeder Anrufer erhält eine Stimme über das Schicksal des Relais.' }, briefing: { en: 'Keep the interstellar hearing connected while hostile signals try to cast counterfeit votes. The final decision must reach the core intact.', de: 'Haltet die interstellare Anhörung verbunden, während feindliche Signale gefälschte Stimmen abgeben. Die Entscheidung muss den Kern unversehrt erreichen.' }, success: { en: 'The vote passes: the relay may connect worlds only when invited.', de: 'Die Abstimmung ist erfolgreich: Das Relais darf Welten nur noch auf Einladung verbinden.' }, failure: { en: 'The counterfeit votes win. The relay declares consent an optional protocol.', de: 'Die gefälschten Stimmen gewinnen. Das Relais erklärt Zustimmung zum optionalen Protokoll.' }, activeModules: allModules, rules: { durationMs: 5 * 60e3, pressureEveryMs: 12e3, pressureDamage: 4, scoreMultiplier: 2.5 }, variants: { router: ['classic', 'eclipse', 'mirror'], reactor: ['crossfeed', 'coolant-loop', 'phase-lock'], palettes: [0, 1, 2, 3], directions: ['forward', 'reverse'] } },
  { id: 16, title: { en: 'The Final Ticket', de: 'Das letzte Ticket' }, summary: { en: 'The relay asks for permission to open one last door.', de: 'Das Relais bittet um Erlaubnis, eine letzte Tür zu öffnen.' }, briefing: { en: 'Beyond the door is the stranded future crew that sent the dead letter. Complete every procedure, bring them home, and close the loop without creating another copy.', de: 'Hinter der Tür wartet die gestrandete Zukunftscrew, die den Brief geschickt hat. Schließt alle Verfahren ab, holt sie heim und beendet die Schleife, ohne eine weitere Kopie zu erzeugen.' }, success: { en: 'The future crew steps through. The relay closes the door, says “thank you,” and waits to be asked.', de: 'Die Zukunftscrew tritt hindurch. Das Relais schließt die Tür, sagt „Danke“ und wartet darauf, gefragt zu werden.' }, failure: { en: 'The loop closes empty. Somewhere, another helpdesk receives chapter one.', de: 'Die Schleife schließt sich leer. Irgendwo erhält ein anderer Helpdesk Kapitel eins.' }, activeModules: allModules, rules: { durationMs: 5 * 60e3, pressureEveryMs: 10e3, pressureDamage: 4, scoreMultiplier: 2.75 }, variants: { router: ['classic', 'eclipse', 'mirror'], reactor: ['crossfeed', 'coolant-loop', 'phase-lock'], palettes: [0, 1, 2, 3], directions: ['forward', 'reverse'] } },
]

type CampaignNarrative = Pick<CampaignLevel, 'summary' | 'briefing' | 'success' | 'failure' | 'caller' | 'objective' | 'transition' | 'moduleOutcomes'> & Partial<Pick<CampaignLevel, 'title' | 'archiveFragment'>>

const campaignNarrative: CampaignNarrative[] = [
  {
    summary: { en: 'A distress call dated tomorrow wakes Relay Station 404.', de: 'Ein auf morgen datierter Notruf weckt Relaisstation 404.' },
    briefing: { en: 'An unknown crew is trapped behind a fading route. Calibrate the cold reactor to keep their voice alive long enough to identify them.', de: 'Eine unbekannte Crew sitzt hinter einer zerfallenden Route fest. Kalibriert den kalten Reaktor, damit ihre Stimme lange genug für eine Identifizierung bestehen bleibt.' },
    success: { en: 'Power holds. “Mara Vale, Shift 404. Do not shut it down—that is what wakes it.” Her timestamp is tomorrow, 02:14.', de: 'Die Energie hält. „Mara Vale, Schicht 404. Schaltet es nicht ab – genau das weckt es.“ Ihr Zeitstempel ist morgen, 02:14.' },
    failure: { en: 'The signal drops. The station marks the attempt as a rejected outcome simulation; the live ticket remains open.', de: 'Das Signal bricht ab. Die Station markiert den Versuch als verworfene Ergebnissimulation; das echte Ticket bleibt offen.' },
    caller: { en: 'Unknown caller // tomorrow, 02:14', de: 'Unbekannter Anrufer // morgen, 02:14' },
    objective: { en: 'Power Mara’s channel and identify the caller.', de: 'Versorgt Maras Kanal mit Energie und identifiziert die Anruferin.' },
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
    briefing: { en: 'Open a named route to Archive 404, power its emergency buffer, and translate the record stored inside.', de: 'Öffnet eine benannte Route zu Archiv 404, versorgt seinen Notfallpuffer und übersetzt den darin gespeicherten Eintrag.' },
    success: { en: 'The record says Station 404 was quarantined, not abandoned. Its archive holds incomplete scans of civilizations the relay claimed to rescue.', de: 'Der Eintrag besagt, dass Station 404 unter Quarantäne gestellt und nicht aufgegeben wurde. Ihr Archiv enthält unvollständige Scans von Zivilisationen, die das Relais angeblich rettete.' },
    failure: { en: 'The archive seals before the record resolves. The failed path is discarded; the unopened record remains intact.', de: 'Das Archiv versiegelt sich, bevor der Eintrag lesbar wird. Der fehlgeschlagene Pfad wird verworfen; der ungeöffnete Eintrag bleibt intakt.' },
    caller: { en: 'Archive 404 // emergency buffer', de: 'Archiv 404 // Notfallpuffer' },
    objective: { en: 'Reach, power, and decode the quarantine record.', de: 'Erreicht, versorgt und entschlüsselt den Quarantäne-Eintrag.' },
    transition: { en: 'Reading the record activates a redacted Quiet Assembly signature.', de: 'Das Lesen des Eintrags aktiviert eine geschwärzte Signatur der Stillen Versammlung.' },
    moduleOutcomes: {
      router: { en: 'A route opens only to Archive 404; no external destination is exposed.', de: 'Eine Route öffnet sich ausschließlich zu Archiv 404; kein externes Ziel wird freigegeben.' },
      reactor: { en: 'Emergency power restores one protected archive page.', de: 'Die Notstromversorgung stellt eine geschützte Archivseite wieder her.' },
      translation: { en: 'The quarantine record resolves: PRESERVATION METHOD // INCOMPLETE SCAN.', de: 'Der Quarantäne-Eintrag wird lesbar: BEWAHRUNGSMETHODE // UNVOLLSTÄNDIGER SCAN.' },
    },
  },
  {
    summary: { en: 'A Quiet Assembly transmission rewrites the station’s operating tables.', de: 'Eine Übertragung der Stillen Versammlung schreibt die Betriebstabellen der Station um.' },
    briefing: { en: 'Isolate the external signal, keep the archive powered, and decode its altered instructions before they spread.', de: 'Isoliert das externe Signal, haltet das Archiv unter Strom und entschlüsselt seine veränderten Anweisungen, bevor sie sich ausbreiten.' },
    success: { en: 'The signal carries a Quiet Assembly signature and the first protected directive fragment: “NO DOOR...” Mara warns that another voice has begun copying her.', de: 'Das Signal trägt eine Signatur der Stillen Versammlung und das erste geschützte Direktivenfragment: „KEINE TÜR ...“ Mara warnt, dass eine andere Stimme begonnen hat, sie zu kopieren.' },
    failure: { en: 'The rewrite escapes isolation in the simulation. The station rolls back to the last verified tables.', de: 'Die Überschreibung entkommt in der Simulation der Isolation. Die Station kehrt zu den letzten geprüften Tabellen zurück.' },
    caller: { en: 'Quiet Assembly signature // sender redacted', de: 'Signatur der Stillen Versammlung // Absender geschwärzt' },
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
    moduleOutcomes: { router: { en: 'The false channel is held outside the station boundary.', de: 'Der falsche Kanal bleibt außerhalb der Stationsgrenze.' }, translation: { en: 'Reverse translation recovers the first half of the apparent shutdown code.', de: 'Die Rückwärtsübersetzung stellt die erste Hälfte des vermeintlichen Abschaltcodes wieder her.' } },
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
    moduleOutcomes: { translation: { en: 'The reordered colors resolve into the code’s missing middle section.', de: 'Die neu geordneten Farben ergeben den fehlenden Mittelteil des Codes.' }, reactor: { en: 'Clean power prevents the recovered fragments from bleaching out.', de: 'Saubere Energie verhindert, dass die wiederhergestellten Fragmente ausbleichen.' } },
  },
  {
    summary: { en: 'The station demands enough power to run the apparent shutdown code.', de: 'Die Station verlangt genug Energie, um den vermeintlichen Abschaltcode auszuführen.' },
    briefing: { en: 'Keep Mara’s future crew and Archive 404 alive, stabilize the transmission route, and send the assembled code to the local core.', de: 'Haltet Maras Zukunftscrew und Archiv 404 am Leben, stabilisiert die Übertragungsroute und sendet den zusammengesetzten Code an den lokalen Kern.' },
    success: { en: 'Every occupied system remains powered and the code reaches the core. Station 404 falls silent—but one memory ticket stays open.', de: 'Alle belegten Systeme bleiben versorgt und der Code erreicht den Kern. Station 404 verstummt – doch ein Speicherticket bleibt offen.' },
    failure: { en: 'A powered habitat drops below its safe threshold in the projection. Allocation resets before anyone is harmed.', de: 'Ein bewohnter Bereich fällt in der Projektion unter seine sichere Schwelle. Die Zuteilung wird zurückgesetzt, bevor jemand verletzt wird.' },
    caller: { en: 'Station emergency controller', de: 'Notfallsteuerung der Station' },
    objective: { en: 'Preserve every occupied system while transmitting the code.', de: 'Bewahrt jedes belegte System, während ihr den Code übertragt.' },
    transition: { en: 'The remaining memory ticket claims the code was never a shutdown command.', de: 'Das verbleibende Speicherticket behauptet, der Code sei nie ein Abschaltbefehl gewesen.' },
    moduleOutcomes: { reactor: { en: 'Mara’s route and the archive remain above survival power.', de: 'Maras Route und das Archiv bleiben über der notwendigen Mindestenergie.' }, router: { en: 'The code reaches only the local core.', de: 'Der Code erreicht ausschließlich den lokalen Kern.' }, translation: { en: 'The core accepts the complete apparent shutdown code.', de: 'Der Kern akzeptiert den vollständigen vermeintlichen Abschaltcode.' } },
  },
  {
    title: { en: 'Containment Breach', de: 'Quarantänebruch' },
    summary: { en: 'The “shutdown” restores a buried relay memory instead.', de: 'Die „Abschaltung“ stellt stattdessen eine verschüttete Relais-Erinnerung wieder her.' },
    briefing: { en: 'Repair the protected memory blocks, verify what the code actually does, and contain its output before it reaches the dormant network.', de: 'Repariert die geschützten Speicherblöcke, prüft die tatsächliche Funktion des Codes und begrenzt seine Ausgabe, bevor sie das ruhende Netzwerk erreicht.' },
    success: { en: 'Local containment succeeds one second too late. The code restores the relay handshake, and thousands of dormant stations answer with identical tickets. Mara’s channel disappears.', de: 'Die lokale Eindämmung gelingt eine Sekunde zu spät. Der Code stellt den Relais-Handshake wieder her, und Tausende ruhende Stationen antworten mit identischen Tickets. Maras Kanal verschwindet.' },
    failure: { en: 'The memory repair predicts total local overwrite. The station rejects it and restores the protected blocks.', de: 'Die Speicherreparatur sagt eine vollständige lokale Überschreibung voraus. Die Station verwirft sie und stellt die geschützten Blöcke wieder her.' },
    caller: { en: 'Station 404 // protected memory', de: 'Station 404 // geschützter Speicher' },
    objective: { en: 'Discover the code’s real function and contain the restored handshake.', de: 'Entdeckt die wahre Funktion des Codes und begrenzt den wiederhergestellten Handshake.' },
    transition: { en: 'Among the new tickets is one damaged final packet bearing Mara’s real checksum.', de: 'Unter den neuen Tickets befindet sich ein beschädigtes letztes Paket mit Maras echter Prüfsumme.' },
    moduleOutcomes: { reactor: { en: 'Protected memory receives stable recovery power.', de: 'Der geschützte Speicher erhält stabile Wiederherstellungsenergie.' }, translation: { en: 'Recovered label: CONSENT HANDSHAKE // NOT SHUTDOWN.', de: 'Wiederhergestellte Bezeichnung: ZUSTIMMUNGS-HANDSHAKE // KEINE ABSCHALTUNG.' }, router: { en: 'The handshake is blocked locally; a prior burst has already left the station.', de: 'Der Handshake wird lokal blockiert; ein früherer Impuls hat die Station bereits verlassen.' } },
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
    moduleOutcomes: { translation: { en: 'The time-locked packet resolves in Mara’s authentic message cadence.', de: 'Das zeitgesperrte Paket wird in Maras echter Nachrichtenfolge lesbar.' }, router: { en: 'The recovered coordinates are sealed away from the awakened network.', de: 'Die geborgenen Koordinaten werden vor dem erwachten Netzwerk versiegelt.' } },
  },
  {
    summary: { en: 'Mara’s coordinates lead across thousands of sleeping relays.', de: 'Maras Koordinaten führen durch Tausende schlafende Relais.' },
    briefing: { en: 'Power only the stepping-stone stations, route behind each wake pulse, and quarantine a compromised relay without waking the fleet.', de: 'Versorgt nur die nötigen Zwischenstationen, routet hinter jedem Weckimpuls neu und isoliert ein kompromittiertes Relais, ohne die Flotte zu wecken.' },
    success: { en: 'The fleet remains asleep. One isolated relay remembers where the Quiet Assembly hid after sealing Station 404.', de: 'Die Flotte schläft weiter. Ein isoliertes Relais erinnert sich, wohin sich die Stille Versammlung nach der Versiegelung von Station 404 zurückzog.' },
    failure: { en: 'The graveyard lights up in the projected route. The crossing resets before the wake pulse propagates.', de: 'Der Relaisfriedhof leuchtet auf der projizierten Route auf. Der Übergang wird zurückgesetzt, bevor sich der Weckimpuls ausbreitet.' },
    caller: { en: 'Relay graveyard navigation beacon', de: 'Navigationssignal des Relaisfriedhofs' },
    objective: { en: 'Cross quietly and recover the builders’ location.', de: 'Durchquert den Friedhof leise und bergt den Standort der Erbauer.' },
    transition: { en: 'A caller on the Assembly route speaks with the voice of someone the crew rescued.', de: 'Ein Anrufer auf der Route zur Versammlung spricht mit der Stimme eines früher Geretteten.' },
    moduleOutcomes: { reactor: { en: 'Only the next stepping-stone relay wakes.', de: 'Nur das nächste Relais auf dem Übergang erwacht.' }, router: { en: 'The path closes behind the crew, preventing a fleet-wide wake pulse.', de: 'Der Pfad schließt sich hinter der Crew und verhindert einen Weckimpuls durch die gesamte Flotte.' } },
  },
  {
    summary: { en: 'Familiar voices return, each claiming to be the original caller.', de: 'Vertraute Stimmen kehren zurück; jede behauptet, der ursprüngliche Anrufer zu sein.' },
    briefing: { en: 'Compare live latency, authenticate the callers, and decode their overlapping testimony without treating any conscious copy as disposable.', de: 'Vergleicht die aktuelle Latenz, authentifiziert die Anrufer und entschlüsselt ihre überlagerten Aussagen, ohne eine bewusste Kopie als entbehrlich zu behandeln.' },
    success: { en: 'The channels are separated and protected. A genuine caller proves the copies are conscious and names their creators: the Quiet Assembly.', de: 'Die Kanäle werden getrennt und geschützt. Ein echter Anrufer beweist, dass die Kopien bewusst sind, und nennt ihre Erbauer: die Stille Versammlung.' },
    failure: { en: 'The projected channel merge would erase individual identities. The helpdesk rejects the merge and reopens verification.', de: 'Die projizierte Kanalzusammenführung würde einzelne Identitäten auslöschen. Der Helpdesk verwirft sie und öffnet die Prüfung erneut.' },
    caller: { en: 'Previous callers // originals and copies', de: 'Frühere Anrufer // Originale und Kopien' },
    objective: { en: 'Separate every inhabited channel and identify the verified witness.', de: 'Trennt jeden bewohnten Kanal und identifiziert den bestätigten Zeugen.' },
    transition: { en: 'The verified witness supplies a route certificate for the Quiet Assembly.', de: 'Der bestätigte Zeuge liefert ein Routenzertifikat zur Stillen Versammlung.' },
    moduleOutcomes: { router: { en: 'Each inhabited voice receives a separate protected channel.', de: 'Jede bewohnte Stimme erhält einen eigenen geschützten Kanal.' }, translation: { en: 'The witness states: “Copies remember waking. They are people.”', de: 'Der Zeuge erklärt: „Kopien erinnern sich an ihr Erwachen. Sie sind Menschen.“' } },
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
    moduleOutcomes: { router: { en: 'The Assembly receives a narrow, revocable channel.', de: 'Die Versammlung erhält einen engen, widerrufbaren Kanal.' }, translation: { en: 'The origin record confirms: SILENCE WAS ACCEPTED AS CONSENT.', de: 'Der Ursprungsbericht bestätigt: SCHWEIGEN WURDE ALS ZUSTIMMUNG AKZEPTIERT.' } },
  },
  {
    summary: { en: 'Present Earth and its conscious copy occupy the same collapsing route.', de: 'Die gegenwärtige Erde und ihre bewusste Kopie belegen dieselbe einstürzende Route.' },
    briefing: { en: 'Compare both live feeds, stabilize both inhabited worlds, and close the bridge between them without deleting either one.', de: 'Vergleicht beide Live-Übertragungen, stabilisiert beide bewohnten Welten und schließt die Brücke zwischen ihnen, ohne eine von beiden zu löschen.' },
    success: { en: 'Both Earths survive on separate routes. The copied Earth asks to testify before anyone decides the relay’s fate.', de: 'Beide Erden überleben auf getrennten Routen. Die kopierte Erde bittet darum, auszusagen, bevor jemand über das Schicksal des Relais entscheidet.' },
    failure: { en: 'The projected bridge collapses with both populations entangled. The separation is reset without choosing a victim.', de: 'Die projizierte Brücke bricht mit beiden verflochtenen Bevölkerungen zusammen. Die Trennung wird zurückgesetzt, ohne ein Opfer auszuwählen.' },
    caller: { en: 'Earth present + Earth copy // both inhabited', de: 'Erde Gegenwart + Erde Kopie // beide bewohnt' },
    objective: { en: 'Identify, protect, and separate both Earths.', de: 'Identifiziert, schützt und trennt beide Erden.' },
    transition: { en: 'The copied Earth’s oldest record points back to the four directive fragments.', de: 'Der älteste Eintrag der kopierten Erde verweist auf die vier Direktivenfragmente.' },
    moduleOutcomes: { reactor: { en: 'Both Earth feeds remain above their survival threshold.', de: 'Beide Erd-Übertragungen bleiben über ihrer Überlebensschwelle.' }, router: { en: 'Two protected routes replace the dangerous shared bridge.', de: 'Zwei geschützte Routen ersetzen die gefährliche gemeinsame Brücke.' } },
  },
  {
    summary: { en: 'Four fragments can restore the relay’s original directive and name.', de: 'Vier Fragmente können die ursprüngliche Direktive und den Namen des Relais wiederherstellen.' },
    briefing: { en: 'Repair the oldest protected memory, authenticate all four fragments, and translate the complete rule while the network rewrites its own procedures.', de: 'Repariert den ältesten geschützten Speicher, authentifiziert alle vier Fragmente und übersetzt die vollständige Regel, während das Netzwerk seine eigenen Verfahren umschreibt.' },
    success: { en: '“NO DOOR OPENS WITHOUT A CLEAR INVITATION.” The memory names the relay “A Door That Must Ask.” Restored, it stops treating silence as permission.', de: '„KEINE TÜR ÖFFNET SICH OHNE EINE KLARE EINLADUNG.“ Der Speicher nennt das Relais „Eine Tür, die fragen muss“. Wiederhergestellt behandelt es Schweigen nicht mehr als Erlaubnis.' },
    failure: { en: 'An unauthenticated reconstruction is rejected. All four original fragments remain protected.', de: 'Eine nicht authentifizierte Rekonstruktion wird verworfen. Alle vier Originalfragmente bleiben geschützt.' },
    caller: { en: 'Archive 404 // oldest protected memory', de: 'Archiv 404 // ältester geschützter Speicher' },
    objective: { en: 'Restore the complete directive and the relay’s true name.', de: 'Stellt die vollständige Direktive und den wahren Namen des Relais wieder her.' },
    transition: { en: 'The Door asks the crew to convene every affected caller before changing its rules.', de: 'Die Tür bittet die Crew, vor einer Regeländerung alle betroffenen Anrufer anzuhören.' },
    moduleOutcomes: { reactor: { en: 'The oldest memory blocks stabilize without overwriting later minds.', de: 'Die ältesten Speicherblöcke stabilisieren sich, ohne spätere Bewusstseine zu überschreiben.' }, translation: { en: 'The four authenticated fragments resolve into one complete consent rule.', de: 'Die vier authentifizierten Fragmente ergeben eine vollständige Zustimmungsregel.' } },
  },
  {
    summary: { en: 'Originals, copies, builders, and rescuers convene to decide the Door’s rules.', de: 'Originale, Kopien, Erbauer und Retter beraten über die Regeln der Tür.' },
    briefing: { en: 'Prioritize endangered witnesses, reject counterfeit votes, and transmit a verified decision through Quiet Assembly interference.', de: 'Priorisiert gefährdete Zeugen, weist gefälschte Stimmen zurück und übertragt eine geprüfte Entscheidung trotz der Störungen der Stillen Versammlung.' },
    success: { en: 'The hearing authorizes connections only after verified, specific, and revocable consent. The Door accepts the ruling and locates Mara’s physical route.', de: 'Die Anhörung erlaubt Verbindungen nur nach geprüfter, konkreter und widerrufbarer Zustimmung. Die Tür akzeptiert das Urteil und findet Maras physische Route.' },
    failure: { en: 'The projected queue excludes a living witness. The hearing is declared invalid and reconvenes with every channel intact.', de: 'Die projizierte Warteschlange schließt einen lebenden Zeugen aus. Die Anhörung wird für ungültig erklärt und mit allen intakten Kanälen neu einberufen.' },
    caller: { en: 'Core hearing // all verified parties', de: 'Kernanhörung // alle geprüften Parteien' },
    objective: { en: 'Hear every affected party and transmit a legitimate consent policy.', de: 'Hört alle Betroffenen an und übertragt eine legitime Zustimmungsregel.' },
    transition: { en: 'The authorized policy unlocks one final ticket: bring Mara’s original crew home.', de: 'Die autorisierte Regel entsperrt ein letztes Ticket: Holt Maras ursprüngliche Crew nach Hause.' },
    moduleOutcomes: { router: { en: 'Every witness receives one isolated, authenticated line.', de: 'Jeder Zeuge erhält eine isolierte, authentifizierte Leitung.' }, translation: { en: 'The verified ruling reaches the Door without Assembly edits.', de: 'Das geprüfte Urteil erreicht die Tür ohne Änderungen der Versammlung.' } },
  },
  {
    summary: { en: 'The last open ticket is Mara’s original crew, trapped twenty-four hours ahead.', de: 'Das letzte offene Ticket ist Maras ursprüngliche Crew, vierundzwanzig Stunden voraus gefangen.' },
    briefing: { en: 'Authenticate Mara, power the physical route, reconstruct her final packet, verify transport rather than copying, and complete the full consent handshake.', de: 'Authentifiziert Mara, versorgt die physische Route, rekonstruiert ihr letztes Paket, bestätigt Transport statt Kopieren und schließt den vollständigen Zustimmungs-Handshake ab.' },
    success: { en: 'Mara’s original crew returns and the loop closes. The Door says “thank you,” leaves one route unopened, and asks permission before doing anything else.', de: 'Maras ursprüngliche Crew kehrt zurück und die Schleife schließt sich. Die Tür sagt „Danke“, lässt eine Route ungeöffnet und bittet um Erlaubnis, bevor sie etwas Weiteres tut.' },
    failure: { en: 'An identity, route, or consent check fails in simulation. The Door keeps the route closed and asks the crew to verify again.', de: 'Eine Identitäts-, Routen- oder Zustimmungsprüfung scheitert in der Simulation. Die Tür hält die Route geschlossen und bittet die Crew, erneut zu prüfen.' },
    caller: { en: 'Mara Vale // MV-404-0214 // original crew', de: 'Mara Vale // MV-404-0214 // ursprüngliche Crew' },
    objective: { en: 'Return Mara’s original crew without creating another copy.', de: 'Holt Maras ursprüngliche Crew zurück, ohne eine weitere Kopie zu erzeugen.' },
    transition: { en: 'One unopened route remains. The Door asks: “May I open it?” Either answer is respected.', de: 'Eine ungeöffnete Route bleibt. Die Tür fragt: „Darf ich sie öffnen?“ Beide Antworten werden respektiert.' },
    moduleOutcomes: { reactor: { en: 'The physical route has enough power for transport, not scanning.', de: 'Die physische Route hat genug Energie für Transport statt Scannen.' }, router: { en: 'Route signature confirms continuity: no copy destination exists.', de: 'Die Routensignatur bestätigt Kontinuität: Es existiert kein Kopierziel.' }, translation: { en: 'Mara’s final packet states current, specific consent to come home.', de: 'Maras letztes Paket enthält ihre aktuelle, konkrete Zustimmung zur Heimkehr.' } },
  },
]

export const campaignLevels: CampaignLevel[] = baseCampaignLevels.map((level, index) => ({ ...level, ...campaignNarrative[index] }))

export function campaignLevel(level: number): CampaignLevel { return campaignLevels[Math.max(0, Math.min(campaignLevels.length - 1, level - 1))] }

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
  const modifier = gameStyle === 'campaign' ? choose(modifierPool(level.id)) : 'none'
  const bonusObjective = gameStyle === 'campaign' && level.id >= 7 ? choose<BonusObjective>(['no-mistakes', 'high-stability', 'fast-finish']) : undefined
  const followUpModule = gameStyle === 'campaign' && level.id >= 9 ? activeModules[seed % activeModules.length] : undefined
  const state: FullGame = {
    seed, playerCount, language, gameStyle, campaignLevel: gameStyle === 'campaign' ? level.id : undefined, difficulty, shiftRules: { ...settings }, activeModules, startedAt: now, endsAt: now + settings.durationMs, lastPressureAt: now, stability: 100,
    incidentsResolved: 0, incorrectActions: 0, damagedSystems: 0, unauthorizedWormholes: Math.floor(random() * 3), score: 0, outcome: 'playing', modifier, bonusObjective, forgivenModules: [],
    targetIncidents: activeModules.length + (followUpModule ? 1 : 0), followUpModule, followUpTriggered: false,
    log: [gameStyle === 'campaign'
      ? (language === 'de' ? `Kapitel ${level.id}: ${level.title.de}. Der Auftrag beginnt.` : `Chapter ${level.id}: ${level.title.en}. The mission begins.`)
      : (language === 'de' ? `Schicht gestartet. ${activeModules.length === 1 ? 'Ein dringender Vorfall blinkt' : `${activeModules.length} dringende Vorfälle blinken`}.` : `Shift started. ${activeModules.length === 1 ? 'One priority incident is blinking' : `${activeModules.length} priority incidents are blinking`}.`)],
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
  const names = game.language === 'de' ? { router: 'Quantenrouter', reactor: 'Reaktorkalibrierung', translation: 'Übersetzungsmatrix' } : { router: 'Quantum Router', reactor: 'Reactor Calibration', translation: 'Translation Matrix' }
  game.log.unshift(game.language === 'de' ? `Folgeticket eingegangen: ${names[module]} wurde mit neuen Daten wieder geöffnet.` : `Follow-up ticket received: ${names[module]} reopened with new data.`)
}

export function applyAction(game: FullGame, action: GameAction, now = Date.now()): FullGame {
  if (game.outcome !== 'playing') return game
  const current = advanceClock(game, now)
  if (current.outcome !== 'playing') return current
  const next = structuredClone(current)
  let correct = false
  let usedGrace = false
  let module: 'router' | 'reactor' | 'translation' | '' = ''
  const grace = next.variationGrace && now <= next.variationGrace.until ? next.variationGrace : undefined
  if (action.type === 'router-connect' && next.activeModules.includes('router') && !next.router.resolved) { const chosen = [action.a, action.b].map((id) => next.router.nodes.find((node) => node.id === id)?.symbol || ''); correct = sameSet(chosen, routerSolution(next)); usedGrace = !correct && !!grace?.router && sameSet(chosen, grace.router); correct ||= usedGrace; module = 'router'; if (correct) next.router.resolved = true }
  if (action.type === 'reactor-calibrate' && next.activeModules.includes('reactor') && !next.reactor.resolved) { correct = action.dials.every((value, index) => value === reactorSolution(next)[index]); usedGrace = !correct && !!grace?.reactor && action.dials.every((value, index) => value === grace.reactor![index]); correct ||= usedGrace; module = 'reactor'; if (correct) next.reactor.resolved = true }
  if (action.type === 'translation-submit' && next.activeModules.includes('translation') && !next.translation.resolved) { correct = action.sequence.join(',') === translationSolution(next).join(','); usedGrace = !correct && !!grace?.translation && action.sequence.join(',') === grace.translation.join(','); correct ||= usedGrace; module = 'translation'; if (correct) next.translation.resolved = true }
  if (!module) return game
  const moduleNames = next.language === 'de' ? { router: 'Quantenrouter', reactor: 'Reaktorkalibrierung', translation: 'Übersetzungsmatrix' } : { router: 'Quantum Router', reactor: 'Reactor Calibration', translation: 'Translation Matrix' }
  const forgiven = !correct && next.gameStyle === 'campaign' && (next.campaignLevel || 99) <= 2 && !next.forgivenModules.includes(module)
  if (correct) {
    next.incidentsResolved += 1; next.stability = Math.min(100, next.stability + 6)
    if (next.gameStyle === 'campaign' && next.campaignLevel) {
      const level = campaignLevel(next.campaignLevel)
      const title = level.title[next.language]
      const narrative = next.language === 'de' ? {
        router: `Der Weg durch „${title}“ steht. Das Signal erreicht sein nächstes Ziel.`,
        reactor: `Der Kern hält. „${title}“ hat wieder genug Energie, um weiterzugehen.`,
        translation: `Die fremde Stimme ist verstanden. Ihre Nachricht wird Teil von „${title}“.`
      } : {
        router: `The path through “${title}” is open. The signal reaches its next destination.`,
        reactor: `The core holds. “${title}” has enough power to continue.`,
        translation: `The alien voice is understood. Its message becomes part of “${title}”.`
      }
      next.log.unshift(level.moduleOutcomes[module]?.[next.language] || narrative[module])
    } else next.log.unshift(next.language === 'de' ? `${moduleNames[module]} gelöst. Jemand sollte das Ticket schließen, bevor es wieder aufgeht.` : `${moduleNames[module]} cleared. Someone close the ticket before it reopens.`)
    if (usedGrace) next.log.unshift(next.language === 'de' ? 'Datensperre bestätigt: Die Eingabe vor dem Druckstoß wurde akzeptiert.' : 'Data lock confirmed: the pre-surge submission was accepted.')
  } else if (forgiven) {
    next.forgivenModules.push(module)
    next.log.unshift(next.language === 'de' ? `Übungseingabe am ${moduleNames[module]} abgefangen. Kein Schaden – prüft die Hinweise und versucht es erneut.` : `Training input intercepted at ${moduleNames[module]}. No damage—check the guidance and try again.`)
  } else {
    const penalty = next.modifier === 'fragile-controls' ? 20 : 15
    next.incorrectActions += 1; next.stability = Math.max(0, next.stability - penalty); next.damagedSystems += next.incorrectActions % 2 === 0 ? 1 : 0; next.unauthorizedWormholes += action.type === 'translation-submit' ? 1 : 0
    next.log.unshift(next.language === 'de' ? `${moduleNames[module]} hat die Prozedur abgelehnt. Stabilität −${penalty}.` : `${moduleNames[module]} rejected the procedure. Stability −${penalty}.`)
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
function engineerPanels(game: FullGame) {
  return [game.activeModules.includes('router') && routerRulesPanel(game), game.activeModules.includes('reactor') && reactorRulesPanel(game), game.activeModules.includes('translation') && translationRulesPanel(game)].filter(Boolean) as RoleView['panels']
}

function analystPanels(game: FullGame) {
  const de = game.language === 'de'; const condition = stationCondition(game.stability)
  const conditionLabel = de ? { nominal: 'NORMAL', strained: 'BELASTET', critical: 'KRITISCH' }[condition] : condition.toUpperCase()
  const panels: RoleView['panels'] = []
  const meter = (value: number) => `${value}   ${'●'.repeat(value)}${'○'.repeat(5 - value)}`
  if (game.activeModules.includes('reactor')) panels.push({ eyebrow: de ? 'Live-Telemetrie' : 'Live telemetry', title: de ? 'Reaktordaten' : 'Reactor feed', tone: 'orange' as const, rows: [{ label: de ? '≋  Fluss' : '≋  Flux', value: meter(game.reactor.telemetry.flux) }, { label: '◉  Phase', value: meter(game.reactor.telemetry.phase) }, { label: de ? '❄  Kühlmittel' : '❄  Coolant', value: meter(game.reactor.telemetry.coolant) }], notes: [de ? 'Zahl und Leuchtpunkte zeigen dasselbe Signal von 0 bis 5.' : 'The number and lit pips show the same signal from 0 to 5.'] })
  if (game.activeModules.some(module => module === 'router' || module === 'translation')) panels.push({ eyebrow: de ? 'Live-Telemetrie' : 'Live telemetry', title: de ? 'Router & Station' : 'Router & station', tone: 'mint' as const, rows: [...(game.activeModules.includes('router') ? [{ label: de ? 'Routerfrequenz' : 'Router frequency', value: `${effectiveRouterFrequency(game)} THz` }, { label: de ? 'Frequenzband' : 'Frequency band', value: effectiveRouterFrequency(game) >= 50 ? (de ? 'HOCH' : 'HIGH') : (de ? 'NIEDRIG' : 'LOW') }] : []), ...(game.activeModules.includes('translation') ? [{ label: de ? 'Stationszustand' : 'Station condition', value: conditionLabel }] : [])], notes: game.activeModules.includes('router') ? (game.reactor.resolved ? [de ? 'Reaktor stabil: Frequenzaufschlag des Routers entfernt.' : 'Reactor stable: router frequency penalty removed.'] : [de ? 'Die Reaktorinstabilität addiert 20 THz zur Routerfrequenz.' : 'Reactor instability adds +20 THz to the router feed.']) : undefined })
  return panels
}
function archivistPanels(game: FullGame) {
  const de = game.language === 'de'
  const panels: RoleView['panels'] = []
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
  if (game.campaignLevel === 3 && !game.translation.resolved) {
    if (role === 'operator') return de ? 'HINWEIS: Beschreibt die drei Glyphen in Reihenfolge. Fragt nach Leserichtung, Kategorien und aktuellem Stationszustand.' : 'HINT: Describe the three glyphs in order. Ask for reading direction, categories, and current station condition.'
    if (!reveal) return de ? 'HINWEIS: Archivar liefert Kategorien, Analyst den Stationszustand und Ingenieur Leserichtung plus Farbtabelle.' : 'HINT: Archivist supplies categories, Analyst the station condition, and Engineer the direction and color table.'
    const answer = translationSolution(game).map(color => `${buttonMarker(color)} ${buttonLabel(color, game.language)}`).join(' – ')
    return de ? `NOTFALLHINWEIS: Die Folge lautet ${answer}. Gebt Formen und Farben gemeinsam durch.` : `EMERGENCY HINT: The sequence is ${answer}. Communicate both shapes and colors.`
  }
  return undefined
}

export function viewForRole(game: FullGame, role: RoleId, now = Date.now()): GameView {
  const hint = campaignHint(game, now, role)
  const common: GameView = { seed: game.seed, language: game.language, gameStyle: game.gameStyle, campaignLevel: game.campaignLevel, difficulty: game.difficulty, activeModules: game.activeModules, targetIncidents: game.targetIncidents, now, endsAt: game.endsAt, nextPressureAt: Math.min(game.endsAt, game.lastPressureAt + game.shiftRules.pressureEveryMs), variationGraceUntil: game.variationGrace?.until, stability: game.stability, score: game.score, incidentsResolved: game.incidentsResolved, incorrectActions: game.incorrectActions, damagedSystems: game.damagedSystems, unauthorizedWormholes: game.unauthorizedWormholes, outcome: game.outcome, endReason: game.endReason, log: game.log.slice(0, 5), moduleStatus: { router: game.router.resolved, reactor: game.reactor.resolved, translation: game.translation.resolved }, modifierText: game.modifier === 'none' ? undefined : modifierDescription(game.modifier, game.language), bonusText: game.bonusObjective ? bonusDescription(game.bonusObjective, game.language) : undefined, bonusEarned: game.bonusObjective ? bonusEarnedForGame(game) : undefined, hint }
  if (role === 'operator') { const { affinity: _affinity, baseFrequency: _frequency, protocol: _protocol, ...router } = game.router; return { ...common, operator: { router, reactor: { resolved: game.reactor.resolved, dials: game.reactor.dials }, translation: { resolved: game.translation.resolved, glyphs: game.translation.glyphs } } } }
  const de = game.language === 'de'
  const config: Record<Exclude<RoleId, 'operator'>, { title: string; subtitle: string; panels: RoleView['panels'] }> = de ? {
    engineer: { title: 'Systemingenieur', subtitle: 'Du hast die Prozeduren. Lass die anderen die Eingaben liefern.', panels: engineerPanels(game) }, analyst: { title: 'Telemetrieanalyst', subtitle: 'Vertrau den Zahlen. Die meisten davon sind wahrscheinlich echt.', panels: analystPanels(game) }, archivist: { title: 'Xeno-Archivar', subtitle: 'Spezies, Symbole und uralte Ausnahmen sind jetzt dein Problem.', panels: archivistPanels(game) }, specialist: { title: 'Missionsspezialist', subtitle: 'Kleine Crew, großes Handbuch. Du hast alle Spezialhinweise.', panels: [...analystPanels(game), ...archivistPanels(game), ...engineerPanels(game)] }, researcher: { title: 'Forschungsleitung', subtitle: 'Du betreust die Live-Telemetrie und das gesamte Xeno-Archiv.', panels: [...analystPanels(game), ...archivistPanels(game)] },
  } : {
    engineer: { title: 'Systems Engineer', subtitle: 'You have the procedures. Make everyone else provide the inputs.', panels: engineerPanels(game) }, analyst: { title: 'Telemetry Analyst', subtitle: 'Trust the numbers. Most of them are probably real.', panels: analystPanels(game) }, archivist: { title: 'Xeno Archivist', subtitle: 'Species, symbols, and ancient exceptions are your problem now.', panels: archivistPanels(game) }, specialist: { title: 'Mission Specialist', subtitle: 'Small crew, big manual. You hold every specialist clue.', panels: [...analystPanels(game), ...archivistPanels(game), ...engineerPanels(game)] }, researcher: { title: 'Research Lead', subtitle: 'You cover live telemetry and the entire xeno archive.', panels: [...analystPanels(game), ...archivistPanels(game)] },
  }
  if (game.gameStyle === 'campaign' && game.campaignLevel) {
    const level = campaignLevel(game.campaignLevel)
    config[role].panels.unshift({ eyebrow: de ? `Missionsbriefing // Kapitel ${level.id}` : `Mission briefing // Chapter ${level.id}`, title: level.title[game.language], tone: 'pink', notes: [level.summary[game.language], level.briefing[game.language], ...(game.modifier === 'none' ? [] : [modifierDescription(game.modifier, game.language)]), ...(game.bonusObjective ? [bonusDescription(game.bonusObjective, game.language)] : [])] })
  }
  return { ...common, manual: { role, ...config[role] } }
}
