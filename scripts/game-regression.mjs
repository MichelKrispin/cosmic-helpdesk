import assert from 'node:assert/strict'
import { createServer } from 'vite'
import { decodeRequestPath } from '../request-path.mjs'

const vite = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' })

try {
  const game = await vite.ssrLoadModule('/src/game.ts')
  const session = await vite.ssrLoadModule('/src/session.ts')
  const campaignSave = await vite.ssrLoadModule('/src/campaign-save.ts')
  const intermission = await vite.ssrLoadModule('/src/intermission.ts')
  const i18n = await vite.ssrLoadModule('/src/i18n.ts')

  const startedAt = 1_000
  const narrativeFields = ['title', 'summary', 'briefing', 'success', 'failure', 'caller', 'objective', 'transition']
  const chapterText = (chapter) => [
    ...narrativeFields.map(field => chapter[field].en),
    chapter.archiveFragment?.en || '',
    ...Object.values(chapter.moduleOutcomes).map(outcome => outcome.en),
  ].join(' ')
  const dossierText = (chapter) => ['title', 'summary', 'briefing', 'caller', 'objective'].map(field => chapter[field].en).join(' ')
  assert.deepEqual(game.campaignLevels.map(chapter => chapter.id), Array.from({ length: 16 }, (_, index) => index + 1), 'the campaign must contain one ordered chapter for every level')
  for (const chapter of game.campaignLevels) {
    for (const field of narrativeFields) {
      assert.ok(chapter[field].en.trim(), `campaign level ${chapter.id} needs English ${field} text`)
      assert.ok(chapter[field].de.trim(), `campaign level ${chapter.id} needs German ${field} text`)
    }
    assert.ok(chapter.briefing.en.trim().split(/\s+/).length <= 24, `campaign level ${chapter.id} briefing must remain short enough to read aloud`)
    assert.ok(!chapter.archiveFragment || chapter.archiveFragment.de.trim(), `campaign level ${chapter.id} needs a German archive fragment`)
    for (const module of chapter.activeModules) {
      assert.ok(chapter.moduleOutcomes[module]?.en.trim(), `campaign level ${chapter.id} needs an English story outcome for ${module}`)
      assert.ok(chapter.moduleOutcomes[module]?.de.trim(), `campaign level ${chapter.id} needs a German story outcome for ${module}`)
    }
  }
  const sharedUiValues = []
  const compareUi = (english, german, path = '') => {
    if (typeof english === 'string') {
      assert.equal(typeof german, 'string', `German UI value missing at ${path}`)
      if (english === german) sharedUiValues.push(path)
      return
    }
    if (Array.isArray(english)) return english.forEach((value, index) => compareUi(value, german[index], `${path}[${index}]`))
    for (const [key, value] of Object.entries(english)) compareUi(value, german[key], path ? `${path}.${key}` : key)
  }
  compareUi(i18n.ui('en'), i18n.ui('de'))
  assert.deepEqual(sharedUiValues.sort(), ['english', 'german', 'level', 'offline', 'originalReality', 'seed', 'status.empty', 'tickets'].sort(), 'new UI copy must not silently reuse English in German')

  const allowedSharedManualText = new Set(['analyst', 'archivist', 'engineer', 'mint', 'orange', 'pink', 'Band', 'Block', 'Orbital', 'STANDARD', 'Status', '◆ MAGENTA', '◉  Halo', '◉  Phase', '● CYAN', '✦  Nova'])
  const compareLocalizedText = (english, german) => {
    if (typeof english === 'string' && english === german && /[A-Za-z]{3}/.test(english)) {
      const isIdentifier = /^(?:\d+ THz|\d\d:\d\d \/\/ DRIFT [\d+ ]+(?:ms|s)|PKT-[A-Z0-9]+|Nova ↔ Halo)$/.test(english)
      assert.ok(isIdentifier || allowedSharedManualText.has(english), `German role view still reuses English text: ${english}`)
      return
    }
    if (Array.isArray(english) && Array.isArray(german)) return english.forEach((value, index) => compareLocalizedText(value, german[index]))
    if (english && german && typeof english === 'object' && typeof german === 'object') {
      for (const key of Object.keys(english)) if (key in german) compareLocalizedText(english[key], german[key])
    }
  }
  for (const levelId of game.campaignLevels.map(level => level.id)) {
    const english = game.createGame(10_000 + levelId, 4, 'en', startedAt, 'standard', 'campaign', levelId)
    const german = game.createGame(10_000 + levelId, 4, 'de', startedAt, 'standard', 'campaign', levelId)
    english.phases = [[...english.activeModules]]
    german.phases = [[...german.activeModules]]
    for (const role of ['engineer', 'analyst', 'archivist']) compareLocalizedText(game.viewForRole(english, role, startedAt).manual, game.viewForRole(german, role, startedAt).manual)
  }
  assert.doesNotMatch(dossierText(game.campaignLevels[0]), /Mara Vale/, 'level 1 must not name its unknown caller before identification')
  assert.match(game.campaignLevels[0].success.en, /Mara Vale/, 'level 1 success must reveal Mara')
  assert.doesNotMatch(game.campaignLevels.slice(0, 3).map(chapterText).join(' '), /Quiet Assembly/, 'the builders’ name must remain hidden before level 4')
  assert.doesNotMatch(dossierText(game.campaignLevels[3]), /Quiet Assembly/, 'level 4 must identify the builders through play, not in its dossier')
  assert.match(game.campaignLevels[3].success.en, /Quiet Assembly/, 'level 4 success must reveal the builders’ name')
  assert.doesNotMatch(game.campaignLevels.slice(0, 10).map(chapterText).join(' '), /copies are conscious|Copies remember waking|They are people|conscious cop/i, 'copy personhood must not be claimed before the level 11 testimony')
  assert.match(game.campaignLevels[10].success.en, /copies are conscious/, 'level 11 success must establish copy personhood')
  assert.doesNotMatch(game.campaignLevels.slice(0, 11).map(chapterText).join(' '), /treated silence as permission|silence was accepted as consent/i, 'the relay’s consent failure must remain hidden before level 12')
  assert.match(game.campaignLevels[11].success.en, /silence as permission/, 'level 12 success must reveal the relay’s consent failure')
  assert.doesNotMatch(game.campaignLevels.slice(0, 13).map(chapterText).join(' '), /A Door That Must Ask/, 'the relay’s true name must remain hidden before level 14')
  assert.match(game.campaignLevels[13].success.en, /A Door That Must Ask/, 'level 14 success must reveal the relay’s true name')

  const state = game.createGame(1, 2, 'en', startedAt, 'standard', 'campaign', 1)
  const late = game.applyAction(state, {
    id: 'late-action',
    type: 'reactor-calibrate',
    dials: game.reactorSolution(state),
  }, state.endsAt + 60_000)
  assert.equal(late.outcome, 'lost', 'an action submitted after the deadline must not win')

  const levelTwo = game.createGame(22, 4, 'en', startedAt, 'standard', 'campaign', 2)
  const initialLevelTwoView = game.viewForRole(levelTwo, 'archivist', startedAt)
  assert.deepEqual(initialLevelTwoView.visibleModules, ['reactor'], 'campaign missions must reveal only their current phase')
  assert.doesNotMatch(JSON.stringify(initialLevelTwoView.manual), /Archive card 88-B/, 'future-phase clues must remain hidden')
  const earlyRouterPair = game.routerSolution(levelTwo)
  const earlyRouterNodes = earlyRouterPair.map(symbol => levelTwo.router.nodes.find(node => node.symbol === symbol).id)
  const earlyRouter = game.applyAction(levelTwo, { id: 'early-router', type: 'router-connect', a: earlyRouterNodes[0], b: earlyRouterNodes[1] }, startedAt + 1)
  assert.equal(earlyRouter.router.resolved, false)
  assert.equal(earlyRouter.stability, levelTwo.stability, 'submissions for future phases must be ignored without penalty')
  const levelTwoReactor = game.applyAction(levelTwo, { id: 'level-two-reactor', type: 'reactor-calibrate', dials: game.reactorSolution(levelTwo) }, startedAt + 2)
  const archivist = game.viewForRole(levelTwoReactor, 'archivist', startedAt + 2)
  assert.deepEqual(archivist.visibleModules, ['router'])
  assert.equal(archivist.moduleStatus.reactor, true, 'completed phases must remain visible in mission status')
  const legend = archivist.manual.panels.find((panel) => panel.title === 'Archive card 88-B')
  assert.equal(legend.rows.length, 4, 'router missions must provide a complete glyph-name legend')

  const earlySpecialistHint = game.viewForRole(state, 'specialist', startedAt + 50_000).hint
  const lateSpecialistHint = game.viewForRole(state, 'specialist', startedAt + 100_000).hint
  const lateOperatorHint = game.viewForRole(state, 'operator', startedAt + 100_000).hint
  assert.match(earlySpecialistHint, /Read all four numbers/)
  assert.match(lateSpecialistHint, /EMERGENCY HINT/)
  assert.doesNotMatch(lateOperatorHint, /Dials A \/ B \/ C are/)

  let followUp = game.createGame(99, 4, 'en', startedAt, 'standard', 'campaign', 9)
  const solveActiveModules = () => {
    if (followUp.activeModules.includes('packet') && !followUp.packet.resolved) followUp = game.applyAction(followUp, { id: crypto.randomUUID(), type: 'packet-submit', tileIds: game.packetSolution(followUp) }, startedAt + 1)
    if (followUp.activeModules.includes('reactor') && !followUp.reactor.resolved) followUp = game.applyAction(followUp, { id: crypto.randomUUID(), type: 'reactor-calibrate', dials: game.reactorSolution(followUp) }, startedAt + 1)
    if (followUp.activeModules.includes('router') && !followUp.router.resolved) {
      const pair = game.routerSolution(followUp)
      const ids = pair.map((symbol) => followUp.router.nodes.find((node) => node.symbol === symbol).id)
      followUp = game.applyAction(followUp, { id: crypto.randomUUID(), type: 'router-connect', a: ids[0], b: ids[1] }, startedAt + 2)
    }
    if (followUp.activeModules.includes('translation') && !followUp.translation.resolved) followUp = game.applyAction(followUp, { id: crypto.randomUUID(), type: 'translation-submit', sequence: game.translationSolution(followUp) }, startedAt + 3)
  }
  solveActiveModules()
  assert.equal(followUp.outcome, 'playing', 'later chapters must open a follow-up ticket')
  assert.equal(followUp.followUpTriggered, true)
  assert.equal(followUp.incidentsResolved, followUp.activeModules.length)
  solveActiveModules()
  assert.equal(followUp.outcome, 'won')
  assert.equal(followUp.incidentsResolved, followUp.targetIncidents)

  const authLevel = game.createGame(505, 4, 'en', startedAt, 'standard', 'campaign', 5)
  const authRepeat = game.createGame(505, 4, 'en', startedAt, 'standard', 'campaign', 5)
  assert.deepEqual(authLevel.authentication, authRepeat.authentication, 'authentication candidates must be deterministic for a campaign seed')
  assert.deepEqual(new Set(authLevel.authentication.candidates.map(candidate => candidate.kind)), new Set(['genuine', 'relay-generated', 'corrupted']), 'authentication must include genuine, relay-generated, and corrupted candidates')
  const wrongCandidate = authLevel.authentication.candidates.find(candidate => candidate.kind === 'relay-generated')
  const rejectedCaller = game.applyAction(authLevel, { id: 'wrong-caller', type: 'authentication-submit', candidateId: wrongCandidate.id }, startedAt + 1)
  assert.equal(rejectedCaller.authentication.resolved, false)
  assert.equal(rejectedCaller.stability, 85, 'accepting an imitation must damage stability')
  const verifiedCaller = game.applyAction(authLevel, { id: 'real-caller', type: 'authentication-submit', candidateId: game.authenticationSolution(authLevel) }, startedAt + 1)
  assert.equal(verifiedCaller.authentication.resolved, true)
  assert.match(verifiedCaller.log[0], /belongs to Mara/)

  const operatorAuth = game.viewForRole(authLevel, 'operator', startedAt)
  const operatorSecrets = JSON.stringify(operatorAuth.operator.authentication)
  assert.doesNotMatch(operatorSecrets, /correctId|timestamp|waveform|challenge|certificate|genuine|relay-generated|corrupted/, 'the Operator must not receive authentication answers or specialist evidence')
  const analystAuth = JSON.stringify(game.viewForRole(authLevel, 'analyst', startedAt).manual)
  const archivistAuth = JSON.stringify(game.viewForRole(authLevel, 'archivist', startedAt).manual)
  const engineerAuth = JSON.stringify(game.viewForRole(authLevel, 'engineer', startedAt).manual)
  assert.match(analystAuth, /Timing & waveform/)
  assert.doesNotMatch(analystAuth, /None\. We work helpdesk|VALID CHAIN/)
  assert.match(archivistAuth, /Private challenge response/)
  assert.doesNotMatch(archivistAuth, /DRIFT|VALID CHAIN/)
  assert.match(engineerAuth, /Certificate chain/)
  assert.doesNotMatch(engineerAuth, /None\. We work helpdesk|DRIFT/)
  const specialistAuth = JSON.stringify(game.viewForRole(authLevel, 'specialist', startedAt).manual)
  assert.match(specialistAuth, /Timing & waveform/)
  assert.match(specialistAuth, /Private challenge response/)
  assert.match(specialistAuth, /Certificate chain/, 'two-player crews must receive every authentication clue domain')

  for (const levelId of [5, 11]) {
    let mission = game.createGame(700 + levelId, 4, 'en', startedAt, 'standard', 'campaign', levelId)
    for (let pass = 0; pass < 2 && mission.outcome === 'playing'; pass += 1) {
      if (!mission.authentication.resolved) mission = game.applyAction(mission, { id: `auth-${levelId}-${pass}`, type: 'authentication-submit', candidateId: game.authenticationSolution(mission) }, startedAt + pass * 10 + 1)
      if (!mission.router.resolved) {
        const pair = game.routerSolution(mission)
        const ids = pair.map(symbol => mission.router.nodes.find(node => node.symbol === symbol).id)
        mission = game.applyAction(mission, { id: `router-${levelId}-${pass}`, type: 'router-connect', a: ids[0], b: ids[1] }, startedAt + pass * 10 + 2)
      }
      if (!mission.translation.resolved) mission = game.applyAction(mission, { id: `translation-${levelId}-${pass}`, type: 'translation-submit', sequence: game.translationSolution(mission) }, startedAt + pass * 10 + 3)
    }
    assert.equal(mission.outcome, 'won', `authentication campaign level ${levelId} must have a deterministic solution path`)
  }

  const packetLevel = game.createGame(606, 4, 'en', startedAt, 'standard', 'campaign', 6)
  const packetRepeat = game.createGame(606, 4, 'en', startedAt, 'standard', 'campaign', 6)
  assert.deepEqual(packetLevel.packet, packetRepeat.packet, 'temporal packet generation must be deterministic for a campaign seed')
  assert.equal(new Set(packetLevel.packet.tiles.map(tile => tile.timestamp)).size, 4, 'packet timestamps must be unique')
  const packetOrder = game.packetSolution(packetLevel)
  assert.equal(new Set(packetOrder).size, 4, 'the packet solution must use every tile exactly once')
  packetOrder.forEach((id, index) => {
    const current = packetLevel.packet.tiles.find(tile => tile.id === id)
    const next = packetLevel.packet.tiles.find(tile => tile.id === packetOrder[(index + 1) % packetOrder.length])
    assert.equal(current.checksumOut, next.checksumIn, 'the checksum ring must confirm every adjacent packet tile')
  })
  const packetOperatorBefore = game.viewForRole(packetLevel, 'operator', startedAt)
  assert.equal(packetOperatorBefore.operator.packet.message, undefined, 'the reconstructed message must remain hidden until success')
  assert.doesNotMatch(JSON.stringify(packetOperatorBefore.operator.packet), /timestamp|checksum|direction/, 'the Operator must not receive packet ordering evidence')
  const packetSolved = game.applyAction(packetLevel, { id: 'packet-correct', type: 'packet-submit', tileIds: packetOrder }, startedAt + 1)
  assert.equal(packetSolved.packet.resolved, true)
  assert.match(packetSolved.log[0], /Message reconstructed/)
  assert.match(game.viewForRole(packetSolved, 'operator', startedAt + 1).operator.packet.message, /OPENS WITHOUT/, 'the reconstructed message must appear immediately after success')

  const analystPacket = JSON.stringify(game.viewForRole(packetLevel, 'analyst', startedAt).manual)
  const archivistPacket = JSON.stringify(game.viewForRole(packetLevel, 'archivist', startedAt).manual)
  const engineerPacket = JSON.stringify(game.viewForRole(packetLevel, 'engineer', startedAt).manual)
  assert.match(analystPacket, /Packet timestamps/)
  assert.doesNotMatch(analystPacket, /LOW → HIGH|HIGH → LOW|Checksum ring/)
  assert.match(archivistPacket, /Sender reading direction/)
  assert.doesNotMatch(archivistPacket, /T\+214|Block transitions/)
  assert.match(engineerPacket, /Verify block transitions/)
  assert.doesNotMatch(engineerPacket, /T\+214|LOW → HIGH|HIGH → LOW/)
  const specialistPacket = JSON.stringify(game.viewForRole(packetLevel, 'specialist', startedAt).manual)
  assert.match(specialistPacket, /Packet timestamps/)
  assert.match(specialistPacket, /Sender reading direction/)
  assert.match(specialistPacket, /Verify block transitions/, 'two-player crews must receive every packet clue domain')

  const oldPacketOrder = game.packetSolution(packetLevel)
  packetLevel.shiftRules.pressureEveryMs = 10_000
  const driftedPacket = game.advanceClock(packetLevel, startedAt + 10_000)
  assert.notDeepEqual(game.packetSolution(driftedPacket), oldPacketOrder, 'a pressure surge must change the live packet ordering')
  assert.deepEqual(driftedPacket.variationGrace.packet, oldPacketOrder)
  const packetGraceAccepted = game.applyAction(driftedPacket, { id: 'packet-grace', type: 'packet-submit', tileIds: oldPacketOrder }, startedAt + 12_000)
  assert.equal(packetGraceAccepted.packet.resolved, true, 'the pre-surge packet order must remain valid during grace')

  const consentLevel = game.createGame(1212, 4, 'en', startedAt, 'standard', 'campaign', 12)
  const consentRepeat = game.createGame(1212, 4, 'en', startedAt, 'standard', 'campaign', 12)
  assert.deepEqual(consentLevel.consent, consentRepeat.consent, 'consent handshake generation must be deterministic for a campaign seed')
  assert.deepEqual(new Set(consentLevel.consent.responses.map(response => response.kind)), new Set(['yes', 'silence', 'no']))
  assert.deepEqual(consentLevel.consent.requiredSequence, ['connect', 'disconnect'], 'level 12 must introduce the short handshake')
  const finalConsent = game.createGame(1616, 4, 'en', startedAt, 'standard', 'campaign', 16)
  assert.deepEqual(finalConsent.consent.requiredSequence, ['connect', 'retain', 'disconnect'], 'the finale must require the full handshake')
  assert.equal(finalConsent.consent.requiredSequence.includes('copy'), false)
  assert.equal(finalConsent.consent.requiredSequence.includes('reopen'), false)

  const operatorConsent = game.viewForRole(consentLevel, 'operator', startedAt)
  assert.equal(operatorConsent.operator.consent.ready, false)
  assert.doesNotMatch(JSON.stringify(operatorConsent.operator.consent), /correctResponseId|requiredSequence|EXPLICIT YES|SILENCE|EXPLICIT NO|"kind"/, 'the Operator must not receive the response meaning or solution')
  let readyConsent = consentLevel
  const consentPair = game.routerSolution(readyConsent)
  const consentNodes = consentPair.map(symbol => readyConsent.router.nodes.find(node => node.symbol === symbol).id)
  readyConsent = game.applyAction(readyConsent, { id: 'consent-router', type: 'router-connect', a: consentNodes[0], b: consentNodes[1] }, startedAt + 2)
  readyConsent = game.applyAction(readyConsent, { id: 'consent-translation', type: 'translation-submit', sequence: game.translationSolution(readyConsent) }, startedAt + 3)
  const analystConsent = JSON.stringify(game.viewForRole(readyConsent, 'analyst', startedAt + 3).manual)
  const archivistConsent = JSON.stringify(game.viewForRole(readyConsent, 'archivist', startedAt + 3).manual)
  const engineerConsent = JSON.stringify(game.viewForRole(readyConsent, 'engineer', startedAt + 3).manual)
  assert.match(analystConsent, /Verify current intent/)
  assert.match(analystConsent, /EXPLICIT YES/)
  assert.doesNotMatch(analystConsent, /Invited access|ALLOWED/)
  assert.match(archivistConsent, /Map the limited scope/)
  assert.match(archivistConsent, /Invited access/)
  assert.doesNotMatch(archivistConsent, /EXPLICIT YES|RESPONSE CHANNEL A/)
  assert.match(engineerConsent, /Order handshake phases/)
  assert.doesNotMatch(engineerConsent, /ALLOWED|DENIED|RESPONSE CHANNEL A/)
  const specialistConsent = JSON.stringify(game.viewForRole(readyConsent, 'specialist', startedAt + 3).manual)
  assert.match(specialistConsent, /Verify current intent/)
  assert.match(specialistConsent, /Map the limited scope/)
  assert.match(specialistConsent, /Order handshake phases/, 'two-player crews must receive every consent clue domain')

  const lockedConsent = game.applyAction(consentLevel, { id: 'consent-too-early', type: 'consent-submit', ...game.consentSolution(consentLevel) }, startedAt + 1)
  assert.equal(lockedConsent.consent.resolved, false, 'consent must remain locked until every prerequisite module is resolved')
  assert.equal(lockedConsent.stability, consentLevel.stability, 'the safety lock must not punish an early submission')
  assert.equal(game.viewForRole(readyConsent, 'operator', startedAt + 3).operator.consent.ready, true)
  const silentResponse = readyConsent.consent.responses.find(response => response.kind === 'silence').id
  const silenceRejected = game.applyAction(readyConsent, { id: 'consent-silence', type: 'consent-submit', permissions: game.consentSolution(readyConsent).permissions, responseId: silentResponse }, startedAt + 4)
  assert.equal(silenceRejected.consent.resolved, false)
  assert.ok(silenceRejected.stability < readyConsent.stability)
  assert.match(silenceRejected.log[0], /silence is not consent/)
  let consentMission = game.applyAction(readyConsent, { id: 'consent-correct', type: 'consent-submit', ...game.consentSolution(readyConsent) }, startedAt + 4)
  assert.equal(consentMission.consent.resolved, true)
  for (let pass = 0; pass < 2 && consentMission.outcome === 'playing'; pass += 1) {
    if (!consentMission.router.resolved) {
      const pair = game.routerSolution(consentMission)
      const ids = pair.map(symbol => consentMission.router.nodes.find(node => node.symbol === symbol).id)
      consentMission = game.applyAction(consentMission, { id: `consent-followup-router-${pass}`, type: 'router-connect', a: ids[0], b: ids[1] }, startedAt + 10 + pass)
    }
    if (!consentMission.translation.resolved) consentMission = game.applyAction(consentMission, { id: `consent-followup-translation-${pass}`, type: 'translation-submit', sequence: game.translationSolution(consentMission) }, startedAt + 12 + pass)
    if (!consentMission.consent.resolved) consentMission = game.applyAction(consentMission, { id: `consent-followup-${pass}`, type: 'consent-submit', ...game.consentSolution(consentMission) }, startedAt + 14 + pass)
  }
  assert.equal(consentMission.outcome, 'won', 'consent campaign level 12 must have a deterministic solution path')

  const triageLevel = game.createGame(707, 4, 'en', startedAt, 'standard', 'campaign', 7)
  const triageRepeat = game.createGame(707, 4, 'en', startedAt, 'standard', 'campaign', 7)
  assert.deepEqual(triageLevel.triage, triageRepeat.triage, 'power triage generation must be deterministic for a campaign seed')
  const safeAllocation = game.triageSolution(triageLevel)
  assert.equal(safeAllocation.reduce((total, allocation) => total + allocation.units, 0), triageLevel.triage.budget, 'the safe allocation must use the full emergency budget')
  assert.ok(safeAllocation.every(allocation => {
    const habitat = triageLevel.triage.habitats.find(candidate => candidate.id === allocation.habitatId)
    return allocation.units > 0 && allocation.units <= habitat.capacity
  }), 'every occupied habitat must receive positive power within line capacity')

  const operatorTriage = game.viewForRole(triageLevel, 'operator', startedAt)
  assert.doesNotMatch(JSON.stringify(operatorTriage.operator.triage), /baseMinimum|load|heat|capacity|reserve|linkedTo/, 'the Operator must not receive specialist power evidence')
  const analystTriage = JSON.stringify(game.viewForRole(triageLevel, 'analyst', startedAt).manual)
  const archivistTriage = JSON.stringify(game.viewForRole(triageLevel, 'archivist', startedAt).manual)
  const engineerTriage = JSON.stringify(game.viewForRole(triageLevel, 'engineer', startedAt).manual)
  assert.match(analystTriage, /Load & line heat/)
  assert.doesNotMatch(analystTriage, /Survival minimum|Grid formula|Capacity/)
  assert.match(archivistTriage, /Survival minimum/)
  assert.doesNotMatch(archivistTriage, /HIGH \+1|HOT \+1|Grid formula/)
  assert.match(engineerTriage, /Grid formula & dependencies/)
  assert.doesNotMatch(engineerTriage, /Survival minimum|HIGH \+1|COOL \+0/)
  const specialistTriage = JSON.stringify(game.viewForRole(triageLevel, 'specialist', startedAt).manual)
  assert.match(specialistTriage, /Load & line heat/)
  assert.match(specialistTriage, /Survival minimum/)
  assert.match(specialistTriage, /Grid formula & dependencies/, 'two-player crews must receive every power-triage clue domain')

  const lockedReactor = game.applyAction(triageLevel, { id: 'triage-lock-check', type: 'reactor-calibrate', dials: game.reactorSolution(triageLevel) }, startedAt + 1)
  assert.equal(lockedReactor.reactor.resolved, false, 'downstream systems must remain locked until power triage is complete')
  assert.equal(lockedReactor.stability, triageLevel.stability, 'the dependency lock must not punish an early action')
  const unsafeAllocation = safeAllocation.map(allocation => ({ ...allocation }))
  unsafeAllocation[0].units -= 1
  unsafeAllocation[1].units += 1
  const rejectedPower = game.applyAction(triageLevel, { id: 'triage-unsafe', type: 'triage-submit', allocations: unsafeAllocation }, startedAt + 2)
  assert.equal(rejectedPower.triage.resolved, false)
  assert.match(rejectedPower.log[0], /every occupied habitat|at least one occupied habitat/)
  const telemetryBeforeTriage = structuredClone(triageLevel.reactor.telemetry)
  const frequencyBeforeTriage = triageLevel.router.baseFrequency
  const stablePower = game.applyAction(triageLevel, { id: 'triage-safe', type: 'triage-submit', allocations: safeAllocation }, startedAt + 2)
  assert.equal(stablePower.triage.resolved, true)
  assert.notDeepEqual(stablePower.reactor.telemetry, telemetryBeforeTriage, 'power allocation must recalculate reactor telemetry')
  assert.notEqual(stablePower.router.baseFrequency, frequencyBeforeTriage, 'power allocation must recalculate router frequency')

  for (const levelId of [7, 10]) {
    let mission = game.createGame(1000 + levelId, 4, 'en', startedAt, 'standard', 'campaign', levelId)
    for (let pass = 0; pass < 2 && mission.outcome === 'playing'; pass += 1) {
      if (!mission.triage.resolved) mission = game.applyAction(mission, { id: `triage-${levelId}-${pass}`, type: 'triage-submit', allocations: game.triageSolution(mission) }, startedAt + pass * 10 + 1)
      if (mission.activeModules.includes('quarantine') && !mission.quarantine.resolved) mission = game.applyAction(mission, { id: `quarantine-${levelId}-${pass}`, type: 'quarantine-submit', choices: game.quarantineSolution(mission) }, startedAt + pass * 10 + 2)
      if (mission.activeModules.includes('reactor') && !mission.reactor.resolved) mission = game.applyAction(mission, { id: `triage-reactor-${levelId}-${pass}`, type: 'reactor-calibrate', dials: game.reactorSolution(mission) }, startedAt + pass * 10 + 2)
      if (mission.activeModules.includes('router') && !mission.router.resolved) {
        const pair = game.routerSolution(mission)
        const ids = pair.map(symbol => mission.router.nodes.find(node => node.symbol === symbol).id)
        mission = game.applyAction(mission, { id: `triage-router-${levelId}-${pass}`, type: 'router-connect', a: ids[0], b: ids[1] }, startedAt + pass * 10 + 3)
      }
      if (mission.activeModules.includes('translation') && !mission.translation.resolved) mission = game.applyAction(mission, { id: `triage-translation-${levelId}-${pass}`, type: 'translation-submit', sequence: game.translationSolution(mission) }, startedAt + pass * 10 + 4)
    }
    assert.equal(mission.outcome, 'won', `power-triage campaign level ${levelId} must have a deterministic solution path`)
  }

  const quarantineLevel = game.createGame(1010, 4, 'en', startedAt, 'standard', 'campaign', 10)
  const quarantineRepeat = game.createGame(1010, 4, 'en', startedAt, 'standard', 'campaign', 10)
  assert.deepEqual(quarantineLevel.quarantine, quarantineRepeat.quarantine, 'quarantine generation must be deterministic for a campaign seed')
  const quarantinePlan = game.quarantineSolution(quarantineLevel)
  assert.equal(quarantinePlan.filter(choice => choice.sealed).length, 2, 'the safe quarantine must isolate both outward hazard links')
  const callerExit = quarantineLevel.quarantine.links.find(link => link.from === quarantineLevel.quarantine.occupiedZoneId && link.to === 'SAFE')
  assert.equal(quarantinePlan.find(choice => choice.linkId === callerExit.id).sealed, false, 'the living caller’s escape route must remain open')
  let poweredQuarantine = game.applyAction(quarantineLevel, { id: 'quarantine-power', type: 'triage-submit', allocations: game.triageSolution(quarantineLevel) }, startedAt + 1)

  const seenQuarantineKinds = new Set()
  for (let seed = 1; seed <= 60; seed += 1) seenQuarantineKinds.add(game.createGame(seed, 4, 'en', startedAt, 'standard', 'campaign', 10).quarantine.kind)
  assert.deepEqual(seenQuarantineKinds, new Set(['biological', 'informational', 'temporal']), 'the same quarantine logic must support all three hazard skins')

  const operatorQuarantine = game.viewForRole(poweredQuarantine, 'operator', startedAt + 1)
  assert.doesNotMatch(JSON.stringify(operatorQuarantine.operator.quarantine), /kind|medium|sourceZoneId|occupiedZoneId|zones|from|to/, 'the Operator must not receive quarantine evidence or the solution')
  const analystQuarantinePanel = game.viewForRole(poweredQuarantine, 'analyst', startedAt + 1).manual.panels.find(panel => panel.title === 'Contamination & life signs')
  const archivistQuarantinePanel = game.viewForRole(poweredQuarantine, 'archivist', startedAt + 1).manual.panels.find(panel => panel.title === 'Spread profile')
  const engineerQuarantinePanel = game.viewForRole(poweredQuarantine, 'engineer', startedAt + 1).manual.panels.find(panel => panel.title === 'Directed doors & vents')
  assert.match(JSON.stringify(analystQuarantinePanel), /SOURCE/)
  assert.match(JSON.stringify(analystQuarantinePanel), /LIVING CALLER/)
  assert.doesNotMatch(JSON.stringify(analystQuarantinePanel), /CARRIER|Direction|SEAL:/)
  assert.match(JSON.stringify(archivistQuarantinePanel), /HAZARD/)
  assert.match(JSON.stringify(archivistQuarantinePanel), /CARRIER/)
  assert.doesNotMatch(JSON.stringify(archivistQuarantinePanel), /SOURCE|LIVING CALLER|ISOLATION CONTROL/)
  assert.match(JSON.stringify(engineerQuarantinePanel), /ISOLATION CONTROL A/)
  assert.match(JSON.stringify(engineerQuarantinePanel), /SEAL:/)
  assert.doesNotMatch(JSON.stringify(engineerQuarantinePanel), /SOURCE|LIVING CALLER|BIOLOGICAL SPORES|INFORMATION WORM|TEMPORAL ECHO/)
  const specialistQuarantine = JSON.stringify(game.viewForRole(poweredQuarantine, 'specialist', startedAt + 1).manual)
  assert.match(specialistQuarantine, /Contamination & life signs/)
  assert.match(specialistQuarantine, /Spread profile/)
  assert.match(specialistQuarantine, /Directed doors & vents/, 'two-player crews must receive every quarantine clue domain')

  const lockedQuarantineReactor = game.applyAction(poweredQuarantine, { id: 'quarantine-lock-check', type: 'reactor-calibrate', dials: game.reactorSolution(poweredQuarantine) }, startedAt + 2)
  assert.equal(lockedQuarantineReactor.reactor.resolved, false, 'downstream systems must remain locked until quarantine is safe')
  assert.equal(lockedQuarantineReactor.stability, poweredQuarantine.stability)
  const trappedCallerPlan = game.quarantineSolution(poweredQuarantine).map(choice => ({ ...choice }))
  trappedCallerPlan.find(choice => choice.linkId === callerExit.id).sealed = true
  const telemetryBeforeContamination = structuredClone(poweredQuarantine.reactor.telemetry)
  const rejectedQuarantine = game.applyAction(poweredQuarantine, { id: 'quarantine-trap', type: 'quarantine-submit', choices: trappedCallerPlan }, startedAt + 3)
  assert.equal(rejectedQuarantine.quarantine.resolved, false)
  assert.equal(rejectedQuarantine.quarantine.contaminatedModule, 'reactor')
  assert.notDeepEqual(rejectedQuarantine.reactor.telemetry, telemetryBeforeContamination, 'a wrong quarantine must contaminate downstream module data')
  assert.match(rejectedQuarantine.log[0], /reactor telemetry contaminated/)
  const safeQuarantine = game.applyAction(rejectedQuarantine, { id: 'quarantine-safe', type: 'quarantine-submit', choices: game.quarantineSolution(rejectedQuarantine) }, startedAt + 4)
  assert.equal(safeQuarantine.quarantine.resolved, true)
  assert.equal(safeQuarantine.quarantine.contaminatedModule, undefined)

  let quarantineFollowUp = game.createGame(1001, 4, 'en', startedAt, 'standard', 'campaign', 10)
  const firstHazardKind = quarantineFollowUp.quarantine.kind
  quarantineFollowUp = game.applyAction(quarantineFollowUp, { id: 'quarantine-followup-power', type: 'triage-submit', allocations: game.triageSolution(quarantineFollowUp) }, startedAt + 1)
  quarantineFollowUp = game.applyAction(quarantineFollowUp, { id: 'quarantine-followup-first', type: 'quarantine-submit', choices: game.quarantineSolution(quarantineFollowUp) }, startedAt + 2)
  quarantineFollowUp = game.applyAction(quarantineFollowUp, { id: 'quarantine-followup-reactor', type: 'reactor-calibrate', dials: game.reactorSolution(quarantineFollowUp) }, startedAt + 3)
  const quarantineFollowUpPair = game.routerSolution(quarantineFollowUp)
  const quarantineFollowUpNodes = quarantineFollowUpPair.map(symbol => quarantineFollowUp.router.nodes.find(node => node.symbol === symbol).id)
  quarantineFollowUp = game.applyAction(quarantineFollowUp, { id: 'quarantine-followup-router', type: 'router-connect', a: quarantineFollowUpNodes[0], b: quarantineFollowUpNodes[1] }, startedAt + 4)
  assert.equal(quarantineFollowUp.followUpModule, 'quarantine')
  assert.equal(quarantineFollowUp.quarantine.resolved, false)
  assert.notEqual(quarantineFollowUp.quarantine.kind, firstHazardKind, 'a quarantine follow-up must reskin and reopen with new topology data')
  quarantineFollowUp = game.applyAction(quarantineFollowUp, { id: 'quarantine-followup-second', type: 'quarantine-submit', choices: game.quarantineSolution(quarantineFollowUp) }, startedAt + 5)
  assert.equal(quarantineFollowUp.outcome, 'won')

  const memoryLevel = game.createGame(808, 4, 'en', startedAt, 'standard', 'campaign', 8)
  const memoryRepeat = game.createGame(808, 4, 'en', startedAt, 'standard', 'campaign', 8)
  assert.deepEqual(memoryLevel.memory, memoryRepeat.memory, 'memory repair generation must be deterministic for a campaign seed')
  const memoryChoices = game.memorySolution(memoryLevel)
  assert.deepEqual(new Set(memoryChoices.map(choice => choice.decision)), new Set(['restore', 'lock', 'discard']), 'memory repair must require all three actions')
  assert.equal(memoryChoices.length, memoryLevel.memory.blocks.length)

  const operatorMemory = game.viewForRole(memoryLevel, 'operator', startedAt)
  assert.equal(operatorMemory.operator.memory.revealedText, undefined, 'archive text must remain hidden before repair')
  assert.doesNotMatch(JSON.stringify(operatorMemory.operator.memory), /storedParity|expectedParity|protected|replacementFrom|"restore"|"lock"|"discard"/, 'the Operator must not receive memory evidence or the solution')
  const analystMemory = JSON.stringify(game.viewForRole(memoryLevel, 'analyst', startedAt).manual)
  const archivistMemory = JSON.stringify(game.viewForRole(memoryLevel, 'archivist', startedAt).manual)
  const engineerMemory = JSON.stringify(game.viewForRole(memoryLevel, 'engineer', startedAt).manual)
  assert.match(analystMemory, /Stored & expected/)
  assert.doesNotMatch(analystMemory, /PROTECTED|Verified replacement/)
  assert.match(archivistMemory, /Protect living memories/)
  assert.doesNotMatch(archivistMemory, /Stored & expected|Verified replacement/)
  assert.match(engineerMemory, /Safe repair rules/)
  assert.doesNotMatch(engineerMemory, /P0|P1|Protect living memories/)
  const specialistMemory = JSON.stringify(game.viewForRole(memoryLevel, 'specialist', startedAt).manual)
  assert.match(specialistMemory, /Stored & expected/)
  assert.match(specialistMemory, /Protect living memories/)
  assert.match(specialistMemory, /Safe repair rules/, 'two-player crews must receive every memory-repair clue domain')

  const lockedTranslation = game.applyAction(memoryLevel, { id: 'memory-lock-check', type: 'translation-submit', sequence: game.translationSolution(memoryLevel) }, startedAt + 1)
  assert.equal(lockedTranslation.translation.resolved, false, 'archive translation must remain locked until memory repair succeeds')
  assert.equal(lockedTranslation.stability, memoryLevel.stability)
  const wrongMemoryChoices = memoryChoices.map(choice => ({ ...choice }))
  wrongMemoryChoices[0].decision = wrongMemoryChoices[0].decision === 'lock' ? 'discard' : 'lock'
  const rejectedMemory = game.applyAction(memoryLevel, { id: 'memory-wrong', type: 'memory-submit', choices: wrongMemoryChoices }, startedAt + 2)
  assert.equal(rejectedMemory.memory.resolved, false)
  assert.match(rejectedMemory.log[0], /protected memories remain unchanged/)
  const repairedMemory = game.applyAction(memoryLevel, { id: 'memory-correct', type: 'memory-submit', choices: memoryChoices }, startedAt + 2)
  assert.equal(repairedMemory.memory.resolved, true)
  assert.match(repairedMemory.log[0], /Archive text restored/)
  assert.match(game.viewForRole(repairedMemory, 'operator', startedAt + 2).operator.memory.revealedText, /CONSENT HANDSHAKE \/\/ NOT SHUTDOWN/)
  const trueNameMemory = game.createGame(1414, 4, 'en', startedAt, 'standard', 'campaign', 14)
  const trueNameRepaired = game.applyAction(trueNameMemory, { id: 'true-name-memory', type: 'memory-submit', choices: game.memorySolution(trueNameMemory) }, startedAt + 2)
  assert.match(game.viewForRole(trueNameRepaired, 'operator', startedAt + 2).operator.memory.revealedText, /NO DOOR OPENS WITHOUT A CLEAR INVITATION/)
  assert.match(game.viewForRole(trueNameRepaired, 'operator', startedAt + 2).operator.memory.revealedText, /A DOOR THAT MUST ASK/)

  for (const levelId of [8, 14]) {
    let mission = game.createGame(1100 + levelId, 4, 'en', startedAt, 'standard', 'campaign', levelId)
    for (let pass = 0; pass < 2 && mission.outcome === 'playing'; pass += 1) {
      if (!mission.memory.resolved) mission = game.applyAction(mission, { id: `memory-${levelId}-${pass}`, type: 'memory-submit', choices: game.memorySolution(mission) }, startedAt + pass * 10 + 1)
      if (mission.activeModules.includes('reactor') && !mission.reactor.resolved) mission = game.applyAction(mission, { id: `memory-reactor-${levelId}-${pass}`, type: 'reactor-calibrate', dials: game.reactorSolution(mission) }, startedAt + pass * 10 + 2)
      if (mission.activeModules.includes('router') && !mission.router.resolved) {
        const pair = game.routerSolution(mission)
        const ids = pair.map(symbol => mission.router.nodes.find(node => node.symbol === symbol).id)
        mission = game.applyAction(mission, { id: `memory-router-${levelId}-${pass}`, type: 'router-connect', a: ids[0], b: ids[1] }, startedAt + pass * 10 + 3)
      }
      if (mission.activeModules.includes('translation') && !mission.translation.resolved) mission = game.applyAction(mission, { id: `memory-translation-${levelId}-${pass}`, type: 'translation-submit', sequence: game.translationSolution(mission) }, startedAt + pass * 10 + 4)
    }
    assert.equal(mission.outcome, 'won', `memory-repair campaign level ${levelId} must have a deterministic solution path`)
  }

  const realityLevel = game.createGame(1313, 4, 'en', startedAt, 'standard', 'campaign', 13)
  const realityRepeat = game.createGame(1313, 4, 'en', startedAt, 'standard', 'campaign', 13)
  assert.deepEqual(realityLevel.reality, realityRepeat.reality, 'reality comparison generation must be deterministic for a campaign seed')
  const realityPlan = game.realitySolution(realityLevel)
  assert.deepEqual(new Set(realityPlan.map(assignment => assignment.classification)), new Set(['original', 'copy']), 'the two inhabited feeds must be identified without classifying the copy as unsafe')
  assert.equal(new Set(realityPlan.map(assignment => assignment.route)).size, 2, 'both inhabited worlds must receive separate safe routes')
  assert.ok(realityLevel.reality.feeds.every(feed => feed.inhabited), 'both original and copied Earth must be represented as inhabited')

  const operatorReality = game.viewForRole(realityLevel, 'operator', startedAt)
  assert.doesNotMatch(JSON.stringify(operatorReality.operator.reality), /livePhase|archiveMarker|routeKey|kind|inhabited/, 'the Operator must not receive reality-comparison evidence or answers')
  const analystReality = JSON.stringify(game.viewForRole(realityLevel, 'analyst', startedAt).manual)
  const archivistReality = JSON.stringify(game.viewForRole(realityLevel, 'archivist', startedAt).manual)
  const engineerReality = JSON.stringify(game.viewForRole(realityLevel, 'engineer', startedAt).manual)
  assert.match(analystReality, /Current phase values/)
  assert.doesNotMatch(analystReality, /CONTINUOUS PROVENANCE|ROUTE KEY/)
  assert.match(archivistReality, /Continuity & personhood/)
  assert.doesNotMatch(archivistReality, /Current phase values|ROUTE KEY/)
  assert.match(engineerReality, /Calculate the live route/)
  assert.doesNotMatch(engineerReality, /CONTINUOUS PROVENANCE|RELAY BIRTH LEDGER|P[0-5]/)
  const specialistReality = JSON.stringify(game.viewForRole(realityLevel, 'specialist', startedAt).manual)
  assert.match(specialistReality, /Current phase values/)
  assert.match(specialistReality, /Continuity & personhood/)
  assert.match(specialistReality, /Calculate the live route/, 'two-player crews must receive every reality-comparison clue domain')

  const unsafeRealityPlan = realityPlan.map(assignment => ({ ...assignment }))
  unsafeRealityPlan.find(assignment => assignment.classification === 'copy').classification = 'unsafe'
  const rejectedReality = game.applyAction(realityLevel, { id: 'reality-unsafe', type: 'reality-submit', assignments: unsafeRealityPlan }, startedAt + 1)
  assert.equal(rejectedReality.reality.resolved, false)
  assert.match(rejectedReality.log[0], /copy is not an unsafe echo/)
  assert.ok(rejectedReality.reality.feeds.every(feed => feed.inhabited), 'a rejected plan must leave both inhabited worlds unchanged')
  const separatedReality = game.applyAction(realityLevel, { id: 'reality-correct', type: 'reality-submit', assignments: realityPlan }, startedAt + 1)
  assert.equal(separatedReality.reality.resolved, true)
  assert.match(separatedReality.log[0], /identified, protected, and separated/)

  const driftingReality = game.createGame(1314, 4, 'en', startedAt, 'standard', 'campaign', 13)
  driftingReality.shiftRules.pressureEveryMs = 10_000
  const oldRealityPlan = game.realitySolution(driftingReality)
  const realityAfterSurge = game.advanceClock(driftingReality, startedAt + 10_000)
  assert.notDeepEqual(game.realitySolution(realityAfterSurge), oldRealityPlan, 'a pressure surge must change the live separation routes')
  assert.deepEqual(realityAfterSurge.variationGrace.reality, oldRealityPlan)
  const realityGraceAccepted = game.applyAction(realityAfterSurge, { id: 'reality-grace', type: 'reality-submit', assignments: oldRealityPlan }, startedAt + 12_000)
  assert.equal(realityGraceAccepted.reality.resolved, true, 'the pre-surge reality plan must remain valid during grace')

  let realityMission = game.createGame(1315, 4, 'en', startedAt, 'standard', 'campaign', 13)
  for (let pass = 0; pass < 2 && realityMission.outcome === 'playing'; pass += 1) {
    if (!realityMission.reality.resolved) realityMission = game.applyAction(realityMission, { id: `reality-${pass}`, type: 'reality-submit', assignments: game.realitySolution(realityMission) }, startedAt + pass * 10 + 1)
    if (!realityMission.reactor.resolved) realityMission = game.applyAction(realityMission, { id: `reality-reactor-${pass}`, type: 'reactor-calibrate', dials: game.reactorSolution(realityMission) }, startedAt + pass * 10 + 2)
    if (!realityMission.router.resolved) {
      const pair = game.routerSolution(realityMission)
      const ids = pair.map(symbol => realityMission.router.nodes.find(node => node.symbol === symbol).id)
      realityMission = game.applyAction(realityMission, { id: `reality-router-${pass}`, type: 'router-connect', a: ids[0], b: ids[1] }, startedAt + pass * 10 + 3)
    }
    if (!realityMission.translation.resolved) realityMission = game.applyAction(realityMission, { id: `reality-translation-${pass}`, type: 'translation-submit', sequence: game.translationSolution(realityMission) }, startedAt + pass * 10 + 4)
  }
  assert.equal(realityMission.outcome, 'won', 'reality-comparison campaign level 13 must have a deterministic solution path')

  const dispatchLevel = game.createGame(1500, 4, 'en', startedAt, 'standard', 'campaign', 15)
  const dispatchRepeat = game.createGame(1500, 4, 'en', startedAt, 'standard', 'campaign', 15)
  assert.deepEqual(dispatchLevel.dispatch, dispatchRepeat.dispatch, 'dispatch queue generation must be deterministic for a campaign seed')
  assert.deepEqual(new Set(dispatchLevel.dispatch.callers.map(caller => caller.label)), new Set(['Vellune witness // Record 88-B', 'Copied Earth Council', 'Quiet Assembly dissident']), 'the hearing queue must bring back established campaign callers')
  const dispatchOrder = game.dispatchSolution(dispatchLevel)
  const rawCountdownOrder = [...dispatchLevel.dispatch.callers].sort((a, b) => a.failureCountdown - b.failureCountdown).map(caller => caller.id)
  assert.notDeepEqual(dispatchOrder, rawCountdownOrder, 'dependencies and caller risks must matter beyond raw countdown sorting')
  dispatchOrder.forEach((id, index) => {
    const caller = dispatchLevel.dispatch.callers.find(candidate => candidate.id === id)
    if (caller.dependsOn) assert.ok(dispatchOrder.indexOf(caller.dependsOn) < index, 'every service dependency must be completed before its caller')
  })

  const operatorDispatch = game.viewForRole(dispatchLevel, 'operator', startedAt)
  assert.doesNotMatch(JSON.stringify(operatorDispatch.operator.dispatch), /failureCountdown|riskBuffer|risk|dependsOn|module/, 'the Operator must not receive dispatch evidence or incident mappings')
  const analystDispatchPanel = game.viewForRole(dispatchLevel, 'analyst', startedAt).manual.panels.find(panel => panel.title === 'Failure countdowns')
  const archivistDispatchPanel = game.viewForRole(dispatchLevel, 'archivist', startedAt).manual.panels.find(panel => panel.title === 'Risk buffers')
  const engineerDispatchPanel = game.viewForRole(dispatchLevel, 'engineer', startedAt).manual.panels.find(panel => panel.title === 'Dependency-aware order')
  assert.match(JSON.stringify(analystDispatchPanel), /T−\d+s/)
  assert.doesNotMatch(JSON.stringify(analystDispatchPanel), /RISK|Must wait|EFFECTIVE URGENCY/)
  assert.match(JSON.stringify(archivistDispatchPanel), /FRAGILE WITNESS MEMORY/)
  assert.doesNotMatch(JSON.stringify(archivistDispatchPanel), /T−\d+s|Must wait|EFFECTIVE URGENCY/)
  assert.match(JSON.stringify(engineerDispatchPanel), /Must wait for/)
  assert.match(JSON.stringify(engineerDispatchPanel), /EFFECTIVE URGENCY/)
  assert.doesNotMatch(JSON.stringify(engineerDispatchPanel), /T−\d+s|FRAGILE WITNESS MEMORY/)
  const specialistDispatch = JSON.stringify(game.viewForRole(dispatchLevel, 'specialist', startedAt).manual)
  assert.match(specialistDispatch, /Failure countdowns/)
  assert.match(specialistDispatch, /Risk buffers/)
  assert.match(specialistDispatch, /Dependency-aware order/, 'two-player crews must receive every dispatch clue domain')

  const dispatchPair = game.routerSolution(dispatchLevel)
  const dispatchNodes = dispatchPair.map(symbol => dispatchLevel.router.nodes.find(node => node.symbol === symbol).id)
  const lockedBeforeDispatch = game.applyAction(dispatchLevel, { id: 'dispatch-locked-before', type: 'router-connect', a: dispatchNodes[0], b: dispatchNodes[1] }, startedAt + 1)
  assert.equal(lockedBeforeDispatch.router.resolved, false, 'hearing incidents must remain locked before the queue is confirmed')
  assert.equal(lockedBeforeDispatch.stability, dispatchLevel.stability, 'the dispatch lock must not punish early input')
  const wrongDispatch = game.applyAction(dispatchLevel, { id: 'dispatch-wrong', type: 'dispatch-submit', callerIds: rawCountdownOrder }, startedAt + 2)
  assert.equal(wrongDispatch.dispatch.resolved, false)
  assert.match(wrongDispatch.log[0], /before its dependency/)
  let sequencedDispatch = game.applyAction(dispatchLevel, { id: 'dispatch-correct', type: 'dispatch-submit', callerIds: dispatchOrder }, startedAt + 2)
  assert.equal(sequencedDispatch.dispatch.resolved, true)
  assert.deepEqual(game.viewForRole(sequencedDispatch, 'operator', startedAt + 2).operator.dispatch.dispatchedOrder, dispatchOrder)
  assert.deepEqual(game.viewForRole(sequencedDispatch, 'operator', startedAt + 2).visibleModules, ['authentication'], 'the confirmed queue must become the mission phase order')
  assert.equal(game.viewForRole(sequencedDispatch, 'operator', startedAt + 2).phaseCount, 4)
  assert.equal(game.viewForRole(sequencedDispatch, 'operator', startedAt + 2).operator.dispatch.currentModule, 'authentication')
  const lockedOutOfOrder = game.applyAction(sequencedDispatch, { id: 'dispatch-locked-router', type: 'router-connect', a: dispatchNodes[0], b: dispatchNodes[1] }, startedAt + 3)
  assert.equal(lockedOutOfOrder.router.resolved, false, 'only the current queued incident may be handled')
  assert.equal(lockedOutOfOrder.stability, sequencedDispatch.stability)
  sequencedDispatch = game.applyAction(sequencedDispatch, { id: 'dispatch-auth', type: 'authentication-submit', candidateId: game.authenticationSolution(sequencedDispatch) }, startedAt + 4)
  assert.deepEqual(game.viewForRole(sequencedDispatch, 'operator', startedAt + 4).visibleModules, ['router'])
  assert.equal(game.viewForRole(sequencedDispatch, 'operator', startedAt + 4).operator.dispatch.currentModule, 'router')
  const liveDispatchPair = game.routerSolution(sequencedDispatch)
  const liveDispatchNodes = liveDispatchPair.map(symbol => sequencedDispatch.router.nodes.find(node => node.symbol === symbol).id)
  sequencedDispatch = game.applyAction(sequencedDispatch, { id: 'dispatch-router', type: 'router-connect', a: liveDispatchNodes[0], b: liveDispatchNodes[1] }, startedAt + 5)
  assert.equal(game.viewForRole(sequencedDispatch, 'operator', startedAt + 5).operator.dispatch.currentModule, 'translation')
  sequencedDispatch = game.applyAction(sequencedDispatch, { id: 'dispatch-translation', type: 'translation-submit', sequence: game.translationSolution(sequencedDispatch) }, startedAt + 6)
  assert.equal(sequencedDispatch.translation.resolved, true)

  let dispatchMission = game.createGame(1515, 4, 'en', startedAt, 'standard', 'campaign', 15)
  for (let pass = 0; pass < 2 && dispatchMission.outcome === 'playing'; pass += 1) {
    if (!dispatchMission.dispatch.resolved) dispatchMission = game.applyAction(dispatchMission, { id: `dispatch-${pass}`, type: 'dispatch-submit', callerIds: game.dispatchSolution(dispatchMission) }, startedAt + pass * 10 + 1)
    if (!dispatchMission.authentication.resolved) dispatchMission = game.applyAction(dispatchMission, { id: `dispatch-auth-${pass}`, type: 'authentication-submit', candidateId: game.authenticationSolution(dispatchMission) }, startedAt + pass * 10 + 2)
    if (!dispatchMission.router.resolved) {
      const pair = game.routerSolution(dispatchMission)
      const ids = pair.map(symbol => dispatchMission.router.nodes.find(node => node.symbol === symbol).id)
      dispatchMission = game.applyAction(dispatchMission, { id: `dispatch-router-${pass}`, type: 'router-connect', a: ids[0], b: ids[1] }, startedAt + pass * 10 + 3)
    }
    if (!dispatchMission.translation.resolved) dispatchMission = game.applyAction(dispatchMission, { id: `dispatch-translation-${pass}`, type: 'translation-submit', sequence: game.translationSolution(dispatchMission) }, startedAt + pass * 10 + 4)
  }
  assert.equal(dispatchMission.outcome, 'won', 'dispatch-queue campaign level 15 must complete in its chosen incident order')

  for (const levelId of [6, 9, 16]) {
    let mission = game.createGame(900 + levelId, 4, 'en', startedAt, 'standard', 'campaign', levelId)
    for (let pass = 0; pass < 2 && mission.outcome === 'playing'; pass += 1) {
      if (mission.activeModules.includes('authentication') && !mission.authentication.resolved) mission = game.applyAction(mission, { id: `packet-auth-${levelId}-${pass}`, type: 'authentication-submit', candidateId: game.authenticationSolution(mission) }, startedAt + pass * 10)
      if (mission.activeModules.includes('packet') && !mission.packet.resolved) mission = game.applyAction(mission, { id: `packet-${levelId}-${pass}`, type: 'packet-submit', tileIds: game.packetSolution(mission) }, startedAt + pass * 10 + 1)
      if (mission.activeModules.includes('reactor') && !mission.reactor.resolved) mission = game.applyAction(mission, { id: `packet-reactor-${levelId}-${pass}`, type: 'reactor-calibrate', dials: game.reactorSolution(mission) }, startedAt + pass * 10 + 2)
      if (mission.activeModules.includes('router') && !mission.router.resolved) {
        const pair = game.routerSolution(mission)
        const ids = pair.map(symbol => mission.router.nodes.find(node => node.symbol === symbol).id)
        mission = game.applyAction(mission, { id: `packet-router-${levelId}-${pass}`, type: 'router-connect', a: ids[0], b: ids[1] }, startedAt + pass * 10 + 3)
      }
      if (mission.activeModules.includes('translation') && !mission.translation.resolved) mission = game.applyAction(mission, { id: `packet-translation-${levelId}-${pass}`, type: 'translation-submit', sequence: game.translationSolution(mission) }, startedAt + pass * 10 + 4)
      if (mission.activeModules.includes('consent') && !mission.consent.resolved) mission = game.applyAction(mission, { id: `packet-consent-${levelId}-${pass}`, type: 'consent-submit', ...game.consentSolution(mission) }, startedAt + pass * 10 + 5)
    }
    assert.equal(mission.outcome, 'won', `temporal packet campaign level ${levelId} must have a deterministic solution path`)
  }

  const drifting = game.createGame(7, 4, 'en', startedAt, 'standard', 'fast', 1)
  assert.deepEqual(game.viewForRole(drifting, 'operator', startedAt).visibleModules, drifting.activeModules, 'Fast Game must retain its simultaneous module layout')
  drifting.modifier = 'router-drift'
  drifting.router.baseFrequency = 44
  drifting.reactor.resolved = true
  drifting.shiftRules.pressureEveryMs = 10_000
  const oldPair = game.routerSolution(drifting)
  const drifted = game.advanceClock(drifting, startedAt + 10_000)
  assert.notDeepEqual(game.routerSolution(drifted), oldPair)
  const oldIds = oldPair.map((symbol) => drifted.router.nodes.find((node) => node.symbol === symbol).id)
  const graceAccepted = game.applyAction(drifted, { id: 'grace', type: 'router-connect', a: oldIds[0], b: oldIds[1] }, startedAt + 12_000)
  assert.equal(graceAccepted.router.resolved, true, 'the pre-surge answer must remain valid during grace')

  assert.equal(new Set(['amber', 'cyan', 'magenta', 'lime'].map(game.buttonMarker)).size, 4, 'every color needs a distinct shape')

  const host = { id: 'host', name: 'Host', role: 'operator', connected: true, isHost: true }
  const specialist = { id: 'specialist', name: 'Old name', role: 'specialist', connected: false, isHost: false }
  const reconnected = session.reconnectOrAddPlayer([host, specialist], { ...specialist, name: 'New name', connected: true })
  assert.equal(reconnected.accepted, true)
  assert.deepEqual(reconnected.players[1], { ...specialist, name: 'New name', connected: true })

  const roster = [host,
    { id: 'a', name: 'A', role: null, connected: true, isHost: false },
    { id: 'b', name: 'B', role: null, connected: true, isHost: false },
    { id: 'gone', name: 'Gone', role: null, connected: false, isHost: false },
  ]
  const replacement = session.reconnectOrAddPlayer(roster, { id: 'c', name: 'C', role: null, connected: true, isHost: false })
  assert.equal(replacement.accepted, true)
  assert.deepEqual(replacement.players.map((player) => player.id), ['host', 'a', 'b', 'c'])

  const full = session.reconnectOrAddPlayer(replacement.players, { id: 'd', name: 'D', role: null, connected: true, isHost: false })
  assert.equal(full.accepted, false)

  assert.equal(decodeRequestPath('/assets/game.js?cache=1'), '/assets/game.js')
  assert.equal(decodeRequestPath('/broken%path'), null)

  const savedCampaign = {
    progress: 10,
    scores: [1200, 2400, 3600],
    completedIntermissions: [1, 2, 4, 9],
    archiveFragments: [4, 6, 9],
    dialogueChoices: [
      { levelId: 4, choiceId: 'verify-mara' },
      { levelId: 8, choiceId: 'warn-callers' },
    ],
  }
  const recoveryCode = campaignSave.encodeCampaignRecovery(savedCampaign, game.campaignLevels.length)
  assert.match(recoveryCode, /^CHD3-/)
  assert.deepEqual(campaignSave.decodeCampaignRecovery(recoveryCode, game.campaignLevels.length), {
    ...savedCampaign,
    scores: [...savedCampaign.scores, ...Array(game.campaignLevels.length - savedCampaign.scores.length).fill(0)],
  }, 'recovery must preserve scores, intermissions, archive fragments, and dialogue choices')
  const damagedRecovery = `${recoveryCode.slice(0, -1)}${recoveryCode.endsWith('0') ? '1' : '0'}`
  assert.equal(campaignSave.decodeCampaignRecovery(damagedRecovery, game.campaignLevels.length), null, 'damaged recovery codes must fail their checksum')
  assert.equal(campaignSave.nextCampaignProgress(4, 2, game.campaignLevels.length), 4, 'replaying an earlier mission must not reduce unlock progress')
  assert.equal(campaignSave.nextCampaignProgress(4, 4, game.campaignLevels.length), 5, 'winning the current mission must unlock the next level')
  assert.equal(campaignSave.nextCampaignProgress(16, 16, game.campaignLevels.length), 16, 'the final mission must not unlock an invalid level')

  for (const levelId of [4, 8, 12, 15]) {
    const operatorDispatch = intermission.privateIntermissionFragment(levelId, 'en', 'operator')
    const engineerDispatch = intermission.privateIntermissionFragment(levelId, 'en', 'engineer')
    const analystDispatch = intermission.privateIntermissionFragment(levelId, 'en', 'analyst')
    const archivistDispatch = intermission.privateIntermissionFragment(levelId, 'en', 'archivist')
    const specialistDispatch = intermission.privateIntermissionFragment(levelId, 'en', 'specialist')
    const researcherDispatch = intermission.privateIntermissionFragment(levelId, 'en', 'researcher')
    assert.equal(operatorDispatch.lines.length, 1)
    assert.equal(new Set([operatorDispatch.lines[0], engineerDispatch.lines[0], analystDispatch.lines[0], archivistDispatch.lines[0]]).size, 4, `level ${levelId} must give core roles distinct private fragments`)
    assert.deepEqual(specialistDispatch.lines, [engineerDispatch.lines[0], analystDispatch.lines[0], archivistDispatch.lines[0]], 'the two-player specialist must receive every absent specialist fragment')
    assert.deepEqual(researcherDispatch.lines, [analystDispatch.lines[0], archivistDispatch.lines[0]], 'the three-player research lead must cover both merged roles')
    for (const role of ['operator', 'engineer', 'analyst', 'archivist', 'specialist', 'researcher']) {
      const germanDispatch = intermission.privateIntermissionFragment(levelId, 'de', role)
      assert.ok(germanDispatch, `level ${levelId} ${role} private fragments must be translated`)
      assert.match(germanDispatch.channel, new RegExp(game.roleName(role, 'de').toLocaleUpperCase('de-DE')), `level ${levelId} private channel must localize the ${role} role name`)
      assert.doesNotMatch(germanDispatch.channel, /ENGINEER|ARCHIVIST|SPECIALIST|RESEARCHER/, 'German private channels must not expose internal English role IDs')
    }
  }
  assert.equal(intermission.privateIntermissionFragment(3, 'en', 'operator'), null, 'private fragments should appear only at selected intermissions')
  assert.doesNotMatch(JSON.stringify(game.viewForRole(game.createGame(808, 4, 'en', startedAt, 'standard', 'campaign', 8), 'analyst', startedAt)), /dead letter from Mara|relay graveyard/i, 'private intermission text must not leak through shared role views')
  assert.deepEqual(campaignSave.normalizeCampaignStoryProgress({ completedIntermissions: [4], archiveFragments: [4], dialogueChoices: [{ levelId: 4, choiceId: 'verify-mara' }, { levelId: 4, choiceId: 'invalid' }], privateFragments: ['secret'] }, game.campaignLevels.length), { completedIntermissions: [4], archiveFragments: [4], dialogueChoices: [{ levelId: 4, choiceId: 'verify-mara' }] }, 'shared campaign progress must keep valid dialogue choices but exclude private fragments')

  assert.equal(intermission.selectedDialogueOption(4, 'en', savedCampaign.dialogueChoices).reply, 'We trust you enough to verify every version.')
  for (const levelId of intermission.dialogueChoiceLevels) {
    const englishPrompt = intermission.dialoguePrompt(levelId, 'en')
    const germanPrompt = intermission.dialoguePrompt(levelId, 'de')
    assert.ok(germanPrompt?.question.trim(), `dialogue at level ${levelId} needs a German question`)
    assert.notEqual(germanPrompt.question, englishPrompt.question, `dialogue at level ${levelId} must not reuse its English question`)
    for (const englishOption of englishPrompt.options) {
      const germanOption = germanPrompt.options.find(option => option.id === englishOption.id)
      assert.ok(germanOption?.label.trim() && germanOption.reply.trim(), `dialogue option ${englishOption.id} needs complete German text`)
      assert.notEqual(germanOption.label, englishOption.label, `dialogue option ${englishOption.id} needs a German label`)
      assert.notEqual(germanOption.reply, englishOption.reply, `dialogue option ${englishOption.id} needs a German reply`)
    }
  }
  assert.match(intermission.dialogueFollowUp(5, 'en', savedCampaign.dialogueChoices).body, /Trust should survive a check/)
  assert.equal(intermission.dialogueBonusObjective(5, savedCampaign.dialogueChoices), 'no-mistakes')
  assert.equal(game.createGame(504, 4, 'en', startedAt, 'standard', 'campaign', 5, intermission.dialogueBonusObjective(5, savedCampaign.dialogueChoices)).bonusObjective, 'no-mistakes', 'a crew reply must select the next relevant optional objective')
  assert.deepEqual(game.createGame(504, 4, 'en', startedAt, 'standard', 'campaign', 5, intermission.dialogueBonusObjective(5, [])).phases, game.createGame(504, 4, 'en', startedAt, 'standard', 'campaign', 5).phases, 'dialogue choices must never change mission order')

  let finale = game.createGame(1616, 4, 'en', startedAt, 'standard', 'campaign', 16, 'no-mistakes')
  const finaleModules = ['authentication', 'reactor', 'packet', 'router', 'translation', 'consent']
  assert.deepEqual(finale.activeModules, finaleModules, 'the finale must contain only the six procedures needed for Mara’s physical rescue')
  assert.deepEqual(finale.phases, finaleModules.map(module => [module]), 'the finale procedures must unlock in narrative order')
  assert.equal(finale.targetIncidents, finaleModules.length)
  assert.equal(finale.followUpModule, undefined, 'nothing may reopen after the final consent handshake')
  assert.ok(finale.authentication.candidates.every(candidate => candidate.label.includes('Mara Vale') && candidate.label.includes('ORIGINAL CREW')), 'the final identity check must authenticate Mara’s original crew')

  const earlyFinalConsent = game.applyAction(finale, { id: 'final-consent-too-early', type: 'consent-submit', ...game.consentSolution(finale) }, startedAt + 1)
  assert.equal(earlyFinalConsent.consent.resolved, false)
  assert.equal(earlyFinalConsent.stability, finale.stability, 'locked finale phases must ignore early submissions without damage')
  finale = game.applyAction(finale, { id: 'final-auth', type: 'authentication-submit', candidateId: game.authenticationSolution(finale) }, startedAt + 1)
  assert.deepEqual(game.viewForRole(finale, 'operator', startedAt + 1).visibleModules, ['reactor'])
  finale = game.applyAction(finale, { id: 'final-reactor', type: 'reactor-calibrate', dials: game.reactorSolution(finale) }, startedAt + 2)
  finale = game.applyAction(finale, { id: 'final-packet', type: 'packet-submit', tileIds: game.packetSolution(finale) }, startedAt + 3)
  const finalPair = game.routerSolution(finale)
  const finalNodeIds = finalPair.map(symbol => finale.router.nodes.find(node => node.symbol === symbol).id)
  finale = game.applyAction(finale, { id: 'final-router', type: 'router-connect', a: finalNodeIds[0], b: finalNodeIds[1] }, startedAt + 4)
  finale = game.applyAction(finale, { id: 'final-translation', type: 'translation-submit', sequence: game.translationSolution(finale) }, startedAt + 5)
  assert.equal(game.viewForRole(finale, 'operator', startedAt + 5).operator.consent.ready, true)
  finale = game.applyAction(finale, { id: 'final-consent', type: 'consent-submit', ...game.consentSolution(finale) }, startedAt + 6)
  assert.equal(finale.outcome, 'won')
  assert.equal(finale.incidentsResolved, finaleModules.length)
  assert.match(finale.endReason, /original crew steps through physically/)
  assert.ok(finale.log.some(entry => /no copy destination exists/.test(entry)))
  assert.ok(finale.log.some(entry => /Copy and Reopen remain denied/.test(entry)))

  const finalChoices = [{ levelId: 16, choiceId: 'wait-final-route' }]
  assert.equal(intermission.dialoguePrompt(16, 'en').question, 'One unopened route remains. May I open it?')
  assert.match(intermission.dialogueAcknowledgement(16, 'en', finalChoices).body, /route remains closed/)
  const finalRecovery = campaignSave.encodeCampaignRecovery({ progress: 16, scores: [], completedIntermissions: [], archiveFragments: [], dialogueChoices: finalChoices }, game.campaignLevels.length)
  assert.deepEqual(campaignSave.decodeCampaignRecovery(finalRecovery, game.campaignLevels.length).dialogueChoices, finalChoices, 'the Door’s final respected answer must survive recovery')

  assert.equal(intermission.campaignTicketStatus(6, 6, 8), 'open')
  assert.equal(intermission.campaignTicketStatus(8, 6, 8), 'incoming')
  assert.equal(intermission.campaignTicketStatus(5, 6, 8), 'resolved')
  assert.equal(intermission.campaignTicketStatus(4, 6, 8), 'corrupted')
  assert.equal(intermission.campaignTicketStatus(9, 6, 8), 'locked')

  const correctActionFor = (mission, module, id) => {
    if (module === 'router') {
      const pair = game.routerSolution(mission)
      const nodes = pair.map(symbol => mission.router.nodes.find(node => node.symbol === symbol).id)
      return { id, type: 'router-connect', a: nodes[0], b: nodes[1] }
    }
    if (module === 'reactor') return { id, type: 'reactor-calibrate', dials: game.reactorSolution(mission) }
    if (module === 'translation') return { id, type: 'translation-submit', sequence: game.translationSolution(mission) }
    if (module === 'authentication') return { id, type: 'authentication-submit', candidateId: game.authenticationSolution(mission) }
    if (module === 'packet') return { id, type: 'packet-submit', tileIds: game.packetSolution(mission) }
    if (module === 'consent') return { id, type: 'consent-submit', ...game.consentSolution(mission) }
    if (module === 'triage') return { id, type: 'triage-submit', allocations: game.triageSolution(mission) }
    if (module === 'memory') return { id, type: 'memory-submit', choices: game.memorySolution(mission) }
    if (module === 'reality') return { id, type: 'reality-submit', assignments: game.realitySolution(mission) }
    if (module === 'dispatch') return { id, type: 'dispatch-submit', callerIds: game.dispatchSolution(mission) }
    return { id, type: 'quarantine-submit', choices: game.quarantineSolution(mission) }
  }
  for (const language of ['en', 'de']) {
    for (const levelId of game.campaignLevels.map(level => level.id)) {
      let mission = game.createGame(20_000 + levelId, 4, language, startedAt, 'standard', 'campaign', levelId, 'no-mistakes')
      if (mission.phases.length > 1) {
        const futureModule = mission.phases[1][0]
        const early = game.applyAction(mission, correctActionFor(mission, futureModule, `early-${language}-${levelId}`), startedAt + 1)
        assert.equal(early[futureModule].resolved, false, `level ${levelId} must keep ${futureModule} locked until its required phase`)
        assert.equal(early.stability, mission.stability, `an early level ${levelId} dependency submission must not cause damage`)
      }
      const completed = new Set()
      for (let step = 0; step < 24 && mission.outcome === 'playing'; step += 1) {
        const currentModule = game.viewForRole(mission, 'operator', startedAt + step + 2).visibleModules[0]
        assert.ok(currentModule, `level ${levelId} needs a visible module while still playing`)
        mission = game.applyAction(mission, correctActionFor(mission, currentModule, `solve-${language}-${levelId}-${step}`), startedAt + step + 2)
        if (mission[currentModule].resolved) completed.add(currentModule)
      }
      assert.equal(mission.outcome, 'won', `campaign level ${levelId} must be solvable in required order in ${language}`)
      assert.ok(mission.activeModules.every(module => completed.has(module)), `campaign level ${levelId} must exercise every required module in ${language}`)
      assert.equal(mission.endReason, game.campaignLevel(levelId).success[language], `campaign level ${levelId} must end with its localized canonical success`)
    }
  }

  let verticalSliceProgress = 1
  const viewedIntermissions = []
  const unlockedFragments = []
  for (let levelId = 1; levelId <= 4; levelId += 1) {
    let mission = game.createGame(400 + levelId, 2, 'en', startedAt, 'standard', 'campaign', levelId)
    if (mission.activeModules.includes('reactor')) mission = game.applyAction(mission, { id: `l${levelId}-reactor`, type: 'reactor-calibrate', dials: game.reactorSolution(mission) }, startedAt + 1)
    if (mission.activeModules.includes('router')) {
      const pair = game.routerSolution(mission)
      const ids = pair.map(symbol => mission.router.nodes.find(node => node.symbol === symbol).id)
      mission = game.applyAction(mission, { id: `l${levelId}-router`, type: 'router-connect', a: ids[0], b: ids[1] }, startedAt + 2)
    }
    if (mission.activeModules.includes('translation')) mission = game.applyAction(mission, { id: `l${levelId}-translation`, type: 'translation-submit', sequence: game.translationSolution(mission) }, startedAt + 3)
    assert.equal(mission.outcome, 'won', `campaign level ${levelId} must be solvable in sequence`)
    assert.equal(mission.endReason, game.campaignLevel(levelId).success.en, `campaign level ${levelId} must reveal its canonical success`)
    verticalSliceProgress = campaignSave.nextCampaignProgress(verticalSliceProgress, levelId, game.campaignLevels.length)
    viewedIntermissions.push(levelId)
    if (game.campaignLevel(levelId).archiveFragment) unlockedFragments.push(levelId)
  }
  assert.equal(verticalSliceProgress, 5, 'the first four missions must unlock level five without gaps')
  assert.deepEqual(viewedIntermissions, [1, 2, 3, 4])
  assert.deepEqual(unlockedFragments, [4], 'the first act must recover exactly the first directive fragment')

  console.log('Game regressions passed: deadlines, onboarding, phased finale, follow-ups, surge grace, accessibility, reconnects, capacity, request paths, and campaign recovery.')
} finally {
  await vite.close()
}
