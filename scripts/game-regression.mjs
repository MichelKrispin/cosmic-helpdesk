import assert from 'node:assert/strict'
import { createServer } from 'vite'
import { decodeRequestPath } from '../request-path.mjs'

const vite = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' })

try {
  const game = await vite.ssrLoadModule('/src/game.ts')
  const session = await vite.ssrLoadModule('/src/session.ts')

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

  console.log('Game regressions passed: deadlines, onboarding, follow-ups, surge grace, accessibility, reconnects, capacity, and request paths.')
} finally {
  await vite.close()
}
