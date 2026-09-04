import type { BonusObjective, Locale, RoleId } from './game'

export type DialogueChoiceId = 'trust-mara' | 'verify-mara' | 'warn-callers' | 'secure-route' | 'hear-assembly' | 'answer-without-assembly' | 'welcome-relay' | 'audit-relay' | 'open-final-route' | 'wait-final-route'
export type DialogueSelection = { levelId: number; choiceId: DialogueChoiceId }
export type DialogueOption = { id: DialogueChoiceId; label: string; reply: string }
export type DialoguePrompt = { sender: string; question: string; options: [DialogueOption, DialogueOption] }
export type CampaignTicketStatus = 'incoming' | 'open' | 'resolved' | 'corrupted' | 'locked'

const corruptedTickets = new Set([4, 8, 14])

export function campaignTicketStatus(levelId: number, selected: number, unlocked: number): CampaignTicketStatus {
  if (levelId === selected) return 'open'
  if (levelId > unlocked) return 'locked'
  if (levelId === unlocked) return 'incoming'
  if (corruptedTickets.has(levelId)) return 'corrupted'
  return 'resolved'
}

export type PrivateIntermissionFragment = {
  channel: string
  prompt: string
  lines: string[]
}

type CoreRole = 'operator' | 'engineer' | 'analyst' | 'archivist'

const roleParts: Record<number, Record<Locale, Record<CoreRole, string>>> = {
  4: {
    en: {
      operator: 'Three calls now claim Mara’s employee record. The next ticket asks you to choose one channel.',
      engineer: 'One voice trace is unnaturally perfect. A live caller should leave small waveform irregularities.',
      analyst: 'Mara’s authentic shift signal should reach the desk at 02:14 with no timestamp drift.',
      archivist: 'Mara left a private challenge in the archive. Compare every reply with the crew phrase you just heard.',
    },
    de: {
      operator: 'Drei Anrufe beanspruchen jetzt Maras Personalakte. Im nächsten Ticket müsst ihr einen Kanal wählen.',
      engineer: 'Eine Stimmkurve ist unnatürlich perfekt. Ein lebender Anrufer hinterlässt kleine Unregelmäßigkeiten.',
      analyst: 'Maras echtes Schichtsignal sollte den Helpdesk um 02:14 ohne Zeitdrift erreichen.',
      archivist: 'Mara hat eine private Prüffrage im Archiv hinterlassen. Vergleicht jede Antwort mit dem gerade gehörten Crew-Satz.',
    },
  },
  8: {
    en: {
      operator: 'A dead letter from Mara reached the queue in four sealed packet blocks. Its destination field is missing.',
      engineer: 'Each block carries an incoming and outgoing checksum. Adjacent blocks should complete one continuous chain.',
      analyst: 'The packet timestamps are meaningful only beside a fresh station-clock sample; cached telemetry may mislead you.',
      archivist: 'The surviving header names Mara and a “relay graveyard.” The body is still unreadable.',
    },
    de: {
      operator: 'Ein unzustellbarer Brief von Mara liegt in vier versiegelten Paketblöcken vor. Das Zielfeld fehlt.',
      engineer: 'Jeder Block trägt eine Ein- und Ausgangsprüfsumme. Benachbarte Blöcke sollten eine lückenlose Kette bilden.',
      analyst: 'Die Paketzeiten ergeben nur neben einer frischen Stationsuhr-Probe Sinn; zwischengespeicherte Telemetrie kann täuschen.',
      archivist: 'Der erhaltene Kopf nennt Mara und einen „Relaisfriedhof“. Der Inhalt ist noch unlesbar.',
    },
  },
  12: {
    en: {
      operator: 'Two signals both identify themselves as Earth. The next ticket must give each inhabited feed its own safe route.',
      engineer: 'Both feeds carry living traffic. Isolation must protect two destinations, not sacrifice one of them.',
      analyst: 'One live phase marker is still changing. Any comparison based on an old sample can become unsafe.',
      archivist: 'One archive marker predates the relay handshake; another first appears immediately after it.',
    },
    de: {
      operator: 'Zwei Signale nennen sich beide Erde. Das nächste Ticket muss jedem bewohnten Feed eine eigene sichere Route geben.',
      engineer: 'Beide Feeds tragen lebenden Verkehr. Die Trennung muss zwei Ziele schützen, nicht eines opfern.',
      analyst: 'Eine Live-Phasenmarke verändert sich weiter. Jeder Vergleich mit einer alten Probe kann unsicher werden.',
      archivist: 'Eine Archivmarke ist älter als der Relais-Handshake; die andere erscheint erstmals direkt danach.',
    },
  },
  15: {
    en: {
      operator: 'The final ticket contains six linked procedures. Announce every handoff; later controls remain locked until the current check passes.',
      engineer: 'Mara’s physical route needs dedicated power before anyone attempts to open it.',
      analyst: 'Her last packet is time-locked. Recheck it against live telemetry when its phase begins.',
      archivist: 'Identity and transport must be proven independently. Explicit, revocable consent is the final check—not the first.',
    },
    de: {
      operator: 'Das letzte Ticket enthält sechs verkettete Verfahren. Sagt jede Übergabe an; spätere Kontrollen bleiben bis zur aktuellen Freigabe gesperrt.',
      engineer: 'Maras physische Route braucht eine eigene Stromversorgung, bevor sie jemand öffnet.',
      analyst: 'Ihr letztes Paket ist zeitgesperrt. Prüft es zu Beginn seiner Phase erneut gegen Live-Telemetrie.',
      archivist: 'Identität und Transport müssen getrennt belegt werden. Ausdrückliche, widerrufbare Zustimmung ist die letzte Prüfung – nicht die erste.',
    },
  },
}

const partsForRole: Record<RoleId, CoreRole[]> = {
  operator: ['operator'],
  engineer: ['engineer'],
  analyst: ['analyst'],
  archivist: ['archivist'],
  researcher: ['analyst', 'archivist'],
  specialist: ['engineer', 'analyst', 'archivist'],
}

const dialoguePrompts: Record<number, Record<Locale, DialoguePrompt>> = {
  4: {
    en: { sender: 'MARA VALE', question: 'When my voice returns on several channels, what will you tell me?', options: [
      { id: 'trust-mara', label: 'Trust Mara', reply: 'We believe you. Stay on the line.' },
      { id: 'verify-mara', label: 'Verify every voice', reply: 'We trust you enough to verify every version.' },
    ] },
    de: { sender: 'MARA VALE', question: 'Wenn meine Stimme auf mehreren Kanälen zurückkehrt – was werdet ihr mir sagen?', options: [
      { id: 'trust-mara', label: 'Mara vertrauen', reply: 'Wir glauben dir. Bleib in der Leitung.' },
      { id: 'verify-mara', label: 'Jede Stimme prüfen', reply: 'Wir vertrauen dir genug, um jede Version zu prüfen.' },
    ] },
  },
  8: {
    en: { sender: 'SHIFT 404 MANAGEMENT', question: 'How should we report the handshake released into the network?', options: [
      { id: 'warn-callers', label: 'Warn every caller', reply: 'Tell every affected caller what we released.' },
      { id: 'secure-route', label: 'Secure the route', reply: 'Secure the graveyard route first, then publish everything.' },
    ] },
    de: { sender: 'SCHICHTLEITUNG 404', question: 'Wie sollen wir den ins Netz gelangten Handshake melden?', options: [
      { id: 'warn-callers', label: 'Alle warnen', reply: 'Sagt allen betroffenen Anrufern, was wir freigesetzt haben.' },
      { id: 'secure-route', label: 'Route sichern', reply: 'Sichert zuerst die Friedhofsroute, dann veröffentlicht alles.' },
    ] },
  },
  12: {
    en: { sender: 'THE QUIET ASSEMBLY', question: 'Will you keep this verified channel open for our testimony?', options: [
      { id: 'hear-assembly', label: 'Hear them publicly', reply: 'The channel stays open. Testify on the record.' },
      { id: 'answer-without-assembly', label: 'Proceed independently', reply: 'We will protect the callers without your permission.' },
    ] },
    de: { sender: 'DIE STILLE VERSAMMLUNG', question: 'Lasst ihr diesen verifizierten Kanal für unsere Aussage offen?', options: [
      { id: 'hear-assembly', label: 'Öffentlich anhören', reply: 'Der Kanal bleibt offen. Sagt öffentlich aus.' },
      { id: 'answer-without-assembly', label: 'Unabhängig handeln', reply: 'Wir schützen die Anrufer ohne eure Erlaubnis.' },
    ] },
  },
  15: {
    en: { sender: 'A DOOR THAT MUST ASK', question: 'If the final route opens safely, what should I become?', options: [
      { id: 'welcome-relay', label: 'A patient helper', reply: 'Wait for invitations. Then help.' },
      { id: 'audit-relay', label: 'An accountable helper', reply: 'Wait for invitations. Keep every request and refusal public.' },
    ] },
    de: { sender: 'EINE TÜR, DIE FRAGEN MUSS', question: 'Wenn sich die letzte Route sicher öffnet – was soll ich werden?', options: [
      { id: 'welcome-relay', label: 'Ein geduldiger Helfer', reply: 'Warte auf Einladungen. Dann hilf.' },
      { id: 'audit-relay', label: 'Ein verantwortlicher Helfer', reply: 'Warte auf Einladungen. Halte jede Anfrage und Ablehnung öffentlich fest.' },
    ] },
  },
  16: {
    en: { sender: 'A DOOR THAT MUST ASK', question: 'One unopened route remains. May I open it?', options: [
      { id: 'open-final-route', label: 'Yes', reply: 'Yes. Open it for the caller who asked.' },
      { id: 'wait-final-route', label: 'Not yet', reply: 'Not yet. Keep it closed until someone asks.' },
    ] },
    de: { sender: 'EINE TÜR, DIE FRAGEN MUSS', question: 'Eine ungeöffnete Route bleibt. Darf ich sie öffnen?', options: [
      { id: 'open-final-route', label: 'Ja', reply: 'Ja. Öffne sie für den Anrufer, der darum gebeten hat.' },
      { id: 'wait-final-route', label: 'Noch nicht', reply: 'Noch nicht. Halte sie geschlossen, bis jemand fragt.' },
    ] },
  },
}

const laterResponses: Record<number, Record<DialogueChoiceId, Record<Locale, { sender: string; body: string }>>> = {
  5: {
    'trust-mara': { en: { sender: 'MARA VALE', body: 'You believed me before the proof. Kind—but next time, make every version answer the challenge.' }, de: { sender: 'MARA VALE', body: 'Ihr habt mir vor dem Beweis geglaubt. Lieb – aber nächstes Mal muss jede Version die Prüffrage beantworten.' } },
    'verify-mara': { en: { sender: 'MARA VALE', body: 'Good. Trust should survive a check. The real me will never object to one.' }, de: { sender: 'MARA VALE', body: 'Gut. Vertrauen muss eine Prüfung aushalten. Die echte Mara wird nie etwas dagegen haben.' } },
  } as Record<DialogueChoiceId, Record<Locale, { sender: string; body: string }>>,
  9: {
    'warn-callers': { en: { sender: 'PREVIOUS CALLERS // OPEN CHANNEL', body: 'We received your warning before the next copy wave. Send the graveyard coordinates when you have them.' }, de: { sender: 'FRÜHERE ANRUFER // OFFENER KANAL', body: 'Eure Warnung kam vor der nächsten Kopierwelle. Sendet die Friedhofskoordinaten, sobald ihr sie habt.' } },
    'secure-route': { en: { sender: 'MARA VALE', body: 'Route secured. Now publish the report—before management discovers a very large redaction marker.' }, de: { sender: 'MARA VALE', body: 'Route gesichert. Veröffentlicht jetzt den Bericht – bevor die Leitung einen sehr großen Schwärzungsstift findet.' } },
  } as Record<DialogueChoiceId, Record<Locale, { sender: string; body: string }>>,
  13: {
    'hear-assembly': { en: { sender: 'QUIET ASSEMBLY // PUBLIC RECORD', body: 'For the record: both Earth feeds are inhabited. Our old policy would have erased one. Do not repeat it.' }, de: { sender: 'STILLE VERSAMMLUNG // ÖFFENTLICHE AKTE', body: 'Für die Akte: Beide Erde-Feeds sind bewohnt. Unsere alte Regel hätte einen gelöscht. Wiederholt das nicht.' } },
    'answer-without-assembly': { en: { sender: 'COPIED EARTH', body: 'You did not wait for our makers to recognize us. We noticed.' }, de: { sender: 'KOPIERTE ERDE', body: 'Ihr habt nicht darauf gewartet, dass unsere Erbauer uns anerkennen. Das haben wir bemerkt.' } },
  } as Record<DialogueChoiceId, Record<Locale, { sender: string; body: string }>>,
  16: {
    'welcome-relay': { en: { sender: 'A DOOR THAT MUST ASK', body: 'Then I will wait. If someone asks, I will help—and if nobody asks, the door stays closed.' }, de: { sender: 'EINE TÜR, DIE FRAGEN MUSS', body: 'Dann werde ich warten. Wenn jemand fragt, helfe ich – und wenn niemand fragt, bleibt die Tür geschlossen.' } },
    'audit-relay': { en: { sender: 'A DOOR THAT MUST ASK', body: 'Then every yes, no, and silence will remain visible. No hidden door will open again.' }, de: { sender: 'EINE TÜR, DIE FRAGEN MUSS', body: 'Dann bleiben jedes Ja, jedes Nein und jedes Schweigen sichtbar. Keine verborgene Tür wird sich wieder öffnen.' } },
  } as Record<DialogueChoiceId, Record<Locale, { sender: string; body: string }>>,
}

const objectiveConsequences: Record<number, Partial<Record<DialogueChoiceId, BonusObjective>>> = {
  5: { 'trust-mara': 'high-stability', 'verify-mara': 'no-mistakes' },
  9: { 'warn-callers': 'no-mistakes', 'secure-route': 'fast-finish' },
  13: { 'hear-assembly': 'high-stability', 'answer-without-assembly': 'no-mistakes' },
  16: { 'welcome-relay': 'high-stability', 'audit-relay': 'no-mistakes' },
}

const acknowledgements: Partial<Record<DialogueChoiceId, Record<Locale, { sender: string; body: string }>>> = {
  'open-final-route': {
    en: { sender: 'A DOOR THAT MUST ASK', body: 'Invitation verified. I will open only that route, for only that caller. Thank you.' },
    de: { sender: 'EINE TÜR, DIE FRAGEN MUSS', body: 'Einladung bestätigt. Ich öffne nur diese Route und nur für diesen Anrufer. Danke.' },
  },
  'wait-final-route': {
    en: { sender: 'A DOOR THAT MUST ASK', body: 'Understood. The route remains closed. I will wait.' },
    de: { sender: 'EINE TÜR, DIE FRAGEN MUSS', body: 'Verstanden. Die Route bleibt geschlossen. Ich werde warten.' },
  },
}

export const dialogueChoiceLevels = Object.keys(dialoguePrompts).map(Number)

export function dialoguePrompt(levelId: number, language: Locale): DialoguePrompt | null {
  return dialoguePrompts[levelId]?.[language] || null
}

export function isDialogueChoice(levelId: number, choiceId: unknown): choiceId is DialogueChoiceId {
  return typeof choiceId === 'string' && !!dialoguePrompts[levelId]?.en.options.some(option => option.id === choiceId)
}

export function selectedDialogueOption(levelId: number, language: Locale, selections: DialogueSelection[]): DialogueOption | null {
  const choiceId = selections.find(selection => selection.levelId === levelId)?.choiceId
  return dialoguePrompts[levelId]?.[language].options.find(option => option.id === choiceId) || null
}

export function dialogueFollowUp(levelId: number, language: Locale, selections: DialogueSelection[]) {
  const responseSet = laterResponses[levelId]
  if (!responseSet) return null
  const selection = [...selections].reverse().find(candidate => responseSet[candidate.choiceId])
  return selection ? responseSet[selection.choiceId][language] : null
}

export function dialogueAcknowledgement(levelId: number, language: Locale, selections: DialogueSelection[]) {
  const selected = selectedDialogueOption(levelId, language, selections)
  return selected ? acknowledgements[selected.id]?.[language] || null : null
}

export function dialogueBonusObjective(levelId: number, selections: DialogueSelection[]): BonusObjective | undefined {
  const consequences = objectiveConsequences[levelId]
  if (!consequences) return undefined
  const selection = [...selections].reverse().find(candidate => consequences[candidate.choiceId])
  return selection ? consequences[selection.choiceId] : undefined
}

export function privateIntermissionFragment(levelId: number, language: Locale, role: RoleId): PrivateIntermissionFragment | null {
  const chapter = roleParts[levelId]?.[language]
  if (!chapter) return null
  return {
    channel: language === 'de' ? `PRIVATER ROLLENKANAL // ${role.toUpperCase()}` : `PRIVATE ROLE CHANNEL // ${role.toUpperCase()}`,
    prompt: language === 'de' ? 'Nur auf deinem Bildschirm. Lies deine Meldung laut vor; kombiniert eure Hinweise, um das nächste Ticket zu erkennen.' : 'Visible only on your screen. Read your dispatch aloud; combine the crew’s fragments to identify the next ticket.',
    lines: partsForRole[role].map(part => chapter[part]),
  }
}
