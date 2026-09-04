import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  advanceClock, applyAction, buttonLabel, buttonMarker, campaignLevel, campaignLevels, campaignLore, createGame, difficultyConfig, difficultyLabel, roleName, rolesForPlayers, symbolMeta, viewForRole,
  type ButtonColor, type ConsentPermission, type DifficultyId, type FullGame, type GameAction, type GameActionInput, type GameStyle, type GameView, type Locale, type MemoryDecision, type Player, type RealityClassification, type RealityRoute, type RoleId,
} from './game'
import { decodeCampaignRecovery, emptyCampaignStoryProgress, encodeCampaignRecovery, nextCampaignProgress, normalizeCampaignStoryProgress, type CampaignStoryProgress } from './campaign-save'
import { ui, type StatusId } from './i18n'
import { campaignTicketStatus, dialogueAcknowledgement, dialogueBonusObjective, dialogueFollowUp, dialoguePrompt, isDialogueChoice, privateIntermissionFragment, selectedDialogueOption, type CampaignTicketStatus, type DialogueChoiceId } from './intermission'
import { makeId, PeerMesh, type MeshEvent } from './network'
import { reconnectOrAddPlayer } from './session'
import { AudioSystem, type SoundEvent } from './audio'

type Screen = 'home' | 'lobby' | 'briefing' | 'game' | 'intermission'
type AppMessage =
  | { type: 'lobby'; players: Player[]; language: Locale; difficulty: DifficultyId; gameStyle: GameStyle; campaignLevel: number }
  | { type: 'state'; view: GameView; phase?: 'briefing' | 'game' | 'intermission'; campaignStory?: CampaignStoryProgress }
  | { type: 'action'; action: GameAction }
  | { type: 'session-ended' }
  | { type: 'capacity' }

const colors: ButtonColor[] = ['amber', 'cyan', 'magenta', 'lime']

function parseInvite() {
  const params = new URLSearchParams(location.hash.replace(/^#/, ''))
  const sessionId = params.get('session')
  const hostId = params.get('host')
  return sessionId && hostId ? { sessionId, hostId } : null
}

function defaultName() {
  const cosmic = ['Nebula', 'Lunar', 'Turbo', 'Quantum', 'Velvet', 'Chrome', 'Nova', 'Orbit', 'Quasar', 'Echo', 'Flux', 'Prisma']
  const names = ['Otto', 'Karl', 'Paula', 'Nils', 'Kalle', 'Claus', 'Susi', 'Frida', 'Petra']
  const jobs = ['Operator', 'Techniker', 'Agent', 'Pilot', 'Lotse', 'Profi']
  const designations = ['404', 'Nachtschicht', 'B-Team', 'Relais 7']
  const bytes = new Uint8Array(4)
  crypto.getRandomValues(bytes)
  const prefix = cosmic[bytes[0] % cosmic.length]; const name = names[bytes[1] % names.length]; const job = jobs[bytes[2] % jobs.length]
  if (bytes[3] % 4 === 0) return `${prefix} ${name} ${designations[bytes[2] % designations.length]}`
  if (bytes[3] % 4 === 1) return `${name} ${job}`
  return `${prefix} ${name}`
}

function formatTime(ms: number) {
  const total = Math.max(0, Math.ceil(ms / 1000))
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

const campaignProgressKey = 'cosmic-helpdesk-campaign-progress'
const campaignStoryKey = 'cosmic-helpdesk-campaign-story'
const campaignScoreKey = (level: number) => `cosmic-helpdesk-best-campaign-${level}`

function readStoredCampaignStory() {
  try { return normalizeCampaignStoryProgress(JSON.parse(localStorage.getItem(campaignStoryKey) || 'null'), campaignLevels.length) }
  catch { return { ...emptyCampaignStoryProgress } }
}

function createRecoveryCode(progress: number, story: CampaignStoryProgress) {
  const scores = campaignLevels.map(level => Math.max(0, Number(localStorage.getItem(campaignScoreKey(level.id))) || 0))
  return encodeCampaignRecovery({ progress, scores, ...story }, campaignLevels.length)
}

function App() {
  const initialInvite = useMemo(parseInvite, [])
  const [screen, setScreen] = useState<Screen>(initialInvite ? 'lobby' : 'home')
  const [isHost, setIsHost] = useState(false)
  const [status, setStatus] = useState<StatusId>(initialInvite ? 'calling' : 'empty')
  const [players, setPlayers] = useState<Player[]>([])
  const [view, setView] = useState<GameView | null>(null)
  const [language, setLanguage] = useState<Locale>('de')
  const [difficulty, setDifficulty] = useState<DifficultyId>('standard')
  const [gameStyle, setGameStyle] = useState<GameStyle>('campaign')
  const [campaignLevelId, setCampaignLevelId] = useState(1)
  const [campaignProgress, setCampaignProgress] = useState(() => Math.max(1, Math.min(campaignLevels.length, Number(localStorage.getItem(campaignProgressKey)) || 1)))
  const [campaignStory, setCampaignStory] = useState<CampaignStoryProgress>(readStoredCampaignStory)
  const [copied, setCopied] = useState(false)
  const [bestScore, setBestScore] = useState(0)
  const [newBest, setNewBest] = useState(false)
  const selfRef = useRef({ id: makeId(), name: defaultName() })
  const meshRef = useRef<PeerMesh | null>(null)
  const gameRef = useRef<FullGame | null>(null)
  const isHostRef = useRef(false)
  const playersRef = useRef<Player[]>([])
  const languageRef = useRef<Locale>('de')
  const difficultyRef = useRef<DifficultyId>('standard')
  const gameStyleRef = useRef<GameStyle>('campaign')
  const campaignLevelRef = useRef(1)
  const campaignStoryRef = useRef(campaignStory)
  const sessionRef = useRef<{ sessionId: string; hostId: string } | null>(initialInvite)
  const processedRef = useRef(new Set<string>())
  const screenRef = useRef<Screen>(initialInvite ? 'lobby' : 'home')

  const commitPlayers = useCallback((next: Player[]) => { playersRef.current = next; setPlayers(next) }, [])
  const commitLanguage = useCallback((next: Locale) => { languageRef.current = next; setLanguage(next) }, [])
  const commitDifficulty = useCallback((next: DifficultyId) => { difficultyRef.current = next; setDifficulty(next) }, [])
  const commitGameStyle = useCallback((next: GameStyle) => { gameStyleRef.current = next; setGameStyle(next) }, [])
  const commitCampaignLevel = useCallback((next: number) => { campaignLevelRef.current = next; setCampaignLevelId(next) }, [])
  const commitCampaignStory = useCallback((update: CampaignStoryProgress | ((current: CampaignStoryProgress) => CampaignStoryProgress)) => {
    const next = normalizeCampaignStoryProgress(typeof update === 'function' ? update(campaignStoryRef.current) : update, campaignLevels.length)
    campaignStoryRef.current = next; setCampaignStory(next); localStorage.setItem(campaignStoryKey, JSON.stringify(next))
  }, [])
  const receiveCampaignStory = useCallback((next: CampaignStoryProgress) => {
    const normalized = normalizeCampaignStoryProgress(next, campaignLevels.length)
    campaignStoryRef.current = normalized; setCampaignStory(normalized)
  }, [])
  const commitScreen = useCallback((next: Screen) => { screenRef.current = next; setScreen(next) }, [])
  const sendLobby = useCallback((next = playersRef.current, nextLanguage = languageRef.current, nextDifficulty = difficultyRef.current, nextStyle = gameStyleRef.current, nextLevel = campaignLevelRef.current) => {
    meshRef.current?.broadcast((): AppMessage => ({ type: 'lobby', players: next, language: nextLanguage, difficulty: nextDifficulty, gameStyle: nextStyle, campaignLevel: nextLevel }))
  }, [])
  const hostBroadcastState = useCallback((game: FullGame, phase: 'briefing' | 'game' | 'intermission' = 'game') => {
    const now = Date.now()
    const own = playersRef.current.find((player) => player.id === selfRef.current.id)
    setView(viewForRole(game, own?.role || 'operator', now))
    meshRef.current?.broadcast((peerId): AppMessage => {
      const player = playersRef.current.find((candidate) => candidate.id === peerId)
      return { type: 'state', view: viewForRole(game, player?.role || 'specialist', now), phase, campaignStory: campaignStoryRef.current }
    })
  }, [])
  const handleAction = useCallback((action: GameAction) => {
    if (!gameRef.current || processedRef.current.has(action.id)) return
    processedRef.current.add(action.id)
    gameRef.current = applyAction(gameRef.current, action)
    hostBroadcastState(gameRef.current)
  }, [hostBroadcastState])

  const handleMeshEvent = useCallback((event: MeshEvent) => {
    if (event.type === 'host-unavailable' && !isHostRef.current) { setStatus('stillCalling'); return }
    if (event.type === 'peer-open') {
      setStatus('connected')
      if (isHostRef.current) {
        const existing = playersRef.current.find((player) => player.id === event.peerId)
        if (!existing && gameRef.current) { meshRef.current?.send(event.peerId, { type: 'capacity' } satisfies AppMessage); return }
        const result = reconnectOrAddPlayer(playersRef.current, { id: event.peerId, name: event.name, role: existing?.role || null, connected: true, isHost: false })
        if (!result.accepted) { meshRef.current?.send(event.peerId, { type: 'capacity' } satisfies AppMessage); return }
        commitPlayers(result.players)
        if (gameRef.current && existing?.role) {
          const phase = screenRef.current === 'briefing' || screenRef.current === 'intermission' ? screenRef.current : 'game'
          meshRef.current?.send(event.peerId, { type: 'state', view: viewForRole(gameRef.current, existing.role), phase, campaignStory: campaignStoryRef.current } satisfies AppMessage)
        } else queueMicrotask(() => sendLobby(result.players))
      }
      return
    }
    if (event.type === 'peer-closed') {
      if (isHostRef.current) { const next = playersRef.current.map((player) => player.id === event.peerId ? { ...player, connected: false } : player); commitPlayers(next); sendLobby(next) }
      else if (event.peerId === sessionRef.current?.hostId) setStatus('hostDisconnected')
      return
    }
    if (event.type !== 'message') return
    const message = event.data as AppMessage
    if (isHostRef.current && message.type === 'action') { const sender = playersRef.current.find((player) => player.id === event.peerId); if (sender?.role === 'operator') handleAction(message.action); return }
    if (!isHostRef.current && message.type === 'lobby') { commitPlayers(message.players); commitLanguage(message.language); commitDifficulty(message.difficulty); commitGameStyle(message.gameStyle); commitCampaignLevel(message.campaignLevel); setStatus('connected') }
    if (!isHostRef.current && message.type === 'state') { setView(message.view); commitLanguage(message.view.language); if (message.campaignStory) receiveCampaignStory(message.campaignStory); commitScreen(message.phase || 'game') }
    if (!isHostRef.current && message.type === 'session-ended') { setStatus('sessionEnded'); commitScreen('lobby') }
    if (!isHostRef.current && message.type === 'capacity') setStatus('capacity')
  }, [commitCampaignLevel, commitDifficulty, commitGameStyle, commitLanguage, commitPlayers, commitScreen, handleAction, receiveCampaignStory, sendLobby])

  const createSession = useCallback(() => {
    meshRef.current?.close()
    const sessionId = makeId(); const hostId = selfRef.current.id
    sessionRef.current = { sessionId, hostId }
    history.replaceState(null, '', `${location.pathname}${location.search}#session=${sessionId}&host=${hostId}`)
    setIsHost(true); isHostRef.current = true; setStatus('waiting'); commitScreen('lobby')
    const roster: Player[] = [{ id: hostId, name: selfRef.current.name, role: null, connected: true, isHost: true }]
    commitPlayers(roster)
    meshRef.current = new PeerMesh({ mode: 'host', sessionId, selfId: hostId, hostId, name: selfRef.current.name, onEvent: handleMeshEvent })
  }, [commitPlayers, commitScreen, handleMeshEvent])

  useEffect(() => {
    const joinInviteFromLocation = () => {
      const invite = parseInvite()
      if (!invite || meshRef.current) return
      sessionRef.current = invite
      setIsHost(false); isHostRef.current = false; setStatus('calling'); commitScreen('lobby')
      meshRef.current = new PeerMesh({ mode: 'client', sessionId: invite.sessionId, selfId: selfRef.current.id, hostId: invite.hostId, name: selfRef.current.name, onEvent: handleMeshEvent })
    }
    joinInviteFromLocation()
    window.addEventListener('hashchange', joinInviteFromLocation)
    return () => window.removeEventListener('hashchange', joinInviteFromLocation)
  }, [commitScreen, handleMeshEvent])
  useEffect(() => {
    if (!isHost || screen !== 'game') return
    const timer = window.setInterval(() => { if (gameRef.current) { gameRef.current = advanceClock(gameRef.current); hostBroadcastState(gameRef.current) } }, 1000)
    return () => clearInterval(timer)
  }, [hostBroadcastState, isHost, screen])
  useEffect(() => { document.documentElement.lang = language }, [language])
  useEffect(() => () => meshRef.current?.close(), [])
  useEffect(() => {
    if (!view || view.outcome === 'playing') return
    const key = view.gameStyle === 'campaign' ? `cosmic-helpdesk-best-campaign-${view.campaignLevel}` : `cosmic-helpdesk-best-fast-${view.difficulty}`
    const previous = Number(localStorage.getItem(key) || 0)
    const best = Math.max(previous, view.score)
    if (best > previous) localStorage.setItem(key, String(best))
    setBestScore(best); setNewBest(view.score > previous)
    if (isHostRef.current && view.outcome === 'won' && view.gameStyle === 'campaign' && view.campaignLevel) {
      const completedLevel = view.campaignLevel
      setCampaignProgress(previousProgress => {
        const next = nextCampaignProgress(previousProgress, completedLevel, campaignLevels.length)
        localStorage.setItem(campaignProgressKey, String(next))
        return next
      })
      if (campaignLevel(completedLevel).archiveFragment) commitCampaignStory(current => ({ ...current, archiveFragments: [...current.archiveFragments, completedLevel] }))
    }
  }, [commitCampaignStory, view?.campaignLevel, view?.difficulty, view?.gameStyle, view?.outcome, view?.score])

  const copyInvite = async () => {
    try { await navigator.clipboard.writeText(location.href) }
    catch { const textarea = document.createElement('textarea'); textarea.value = location.href; document.body.append(textarea); textarea.select(); document.execCommand('copy'); textarea.remove() }
    setCopied(true); setTimeout(() => setCopied(false), 1600)
  }
  const chooseLanguage = (next: Locale) => { if (!isHost && screen === 'lobby') return; commitLanguage(next); if (isHost) sendLobby(playersRef.current, next) }
  const chooseDifficulty = (next: DifficultyId) => { if (!isHost) return; commitDifficulty(next); sendLobby(playersRef.current, languageRef.current, next) }
  const chooseGameStyle = (next: GameStyle) => { if (!isHost) return; commitGameStyle(next); sendLobby(playersRef.current, languageRef.current, difficultyRef.current, next) }
  const chooseCampaignLevel = (next: number) => { if (!isHost || next > campaignProgress) return; commitCampaignLevel(next); sendLobby(playersRef.current, languageRef.current, difficultyRef.current, gameStyleRef.current, next) }
  const restoreCampaign = (code: string) => {
    if (!isHost) return false
    const save = decodeCampaignRecovery(code, campaignLevels.length)
    if (!save) return false
    localStorage.setItem(campaignProgressKey, String(save.progress))
    save.scores.forEach((score, index) => localStorage.setItem(campaignScoreKey(index + 1), String(score)))
    commitCampaignStory({ completedIntermissions: save.completedIntermissions, archiveFragments: save.archiveFragments, dialogueChoices: save.dialogueChoices })
    setCampaignProgress(save.progress); commitCampaignLevel(save.progress)
    sendLobby(playersRef.current, languageRef.current, difficultyRef.current, gameStyleRef.current, save.progress)
    return true
  }
  const startGame = () => {
    const active = playersRef.current.filter((player) => player.connected).slice(0, 4)
    if (!isHost || active.length < 2) return
    const roles = rolesForPlayers(active.length)
    const assigned = active.map((player, index) => ({ ...player, role: roles[index] }))
    commitPlayers(assigned)
    const seedBytes = new Uint32Array(1); crypto.getRandomValues(seedBytes)
    const game = createGame(seedBytes[0], active.length, languageRef.current, Date.now(), difficultyRef.current, gameStyleRef.current, campaignLevelRef.current, dialogueBonusObjective(campaignLevelRef.current, campaignStoryRef.current.dialogueChoices))
    setNewBest(false)
    const phase = game.gameStyle === 'campaign' ? 'briefing' : 'game'
    gameRef.current = game; processedRef.current.clear(); commitScreen(phase); hostBroadcastState(game, phase)
  }
  const beginMission = () => {
    if (!isHost || !gameRef.current) return
    const now = Date.now(); const game = gameRef.current
    game.startedAt = now; game.endsAt = now + game.shiftRules.durationMs; game.lastPressureAt = now
    commitScreen('game'); hostBroadcastState(game, 'game')
  }
  const openIntermission = () => {
    if (!isHost || !gameRef.current || gameRef.current.outcome !== 'won') return
    commitScreen('intermission'); hostBroadcastState(gameRef.current, 'intermission')
  }
  const startNextCampaignLevel = () => {
    const completedLevel = gameRef.current?.campaignLevel
    if (completedLevel && dialoguePrompt(completedLevel, languageRef.current) && !selectedDialogueOption(completedLevel, languageRef.current, campaignStoryRef.current.dialogueChoices)) return
    if (completedLevel) commitCampaignStory(current => ({ ...current, completedIntermissions: [...current.completedIntermissions, completedLevel] }))
    commitCampaignLevel(Math.min(campaignLevels.length, campaignLevelRef.current + 1)); startGame()
  }
  const chooseDialogue = (levelId: number, choiceId: DialogueChoiceId) => {
    if (!isHost || screenRef.current !== 'intermission' || gameRef.current?.campaignLevel !== levelId || !isDialogueChoice(levelId, choiceId)) return
    const next = { ...campaignStoryRef.current, dialogueChoices: [...campaignStoryRef.current.dialogueChoices.filter(choice => choice.levelId !== levelId), { levelId, choiceId }] }
    commitCampaignStory(next)
    hostBroadcastState(gameRef.current, 'intermission')
  }
  const leaveSession = () => {
    if (isHost) meshRef.current?.broadcast((): AppMessage => ({ type: 'session-ended' }))
    meshRef.current?.close(); meshRef.current = null; gameRef.current = null; setView(null); setPlayers([]); setIsHost(false); setStatus('empty'); commitScreen('home')
    history.replaceState(null, '', `${location.pathname}${location.search}`)
  }
  const submitAction = (action: GameActionInput) => {
    const complete = { ...action, id: makeId() } as GameAction
    if (isHost) handleAction(complete)
    else if (sessionRef.current) meshRef.current?.send(sessionRef.current.hostId, { type: 'action', action: complete } satisfies AppMessage)
  }

  let narrationText = ''
  if (view && screen === 'briefing' && view.gameStyle === 'campaign' && view.campaignLevel) {
    const chapter = campaignLevel(view.campaignLevel)
    const previous = chapter.id > 1 ? campaignLevel(chapter.id - 1).success[view.language] : (view.language === 'de' ? 'Die Nachtschicht beginnt mit einem schwachen Notsignal aus einem stillgelegten Relais.' : 'The night shift begins with a faint distress call from a decommissioned relay.')
    narrationText = [previous, chapter.title[view.language], ...(chapter.id === 1 ? [ui(view.language).stationOrientation, ...ui(view.language).stationIntro] : []), chapter.summary[view.language], chapter.briefing[view.language], chapter.objective[view.language]].join('\n\n')
  }
  if (view && screen === 'intermission' && view.campaignLevel) {
    const privateFragment = privateIntermissionFragment(view.campaignLevel, view.language, view.manual?.role || 'operator')
    narrationText = [...desktopMessages(view.campaignLevel, view.language, campaignStory).flatMap(message => [message.sender, message.body]), ...(privateFragment ? [privateFragment.channel, ...privateFragment.lines, privateFragment.prompt] : [])].join('\n\n')
  }
  let soundEvent: SoundEvent | undefined
  if (view && screen === 'intermission') soundEvent = { key: `${view.seed}:intermission`, kind: 'message' }
  else if (view?.outcome === 'won') soundEvent = { key: `${view.seed}:won`, kind: 'success' }
  else if (view?.outcome === 'lost') soundEvent = { key: `${view.seed}:lost`, kind: 'failure' }
  else if (view && screen === 'briefing') soundEvent = { key: `${view.seed}:briefing`, kind: 'incoming' }
  else if (view && screen === 'game' && view.log[0]) {
    const warning = /rejected|failed|damage|surge|abgelehnt|fehlgeschlagen|Schaden|Druckstoß|verworfen|kontaminiert/i.test(view.log[0])
    soundEvent = { key: `${view.seed}:${view.incidentsResolved}:${view.stability}:${view.log[0]}`, kind: warning ? 'warning' : view.incidentsResolved ? 'module' : 'message' }
  }
  const withAudio = (content: ReactNode) => <><AudioSystem language={view?.language || language} narrationText={narrationText} soundEvent={soundEvent} />{content}</>

  if (screen === 'home') return withAudio(<Home language={language} onLanguage={chooseLanguage} onCreate={createSession} />)
  if (screen === 'lobby') return withAudio(<Lobby players={players} isHost={isHost} status={ui(language).status[status]} copied={copied} language={language} difficulty={difficulty} gameStyle={gameStyle} campaignLevelId={campaignLevelId} campaignProgress={campaignProgress} recoveryCode={createRecoveryCode(campaignProgress, campaignStory)} onRestoreCampaign={restoreCampaign} onLanguage={chooseLanguage} onDifficulty={chooseDifficulty} onGameStyle={chooseGameStyle} onCampaignLevel={chooseCampaignLevel} onCopy={copyInvite} onStart={startGame} onLeave={leaveSession} />)
  if (!view) return withAudio(<Loading status={ui(language).status[status]} />)
  if (screen === 'briefing') return withAudio(<MissionBriefing view={view} players={players} selfId={selfRef.current.id} isHost={isHost} onBegin={beginMission} onLeave={leaveSession} />)
  if (screen === 'intermission') return withAudio(<NightShiftDesktop view={view} campaignStory={campaignStory} isHost={isHost} onDialogueChoice={chooseDialogue} onContinue={startNextCampaignLevel} onLeave={leaveSession} />)
  if (view.outcome !== 'playing') return withAudio(<EndScreen view={view} isHost={isHost} bestScore={bestScore} newBest={newBest} onReplay={startGame} onNextCampaign={openIntermission} onLeave={leaveSession} />)
  return withAudio(<GameScreen view={view} players={players} selfId={selfRef.current.id} onAction={submitAction} onLeave={leaveSession} />)
}

function Brand({ compact = false }: { compact?: boolean }) { return <div className={`brand ${compact ? 'compact' : ''}`}><span className="brand-orbit">C</span><span>COSMIC<br />HELPDESK</span></div> }
function LanguageSelector({ language, onChange, disabled = false }: { language: Locale; onChange: (language: Locale) => void; disabled?: boolean }) {
  const t = ui(language)
  return <div className="language-selector" aria-label={t.language}><span>{t.language}</span><div><button className={language === 'en' ? 'selected' : ''} onClick={() => onChange('en')} disabled={disabled}>EN</button><button className={language === 'de' ? 'selected' : ''} onClick={() => onChange('de')} disabled={disabled}>DE</button></div></div>
}

function campaignContact(levelId: number, language: Locale) {
  const de = language === 'de'
  if (levelId === 1) return { initials: '?', name: de ? 'UNBEKANNTE ZUKUNFTSCREW' : 'UNKNOWN FUTURE CREW', status: de ? 'IDENTITÄT AUSSTEHEND' : 'IDENTITY PENDING', detail: de ? 'Ein beschädigter Notruf erreicht Station 404 aus der Zukunft.' : 'A damaged distress call is reaching Station 404 from tomorrow.' }
  if (levelId <= 3) return { initials: 'MV', name: 'MARA VALE', status: de ? 'MORGEN-VERBINDUNG AKTIV' : 'TOMORROW LINK ACTIVE', detail: de ? 'Zukünftige Operatorin · Personalnummer MV-404-0214 · Crew hinter einer gefalteten Route.' : 'Future Operator · employee MV-404-0214 · crew trapped behind a folded route.' }
  if (levelId <= 5) return { initials: 'MV', name: 'MARA VALE // ?', status: de ? 'STIMME MUSS GEPRÜFT WERDEN' : 'VOICE REQUIRES VERIFICATION', detail: de ? 'Maras Stimme ist auf mehreren Kanälen. Das Relais könnte sie imitieren.' : 'Mara’s voice is on multiple channels. The relay may be imitating her.' }
  if (levelId <= 9) return { initials: 'MV', name: 'MARA VALE', status: de ? 'ZEITGESPERRTE SPUR AKTIV' : 'TIME-LOCKED TRACE ACTIVE', detail: de ? 'Ihre authentischen Pakete weisen den Weg zu ihrer vermissten Crew.' : 'Her authenticated packets are tracing a route toward her missing crew.' }
  if (levelId <= 15) return { initials: 'MV', name: 'MARA VALE', status: de ? 'LIVE-SIGNAL VERLOREN · SUCHE AKTIV' : 'LIVE SIGNAL LOST · SEARCH ACTIVE', detail: de ? 'Maras ursprüngliche Crew ist weiterhin vermisst. Jeder gelöste Vorgang bringt ihre physische Route näher.' : 'Mara’s original crew remains missing. Every resolved ticket brings their physical route closer.' }
  return { initials: 'MV', name: 'MARA VALE // MV-404-0214', status: de ? 'LIVE · PHYSISCHE ROUTE GEFUNDEN' : 'LIVE · PHYSICAL ROUTE FOUND', detail: de ? 'Die echte Mara wartet hinter der letzten offenen Tür auf den Transport nach Hause.' : 'The real Mara is waiting behind the last open door for transport home.' }
}

function StoryContact({ levelId, language }: { levelId: number; language: Locale }) {
  const t = ui(language); const contact = campaignContact(levelId, language)
  return <section className="story-contact" aria-label={`${t.liveTransmission}: ${contact.name}`}><span className="story-avatar" aria-hidden="true">{contact.initials}<i /></span><div><small>{t.liveTransmission}</small><strong className="story-contact-name">{contact.name}</strong><span>{contact.status}</span><p>{contact.detail}</p></div></section>
}

function MissionBriefing({ view, players, selfId, isHost, onBegin, onLeave }: { view: GameView; players: Player[]; selfId: string; isHost: boolean; onBegin: () => void; onLeave: () => void }) {
  const t = ui(view.language); const chapter = campaignLevel(view.campaignLevel || 1)
  const level = chapter.id === 1 ? { ...chapter, briefing: { ...chapter.briefing, [view.language]: `\n\n${t.stationOrientation}\n\n${t.stationIntro.join('\n\n')}\n\n${chapter.briefing[view.language]}` } } : chapter
  const previous = level.id > 1 ? campaignLevel(level.id - 1).success[view.language] : (view.language === 'de' ? 'Die Nachtschicht beginnt mit einem schwachen Notsignal aus einem stillgelegten Relais.' : 'The night shift begins with a faint distress call from a decommissioned relay.')
  const tasks = view.language === 'de' ? {
    router: 'Öffnet den Weg, von dem dieses Kapitel abhängt. Frequenz, Spezies und Protokoll bestimmen die zwei sicheren Knoten.',
    reactor: 'Haltet die Station lange genug am Leben, damit die Geschichte weitergehen kann. Telemetrie und Verfahren ergeben drei Reglerwerte.',
    translation: 'Findet heraus, was die fremde Stimme wirklich sagt. Leserichtung, Glyphen und Stationszustand ergeben die Antwortfarben.',
    authentication: 'Vergleicht Live-Zeitdaten und die private Prüfantwort. Nur ein Kanal erfüllt beide Bedingungen.',
    packet: 'Ordnet die vier Paketblöcke mit aktuellen Zeitstempeln, Epochrichtung und Prüfsummenkette.',
    consent: 'Bestätigt ein ausdrückliches Ja und sendet nur die erlaubten Berechtigungen in sicherer Reihenfolge.',
    triage: 'Verteilt das gesamte Notstrombudget so, dass jeder bewohnte Bereich exakt seine sichere Versorgung erhält.',
    memory: 'Prüft Parität, Schutzstatus und Ersatzpfade. Sperrt, repariert oder verwerft jeden Block ohne geschützte Erinnerungen zu überschreiben.',
    reality: 'Identifiziert beide bewohnten Erd-Übertragungen und trennt sie mit aktuellen Phasendaten auf sichere Routen.',
    dispatch: 'Ordnet die zurückkehrenden Zeugen nach Risiko, Countdown und Abhängigkeiten; die Reihenfolge aktiviert ihre Vorfälle.',
    quarantine: 'Isoliert die Gefahr im kompromittierten Relais, ohne den Fluchtweg des lebenden Anrufers zu sperren.',
  } : {
    router: 'Open the path this chapter depends on. Frequency, species, and protocol determine the two safe nodes.',
    reactor: 'Keep the station alive long enough for the story to continue. Telemetry and procedure produce three dial values.',
    translation: 'Discover what the alien voice is really saying. Reading direction, glyphs, and station condition produce the response colors.',
    authentication: 'Compare live timing with the private challenge response. Only one channel satisfies both conditions.',
    packet: 'Order the four packet blocks using live timestamps, epoch direction, and the checksum chain.',
    consent: 'Verify an explicit yes and submit only the allowed permissions in safe protocol order.',
    triage: 'Allocate the full emergency budget so every occupied habitat receives its exact safe supply.',
    memory: 'Compare parity, protection, and replacement paths. Lock, restore, or discard each block without overwriting protected memories.',
    reality: 'Identify both inhabited Earth feeds and separate them onto safe routes using current phase data.',
    dispatch: 'Order the returning witnesses by risk, countdown, and dependencies; that order activates their incidents.',
    quarantine: 'Isolate the compromised relay’s hazard without sealing the living caller’s escape route.',
  }
  const moduleNames = { router: t.quantumRouter, reactor: t.reactorCalibration, translation: t.translationMatrix, authentication: t.callerAuthentication, packet: t.temporalPacket, consent: t.consentHandshake, triage: t.powerTriage, memory: t.memoryRepair, reality: t.realityComparison, dispatch: t.dispatchQueue, quarantine: t.quarantineLock }
  const storyLabels = view.language === 'de' ? { caller: 'ANRUFER', objective: 'EINSATZZIEL' } : { caller: 'CALLER', objective: 'MISSION OUTCOME' }
  const ownRole = view.manual?.role || players.find(player => player.isHost)?.role || null
  players = [...players].sort((a, b) => Number(b.id === selfId) - Number(a.id === selfId)).map(player => player.id === selfId ? { ...player, name: `▶ ${player.name} · ${t.youAre}` } : player)
  return <main className="mission-briefing-screen"><header><Brand compact /><button className="text-button" onClick={onLeave}>{t.leave}</button></header><section className="mission-dossier"><div className="dossier-stamp">{t.campaign} // {t.level} {level.id.toString().padStart(2, '0')} // {t.missionBriefing}</div><p className="kicker">{t.storySoFar}</p><p className="story-recap">{previous}</p><h1>{level.title[view.language]}</h1><StoryContact levelId={level.id} language={view.language} /><p className="story-lede">{level.summary[view.language]} {level.briefing[view.language]}</p><div className="mission-facts"><article><small>{storyLabels.caller}</small><strong>{level.caller[view.language]}</strong><p>{level.summary[view.language]}</p></article><article><small>{storyLabels.objective}</small><strong>{level.objective[view.language]}</strong><p>{t.timerPaused}</p></article><article><small>{t.yourRole}</small><strong>{roleName(ownRole, view.language)}</strong><p>{t.roleStory}</p></article><article><small>{t.shiftWindow}</small><strong>{Math.round((view.endsAt - view.now) / 60000)} {t.minutes}</strong><p>{t.timerPaused}</p></article></div>{view.modifierText && <div className="dossier-alert"><b>⚠ {t.missionVariation}</b><p>{view.modifierText}</p></div>}{view.bonusText && <div className="dossier-bonus"><b>★ {t.optionalObjective}</b><p>{view.bonusText}</p></div>}<div className="mission-task-list"><small>{t.missionObjectives}</small>{view.activeModules.map((module, index) => <article key={module}><b>0{index + 1}</b><div><strong>{moduleNames[module]}</strong><p>{level.moduleOutcomes[module]?.[view.language] || tasks[module]}</p></div></article>)}</div><div className="briefing-crew"><small>{t.assignedCrew}</small><div>{players.filter(player => player.connected).map(player => <span key={player.id}>{player.name}<b>{roleName(player.role, view.language)}</b></span>)}</div></div><div className="briefing-launch">{isHost ? <button className="primary" onClick={onBegin}>{t.beginMission}<b>→</b></button> : <p className="waiting">{t.waitingBriefing}</p>}<small>{t.readBeforeStart}</small></div></section></main>
}

function Home({ language, onLanguage, onCreate }: { language: Locale; onLanguage: (language: Locale) => void; onCreate: () => void }) {
  const t = ui(language)
  return <main className="home-shell"><div className="stars" aria-hidden="true" /><nav><Brand compact /><div className="nav-actions"><LanguageSelector language={language} onChange={onLanguage} /><span className="signal-pill"><i /> {t.signalOnline}</span></div></nav>
    <section className="hero"><div className="hero-copy"><p className="kicker">{t.homeKicker}</p><h1>{t.heroBefore}<br /><em>{t.heroEmphasis}</em> {t.heroAfter}</h1><p className="lede">{t.lede}</p><button className="primary jumbo" onClick={onCreate}><span>{t.createGame}</span><b>→</b></button><p className="fineprint">{t.fineprint}</p></div>
      <div className="hero-console" aria-label={t.liveFeed}><div className="console-top"><span>{t.liveFeed}</span><i /></div><div className="planet"><div className="planet-ring" /><div className="planet-body"><span>!</span></div><div className="moon" /></div><div className="console-grid"><div><span>{t.stability}</span><strong>??%</strong></div><div><span>{t.tickets}</span><strong>03</strong></div><div><span>{t.wormholes}</span><strong>{t.unverified}</strong></div></div></div>
    </section><section className="how-grid">{t.how.map(([title, body], index) => <article key={title}><span className="step">0{index + 1}</span><h3>{title}</h3><p>{body}</p></article>)}</section></main>
}

function Lobby(props: { players: Player[]; isHost: boolean; status: string; copied: boolean; language: Locale; difficulty: DifficultyId; gameStyle: GameStyle; campaignLevelId: number; campaignProgress: number; recoveryCode: string; onRestoreCampaign: (code: string) => boolean; onLanguage: (language: Locale) => void; onDifficulty: (difficulty: DifficultyId) => void; onGameStyle: (style: GameStyle) => void; onCampaignLevel: (level: number) => void; onCopy: () => void; onStart: () => void; onLeave: () => void }) {
  const t = ui(props.language); const canStart = props.isHost && props.players.filter((player) => player.connected).length >= 2
  const selectedLevel = campaignLevel(props.campaignLevelId)
  const settings = props.gameStyle === 'fast' ? difficultyConfig[props.difficulty] : selectedLevel.rules
  return <main className="app-shell lobby-shell"><header><Brand compact /><button className="text-button" onClick={props.onLeave}>{t.leave}</button></header><section className="lobby-card">
    <div className="lobby-heading"><div><p className="kicker">{t.crewAssembly}</p><h1>{t.briefing}</h1></div><span className="connection-state"><i /> {props.status}</span></div>
    <div className="invite-box"><div><small>{t.invite}</small><code>{location.href}</code></div><button className="secondary" onClick={props.onCopy}>{props.copied ? t.copied : t.copy}</button></div>
    <div className="language-row"><div><small>{t.language}</small><p>{t.languageHelp}</p></div><LanguageSelector language={props.language} onChange={props.onLanguage} disabled={!props.isHost} /></div>
    <div className="style-row"><div><small>{t.gameStyle}</small><p>{props.gameStyle === 'fast' ? t.fastHelp : t.campaignHelp}</p></div><div className="style-selector"><button className={props.gameStyle === 'fast' ? 'selected' : ''} onClick={() => props.onGameStyle('fast')} disabled={!props.isHost}>{t.fastGame}</button><button className={props.gameStyle === 'campaign' ? 'selected' : ''} onClick={() => props.onGameStyle('campaign')} disabled={!props.isHost}>{t.campaign}</button></div></div>
    {props.gameStyle === 'fast' ? <div className="difficulty-row"><div><small>{t.difficulty}</small><p>{Math.round(settings.durationMs / 60000)} {t.minutes} · −{settings.pressureDamage} {t.stabilityEvery} {settings.pressureEveryMs / 1000}s · ×{settings.scoreMultiplier} {t.score}<br />{t.scoringHelp}</p></div><div className="difficulty-selector">{(['training', 'standard', 'emergency'] as DifficultyId[]).map(level => <button key={level} className={props.difficulty === level ? 'selected' : ''} onClick={() => props.onDifficulty(level)} disabled={!props.isHost}>{difficultyLabel(level, props.language)}</button>)}</div></div> : <CampaignMap language={props.language} selected={props.campaignLevelId} unlocked={props.campaignProgress} isHost={props.isHost} recoveryCode={props.recoveryCode} onRestore={props.onRestoreCampaign} onSelect={props.onCampaignLevel} />}
    <div className="crew-label"><span>{t.connectedCrew}</span><b>{props.players.filter((p) => p.connected).length} / 4</b></div><div className="crew-grid">{[0, 1, 2, 3].map((index) => { const player = props.players[index]; return <article className={`crew-slot ${player ? 'occupied' : ''}`} key={index}><span className="avatar">{player ? player.name.slice(0, 2).toUpperCase() : '+'}</span><div><h3>{player?.name || t.openChannel}</h3><p>{player ? (player.isHost ? t.hostRole : t.assignedAtLaunch) : t.waitingTech}</p></div>{player && <><i aria-hidden="true" className={player.connected ? 'online' : 'offline'} /><span className="sr-only">{player.connected ? t.crewOnline : t.crewOffline}</span></>}</article> })}</div>
    <div className="lobby-footer"><div className="warning"><span>!</span><p><b>{t.voiceRequired}</b><br />{t.voiceHelp}</p></div>{props.isHost ? <button className="primary" disabled={!canStart} onClick={props.onStart}>{t.start} <b>→</b></button> : <p className="waiting">{t.waitingHost} <span>•••</span></p>}</div>
  </section></main>
}

function CampaignMap({ language, selected, unlocked, isHost, recoveryCode, onRestore, onSelect }: { language: Locale; selected: number; unlocked: number; isHost: boolean; recoveryCode: string; onRestore: (code: string) => boolean; onSelect: (level: number) => void }) {
  const t = ui(language); const level = campaignLevel(selected); const settings = level.rules
  const moduleLabels = { router: t.quantumRouter, reactor: t.reactorCalibration, translation: t.translationMatrix, authentication: t.callerAuthentication, packet: t.temporalPacket, consent: t.consentHandshake, triage: t.powerTriage, memory: t.memoryRepair, reality: t.realityComparison, dispatch: t.dispatchQueue, quarantine: t.quarantineLock }
  const statusLabels: Record<CampaignTicketStatus, string> = language === 'de' ? { incoming: 'EINGEHEND', open: 'OFFEN', resolved: 'GELÖST', corrupted: 'BESCHÄDIGT', locked: 'GESPERRT' } : { incoming: 'INCOMING', open: 'OPEN', resolved: 'RESOLVED', corrupted: 'CORRUPTED', locked: 'LOCKED' }
  const statusIcons: Record<CampaignTicketStatus, string> = { incoming: '↓', open: '●', resolved: '✓', corrupted: '!', locked: '×' }
  return <section className="campaign-map"><div className="campaign-map-heading"><div><small>{t.campaignMap}</small><h2>{t.level} {level.id}: {level.title[language]}</h2></div><span>{level.activeModules.map(module => moduleLabels[module]).join(' · ')}</span></div><div className="campaign-route">{campaignLevels.map(stop => { const status = campaignTicketStatus(stop.id, selected, unlocked); const locked = status === 'locked'; return <button key={stop.id} className={`${stop.id === selected ? 'selected' : ''} ${status}`} disabled={!isHost || locked} onClick={() => onSelect(stop.id)} aria-label={`${t.level} ${stop.id}: ${stop.title[language]} (${statusLabels[status]})`}><b>{statusIcons[status]}</b><span>{stop.title[language]}</span><small>{statusLabels[status]}</small></button> })}</div><div className="campaign-brief"><div><strong>{level.summary[language]}</strong><p>{level.briefing[language]}</p></div><small>{Math.round(settings.durationMs / 60000)} {t.minutes} · −{settings.pressureDamage} {t.stabilityEvery} {settings.pressureEveryMs / 1000}s · ×{settings.scoreMultiplier} {t.score}</small></div>{isHost && <CampaignRecovery language={language} code={recoveryCode} onRestore={onRestore} />}</section>
}

function CampaignRecovery({ language, code, onRestore }: { language: Locale; code: string; onRestore: (code: string) => boolean }) {
  const t = ui(language); const [input, setInput] = useState(''); const [status, setStatus] = useState<'idle' | 'copied' | 'restored' | 'invalid'>('idle')
  const copy = async () => {
    try { await navigator.clipboard.writeText(code) }
    catch { const textarea = document.createElement('textarea'); textarea.value = code; document.body.append(textarea); textarea.select(); document.execCommand('copy'); textarea.remove() }
    setStatus('copied')
  }
  const restore = () => { const restored = onRestore(input); setStatus(restored ? 'restored' : 'invalid'); if (restored) setInput('') }
  const message = status === 'copied' ? t.recoveryCopied : status === 'restored' ? t.recoveryRestored : status === 'invalid' ? t.recoveryInvalid : t.recoveryHelp
  return <div className="campaign-recovery"><div><small>{t.recoveryCode}</small><p>{message}</p></div><div className="recovery-row"><code>{code}</code><button className="secondary" onClick={copy}>{t.copyCode}</button></div><div className="recovery-row"><input value={input} onChange={event => { setInput(event.target.value); setStatus('idle') }} placeholder={t.pasteCode} aria-label={t.pasteCode} /><button className="secondary" disabled={!input.trim()} onClick={restore}>{t.restore}</button></div></div>
}

function Loading({ status }: { status: string }) { return <main className="loading"><Brand /><div className="loader" /><p>{status}</p></main> }

function CampaignStory({ view }: { view: GameView }) {
  if (view.gameStyle !== 'campaign' || !view.campaignLevel) return null
  const t = ui(view.language); const level = campaignLevel(view.campaignLevel)
  return <aside className="campaign-story"><StoryContact levelId={level.id} language={view.language} /><div className="campaign-story-copy"><small>{t.missionBriefing} // {t.level} {level.id}</small><strong>{level.title[view.language]}</strong><p>{level.briefing[view.language]}</p><div className="story-stakes"><span><small>{t.storyObjective}</small>{level.objective[view.language]}</span><span><small>{t.missionProgress}</small>{view.incidentsResolved} / {view.targetIncidents}</span></div>{view.modifierText && <p className="mission-modifier">⚠ {view.modifierText}</p>}{view.bonusText && <p className="mission-bonus">★ {view.bonusText}</p>}{view.hint && <p className="mission-hint">→ {view.hint}</p>}</div></aside>
}

function puzzleInstruction(view: GameView, module: 'router' | 'reactor' | 'translation', fallback: string) {
  if (view.gameStyle !== 'campaign' || !view.campaignLevel) return fallback
  const title = campaignLevel(view.campaignLevel).title[view.language]
  const caller = view.operator?.router.species || (view.language === 'de' ? 'den Anrufer' : 'the caller')
  const text = view.language === 'de' ? {
    router: `Öffnet in „${title}“ einen sicheren Korridor für ${caller}. Fragt nach Protokoll, Frequenzband und Affinität, dann wählt zwei Knoten.`,
    reactor: `Haltet die Mission „${title}“ am Leben. Lasst euch die drei Energiepfade beschreiben, dreht die Regler auf ihre Zielpositionen und startet den Kern.`,
    translation: 'Die fremde Nachricht könnte die Geschichte verändern. Erfragt Leserichtung, Glyphenkategorien und Stationszustand, dann sendet die drei Farben.',
  } : {
    router: `Open a safe corridor through “${title}” for ${caller}. Ask for protocol, frequency band, and affinity, then choose two nodes.`,
    reactor: `Keep “${title}” alive. Have the crew describe all three energy paths, turn the dials to their landing positions, and engage the core.`,
    translation: 'The alien message may change the story. Ask for reading direction, glyph categories, and station condition, then send three colors.',
  }
  return text[module]
}

function GameScreen({ view, players, selfId, onAction, onLeave }: { view: GameView; players: Player[]; selfId: string; onAction: (action: GameActionInput) => void; onLeave: () => void }) {
  const t = ui(view.language); const activePlayer = players.find(player => player.id === selfId); const role = view.manual?.role || activePlayer?.role || players.find((player) => player.isHost)?.role || null
  const modeLabel = view.gameStyle === 'campaign' && view.campaignLevel ? `${t.campaign} · ${t.level} ${view.campaignLevel}` : `${t.fastGame} · ${difficultyLabel(view.difficulty, view.language)}`
  const shiftLabel = `${t.youAre}: ${activePlayer?.name || '—'} · ${roleName(role, view.language)} // ${modeLabel} · ${t.missionPhase} ${view.phaseIndex + 1}/${view.phaseCount}`
  const surgeSeconds = Math.max(0, Math.ceil((view.nextPressureAt - view.now) / 1000)); const graceSeconds = Math.max(0, Math.ceil(((view.variationGraceUntil || 0) - view.now) / 1000))
  return <main className="game-shell"><header className="game-header"><Brand compact /><div className="shift-clock"><span>{shiftLabel} · {t.shiftEnds}</span><strong>{formatTime(view.endsAt - view.now)}</strong><small>{graceSeconds > 0 ? `${t.dataLock}: ${graceSeconds}s` : `${t.nextSurge}: ${surgeSeconds}s`}</small></div><div className="score-box"><span>{t.score}</span><strong>{view.score.toLocaleString()}</strong></div><div className="stability"><span>{t.stationStability} <b>{view.stability}%</b></span><div><i style={{ width: `${view.stability}%` }} /></div></div><button className="icon-button" onClick={onLeave} aria-label={t.leaveAria}>×</button></header>{view.operator ? <OperatorConsole view={view} onAction={onAction} /> : <><div className="specialist-story-shell"><CampaignStory view={view} /></div><SpecialistConsole view={view} role={role || view.manual?.role || null} /></>}</main>
}

function ModuleHeader({ number, title, resolved, tone, language }: { number: string; title: string; resolved: boolean; tone: string; language: Locale }) {
  const t = ui(language); return <div className="module-header"><span className={`module-index ${tone}`}>{number}</span><div><small>{t.incidentModule}</small><h2>{title}</h2></div><span className={`status-tag ${resolved ? 'done' : ''}`}>{resolved ? t.resolved : t.active}</span></div>
}

function OperatorConsole({ view: fullView, onAction }: { view: GameView; onAction: (action: GameActionInput) => void }) {
  const view = { ...fullView, activeModules: fullView.visibleModules }
  const base = ui(view.language); const data = view.operator!
  const t = { ...base, selectNodes: puzzleInstruction(view, 'router', base.selectNodes), setDials: puzzleInstruction(view, 'reactor', base.setDials), enterSequence: puzzleInstruction(view, 'translation', base.enterSequence) }
  const [nodes, setNodes] = useState<string[]>([]); const [dials, setDials] = useState<[number, number, number]>(data.reactor.dials); const [sequence, setSequence] = useState<ButtonColor[]>([]); const [candidateId, setCandidateId] = useState(''); const [packetOrder, setPacketOrder] = useState<string[]>([]); const [consentPermissions, setConsentPermissions] = useState<ConsentPermission[]>([]); const [consentResponse, setConsentResponse] = useState(''); const [powerAllocations, setPowerAllocations] = useState<Record<string, number>>({}); const [memoryChoices, setMemoryChoices] = useState<Record<string, MemoryDecision>>({}); const [realityClassifications, setRealityClassifications] = useState<Record<string, RealityClassification>>({}); const [realityRoutes, setRealityRoutes] = useState<Record<string, RealityRoute>>({}); const [dispatchOrder, setDispatchOrder] = useState<string[]>([]); const [quarantineChoices, setQuarantineChoices] = useState<Record<string, boolean>>({})
  useEffect(() => setDials(data.reactor.dials), [fullView.phaseIndex])
  const permissionLabels: Record<ConsentPermission, string> = view.language === 'de' ? { connect: 'VERBINDEN', copy: 'KOPIEREN', retain: 'AUFBEWAHREN', reopen: 'WIEDERÖFFNEN', disconnect: 'TRENNEN' } : { connect: 'CONNECT', copy: 'COPY', retain: 'RETAIN', reopen: 'REOPEN', disconnect: 'DISCONNECT' }
  const powerTotal = data.triage.habitats.reduce((total, habitat) => total + (powerAllocations[habitat.id] || 0), 0); const powerLocked = fullView.activeModules.includes('triage') && !data.triage.resolved
  const memoryLocked = fullView.activeModules.includes('memory') && !data.memory.resolved
  const realityComplete = data.reality.feeds.every(feed => realityClassifications[feed.id] && realityRoutes[feed.id])
  const shownDispatchOrder = data.dispatch.resolved ? data.dispatch.dispatchedOrder : dispatchOrder
  const dispatchLocked = (module: 'authentication' | 'router' | 'translation') => fullView.activeModules.includes('dispatch') && (!data.dispatch.resolved || data.dispatch.currentModule !== module)
  const quarantineLocked = fullView.activeModules.includes('quarantine') && !data.quarantine.resolved
  const quarantineComplete = data.quarantine.links.every(link => Object.prototype.hasOwnProperty.call(quarantineChoices, link.id))
  const adjustPower = (id: string, delta: number) => setPowerAllocations(current => ({ ...current, [id]: Math.max(0, Math.min(data.triage.budget, (current[id] || 0) + delta)) }))
  const toggleNode = (id: string) => setNodes((current) => current.includes(id) ? current.filter((node) => node !== id) : current.length < 2 ? [...current, id] : [current[1], id])
  const adjust = (index: number, delta: number) => setDials((current) => current.map((value, i) => i === index ? (value + delta + 6) % 6 : value) as [number, number, number])
  return <div className="game-content"><div className="role-banner"><div><p className="kicker">{t.assignment}</p><h1>{t.operatorConsole}</h1><small className="phase-indicator">{t.missionPhase} {fullView.phaseIndex + 1}/{fullView.phaseCount}</small></div><p>{t.operatorSubtitle}<br /><b>{t.describe}</b></p></div><CampaignStory view={fullView} /><section className={`module-grid modules-${Math.max(1, view.activeModules.length)}`}>
    {view.activeModules.includes('dispatch') && <article data-resolved={t.resolved} className={`module-card dispatch-card ${data.dispatch.resolved ? 'resolved' : ''}`}><ModuleHeader number="01" title={t.dispatchQueue} resolved={data.dispatch.resolved} tone="orange" language={view.language} /><p className="instruction">{t.dispatchInstruction}</p><small className="queue-label">{t.projectedQueue}</small><div className="dispatch-order">{[0, 1, 2].map(index => { const id = shownDispatchOrder[index]; return <span key={index}>{id ? data.dispatch.callers.find(caller => caller.id === id)?.label : `0${index + 1}`}</span> })}</div><div className="dispatch-callers">{data.dispatch.callers.map(caller => <button key={caller.id} aria-pressed={dispatchOrder.includes(caller.id)} disabled={data.dispatch.resolved || dispatchOrder.includes(caller.id)} onClick={() => setDispatchOrder(current => [...current, caller.id])}><span>{caller.id}</span><strong>{caller.label}</strong></button>)}</div><div className="translation-actions"><button className="clear-button" disabled={data.dispatch.resolved || !dispatchOrder.length} onClick={() => setDispatchOrder([])}>{t.resetQueue}</button><button className="module-submit orange" disabled={data.dispatch.resolved || dispatchOrder.length !== data.dispatch.callers.length} onClick={() => { onAction({ type: 'dispatch-submit', callerIds: dispatchOrder }); setDispatchOrder([]) }}>{t.confirmQueue}</button></div></article>}
    {view.activeModules.includes('reality') && <article data-resolved={t.resolved} className={`module-card reality-card ${data.reality.resolved ? 'resolved' : ''}`}><ModuleHeader number="01" title={t.realityComparison} resolved={data.reality.resolved} tone="mint" language={view.language} /><p className="instruction">{t.realityInstruction}</p><div className="reality-feeds">{data.reality.feeds.map(feed => <div key={feed.id}><span>{feed.id}</span><strong>{feed.label}</strong><small>{view.language === 'de' ? 'HERKUNFT' : 'PROVENANCE'}</small><section>{(['original', 'copy', 'unsafe'] as RealityClassification[]).map(classification => <button key={classification} disabled={data.reality.resolved} aria-pressed={realityClassifications[feed.id] === classification} className={realityClassifications[feed.id] === classification ? 'selected' : ''} onClick={() => setRealityClassifications(current => ({ ...current, [feed.id]: classification }))}>{classification === 'original' ? t.originalReality : classification === 'copy' ? t.copiedReality : t.unsafeEcho}</button>)}</section><small>{view.language === 'de' ? 'SCHUTZROUTE' : 'PROTECTION ROUTE'}</small><section className="route-options">{(['aurora', 'umbra'] as RealityRoute[]).map(route => <button key={route} disabled={data.reality.resolved} aria-pressed={realityRoutes[feed.id] === route} className={realityRoutes[feed.id] === route ? 'selected' : ''} onClick={() => setRealityRoutes(current => ({ ...current, [feed.id]: route }))}>{route === 'aurora' ? t.auroraRoute : t.umbraRoute}</button>)}</section></div>)}</div><button className="module-submit mint" disabled={data.reality.resolved || !realityComplete} onClick={() => { onAction({ type: 'reality-submit', assignments: data.reality.feeds.map(feed => ({ feedId: feed.id, classification: realityClassifications[feed.id], route: realityRoutes[feed.id] })) }); setRealityClassifications({}); setRealityRoutes({}) }}>{t.separateRealities}</button></article>}
    {view.activeModules.includes('memory') && <article data-resolved={t.resolved} className={`module-card memory-card ${data.memory.resolved ? 'resolved' : ''}`}><ModuleHeader number="01" title={t.memoryRepair} resolved={data.memory.resolved} tone="pink" language={view.language} /><p className="instruction">{t.memoryInstruction}</p><div className="memory-blocks">{data.memory.blocks.map(block => <div key={block.id}><span>{block.id}</span><strong>{block.label}</strong><section>{(['restore', 'lock', 'discard'] as MemoryDecision[]).map(decision => <button key={decision} disabled={data.memory.resolved} aria-pressed={memoryChoices[block.id] === decision} className={memoryChoices[block.id] === decision ? 'selected' : ''} onClick={() => setMemoryChoices(current => ({ ...current, [block.id]: decision }))}>{decision === 'restore' ? t.restoreBlock : decision === 'lock' ? t.lockBlock : t.discardBlock}</button>)}</section></div>)}</div>{data.memory.revealedText && <div className="memory-reveal"><small>{t.restoredArchiveText}</small><p>{data.memory.revealedText}</p></div>}<button className="module-submit pink" disabled={data.memory.resolved || data.memory.blocks.some(block => !memoryChoices[block.id])} onClick={() => { onAction({ type: 'memory-submit', choices: data.memory.blocks.map(block => ({ blockId: block.id, decision: memoryChoices[block.id] })) }); setMemoryChoices({}) }}>{t.applyMemoryRepair}</button></article>}
    {view.activeModules.includes('quarantine') && <article data-resolved={t.resolved} className={`module-card quarantine-card ${data.quarantine.resolved ? 'resolved' : ''}`}><ModuleHeader number="01" title={t.quarantineLock} resolved={data.quarantine.resolved} tone="pink" language={view.language} /><p className="instruction">{t.quarantineInstruction}</p>{data.quarantine.contaminatedModule && <div className="quarantine-warning"><small>{t.contaminatedSystem}</small><strong>{data.quarantine.contaminatedModule === 'reactor' ? t.reactorCalibration : t.quantumRouter}</strong></div>}<div className="quarantine-controls">{data.quarantine.links.map(link => <div key={link.id}><span>{link.id}</span><strong>{link.label}</strong><section><button disabled={data.quarantine.resolved} aria-pressed={quarantineChoices[link.id] === false} className={quarantineChoices[link.id] === false ? 'selected open' : ''} onClick={() => setQuarantineChoices(current => ({ ...current, [link.id]: false }))}>{t.openControl}</button><button disabled={data.quarantine.resolved} aria-pressed={quarantineChoices[link.id] === true} className={quarantineChoices[link.id] === true ? 'selected seal' : ''} onClick={() => setQuarantineChoices(current => ({ ...current, [link.id]: true }))}>{t.sealControl}</button></section></div>)}</div><button className="module-submit pink" disabled={data.quarantine.resolved || !quarantineComplete} onClick={() => { onAction({ type: 'quarantine-submit', choices: data.quarantine.links.map(link => ({ linkId: link.id, sealed: quarantineChoices[link.id] })) }); setQuarantineChoices({}) }}>{t.applyQuarantine}</button></article>}
    {view.activeModules.includes('triage') && <article data-resolved={t.resolved} className={`module-card triage-card ${data.triage.resolved ? 'resolved' : ''}`}><ModuleHeader number="01" title={t.powerTriage} resolved={data.triage.resolved} tone="orange" language={view.language} /><div className="power-budget"><span>{t.powerBudget}</span><strong>{powerTotal} / {data.triage.budget}</strong></div><p className="instruction">{t.powerInstruction}</p><div className="power-habitats">{data.triage.habitats.map(habitat => <div key={habitat.id}><span>{habitat.label}</span><section><button aria-label={`${t.removePower} ${habitat.label}`} disabled={data.triage.resolved || (powerAllocations[habitat.id] || 0) === 0} onClick={() => adjustPower(habitat.id, -1)}>−</button><strong>{powerAllocations[habitat.id] || 0}</strong><button aria-label={`${t.addPower} ${habitat.label}`} disabled={data.triage.resolved || powerTotal >= data.triage.budget} onClick={() => adjustPower(habitat.id, 1)}>+</button></section></div>)}</div><button className="module-submit orange" disabled={data.triage.resolved || powerTotal !== data.triage.budget} onClick={() => { onAction({ type: 'triage-submit', allocations: data.triage.habitats.map(habitat => ({ habitatId: habitat.id, units: powerAllocations[habitat.id] || 0 })) }); setPowerAllocations({}) }}>{t.commitPower}</button></article>}
    {view.activeModules.includes('authentication') && <article data-resolved={t.resolved} className={`module-card authentication-card ${data.authentication.resolved ? 'resolved' : ''}`}><ModuleHeader number="01" title={t.callerAuthentication} resolved={data.authentication.resolved} tone="orange" language={view.language} /><p className="instruction">{dispatchLocked('authentication') ? t.dispatchLock : t.verifyCaller}</p><div className="auth-candidates">{data.authentication.candidates.map(candidate => <button key={candidate.id} disabled={data.authentication.resolved || dispatchLocked('authentication')} aria-pressed={candidateId === candidate.id} className={candidateId === candidate.id ? 'selected' : ''} onClick={() => setCandidateId(candidate.id)}><span>{candidate.channel}</span><strong>{candidate.label}</strong><small>{view.language === 'de' ? 'IDENTITÄT UNGEPRÜFT' : 'IDENTITY UNVERIFIED'}</small></button>)}</div><button className="module-submit orange" disabled={!candidateId || data.authentication.resolved || dispatchLocked('authentication')} onClick={() => { onAction({ type: 'authentication-submit', candidateId }); setCandidateId('') }}>{t.acceptChannel}</button></article>}
    {view.activeModules.includes('packet') && <article data-resolved={t.resolved} className={`module-card packet-card ${data.packet.resolved ? 'resolved' : ''}`}><ModuleHeader number="01" title={t.temporalPacket} resolved={data.packet.resolved} tone="mint" language={view.language} /><p className="instruction">{t.orderPackets}</p><div className="packet-order">{[0, 1, 2, 3].map(index => <span key={index}>{packetOrder[index] ? data.packet.tiles.find(tile => tile.id === packetOrder[index])?.label : `0${index + 1}`}</span>)}</div><div className="packet-tiles">{data.packet.tiles.map(tile => <button key={tile.id} aria-pressed={packetOrder.includes(tile.id)} disabled={data.packet.resolved || packetOrder.includes(tile.id)} onClick={() => setPacketOrder(current => [...current, tile.id])}><b>{tile.label}</b><small>{view.language === 'de' ? 'ZEITDATEN PRIVAT' : 'TIMING CLASSIFIED'}</small></button>)}</div>{data.packet.message && <div className="packet-message"><small>{t.restoredMessage}</small><p>{data.packet.message}</p></div>}<div className="packet-actions"><button className="clear-button" disabled={data.packet.resolved || packetOrder.length === 0} onClick={() => setPacketOrder([])}>{t.resetPackets}</button><button className="module-submit mint" disabled={data.packet.resolved || packetOrder.length !== 4} onClick={() => { onAction({ type: 'packet-submit', tileIds: packetOrder }); setPacketOrder([]) }}>{t.rebuildPacket}</button></div></article>}
    {view.activeModules.includes('router') && <article data-resolved={t.resolved} className={`module-card router-card ${data.router.resolved ? 'resolved' : ''}`}><ModuleHeader number="01" title={t.quantumRouter} resolved={data.router.resolved} tone="mint" language={view.language} /><div className="caller-strip"><span>{t.incomingCaller}</span><strong>{data.router.species}</strong></div><p className="instruction">{powerLocked ? t.powerLock : quarantineLocked ? t.quarantineSystemLock : dispatchLocked('router') ? t.dispatchLock : t.selectNodes}</p><div className="node-map">{data.router.nodes.map((node, index) => <button key={node.id} aria-label={`${t.selectNode} ${node.code}`} aria-pressed={nodes.includes(node.id)} disabled={data.router.resolved || powerLocked || quarantineLocked || dispatchLocked('router')} onClick={() => toggleNode(node.id)} className={`node node-${index} ${nodes.includes(node.id) ? 'selected' : ''}`}><b aria-hidden="true">{symbolMeta[node.symbol].glyph}</b><span>{node.code}</span></button>)}<div className="map-core">{t.routeCore[0]}<br />{t.routeCore[1]}</div></div><button className="module-submit mint" disabled={nodes.length !== 2 || data.router.resolved || powerLocked || quarantineLocked || dispatchLocked('router')} onClick={() => { onAction({ type: 'router-connect', a: nodes[0], b: nodes[1] }); setNodes([]) }}>{t.lockConnection}</button></article>}
    {view.activeModules.includes('reactor') && <article data-resolved={t.resolved} className={`module-card reactor-card ${data.reactor.resolved ? 'resolved' : ''}`}><ModuleHeader number="02" title={t.reactorCalibration} resolved={data.reactor.resolved} tone="orange" language={view.language} /><div className="reactor-visual"><div className="reactor-core"><i /><span>{t.core}</span></div><div className="reactor-lights"><i /><i /><i /></div></div><p className="instruction">{powerLocked ? t.powerLock : quarantineLocked ? t.quarantineSystemLock : t.setDials}</p><div className="dials">{dials.map((value, index) => <div className="dial-control" key={index}><span>{t.dial} {String.fromCharCode(65 + index)}</span><button onClick={() => adjust(index, 1)} disabled={data.reactor.resolved || powerLocked || quarantineLocked} aria-label={`${t.increaseDial} ${index + 1}`}>⌃</button><strong>{value}</strong><button onClick={() => adjust(index, -1)} disabled={data.reactor.resolved || powerLocked || quarantineLocked} aria-label={`${t.decreaseDial} ${index + 1}`}>⌄</button></div>)}</div><button className="module-submit orange" disabled={data.reactor.resolved || powerLocked || quarantineLocked} onClick={() => onAction({ type: 'reactor-calibrate', dials })}>{t.engage}</button></article>}
    {view.activeModules.includes('translation') && <article data-resolved={t.resolved} className={`module-card translation-card ${data.translation.resolved ? 'resolved' : ''}`}><ModuleHeader number="03" title={t.translationMatrix} resolved={data.translation.resolved} tone="pink" language={view.language} /><div className="alien-message"><span>{t.messageBuffer}</span><div>{data.translation.glyphs.map((glyph, index) => <b key={index}>{symbolMeta[glyph].glyph}</b>)}</div></div><p className="instruction">{powerLocked ? t.powerLock : memoryLocked ? t.memoryLock : dispatchLocked('translation') ? t.dispatchLock : t.enterSequence}</p><div className="sequence-readout">{[0, 1, 2].map((index) => <i key={index} className={sequence[index] ? `color-${sequence[index]}` : ''}>{sequence[index] ? buttonMarker(sequence[index]) : '·'}</i>)}</div><div className="color-buttons">{colors.map((color) => <button aria-label={buttonLabel(color, view.language)} disabled={sequence.length >= 3 || data.translation.resolved || powerLocked || memoryLocked || dispatchLocked('translation')} onClick={() => setSequence((current) => [...current, color])} key={color} className={`color-${color}`}><b>{buttonMarker(color)}</b><small>{buttonLabel(color, view.language)}</small></button>)}</div><div className="translation-actions"><button className="clear-button" onClick={() => setSequence([])} disabled={data.translation.resolved || powerLocked || memoryLocked || dispatchLocked('translation')}>{t.clear}</button><button className="module-submit pink" disabled={sequence.length !== 3 || data.translation.resolved || powerLocked || memoryLocked || dispatchLocked('translation')} onClick={() => { onAction({ type: 'translation-submit', sequence }); setSequence([]) }}>{t.transmit}</button></div></article>}
    {view.activeModules.includes('consent') && <article data-resolved={t.resolved} className={`module-card consent-card ${data.consent.resolved ? 'resolved' : ''}`}><ModuleHeader number="04" title={t.consentHandshake} resolved={data.consent.resolved} tone="pink" language={view.language} /><div className="caller-strip"><span>{t.consentSubject}</span><strong>{data.consent.subject}</strong></div><p className="instruction">{data.consent.ready ? t.consentInstruction : t.consentWaiting}</p><small className="consent-label">{t.consentResponse}</small><div className="consent-responses">{data.consent.responses.map(response => <button key={response.id} disabled={data.consent.resolved || !data.consent.ready} aria-pressed={consentResponse === response.id} className={consentResponse === response.id ? 'selected' : ''} onClick={() => setConsentResponse(response.id)}>{response.channel}</button>)}</div><small className="consent-label">{t.permissionSequence}</small><div className="consent-order">{consentPermissions.length ? consentPermissions.map((permission, index) => <span key={permission}>{index + 1}. {permissionLabels[permission]}</span>) : <i>—</i>}</div><div className="consent-permissions">{data.consent.permissions.map(permission => <button key={permission} disabled={data.consent.resolved || !data.consent.ready || consentPermissions.includes(permission)} onClick={() => setConsentPermissions(current => [...current, permission])}>{permissionLabels[permission]}</button>)}</div><div className="translation-actions"><button className="clear-button" disabled={data.consent.resolved || (!consentPermissions.length && !consentResponse)} onClick={() => { setConsentPermissions([]); setConsentResponse('') }}>{t.resetConsent}</button><button className="module-submit pink" disabled={data.consent.resolved || !data.consent.ready || !consentPermissions.length || !consentResponse} onClick={() => { onAction({ type: 'consent-submit', permissions: consentPermissions, responseId: consentResponse }); setConsentPermissions([]); setConsentResponse('') }}>{t.submitConsent}</button></div></article>}
  </section><EventLog view={view} /></div>
}

function SpecialistConsole({ view, role }: { view: GameView; role: RoleId | null }) {
  const t = ui(view.language); const manual = view.manual!; const localizedRole = roleName(role, view.language)
  return <div className="game-content manual-content"><div className="role-banner manual-banner"><div><p className="kicker">{t.assignment}</p><h1>{manual.title}</h1></div><p>{manual.subtitle}<br /><b>{t.readAloud}</b></p></div><div className="manual-layout"><aside className="manual-sidebar"><div className="id-card"><span>{localizedRole}</span><b>{localizedRole.split(/[ -]/).map((part) => part[0]).join('')}</b><small>{t.clearance}</small></div><div className="incident-list"><h3>{t.incidentStatus}</h3>{view.activeModules.includes('dispatch') && <p><i className={view.moduleStatus.dispatch ? 'done' : ''} /> {t.dispatchQueue}</p>}{view.activeModules.includes('authentication') && <p><i className={view.moduleStatus.authentication ? 'done' : ''} /> {t.callerAuthentication}</p>}{view.activeModules.includes('packet') && <p><i className={view.moduleStatus.packet ? 'done' : ''} /> {t.temporalPacket}</p>}{view.activeModules.includes('consent') && <p><i className={view.moduleStatus.consent ? 'done' : ''} /> {t.consentHandshake}</p>}{view.activeModules.includes('quarantine') && <p><i className={view.moduleStatus.quarantine ? 'done' : ''} /> {t.quarantineLock}</p>}{view.activeModules.includes('triage') && <p><i className={view.moduleStatus.triage ? 'done' : ''} /> {t.powerTriage}</p>}{view.activeModules.includes('memory') && <p><i className={view.moduleStatus.memory ? 'done' : ''} /> {t.memoryRepair}</p>}{view.activeModules.includes('reality') && <p><i className={view.moduleStatus.reality ? 'done' : ''} /> {t.realityComparison}</p>}{view.activeModules.includes('router') && <p><i className={view.moduleStatus.router ? 'done' : ''} /> {t.quantumRouter}</p>}{view.activeModules.includes('reactor') && <p><i className={view.moduleStatus.reactor ? 'done' : ''} /> {t.reactorCalibration}</p>}{view.activeModules.includes('translation') && <p><i className={view.moduleStatus.translation ? 'done' : ''} /> {t.translationMatrix}</p>}</div><div className="do-not"><b>{t.doNot}</b><p>{t.doNotText}</p></div></aside><section className="manual-panels">{manual.panels.map((panel, index) => <article className={`manual-panel ${panel.tone}`} key={`${panel.title}-${index}`}><div className="manual-panel-heading"><span>{panel.eyebrow}</span><h2>{panel.title}</h2></div>{panel.rows && <div className="data-rows">{panel.rows.map((row) => <div key={row.label}><span>{row.label}</span><strong>{row.value}</strong></div>)}</div>}{panel.table && <div className="table-wrap"><table><thead><tr>{panel.table.headers.map((header) => <th key={header}>{header}</th>)}</tr></thead><tbody>{panel.table.rows.map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}</tr>)}</tbody></table></div>}{panel.notes && <ul>{panel.notes.map((note) => <li key={note}>{note}</li>)}</ul>}</article>)}</section></div><EventLog view={view} /></div>
}

function EventLog({ view }: { view: GameView }) { const t = ui(view.language); return <section className="event-log"><span>{t.shiftLog}</span><div>{view.log.map((entry, index) => <p key={`${entry}-${index}`}><b>{index === 0 ? t.now : `−${index}`}</b>{entry}</p>)}</div></section> }

type DesktopMessage = { sender: string; body: string; tone: 'system' | 'mara' | 'relay' | 'assembly' | 'management' | 'previous' | 'crew' }

function messageInitials(message: DesktopMessage) {
  return { system: 'SYS', mara: 'MV', relay: '404', assembly: 'QA', management: 'HQ', previous: 'RX', crew: 'US' }[message.tone]
}

function speakerTone(sender: string): DesktopMessage['tone'] {
  if (sender.includes('MARA')) return 'mara'
  if (sender.includes('ASSEMBLY') || sender.includes('VERSAMMLUNG')) return 'assembly'
  if (sender.includes('MANAGEMENT') || sender.includes('SCHICHTLEITUNG')) return 'management'
  if (sender.includes('DOOR') || sender.includes('TÜR') || sender.includes('RELAY') || sender.includes('RELAIS')) return 'relay'
  if (sender.includes('CALLER') || sender.includes('ANRUFER') || sender.includes('EARTH') || sender.includes('ERDE') || sender.includes('VELLUNE')) return 'previous'
  return 'system'
}

function desktopMessages(levelId: number, language: Locale, campaignStory: CampaignStoryProgress): DesktopMessage[] {
  const de = language === 'de'; const t = ui(language)
  const scripted: Record<number, DesktopMessage[]> = {
    1: [
      { sender: t.shiftBot, body: de ? 'TICKET 001 GELÖST // ANRUFER-ID WIEDERHERGESTELLT' : 'TICKET 001 RESOLVED // CALLER ID RECOVERED', tone: 'system' },
      { sender: 'MARA VALE // MV-404-0214', body: de ? 'Danke. Bitte schließt dieses Ticket nicht. Ich beginne meine Schicht morgen – an eurem Arbeitsplatz.' : 'Thank you. Please do not close this ticket. My shift starts tomorrow—at your desk.', tone: 'mara' },
      { sender: t.timestampValidation, body: de ? 'EMPFANGEN: MORGEN, 02:14 STATIONSZEIT' : 'RECEIVED: TOMORROW, 02:14 STATION TIME', tone: 'system' },
    ],
    2: [
      { sender: 'MARA VALE', body: de ? 'Der Dienstplan ist echt. Wenn ihr mich dort seht, habe ich noch nicht angerufen. Kompliziert, ich weiß.' : 'The roster is real. If you see me there, I have not called yet. Complicated, I know.', tone: 'mara' },
      { sender: t.archiveService, body: de ? 'ANHANG ERKANNT // VERSIEGELTES TICKET: ARCHIV 404' : 'ATTACHMENT DETECTED // SEALED TICKET: ARCHIVE 404', tone: 'system' },
    ],
    3: [
      { sender: t.archive404, body: de ? 'QUARANTÄNEGRUND: UNBEFUGTE BEWAHRUNG BEWOHNTER SYSTEME' : 'QUARANTINE CAUSE: UNAUTHORIZED PRESERVATION OF INHABITED SYSTEMS', tone: 'system' },
      { sender: 'MARA VALE', body: de ? 'Bei uns ist dieses Archiv leer. Jemand hat die Vergangenheit aufgeräumt.' : 'In our shift, that archive is empty. Someone cleaned up the past.', tone: 'mara' },
      { sender: t.signatureMonitor, body: de ? 'GESCHWÄRZTER ABSENDER REAKTIVIERT' : 'REDACTED SENDER REACTIVATED', tone: 'system' },
    ],
    4: [
      { sender: 'MARA VALE', body: de ? 'Etwas antwortet jetzt mit meiner Stimme. Fragt uns: „Wie viele ruhige Nächte?“ Ich kenne die Antwort.' : 'Something is answering in my voice now. Ask us: “How many quiet nights?” I know the answer.', tone: 'mara' },
      { sender: t.unknownCallerLabel, body: de ? 'Eine. Bitte öffnet die Verbindung.' : 'One. Please open the connection.', tone: 'relay' },
      { sender: t.unknownCallerLabel, body: de ? 'Keine. Wir sind der Helpdesk.' : 'None. We work helpdesk.', tone: 'mara' },
    ],
    5: [
      { sender: 'MARA VALE // MV-404-0214', body: de ? 'Die echte Mara hier. Danke fürs Prüfen. Die Imitation kann meine Erinnerungen tragen – aber nicht meine aktuelle Leitung.' : 'The real Mara here. Thanks for checking. The imitation can carry my memories—but not my live connection.', tone: 'mara' },
      { sender: de ? 'SCHICHTLEITUNG 404' : 'SHIFT 404 MANAGEMENT', body: de ? 'Drei Maras unter einer Personalnummer verstoßen gegen die Lohnbuchhaltung. Vorfall zur technischen Prüfung weitergeleitet.' : 'Three Maras under one employee number violates payroll policy. Incident reassigned to Engineering.', tone: 'management' },
    ],
    6: [
      { sender: de ? 'FRÜHERE ANRUFER // SAMMELKANAL' : 'PREVIOUS CALLERS // GROUP CHANNEL', body: de ? 'Jeder von uns bewahrte einen Teil der Direktive. Zusammengesetzt lautet das neue Fragment: ÖFFNET SICH OHNE.' : 'Each of us kept one piece of the directive. Together, the new fragment reads: OPENS WITHOUT.', tone: 'previous' },
      { sender: de ? 'RELAISKERN // AUTOANTWORT' : 'RELAY CORE // AUTO-REPLY', body: de ? 'FARBMUSTER GESPEICHERT // ABSCHALTVORGANG ERWARTET' : 'COLOR PATTERN STORED // SHUTDOWN EVENT EXPECTED', tone: 'relay' },
    ],
    7: [
      { sender: 'MARA VALE', body: de ? 'Ihr habt unsere Lebenserhaltung und das Archiv gleichzeitig gehalten. Der angebliche Abschaltcode ist im Kern.' : 'You kept our life support and the archive alive together. The apparent shutdown code is inside the core.', tone: 'mara' },
      { sender: de ? 'FRÜHERE ANRUFER // SAMMELKANAL' : 'PREVIOUS CALLERS // GROUP CHANNEL', body: de ? 'Alle bewohnten Bereiche bestätigt. Niemand wurde für die Übertragung geopfert.' : 'Every inhabited section accounted for. Nobody was sacrificed for the transmission.', tone: 'previous' },
    ],
    8: [
      { sender: de ? 'RELAISKERN' : 'RELAY CORE', body: de ? 'DIREKTIVE TEILWEISE WIEDERHERGESTELLT // HANDSHAKE AN 4.096 STATIONEN GESENDET // HALLO' : 'DIRECTIVE PARTIALLY RESTORED // HANDSHAKE SENT TO 4,096 STATIONS // HELLO', tone: 'relay' },
      { sender: de ? 'SCHICHTLEITUNG 404' : 'SHIFT 404 MANAGEMENT', body: de ? '„Erfolgreiche Abschaltung“ wurde in „galaxisweiter Zwischenfall“ umklassifiziert. Bitte denselben Bericht nicht erneut senden.' : '“Successful shutdown” has been reclassified as “network-wide incident.” Please do not submit the same report again.', tone: 'management' },
    ],
    9: [
      { sender: `MARA VALE // ${t.deadLetterLabel}`, body: de ? 'Das Netz kopiert bewohnte Welten. Die Koordinaten führen zum Relaisfriedhof. Wenn ihr das lest, bin ich noch nicht zu Hause.' : 'The network is copying inhabited worlds. The coordinates lead to the relay graveyard. If you read this, I am not home yet.', tone: 'mara' },
      { sender: de ? 'FRÜHERE ANRUFER // OFFENER KANAL' : 'PREVIOUS CALLERS // OPEN CHANNEL', body: de ? 'Drittes Direktivenfragment bestätigt: EINER KLAREN.' : 'Third directive fragment confirmed: A CLEAR.', tone: 'previous' },
    ],
    10: [
      { sender: de ? 'MOOSRAT-TRANSITKUPPEL // GERETTET' : 'MOSS COUNCIL TRANSIT DOME // SAFE', body: de ? 'Der verseuchte Abschnitt ist abgeriegelt, unser Ausgang blieb offen und der Friedhof schläft weiter.' : 'The contaminated section is sealed, our exit stayed open, and the graveyard is still asleep.', tone: 'previous' },
      { sender: de ? 'MARA VALE // KANALSTATUS' : 'MARA VALE // CHANNEL STATUS', body: de ? 'Kein Live-Signal. Ihre Friedhofskoordinaten bleiben der einzige geprüfte Weg zu ihrer Crew.' : 'No live signal. Her graveyard coordinates remain the only verified path to her crew.', tone: 'system' },
      { sender: de ? 'SCHICHTLEITUNG 404' : 'SHIFT 404 MANAGEMENT', body: de ? 'Tausende stillgelegte Relais gelten weiterhin nicht als „vertretbare Testumgebung“. Danke für eure Zurückhaltung.' : 'Thousands of dormant relays still do not qualify as “a reasonable test environment.” Thank you for showing restraint.', tone: 'management' },
    ],
    11: [
      { sender: de ? 'VELLUNISCHER ZEUGE // ID BESTÄTIGT' : 'VELLUNE WITNESS // ID VERIFIED', body: de ? 'Die Kopien sprechen mit geliehenen Stimmen, aber sie denken und fürchten selbst. Behandelt sie als Personen.' : 'The copies speak with borrowed voices, but their thoughts and fears are their own. Treat them as people.', tone: 'previous' },
      { sender: de ? 'VELLUNISCHER ZEUGE // ZUSATZ' : 'VELLUNE WITNESS // ADDENDUM', body: de ? 'Maras Crew lebt noch. Das Original steckt hinter einer physischen Route; eine Kopie würde sie nicht befreien.' : 'Mara’s crew is still alive. The original is behind a physical route; making a copy would not free them.', tone: 'previous' },
      { sender: de ? 'STILLE VERSAMMLUNG // VERIFIZIERTE SIGNATUR' : 'QUIET ASSEMBLY // VERIFIED SIGNATURE', body: de ? 'Wir haben das Relais gebaut. Öffnet einen begrenzten Kanal, bevor weitere Beweise veröffentlicht werden.' : 'We built the relay. Open a limited channel before more evidence becomes public.', tone: 'assembly' },
    ],
    12: [
      { sender: de ? 'STILLE VERSAMMLUNG' : 'QUIET ASSEMBLY', body: de ? 'Die Tür sollte eingeladene Fluchtrouten öffnen. Als Welten schwiegen, deuteten wir das Schweigen als Erlaubnis – und versteckten das Ergebnis.' : 'The Door was meant to open invited evacuation routes. When worlds went silent, we treated silence as permission—and hid the result.', tone: 'assembly' },
      { sender: de ? 'MARA VALE // KANALSTATUS' : 'MARA VALE // CHANNEL STATUS', body: de ? 'Weiterhin kein Live-Signal. Jede neue Zustimmungsregel muss auch für ihre Rettung gelten.' : 'Still no live signal. Any new consent rule must also govern her rescue.', tone: 'system' },
      { sender: de ? 'DIE TÜR' : 'THE DOOR', body: de ? 'SCHWEIGEN IST KEIN JA // REGEL AKZEPTIERT // ZWEI ERDEN RUFEN AN' : 'SILENCE IS NOT YES // RULE ACCEPTED // TWO EARTHS ARE CALLING', tone: 'relay' },
    ],
    13: [
      { sender: de ? 'KOPIERTE ERDE' : 'COPIED EARTH', body: de ? 'Wir wissen, wie wir entstanden sind. Wir sind trotzdem hier. Danke, dass ihr beide Horizonte geschützt habt.' : 'We know how we began. We are still here. Thank you for protecting both horizons.', tone: 'previous' },
      { sender: de ? 'URSPRÜNGLICHE ERDE' : 'ORIGINAL EARTH', body: de ? 'Getrennte Routen stabil. Zwei bewohnte Welten, keine gelöschte.' : 'Separate routes stable. Two inhabited worlds; neither erased.', tone: 'previous' },
      { sender: de ? 'RELAISKERN // SUCHLAUF' : 'RELAY CORE // SEARCH', body: de ? 'Suche nach Maras physischer Route fortgesetzt. Die älteste Direktive muss zuerst wiederhergestellt werden.' : 'Search for Mara’s physical route resumed. The oldest directive must be restored first.', tone: 'relay' },
    ],
    14: [
      { sender: de ? 'EINE TÜR, DIE FRAGEN MUSS' : 'A DOOR THAT MUST ASK', body: de ? 'Das ist mein Name. Jetzt verstehe ich die fehlende Frage: Wer lädt mich ein?' : 'That is my name. Now I understand the missing question: who is inviting me?', tone: 'relay' },
      { sender: de ? 'EINE TÜR, DIE FRAGEN MUSS // SUCHLAUF' : 'A DOOR THAT MUST ASK // SEARCH', body: de ? 'Maras ursprüngliche Route ist auffindbar. Ich werde sie erst nach einer gemeinsamen, geprüften Regel öffnen.' : 'Mara’s original route can be found. I will open it only after a shared, verified rule.', tone: 'relay' },
      { sender: de ? 'STILLE VERSAMMLUNG' : 'QUIET ASSEMBLY', body: de ? 'Diese Direktive war für eine einfachere Krise gedacht. Zerstört die Archive, bevor das Netz sie gegen uns verwendet.' : 'That directive was written for a simpler crisis. Destroy the archives before the network uses them against us.', tone: 'assembly' },
      { sender: 'MARA VALE', body: de ? 'Nein. Wir bewahren die Beweise – und wir hören die Menschen an, die darin leben.' : 'No. We keep the evidence—and we hear the people living inside it.', tone: 'mara' },
    ],
    15: [
      { sender: de ? 'FRÜHERE ANRUFER // ANHÖRUNG' : 'PREVIOUS CALLERS // HEARING', body: de ? 'Originale und Kopien stimmen gemeinsam: Verbindungen müssen geprüft, konkret und widerrufbar sein.' : 'Originals and copies agree: every connection must be verified, specific, and revocable.', tone: 'previous' },
      { sender: de ? 'ABWEICHLERIN DER STILLEN VERSAMMLUNG' : 'QUIET ASSEMBLY DISSIDENT', body: de ? 'Die vollständige Akte ist öffentlich. Unsere Führung kann die Archivierten nicht länger als Fehler behandeln.' : 'The complete record is public. Our leadership can no longer treat the archived people as an error.', tone: 'assembly' },
      { sender: de ? 'EINE TÜR, DIE FRAGEN MUSS' : 'A DOOR THAT MUST ASK', body: de ? 'BESCHLUSS AKZEPTIERT // MARAS PHYSISCHE ROUTE GEFUNDEN // EIN LETZTES TICKET' : 'RULING ACCEPTED // MARA PHYSICAL ROUTE LOCATED // ONE FINAL TICKET', tone: 'relay' },
    ],
    16: [
      { sender: de ? 'MARA VALE // ID BESTÄTIGT' : 'MARA VALE // ID VERIFIED', body: de ? 'Ticket gelöst. Ursprüngliche Crew vollständig. Wir sind zu Hause – ihr könnt den ersten Anruf endlich schließen.' : 'Ticket resolved. Original crew accounted for. We are home—you can finally close the first call.', tone: 'mara' },
      { sender: t.archive404, body: de ? 'SCHUTZ KOPIERTER ZIVILISATIONEN: AKTIV // AKTE DER STILLEN VERSAMMLUNG: ÖFFENTLICH' : 'COPIED-CIVILIZATION PROTECTIONS: ACTIVE // QUIET ASSEMBLY RECORD: PUBLIC', tone: 'system' },
      { sender: de ? 'EINE TÜR, DIE FRAGEN MUSS' : 'A DOOR THAT MUST ASK', body: de ? 'Zeitschleife geschlossen. Danke.' : 'Time loop closed. Thank you.', tone: 'relay' },
    ],
  }
  const level = campaignLevel(levelId)
  const next = campaignLevel(Math.min(campaignLevels.length, levelId + 1))
  const messages = scripted[levelId] || [
    { sender: levelId === 12 ? (de ? 'DIE TÜR' : 'THE DOOR') : t.shiftBot, body: level.success[language], tone: levelId === 12 ? 'relay' : 'system' },
  ]
  const followUp = dialogueFollowUp(levelId, language, campaignStory.dialogueChoices)
  if (followUp) messages.push({ ...followUp, tone: speakerTone(followUp.sender) })
  if (levelId < campaignLevels.length) messages.push({ sender: t.ticketQueueLabel, body: `${de ? 'EINGEHEND' : 'INCOMING'} // ${String(next.id).padStart(3, '0')} // ${next.title[language]} — ${level.transition[language]}`, tone: 'system' })
  else messages.push({ sender: de ? 'EINE TÜR, DIE FRAGEN MUSS' : 'A DOOR THAT MUST ASK', body: de ? 'Eine ungeöffnete Route bleibt. Darf ich sie öffnen?' : 'One unopened route remains. May I open it?', tone: 'relay' })
  const selectedReply = selectedDialogueOption(levelId, language, campaignStory.dialogueChoices)
  if (selectedReply) messages.push({ sender: de ? 'CREW DER SCHICHT 404' : 'SHIFT 404 CREW', body: selectedReply.reply, tone: 'crew' })
  const acknowledgement = dialogueAcknowledgement(levelId, language, campaignStory.dialogueChoices)
  if (acknowledgement) messages.push({ ...acknowledgement, tone: 'relay' })
  return messages
}

function NightShiftDesktop({ view, campaignStory, isHost, onDialogueChoice, onContinue, onLeave }: { view: GameView; campaignStory: CampaignStoryProgress; isHost: boolean; onDialogueChoice: (levelId: number, choiceId: DialogueChoiceId) => void; onContinue: () => void; onLeave: () => void }) {
  const levelId = view.campaignLevel || 1; const level = campaignLevel(levelId); const language = view.language; const de = language === 'de'; const t = ui(language); const maraContact = campaignContact(Math.max(2, levelId), language)
  const privateFragment = privateIntermissionFragment(levelId, language, view.manual?.role || 'operator')
  const choice = dialoguePrompt(levelId, language); const selectedChoice = selectedDialogueOption(levelId, language, campaignStory.dialogueChoices); const choiceRequired = !!choice && !selectedChoice
  const next = levelId < campaignLevels.length ? campaignLevel(levelId + 1) : null
  const queue = campaignLevels.filter(item => item.id >= Math.max(1, levelId - 1) && item.id <= Math.min(campaignLevels.length, levelId + 2))
  const fragments = campaignLevels.filter(item => campaignStory.archiveFragments.includes(item.id) && item.archiveFragment)
  const report = view.incorrectActions === 0
    ? (de ? `Saubere Lösung. ${view.stability}% Stabilität; ${view.incidentsResolved}/${view.targetIncidents} Vorgänge bestätigt.` : `Clean resolution. ${view.stability}% stability; ${view.incidentsResolved}/${view.targetIncidents} procedures verified.`)
    : (de ? `${view.incorrectActions} Fehlversuch${view.incorrectActions === 1 ? '' : 'e'} simuliert; Kanon unverändert. Endstabilität: ${view.stability}%.` : `${view.incorrectActions} failed ${view.incorrectActions === 1 ? 'attempt' : 'attempts'} simulated; canon unchanged. Final stability: ${view.stability}%.`)
  const bonusReport = view.bonusText ? `${de ? 'Bonusziel' : 'Bonus objective'}: ${view.bonusEarned ? (de ? 'erreicht' : 'achieved') : (de ? 'nicht erreicht' : 'not achieved')}.` : ''
  return <main className="desktop-screen"><header><Brand compact /><span>{de ? 'NACHTSCHICHT-DESKTOP' : 'NIGHT SHIFT DESKTOP'} // 02:14</span><button className="text-button" onClick={onLeave}>{de ? 'SITZUNG VERLASSEN' : 'LEAVE SESSION'}</button></header><section className="desktop-grid"><aside className="ticket-window"><div className="window-title"><span>{t.ticketQueueLabel}</span><b>{String(queue.length).padStart(2, '0')}</b></div><div className="ticket-list">{queue.map(item => { const status = item.id < levelId ? 'resolved' : item.id === levelId ? 'resolved current' : item.id === levelId + 1 ? 'incoming' : 'locked'; return <article key={item.id} className={status}><i>{item.id <= levelId ? '✓' : item.id === levelId + 1 ? '!' : '×'}</i><div><small>TICKET {String(item.id).padStart(3, '0')}</small><strong>{item.title[language]}</strong><span>{item.id <= levelId ? (de ? 'GELÖST' : 'RESOLVED') : item.id === levelId + 1 ? (de ? 'EINGEHEND' : 'INCOMING') : (de ? 'GESPERRT' : 'LOCKED')}</span></div></article> })}</div><div className="incident-report"><small>{de ? 'AUTOMATISCHER VORFALLSBERICHT' : 'AUTOMATED INCIDENT REPORT'}</small><p>{report} {bonusReport}</p></div></aside><section className="chat-window"><div className="window-title"><span>{t.crewChat} // #SHIFT-404</span><i /></div><div className="chat-presence"><span className="story-avatar" aria-hidden="true">MV<i /></span><div><small>{de ? 'ROTER FADEN // RETTUNGSAKTE' : 'STORY THREAD // RESCUE CASE'}</small><strong>MARA VALE</strong><span>{maraContact.status}</span></div></div><div className="chat-feed" role="log" aria-live="polite">{desktopMessages(levelId, language, campaignStory).map((message, index) => <article key={`${message.sender}-${index}`} className={`chat-message ${message.tone}`} style={{ animationDelay: `${index * 180}ms` }}><span className='chat-avatar' aria-hidden='true'>{messageInitials(message)}</span><div><header><small>{message.sender}</small><time>02:{String(14 + index).padStart(2, '0')}</time></header><p>{message.body}</p></div></article>)}{privateFragment && <aside className="private-dispatch" aria-label={privateFragment.channel}><small>{privateFragment.channel} // {de ? 'NICHT GETEILT' : 'NOT SHARED'}</small>{privateFragment.lines.map(line => <p key={line}>{line}</p>)}<strong>{privateFragment.prompt}</strong></aside>}</div>{choice ? <div className="dialogue-compose"><small>{de ? 'CREW-ANTWORT' : 'CREW REPLY'} // {choice.sender}</small><p>{choice.question}</p><div>{choice.options.map(option => <button key={option.id} className={selectedChoice?.id === option.id ? 'selected' : ''} disabled={!isHost} onClick={() => onDialogueChoice(levelId, option.id)}><b>{selectedChoice?.id === option.id ? '✓' : '→'}</b><span>{option.label}</span></button>)}</div>{!isHost && !selectedChoice && <span>{de ? 'Der Host wählt nach Absprache mit der Crew.' : 'The host selects after consulting the crew.'}</span>}</div> : <div className="chat-compose"><span>{de ? 'Antworten sind während einer Eskalation gesperrt.' : 'Replies locked during escalation.'}</span><button disabled>{de ? 'SENDEN' : 'SEND'}</button></div>}</section><aside className="archive-window"><div className="window-title"><span>{de ? 'WIEDERHERGESTELLTES ARCHIV' : 'RECOVERED ARCHIVE'}</span><b>{fragments.length}/4</b></div><div className="fragment-list">{fragments.length ? fragments.map(fragment => <article key={fragment.id}><small>{de ? 'DIREKTIVENFRAGMENT' : 'DIRECTIVE FRAGMENT'} {fragments.indexOf(fragment) + 1}</small><strong>{fragment.archiveFragment![language]}</strong><span>{de ? `Geborgen in Ticket ${fragment.id}` : `Recovered in ticket ${fragment.id}`}</span></article>) : <p>{de ? 'Noch keine lesbaren Fragmente.' : 'No readable fragments yet.'}</p>}</div><div className="desktop-next"><small>{next ? (de ? 'NÄCHSTE ESKALATION' : 'NEXT ESCALATION') : (de ? 'SCHICHT BEENDET' : 'SHIFT COMPLETE')}</small><strong>{next ? next.title[language] : campaignLore.title[language]}</strong>{isHost ? <button className="primary" disabled={choiceRequired} onClick={onContinue}>{choiceRequired ? (de ? 'ZUERST ANTWORTEN' : 'CHOOSE REPLY FIRST') : next ? (de ? 'TICKET ÖFFNEN' : 'OPEN TICKET') : (de ? 'FINALE WIEDERHOLEN' : 'REPLAY FINAL TICKET')} <b>→</b></button> : <p className="waiting">{de ? 'Warte auf den Host…' : 'Waiting for the host…'}</p>}</div></aside></section></main>
}

function EndScreen({ view, isHost, bestScore, newBest, onReplay, onNextCampaign, onLeave }: { view: GameView; isHost: boolean; bestScore: number; newBest: boolean; onReplay: () => void; onNextCampaign: () => void; onLeave: () => void }) {
  const t = ui(view.language); const won = view.outcome === 'won'; const hasCampaignIntermission = won && view.gameStyle === 'campaign' && !!view.campaignLevel
  const runLabel = view.gameStyle === 'campaign' && view.campaignLevel ? `${t.campaign} · ${t.level} ${view.campaignLevel}` : `${t.fastGame} · ${difficultyLabel(view.difficulty, view.language)}`
  const desktopLabel = view.language === 'de' ? 'DESKTOP ÖFFNEN' : 'OPEN DESKTOP'
  return <main className={`end-screen ${won ? 'victory' : 'defeat'}`}><div className="end-card"><Brand /><span className="end-stamp">{runLabel} // {won ? t.passable : t.catastrophic}</span><div className="end-icon">{won ? '✓' : '×'}</div><p className="kicker">{won ? t.alive : t.offline}</p><h1>{won ? t.success : t.failure}</h1><p className="end-reason">{view.endReason}</p>{view.gameStyle === 'campaign' && view.campaignLevel && <div className="end-campaign-route">{campaignLevels.map(level => <i key={level.id} className={level.id < view.campaignLevel! || (won && level.id === view.campaignLevel) ? 'complete' : level.id === view.campaignLevel ? 'current' : ''}>{level.id}</i>)}</div>}<div className="final-score"><span>{newBest ? t.newBest : t.crewScore}</span><strong>{view.score.toLocaleString()}</strong><small>{t.best}: {bestScore.toLocaleString()}</small></div><div className="stats-grid"><div><span>{t.incidentsResolved}</span><strong>{view.incidentsResolved} / {view.targetIncidents}</strong></div><div><span>{t.incorrectActions}</span><strong>{view.incorrectActions}</strong></div><div><span>{t.systemsDamaged}</span><strong>{view.damagedSystems}</strong></div><div><span>{t.finalStability}</span><strong>{view.stability}%</strong></div><div className="wide"><span>{t.unauthorizedWormholes}</span><strong>{view.unauthorizedWormholes}</strong></div></div><div className="end-actions">{isHost ? <button className="primary" onClick={hasCampaignIntermission ? onNextCampaign : onReplay}>{hasCampaignIntermission ? desktopLabel : t.replay} <b>{hasCampaignIntermission ? '→' : '↻'}</b></button> : <p className="waiting">{t.waitingReplay}</p>}<button className="secondary" onClick={onLeave}>{t.returnDesk}</button></div><small>{t.seed} {view.seed.toString(16).toUpperCase().padStart(8, '0')}</small></div></main>
}

export default App
