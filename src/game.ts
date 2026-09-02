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
  endReason?: string; log: string[]; moduleStatus: { router: boolean; reactor: boolean; translation: boolean }; modifierText?: string; bonusText?: string; hint?: string
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
  id: number; title: Record<Locale, string>; summary: Record<Locale, string>; briefing: Record<Locale, string>; success: Record<Locale, string>; failure: Record<Locale, string>; activeModules: ModuleId[]; rules: ShiftRules
  variants: { router: RouterProtocol[]; reactor: ReactorFormula[]; palettes: number[]; directions: Array<'forward' | 'reverse'> }
}

const allModules: ModuleId[] = ['router', 'reactor', 'translation']
export const campaignLevels: CampaignLevel[] = [
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
  const state: FullGame = {
    seed, playerCount, language, gameStyle, campaignLevel: gameStyle === 'campaign' ? level.id : undefined, difficulty, shiftRules: { ...settings }, activeModules, startedAt: now, endsAt: now + settings.durationMs, lastPressureAt: now, stability: 100,
    incidentsResolved: 0, incorrectActions: 0, damagedSystems: 0, unauthorizedWormholes: Math.floor(random() * 3), score: 0, outcome: 'playing', modifier, bonusObjective, forgivenModules: [],
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
  const bonusEarned = game.outcome === 'won' && game.bonusObjective && (
    (game.bonusObjective === 'no-mistakes' && game.incorrectActions === 0)
    || (game.bonusObjective === 'high-stability' && game.stability >= 75)
    || (game.bonusObjective === 'fast-finish' && scoredAt - game.startedAt <= game.shiftRules.durationMs * 0.6)
  )
  return Math.max(0, Math.round(base * game.shiftRules.scoreMultiplier) + (bonusEarned ? 500 : 0))
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
  const forgiven = !correct && next.gameStyle === 'campaign' && (next.campaignLevel || 99) <= 2 && !next.forgivenModules.includes(module)
  if (correct) {
    next.incidentsResolved += 1; next.stability = Math.min(100, next.stability + 6)
    next.log.unshift(next.language === 'de' ? `${moduleNames[module]} gelöst. Jemand sollte das Ticket schließen, bevor es wieder aufgeht.` : `${moduleNames[module]} cleared. Someone close the ticket before it reopens.`)
  } else if (forgiven) {
    next.forgivenModules.push(module)
    next.log.unshift(next.language === 'de' ? `Übungseingabe am ${moduleNames[module]} abgefangen. Kein Schaden – prüft die Hinweise und versucht es erneut.` : `Training input intercepted at ${moduleNames[module]}. No damage—check the guidance and try again.`)
  } else {
    const penalty = next.modifier === 'fragile-controls' ? 20 : 15
    next.incorrectActions += 1; next.stability = Math.max(0, next.stability - penalty); next.damagedSystems += next.incorrectActions % 2 === 0 ? 1 : 0; next.unauthorizedWormholes += action.type === 'translation-submit' ? 1 : 0
    next.log.unshift(next.language === 'de' ? `${moduleNames[module]} hat die Prozedur abgelehnt. Stabilität −${penalty}.` : `${moduleNames[module]} rejected the procedure. Stability −${penalty}.`)
  }
  if (next.stability <= 0) { next.outcome = 'lost'; next.completedAt = now; next.endReason = next.language === 'de' ? 'Die Stationsstabilität ist auf null gefallen. Der Helpdesk ist jetzt technisch gesehen eine Hilfskugel.' : 'Station stability reached zero. The helpdesk is now technically a help-sphere.' }
  else if (next.incidentsResolved >= next.activeModules.length) { next.outcome = 'won'; next.completedAt = now; next.endReason = next.language === 'de' ? 'Alle dringenden Vorfälle wurden gelöst, bevor jemand die Leitung eingeschaltet hat.' : 'All priority incidents resolved before anyone escalated to management.' }
  if (next.outcome !== 'playing' && next.gameStyle === 'campaign' && next.campaignLevel) {
    const chapter = campaignLevel(next.campaignLevel)
    next.endReason = (next.outcome === 'won' ? chapter.success : chapter.failure)[next.language]
  }
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
    const damage = pulses * (settings.pressureDamage + (next.modifier === 'solar-static' ? 1 : 0))
    next.lastPressureAt += pulses * settings.pressureEveryMs
    next.stability = Math.max(0, next.stability - damage)
    next.log.unshift(next.language === 'de' ? `Kosmischer Druckstoß: Stabilität −${damage}.` : `Cosmic pressure surge: stability −${damage}.`)
    if (next.modifier === 'router-drift' && !next.router.resolved) {
      next.router.baseFrequency = 30 + ((next.router.baseFrequency - 30 + pulses * 11) % 31)
      next.log.unshift(next.language === 'de' ? 'Frequenzdrift erkannt: Routerdaten wurden aktualisiert.' : 'Frequency drift detected: router data updated.')
    }
    if (next.modifier === 'color-flux' && !next.translation.resolved) {
      next.translation.paletteShift = (next.translation.paletteShift + pulses) % 4
      next.log.unshift(next.language === 'de' ? 'Farbfluss erkannt: Übersetzungstabelle wurde aktualisiert.' : 'Color flux detected: translation table updated.')
    }
    if (next.modifier === 'reactor-echo' && !next.reactor.resolved) {
      next.reactor.telemetry = { flux: (next.reactor.telemetry.flux + pulses) % 6, phase: (next.reactor.telemetry.phase + pulses * 2) % 6, coolant: (next.reactor.telemetry.coolant + pulses * 3) % 6 }
      next.log.unshift(next.language === 'de' ? 'Reaktorecho erkannt: Telemetrie wurde aktualisiert.' : 'Reactor echo detected: telemetry updated.')
    }
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
  const example = game.gameStyle === 'campaign' && game.campaignLevel === 1 ? [de ? 'BEISPIEL: Bei Fluss 2 und Phase 3 wäre Regler A = 2 + 3 = 5. Berechnet genauso die drei Werte mit euren Live-Daten.' : 'EXAMPLE: With Flux 2 and Phase 3, Dial A would be 2 + 3 = 5. Calculate all three values the same way using your live data.'] : []
  return { eyebrow: de ? `Reaktormodus: ${names[game.reactor.formula]}` : `Reactor mode: ${names[game.reactor.formula]}`, title: de ? 'Regler berechnen' : 'Calculate the dials', tone: 'orange' as const, notes: [...example, wrap, ...formulas[game.reactor.formula]] }
}
function translationRulesPanel(game: FullGame) {
  const de = game.language === 'de'; const symbols = Object.keys(symbolMeta) as SymbolId[]
  const direction = game.translation.direction === 'forward' ? (de ? 'von links nach rechts' : 'left to right') : (de ? 'von rechts nach links' : 'right to left')
  return { eyebrow: de ? `Leserichtung: ${direction}` : `Read: ${direction}`, title: de ? 'Kategorie in Farbe umwandeln' : 'Convert category to color', tone: 'pink' as const,
    notes: de ? [...(game.gameStyle === 'campaign' && game.campaignLevel === 3 ? ['ÜBUNG: Nennt erst jede Glyphe und ihre Kategorie. Sucht dann für den aktuellen Stationszustand die Farbe derselben Tabellenzeile.'] : []), `Lies die Glyphen ${direction}.`, 'Achtung: Falsche Eingaben können den Stationszustand ändern. Prüft ihn direkt vor dem Senden erneut.'] : [...(game.gameStyle === 'campaign' && game.campaignLevel === 3 ? ['TRAINING: First name each glyph and its category. Then find the color in the same table row for the current station condition.'] : []), `Read the glyphs ${direction}.`, 'Warning: mistakes can change station condition. Check it again immediately before submitting.'],
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

function campaignHint(game: FullGame, now: number) {
  if (game.gameStyle !== 'campaign' || !game.campaignLevel || game.campaignLevel > 3 || now - game.startedAt < 40e3) return undefined
  const de = game.language === 'de'
  if (game.campaignLevel === 1 && !game.reactor.resolved) {
    const answer = reactorSolution(game).join(' / ')
    return de ? `HINWEIS: Mit den aktuellen Live-Daten lauten die Regler A / B / C: ${answer}.` : `HINT: With the current live data, Dials A / B / C are ${answer}.`
  }
  if (game.campaignLevel === 2) {
    if (!game.reactor.resolved) return de ? 'HINWEIS: Löst zuerst den Reaktor. Dadurch ändert sich die Routerfrequenz.' : 'HINT: Solve the reactor first. That changes the router frequency.'
    if (!game.router.resolved) { const answer = routerSolution(game).map(symbol => symbolLabel(symbol, game.language).name).join(' + '); return de ? `HINWEIS: Verbindet jetzt ${answer}.` : `HINT: Connect ${answer} now.` }
  }
  if (game.campaignLevel === 3 && !game.translation.resolved) return de ? `HINWEIS: Die aktuelle Farbfolge lautet ${translationSolution(game).map(color => buttonLabel(color, game.language)).join(' – ')}.` : `HINT: The current color sequence is ${translationSolution(game).map(color => buttonLabel(color, game.language)).join(' – ')}.`
  return undefined
}

export function viewForRole(game: FullGame, role: RoleId, now = Date.now()): GameView {
  const hint = campaignHint(game, now)
  const common: GameView = { seed: game.seed, language: game.language, gameStyle: game.gameStyle, campaignLevel: game.campaignLevel, difficulty: game.difficulty, activeModules: game.activeModules, targetIncidents: game.activeModules.length, now, endsAt: game.endsAt, stability: game.stability, score: game.score, incidentsResolved: game.incidentsResolved, incorrectActions: game.incorrectActions, damagedSystems: game.damagedSystems, unauthorizedWormholes: game.unauthorizedWormholes, outcome: game.outcome, endReason: game.endReason, log: game.log.slice(0, 5), moduleStatus: { router: game.router.resolved, reactor: game.reactor.resolved, translation: game.translation.resolved }, modifierText: game.modifier === 'none' ? undefined : modifierDescription(game.modifier, game.language), bonusText: game.bonusObjective ? bonusDescription(game.bonusObjective, game.language) : undefined, hint }
  if (role === 'operator') { const { affinity: _affinity, baseFrequency: _frequency, protocol: _protocol, ...router } = game.router; return { ...common, operator: { router, reactor: { resolved: game.reactor.resolved, dials: game.reactor.dials }, translation: { resolved: game.translation.resolved, glyphs: game.translation.glyphs } } } }
  const de = game.language === 'de'
  const config: Record<Exclude<RoleId, 'operator'>, { title: string; subtitle: string; panels: RoleView['panels'] }> = de ? {
    engineer: { title: 'Systemingenieur', subtitle: 'Du hast die Prozeduren. Lass die anderen die Eingaben liefern.', panels: engineerPanels(game) }, analyst: { title: 'Telemetrieanalyst', subtitle: 'Vertrau den Zahlen. Die meisten davon sind wahrscheinlich echt.', panels: analystPanels(game) }, archivist: { title: 'Xeno-Archivar', subtitle: 'Spezies, Symbole und uralte Ausnahmen sind jetzt dein Problem.', panels: archivistPanels(game) }, specialist: { title: 'Missionsspezialist', subtitle: 'Kleine Crew, großes Handbuch. Du hast alle Spezialhinweise.', panels: [...analystPanels(game), ...archivistPanels(game), ...engineerPanels(game)] }, researcher: { title: 'Forschungsleitung', subtitle: 'Du betreust die Live-Telemetrie und das gesamte Xeno-Archiv.', panels: [...analystPanels(game), ...archivistPanels(game)] },
  } : {
    engineer: { title: 'Systems Engineer', subtitle: 'You have the procedures. Make everyone else provide the inputs.', panels: engineerPanels(game) }, analyst: { title: 'Telemetry Analyst', subtitle: 'Trust the numbers. Most of them are probably real.', panels: analystPanels(game) }, archivist: { title: 'Xeno Archivist', subtitle: 'Species, symbols, and ancient exceptions are your problem now.', panels: archivistPanels(game) }, specialist: { title: 'Mission Specialist', subtitle: 'Small crew, big manual. You hold every specialist clue.', panels: [...analystPanels(game), ...archivistPanels(game), ...engineerPanels(game)] }, researcher: { title: 'Research Lead', subtitle: 'You cover live telemetry and the entire xeno archive.', panels: [...analystPanels(game), ...archivistPanels(game)] },
  }
  if (game.gameStyle === 'campaign' && game.campaignLevel) {
    const level = campaignLevel(game.campaignLevel)
    config[role].panels.unshift({ eyebrow: de ? `Missionsbriefing // Kapitel ${level.id}` : `Mission briefing // Chapter ${level.id}`, title: level.title[game.language], tone: 'pink', notes: [level.summary[game.language], level.briefing[game.language], ...(game.modifier === 'none' ? [] : [modifierDescription(game.modifier, game.language)]), ...(game.bonusObjective ? [bonusDescription(game.bonusObjective, game.language)] : []), ...(hint ? [hint] : [])] })
  }
  return { ...common, manual: { role, ...config[role] } }
}
