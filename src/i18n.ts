import type { Locale } from './game'

const en = {
  language: 'Language', languageHelp: 'The host selects one language for the entire crew.', english: 'English', german: 'Deutsch',
  signalOnline: 'P2P COMMS ONLINE', homeKicker: 'INTERDIMENSIONAL SUPPORT DIVISION • SHIFT 404',
  heroBefore: 'Keep the station', heroEmphasis: 'mostly', heroAfter: 'operational.',
  lede: 'One crew member has the controls. Everyone else has the instructions. Talk fast, cross-reference everything, and please stop opening wormholes in the break room.',
  createGame: 'CREATE GAME', fineprint: '2–4 players · 10 minute shifts · external voice chat recommended',
  liveFeed: 'STATION // LIVE FEED', stability: 'STABILITY', tickets: 'TICKETS', wormholes: 'WORMHOLES', unverified: 'UNVERIFIED',
  how: [
    ['Split the intel', 'The Operator sees the problem. Specialists see the rules. Nobody gets the whole picture.'],
    ['Talk it through', 'Describe glyphs, compare telemetry, and turn contradictory manuals into one risky procedure.'],
    ['Try not to explode', 'Wrong inputs damage station stability. Correct ones merely reveal the next problem.'],
  ],
  leave: 'LEAVE SESSION', crewAssembly: 'CREW ASSEMBLY', briefing: 'Night shift briefing', invite: 'SECURE INVITE LINK', copied: 'COPIED!', copy: 'COPY LINK',
  gameStyle: 'GAME STYLE', fastGame: 'FAST GAME', campaign: 'CAMPAIGN', fastHelp: 'The complete challenge in one shift.', campaignHelp: 'Follow a level map that introduces systems and rule variations gradually.', campaignMap: 'CAMPAIGN ROUTE', level: 'LEVEL', locked: 'LOCKED', nextLevel: 'NEXT LEVEL',
  difficulty: 'SHIFT LEVEL', minutes: 'min', stabilityEvery: 'stability every', score: 'SCORE', scoringHelp: 'Solve quickly and preserve stability. Mistakes cost points.',
  connectedCrew: 'CONNECTED CREW', openChannel: 'OPEN CHANNEL', hostRole: 'SESSION HOST • OPERATOR', assignedAtLaunch: 'ROLE ASSIGNED AT LAUNCH', waitingTech: 'Waiting for technician…',
  voiceRequired: 'VOICE COMMS REQUIRED', voiceHelp: 'Use a phone call, Discord, or your preferred telepathic channel.', start: 'START SHIFT', waitingHost: 'WAITING FOR HOST TO START',
  shiftEnds: 'SHIFT ENDS IN', stationStability: 'STATION STABILITY', leaveAria: 'Leave session', assignment: 'YOUR ASSIGNMENT',
  operatorConsole: 'Operator Console', operatorSubtitle: 'You can touch the controls. You cannot see the procedures.', describe: 'Describe everything out loud.',
  incidentModule: 'INCIDENT MODULE', resolved: 'RESOLVED', active: 'ACTIVE', quantumRouter: 'Quantum Router', reactorCalibration: 'Reactor Calibration', translationMatrix: 'Translation Matrix',
  incomingCaller: 'INCOMING CALLER', selectNodes: 'Select two nodes to establish a stable route.', routeCore: ['ROUTE', 'CORE'], lockConnection: 'LOCK CONNECTION',
  setDials: 'Set all three calibration dials, then engage.', dial: 'DIAL', increaseDial: 'Increase dial', decreaseDial: 'Decrease dial', core: 'CORE', engage: 'ENGAGE CALIBRATION',
  messageBuffer: 'MESSAGE BUFFER', enterSequence: 'Enter the response sequence. Pressed colors appear below.', clear: 'CLEAR', transmit: 'TRANSMIT',
  readAloud: 'Read useful details aloud.', clearance: 'CLEARANCE 4½', incidentStatus: 'INCIDENT STATUS', doNot: 'DO NOT', doNotText: 'Guess. Touch the Operator’s screen. Mention the insurance deductible.',
  shiftLog: 'SHIFT LOG', now: 'NOW', report: 'SHIFT REPORT', passable: 'PASSABLE', catastrophic: 'CATASTROPHIC', alive: 'CLOCKED OUT ALIVE', offline: 'STATION OFFLINE',
  success: 'Technically, a success.', failure: 'That could have gone better.', crewScore: 'CREW SCORE', newBest: 'NEW PERSONAL BEST', best: 'BEST', replay: 'NEW SHIFT', waitingReplay: 'Waiting for the host to start another shift…', incidentsResolved: 'INCIDENTS RESOLVED', incorrectActions: 'INCORRECT ACTIONS', systemsDamaged: 'SYSTEMS DAMAGED', finalStability: 'FINAL STABILITY', unauthorizedWormholes: 'UNAUTHORIZED WORMHOLES', returnDesk: 'RETURN TO DESK', seed: 'SEED',
  status: { empty: '', calling: 'Calling the station…', waiting: 'Waiting for crew', connected: 'Direct link established', stillCalling: 'Still calling… If this persists, ask the host to keep their tab open.', hostDisconnected: 'Host disconnected — session paused', sessionEnded: 'The host ended this session.', capacity: 'This crew is full or already mid-shift.' },
}

const de: typeof en = {
  language: 'Sprache', languageHelp: 'Der Host wählt eine Sprache für die gesamte Crew.', english: 'English', german: 'Deutsch',
  signalOnline: 'P2P-KOMMUNIKATION ONLINE', homeKicker: 'INTERDIMENSIONALE SUPPORTABTEILUNG • SCHICHT 404',
  heroBefore: 'Halte die Station', heroEmphasis: 'halbwegs', heroAfter: 'betriebsbereit.',
  lede: 'Ein Crewmitglied hat die Steuerung. Alle anderen haben die Anweisungen. Sprecht schnell, gleicht alles ab und hört bitte auf, Wurmlöcher im Pausenraum zu öffnen.',
  createGame: 'SPIEL ERSTELLEN', fineprint: '2–4 Spieler · 10-Minuten-Schichten · externer Sprachchat empfohlen',
  liveFeed: 'STATION // LIVEÜBERTRAGUNG', stability: 'STABILITÄT', tickets: 'TICKETS', wormholes: 'WURMLÖCHER', unverified: 'UNGEPRÜFT',
  how: [
    ['Informationen aufteilen', 'Der Operator sieht das Problem. Spezialisten sehen die Regeln. Niemand kennt das Gesamtbild.'],
    ['Redet miteinander', 'Beschreibt Glyphen, vergleicht Telemetrie und macht aus widersprüchlichen Handbüchern eine riskante Prozedur.'],
    ['Nicht explodieren', 'Falsche Eingaben beschädigen die Stationsstabilität. Richtige decken nur das nächste Problem auf.'],
  ],
  leave: 'SITZUNG VERLASSEN', crewAssembly: 'CREW-ZUSAMMENSTELLUNG', briefing: 'Einweisung zur Nachtschicht', invite: 'SICHERER EINLADUNGSLINK', copied: 'KOPIERT!', copy: 'LINK KOPIEREN',
  gameStyle: 'SPIELART', fastGame: 'SCHNELLES SPIEL', campaign: 'KAMPAGNE', fastHelp: 'Die vollständige Herausforderung in einer Schicht.', campaignHelp: 'Folgt einer Karte, die Systeme und Regelvarianten schrittweise einführt.', campaignMap: 'KAMPAGNENROUTE', level: 'LEVEL', locked: 'GESPERRT', nextLevel: 'NÄCHSTES LEVEL',
  difficulty: 'SCHICHTSTUFE', minutes: 'Min.', stabilityEvery: 'Stabilität alle', score: 'PUNKTE', scoringHelp: 'Löst schnell und bewahrt Stabilität. Fehler kosten Punkte.',
  connectedCrew: 'VERBUNDENE CREW', openChannel: 'OFFENER KANAL', hostRole: 'SITZUNGSHOST • OPERATOR', assignedAtLaunch: 'ROLLE WIRD BEIM START VERGEBEN', waitingTech: 'Warte auf Techniker…',
  voiceRequired: 'SPRACHKOMMUNIKATION NÖTIG', voiceHelp: 'Nutzt einen Anruf, Discord oder euren bevorzugten telepathischen Kanal.', start: 'SCHICHT STARTEN', waitingHost: 'WARTE AUF DEN START DURCH DEN HOST',
  shiftEnds: 'SCHICHTENDE IN', stationStability: 'STATIONSSTABILITÄT', leaveAria: 'Sitzung verlassen', assignment: 'DEINE AUFGABE',
  operatorConsole: 'Operatorkonsole', operatorSubtitle: 'Du kannst die Steuerung bedienen. Du siehst die Prozeduren nicht.', describe: 'Beschreibe alles laut.',
  incidentModule: 'VORFALLMODUL', resolved: 'GELÖST', active: 'AKTIV', quantumRouter: 'Quantenrouter', reactorCalibration: 'Reaktorkalibrierung', translationMatrix: 'Übersetzungsmatrix',
  incomingCaller: 'EINGEHENDER ANRUF', selectNodes: 'Wähle zwei Knoten, um eine stabile Route herzustellen.', routeCore: ['ROUTEN-', 'KERN'], lockConnection: 'VERBINDUNG FIXIEREN',
  setDials: 'Stelle alle drei Kalibrierungsregler ein und aktiviere sie.', dial: 'REGLER', increaseDial: 'Regler erhöhen', decreaseDial: 'Regler verringern', core: 'KERN', engage: 'KALIBRIERUNG AKTIVIEREN',
  messageBuffer: 'NACHRICHTENPUFFER', enterSequence: 'Gib die Antwortsequenz ein. Gewählte Farben erscheinen unten.', clear: 'LÖSCHEN', transmit: 'SENDEN',
  readAloud: 'Lies nützliche Details laut vor.', clearance: 'FREIGABE 4½', incidentStatus: 'VORFALLSTATUS', doNot: 'NICHT', doNotText: 'Raten. Den Bildschirm des Operators berühren. Den Selbstbehalt erwähnen.',
  shiftLog: 'SCHICHTPROTOKOLL', now: 'JETZT', report: 'SCHICHTBERICHT', passable: 'AKZEPTABEL', catastrophic: 'KATASTROPHAL', alive: 'LEBEND AUSGESTEMPELT', offline: 'STATION OFFLINE',
  success: 'Technisch gesehen ein Erfolg.', failure: 'Das hätte besser laufen können.', crewScore: 'CREW-PUNKTE', newBest: 'NEUE PERSÖNLICHE BESTLEISTUNG', best: 'BESTWERT', replay: 'NEUE SCHICHT', waitingReplay: 'Warte darauf, dass der Host eine neue Schicht startet…', incidentsResolved: 'VORFÄLLE GELÖST', incorrectActions: 'FALSCHE AKTIONEN', systemsDamaged: 'SYSTEME BESCHÄDIGT', finalStability: 'ENDSTABILITÄT', unauthorizedWormholes: 'UNAUTORISIERTE WURMLÖCHER', returnDesk: 'ZURÜCK ZUM DESK', seed: 'SEED',
  status: { empty: '', calling: 'Station wird gerufen…', waiting: 'Warte auf Crew', connected: 'Direktverbindung hergestellt', stillCalling: 'Rufe weiter an… Falls das anhält, bitte den Host, seinen Tab offen zu lassen.', hostDisconnected: 'Host getrennt — Sitzung pausiert', sessionEnded: 'Der Host hat diese Sitzung beendet.', capacity: 'Diese Crew ist voll oder bereits mitten in der Schicht.' },
}

export type StatusId = keyof typeof en.status
export function ui(language: Locale) { return language === 'de' ? de : en }
