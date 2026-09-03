import assert from 'node:assert/strict'
import { createServer } from 'vite'
import { decodeRequestPath } from '../request-path.mjs'

const vite = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' })

try {
  const game = await vite.ssrLoadModule('/src/game.ts')
  const session = await vite.ssrLoadModule('/src/session.ts')
  const campaignSave = await vite.ssrLoadModule('/src/campaign-save.ts')

  const startedAt = 1_000
  const state = game.createGame(1, 2, 'en', startedAt, 'standard', 'campaign', 1)
  const late = game.applyAction(state, {
    id: 'late-action',
    type: 'reactor-calibrate',
    dials: game.reactorSolution(state),
  }, state.endsAt + 60_000)
  assert.equal(late.outcome, 'lost', 'an action submitted after the deadline must not win')

  const levelTwo = game.createGame(22, 4, 'en', startedAt, 'standard', 'campaign', 2)
  const archivist = game.viewForRole(levelTwo, 'archivist', startedAt)
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

  const drifting = game.createGame(7, 4, 'en', startedAt, 'standard', 'fast', 1)
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
  }
  const recoveryCode = campaignSave.encodeCampaignRecovery(savedCampaign, game.campaignLevels.length)
  assert.match(recoveryCode, /^CHD2-/)
  assert.deepEqual(campaignSave.decodeCampaignRecovery(recoveryCode, game.campaignLevels.length), {
    ...savedCampaign,
    scores: [...savedCampaign.scores, ...Array(game.campaignLevels.length - savedCampaign.scores.length).fill(0)],
  }, 'recovery must preserve scores, completed intermissions, and archive fragments')
  const damagedRecovery = `${recoveryCode.slice(0, -1)}${recoveryCode.endsWith('0') ? '1' : '0'}`
  assert.equal(campaignSave.decodeCampaignRecovery(damagedRecovery, game.campaignLevels.length), null, 'damaged recovery codes must fail their checksum')
  assert.equal(campaignSave.nextCampaignProgress(4, 2, game.campaignLevels.length), 4, 'replaying an earlier mission must not reduce unlock progress')
  assert.equal(campaignSave.nextCampaignProgress(4, 4, game.campaignLevels.length), 5, 'winning the current mission must unlock the next level')
  assert.equal(campaignSave.nextCampaignProgress(16, 16, game.campaignLevels.length), 16, 'the final mission must not unlock an invalid level')

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

  const legacyScores = 'a.b.c'
  const legacyPayload = `1|7|${legacyScores}`
  let legacyHash = 2166136261
  for (const character of legacyPayload) { legacyHash ^= character.charCodeAt(0); legacyHash = Math.imul(legacyHash, 16777619) }
  const legacyChecksum = (legacyHash >>> 0).toString(36).toUpperCase().padStart(7, '0')
  const legacy = campaignSave.decodeCampaignRecovery(`CHD1-7-${legacyScores}-${legacyChecksum}`, game.campaignLevels.length)
  assert.equal(legacy.progress, 7, 'legacy CHD1 recovery codes must remain importable')
  assert.deepEqual(legacy.archiveFragments, [4, 6], 'legacy story unlocks must be reconstructed from campaign progress')

  console.log('Game regressions passed: deadlines, onboarding, follow-ups, surge grace, accessibility, reconnects, capacity, request paths, and campaign recovery.')
} finally {
  await vite.close()
}
