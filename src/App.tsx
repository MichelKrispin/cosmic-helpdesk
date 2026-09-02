import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  advanceClock, applyAction, buttonLabel, buttonMarker, campaignLevel, campaignLevels, createGame, difficultyConfig, difficultyLabel, roleName, rolesForPlayers, symbolMeta, viewForRole,
  type ButtonColor, type DifficultyId, type FullGame, type GameAction, type GameActionInput, type GameStyle, type GameView, type Locale, type Player, type RoleId,
} from './game'
import { ui, type StatusId } from './i18n'
import { makeId, PeerMesh, type MeshEvent } from './network'
import { reconnectOrAddPlayer } from './session'

type Screen = 'home' | 'lobby' | 'briefing' | 'game'
type AppMessage =
  | { type: 'lobby'; players: Player[]; language: Locale; difficulty: DifficultyId; gameStyle: GameStyle; campaignLevel: number }
  | { type: 'state'; view: GameView; phase?: 'briefing' | 'game' }
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
const campaignScoreKey = (level: number) => `cosmic-helpdesk-best-campaign-${level}`

function campaignChecksum(value: string) {
  let hash = 2166136261
  for (const character of value) { hash ^= character.charCodeAt(0); hash = Math.imul(hash, 16777619) }
  return (hash >>> 0).toString(36).toUpperCase().padStart(7, '0')
}

function createRecoveryCode(progress: number) {
  const scores = campaignLevels.map(level => Math.max(0, Number(localStorage.getItem(campaignScoreKey(level.id))) || 0).toString(36)).join('.')
  const payload = `1|${progress.toString(36)}|${scores}`
  return `CHD1-${progress.toString(36).toUpperCase()}-${scores.toUpperCase()}-${campaignChecksum(payload)}`
}

function readRecoveryCode(code: string) {
  const match = code.trim().toLowerCase().match(/^chd1-([0-9a-z]+)-([0-9a-z.]+)-([0-9a-z]+)$/)
  if (!match) return null
  const progress = Number.parseInt(match[1], 36)
  const scoreParts = match[2].split('.')
  const scores = scoreParts.map(score => Number.parseInt(score, 36))
  const payload = `1|${match[1]}|${match[2]}`
  if (campaignChecksum(payload).toLowerCase() !== match[3] || !Number.isInteger(progress) || progress < 1 || progress > campaignLevels.length || scores.length > campaignLevels.length || scores.some(score => !Number.isSafeInteger(score) || score < 0)) return null
  return { progress, scores: [...scores, ...Array(campaignLevels.length - scores.length).fill(0)] }
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
  const sessionRef = useRef<{ sessionId: string; hostId: string } | null>(initialInvite)
  const processedRef = useRef(new Set<string>())
  const screenRef = useRef<Screen>(initialInvite ? 'lobby' : 'home')

  const commitPlayers = useCallback((next: Player[]) => { playersRef.current = next; setPlayers(next) }, [])
  const commitLanguage = useCallback((next: Locale) => { languageRef.current = next; setLanguage(next) }, [])
  const commitDifficulty = useCallback((next: DifficultyId) => { difficultyRef.current = next; setDifficulty(next) }, [])
  const commitGameStyle = useCallback((next: GameStyle) => { gameStyleRef.current = next; setGameStyle(next) }, [])
  const commitCampaignLevel = useCallback((next: number) => { campaignLevelRef.current = next; setCampaignLevelId(next) }, [])
  const commitScreen = useCallback((next: Screen) => { screenRef.current = next; setScreen(next) }, [])
  const sendLobby = useCallback((next = playersRef.current, nextLanguage = languageRef.current, nextDifficulty = difficultyRef.current, nextStyle = gameStyleRef.current, nextLevel = campaignLevelRef.current) => {
    meshRef.current?.broadcast((): AppMessage => ({ type: 'lobby', players: next, language: nextLanguage, difficulty: nextDifficulty, gameStyle: nextStyle, campaignLevel: nextLevel }))
  }, [])
  const hostBroadcastState = useCallback((game: FullGame, phase: 'briefing' | 'game' = 'game') => {
    const now = Date.now()
    const own = playersRef.current.find((player) => player.id === selfRef.current.id)
    setView(viewForRole(game, own?.role || 'operator', now))
    meshRef.current?.broadcast((peerId): AppMessage => {
      const player = playersRef.current.find((candidate) => candidate.id === peerId)
      return { type: 'state', view: viewForRole(game, player?.role || 'specialist', now), phase }
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
          const phase = screenRef.current === 'briefing' ? 'briefing' : 'game'
          meshRef.current?.send(event.peerId, { type: 'state', view: viewForRole(gameRef.current, existing.role), phase } satisfies AppMessage)
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
    if (!isHostRef.current && message.type === 'state') { setView(message.view); commitLanguage(message.view.language); commitScreen(message.phase || 'game') }
    if (!isHostRef.current && message.type === 'session-ended') { setStatus('sessionEnded'); commitScreen('lobby') }
    if (!isHostRef.current && message.type === 'capacity') setStatus('capacity')
  }, [commitCampaignLevel, commitDifficulty, commitGameStyle, commitLanguage, commitPlayers, commitScreen, handleAction, sendLobby])

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
    if (!initialInvite || meshRef.current) return
    setIsHost(false); isHostRef.current = false
    meshRef.current = new PeerMesh({ mode: 'client', sessionId: initialInvite.sessionId, selfId: selfRef.current.id, hostId: initialInvite.hostId, name: selfRef.current.name, onEvent: handleMeshEvent })
  }, [handleMeshEvent, initialInvite])
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
      const unlocked = Math.min(campaignLevels.length, view.campaignLevel + 1)
      setCampaignProgress(previousProgress => {
        const next = Math.max(previousProgress, unlocked)
        localStorage.setItem(campaignProgressKey, String(next))
        return next
      })
    }
  }, [view?.campaignLevel, view?.difficulty, view?.gameStyle, view?.outcome, view?.score])

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
    const save = readRecoveryCode(code)
    if (!save) return false
    localStorage.setItem(campaignProgressKey, String(save.progress))
    save.scores.forEach((score, index) => localStorage.setItem(campaignScoreKey(index + 1), String(score)))
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
    const game = createGame(seedBytes[0], active.length, languageRef.current, Date.now(), difficultyRef.current, gameStyleRef.current, campaignLevelRef.current)
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
  const startNextCampaignLevel = () => { commitCampaignLevel(Math.min(campaignLevels.length, campaignLevelRef.current + 1)); startGame() }
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

  if (screen === 'home') return <Home language={language} onLanguage={chooseLanguage} onCreate={createSession} />
  if (screen === 'lobby') return <Lobby players={players} isHost={isHost} status={ui(language).status[status]} copied={copied} language={language} difficulty={difficulty} gameStyle={gameStyle} campaignLevelId={campaignLevelId} campaignProgress={campaignProgress} recoveryCode={createRecoveryCode(campaignProgress)} onRestoreCampaign={restoreCampaign} onLanguage={chooseLanguage} onDifficulty={chooseDifficulty} onGameStyle={chooseGameStyle} onCampaignLevel={chooseCampaignLevel} onCopy={copyInvite} onStart={startGame} onLeave={leaveSession} />
  if (!view) return <Loading status={ui(language).status[status]} />
  if (screen === 'briefing') return <MissionBriefing view={view} players={players} selfId={selfRef.current.id} isHost={isHost} onBegin={beginMission} onLeave={leaveSession} />
  if (view.outcome !== 'playing') return <EndScreen view={view} isHost={isHost} bestScore={bestScore} newBest={newBest} onReplay={startGame} onNextCampaign={startNextCampaignLevel} onLeave={leaveSession} />
  return <GameScreen view={view} players={players} selfId={selfRef.current.id} onAction={submitAction} onLeave={leaveSession} />
}

function Brand({ compact = false }: { compact?: boolean }) { return <div className={`brand ${compact ? 'compact' : ''}`}><span className="brand-orbit">C</span><span>COSMIC<br />HELPDESK</span></div> }
function LanguageSelector({ language, onChange, disabled = false }: { language: Locale; onChange: (language: Locale) => void; disabled?: boolean }) {
  const t = ui(language)
  return <div className="language-selector" aria-label={t.language}><span>{t.language}</span><div><button className={language === 'en' ? 'selected' : ''} onClick={() => onChange('en')} disabled={disabled}>EN</button><button className={language === 'de' ? 'selected' : ''} onClick={() => onChange('de')} disabled={disabled}>DE</button></div></div>
}

function MissionBriefing({ view, players, selfId, isHost, onBegin, onLeave }: { view: GameView; players: Player[]; selfId: string; isHost: boolean; onBegin: () => void; onLeave: () => void }) {
  const t = ui(view.language); const chapter = campaignLevel(view.campaignLevel || 1)
  const level = chapter.id === 1 ? { ...chapter, briefing: { ...chapter.briefing, [view.language]: `\n\n${t.stationOrientation}\n\n${t.stationIntro.join('\n\n')}\n\n${chapter.briefing[view.language]}` } } : chapter
  const previous = level.id > 1 ? campaignLevel(level.id - 1).success[view.language] : (view.language === 'de' ? 'Die Nachtschicht beginnt mit einem schwachen Notsignal aus einem stillgelegten Relais.' : 'The night shift begins with a faint distress call from a decommissioned relay.')
  const tasks = view.language === 'de' ? {
    router: 'Öffnet den Weg, von dem dieses Kapitel abhängt. Frequenz, Spezies und Protokoll bestimmen die zwei sicheren Knoten.',
    reactor: 'Haltet die Station lange genug am Leben, damit die Geschichte weitergehen kann. Telemetrie und Verfahren ergeben drei Reglerwerte.',
    translation: 'Findet heraus, was die fremde Stimme wirklich sagt. Leserichtung, Glyphen und Stationszustand ergeben die Antwortfarben.',
  } : {
    router: 'Open the path this chapter depends on. Frequency, species, and protocol determine the two safe nodes.',
    reactor: 'Keep the station alive long enough for the story to continue. Telemetry and procedure produce three dial values.',
    translation: 'Discover what the alien voice is really saying. Reading direction, glyphs, and station condition produce the response colors.',
  }
  const moduleNames = { router: t.quantumRouter, reactor: t.reactorCalibration, translation: t.translationMatrix }
  const ownRole = view.manual?.role || players.find(player => player.isHost)?.role || null
  players = [...players].sort((a, b) => Number(b.id === selfId) - Number(a.id === selfId)).map(player => player.id === selfId ? { ...player, name: `▶ ${player.name} · ${t.youAre}` } : player)
  return <main className="mission-briefing-screen"><header><Brand compact /><button className="text-button" onClick={onLeave}>{t.leave}</button></header><section className="mission-dossier"><div className="dossier-stamp">{t.campaign} // {t.level} {level.id.toString().padStart(2, '0')} // {t.missionBriefing}</div><p className="kicker">{t.storySoFar}</p><p className="story-recap">{previous}</p><h1>{level.title[view.language]}</h1><p className="story-lede">{level.summary[view.language]} {level.briefing[view.language]}</p><div className="mission-facts"><article><small>{t.yourRole}</small><strong>{roleName(ownRole, view.language)}</strong><p>{t.roleStory}</p></article><article><small>{t.shiftWindow}</small><strong>{Math.round((view.endsAt - view.now) / 60000)} {t.minutes}</strong><p>{t.timerPaused}</p></article></div>{view.modifierText && <div className="dossier-alert"><b>⚠ {t.missionVariation}</b><p>{view.modifierText}</p></div>}{view.bonusText && <div className="dossier-bonus"><b>★ {t.optionalObjective}</b><p>{view.bonusText}</p></div>}<div className="mission-task-list"><small>{t.missionObjectives}</small>{view.activeModules.map((module, index) => <article key={module}><b>0{index + 1}</b><div><strong>{moduleNames[module]}</strong><p>{tasks[module]}</p></div></article>)}</div><div className="briefing-crew"><small>{t.assignedCrew}</small><div>{players.filter(player => player.connected).map(player => <span key={player.id}>{player.name}<b>{roleName(player.role, view.language)}</b></span>)}</div></div><div className="briefing-launch">{isHost ? <button className="primary" onClick={onBegin}>{t.beginMission}<b>→</b></button> : <p className="waiting">{t.waitingBriefing}</p>}<small>{t.readBeforeStart}</small></div></section></main>
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
    <div className="crew-label"><span>{t.connectedCrew}</span><b>{props.players.filter((p) => p.connected).length} / 4</b></div><div className="crew-grid">{[0, 1, 2, 3].map((index) => { const player = props.players[index]; return <article className={`crew-slot ${player ? 'occupied' : ''}`} key={index}><span className="avatar">{player ? player.name.slice(0, 2).toUpperCase() : '+'}</span><div><h3>{player?.name || t.openChannel}</h3><p>{player ? (player.isHost ? t.hostRole : t.assignedAtLaunch) : t.waitingTech}</p></div>{player && <i className={player.connected ? 'online' : 'offline'} />}</article> })}</div>
    <div className="lobby-footer"><div className="warning"><span>!</span><p><b>{t.voiceRequired}</b><br />{t.voiceHelp}</p></div>{props.isHost ? <button className="primary" disabled={!canStart} onClick={props.onStart}>{t.start} <b>→</b></button> : <p className="waiting">{t.waitingHost} <span>•••</span></p>}</div>
  </section></main>
}

function CampaignMap({ language, selected, unlocked, isHost, recoveryCode, onRestore, onSelect }: { language: Locale; selected: number; unlocked: number; isHost: boolean; recoveryCode: string; onRestore: (code: string) => boolean; onSelect: (level: number) => void }) {
  const t = ui(language); const level = campaignLevel(selected); const settings = level.rules
  const moduleLabels = { router: t.quantumRouter, reactor: t.reactorCalibration, translation: t.translationMatrix }
  return <section className="campaign-map"><div className="campaign-map-heading"><div><small>{t.campaignMap}</small><h2>{t.level} {level.id}: {level.title[language]}</h2></div><span>{level.activeModules.map(module => moduleLabels[module]).join(' · ')}</span></div><div className="campaign-route">{campaignLevels.map(stop => { const locked = stop.id > Math.max(unlocked, selected); const complete = stop.id < unlocked; return <button key={stop.id} className={`${stop.id === selected ? 'selected' : ''} ${complete ? 'complete' : ''}`} disabled={!isHost || locked} onClick={() => onSelect(stop.id)} aria-label={`${t.level} ${stop.id}: ${stop.title[language]}${locked ? ` (${t.locked})` : ''}`}><b>{complete ? '✓' : locked ? '×' : stop.id}</b><span>{stop.title[language]}</span></button> })}</div><div className="campaign-brief"><div><strong>{level.summary[language]}</strong><p>{level.briefing[language]}</p></div><small>{Math.round(settings.durationMs / 60000)} {t.minutes} · −{settings.pressureDamage} {t.stabilityEvery} {settings.pressureEveryMs / 1000}s · ×{settings.scoreMultiplier} {t.score}</small></div>{isHost && <CampaignRecovery language={language} code={recoveryCode} onRestore={onRestore} />}</section>
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
  return <aside className="campaign-story"><small>{t.missionBriefing} // {t.level} {level.id}</small><strong>{level.title[view.language]}</strong><p>{level.briefing[view.language]}</p>{view.modifierText && <p className="mission-modifier">⚠ {view.modifierText}</p>}{view.bonusText && <p className="mission-bonus">★ {view.bonusText}</p>}{view.hint && <p className="mission-hint">→ {view.hint}</p>}</aside>
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
  const shiftLabel = `${t.youAre}: ${activePlayer?.name || '—'} · ${roleName(role, view.language)} // ${modeLabel}`
  const surgeSeconds = Math.max(0, Math.ceil((view.nextPressureAt - view.now) / 1000)); const graceSeconds = Math.max(0, Math.ceil(((view.variationGraceUntil || 0) - view.now) / 1000))
  return <main className="game-shell"><header className="game-header"><Brand compact /><div className="shift-clock"><span>{shiftLabel} · {t.shiftEnds}</span><strong>{formatTime(view.endsAt - view.now)}</strong><small>{graceSeconds > 0 ? `${t.dataLock}: ${graceSeconds}s` : `${t.nextSurge}: ${surgeSeconds}s`}</small></div><div className="score-box"><span>{t.score}</span><strong>{view.score.toLocaleString()}</strong></div><div className="stability"><span>{t.stationStability} <b>{view.stability}%</b></span><div><i style={{ width: `${view.stability}%` }} /></div></div><button className="icon-button" onClick={onLeave} aria-label={t.leaveAria}>×</button></header>{view.operator ? <OperatorConsole view={view} onAction={onAction} /> : <SpecialistConsole view={view} role={role || view.manual?.role || null} />}</main>
}

function ModuleHeader({ number, title, resolved, tone, language }: { number: string; title: string; resolved: boolean; tone: string; language: Locale }) {
  const t = ui(language); return <div className="module-header"><span className={`module-index ${tone}`}>{number}</span><div><small>{t.incidentModule}</small><h2>{title}</h2></div><span className={`status-tag ${resolved ? 'done' : ''}`}>{resolved ? t.resolved : t.active}</span></div>
}

function OperatorConsole({ view, onAction }: { view: GameView; onAction: (action: GameActionInput) => void }) {
  const base = ui(view.language); const data = view.operator!
  const t = { ...base, selectNodes: puzzleInstruction(view, 'router', base.selectNodes), setDials: puzzleInstruction(view, 'reactor', base.setDials), enterSequence: puzzleInstruction(view, 'translation', base.enterSequence) }
  const [nodes, setNodes] = useState<string[]>([]); const [dials, setDials] = useState<[number, number, number]>(data.reactor.dials); const [sequence, setSequence] = useState<ButtonColor[]>([])
  const toggleNode = (id: string) => setNodes((current) => current.includes(id) ? current.filter((node) => node !== id) : current.length < 2 ? [...current, id] : [current[1], id])
  const adjust = (index: number, delta: number) => setDials((current) => current.map((value, i) => i === index ? (value + delta + 6) % 6 : value) as [number, number, number])
  return <div className="game-content"><div className="role-banner"><div><p className="kicker">{t.assignment}</p><h1>{t.operatorConsole}</h1></div><p>{t.operatorSubtitle}<br /><b>{t.describe}</b></p></div><CampaignStory view={view} /><section className={`module-grid modules-${view.activeModules.length}`}>
    {view.activeModules.includes('router') && <article data-resolved={t.resolved} className={`module-card router-card ${data.router.resolved ? 'resolved' : ''}`}><ModuleHeader number="01" title={t.quantumRouter} resolved={data.router.resolved} tone="mint" language={view.language} /><div className="caller-strip"><span>{t.incomingCaller}</span><strong>{data.router.species}</strong></div><p className="instruction">{t.selectNodes}</p><div className="node-map">{data.router.nodes.map((node, index) => <button key={node.id} disabled={data.router.resolved} onClick={() => toggleNode(node.id)} className={`node node-${index} ${nodes.includes(node.id) ? 'selected' : ''}`}><b>{symbolMeta[node.symbol].glyph}</b><span>{node.code}</span></button>)}<div className="map-core">{t.routeCore[0]}<br />{t.routeCore[1]}</div></div><button className="module-submit mint" disabled={nodes.length !== 2 || data.router.resolved} onClick={() => { onAction({ type: 'router-connect', a: nodes[0], b: nodes[1] }); setNodes([]) }}>{t.lockConnection}</button></article>}
    {view.activeModules.includes('reactor') && <article data-resolved={t.resolved} className={`module-card reactor-card ${data.reactor.resolved ? 'resolved' : ''}`}><ModuleHeader number="02" title={t.reactorCalibration} resolved={data.reactor.resolved} tone="orange" language={view.language} /><div className="reactor-visual"><div className="reactor-core"><i /><span>{t.core}</span></div><div className="reactor-lights"><i /><i /><i /></div></div><p className="instruction">{t.setDials}</p><div className="dials">{dials.map((value, index) => <div className="dial-control" key={index}><span>{t.dial} {String.fromCharCode(65 + index)}</span><button onClick={() => adjust(index, 1)} disabled={data.reactor.resolved} aria-label={`${t.increaseDial} ${index + 1}`}>⌃</button><strong>{value}</strong><button onClick={() => adjust(index, -1)} disabled={data.reactor.resolved} aria-label={`${t.decreaseDial} ${index + 1}`}>⌄</button></div>)}</div><button className="module-submit orange" disabled={data.reactor.resolved} onClick={() => onAction({ type: 'reactor-calibrate', dials })}>{t.engage}</button></article>}
    {view.activeModules.includes('translation') && <article data-resolved={t.resolved} className={`module-card translation-card ${data.translation.resolved ? 'resolved' : ''}`}><ModuleHeader number="03" title={t.translationMatrix} resolved={data.translation.resolved} tone="pink" language={view.language} /><div className="alien-message"><span>{t.messageBuffer}</span><div>{data.translation.glyphs.map((glyph, index) => <b key={index}>{symbolMeta[glyph].glyph}</b>)}</div></div><p className="instruction">{t.enterSequence}</p><div className="sequence-readout">{[0, 1, 2].map((index) => <i key={index} className={sequence[index] ? `color-${sequence[index]}` : ''}>{sequence[index] ? buttonMarker(sequence[index]) : '·'}</i>)}</div><div className="color-buttons">{colors.map((color) => <button aria-label={buttonLabel(color, view.language)} disabled={sequence.length >= 3 || data.translation.resolved} onClick={() => setSequence((current) => [...current, color])} key={color} className={`color-${color}`}><b>{buttonMarker(color)}</b><small>{buttonLabel(color, view.language)}</small></button>)}</div><div className="translation-actions"><button className="clear-button" onClick={() => setSequence([])} disabled={data.translation.resolved}>{t.clear}</button><button className="module-submit pink" disabled={sequence.length !== 3 || data.translation.resolved} onClick={() => { onAction({ type: 'translation-submit', sequence }); setSequence([]) }}>{t.transmit}</button></div></article>}
  </section><EventLog view={view} /></div>
}

function SpecialistConsole({ view, role }: { view: GameView; role: RoleId | null }) {
  const t = ui(view.language); const manual = view.manual!; const localizedRole = roleName(role, view.language)
  return <div className="game-content manual-content"><div className="role-banner manual-banner"><div><p className="kicker">{t.assignment}</p><h1>{manual.title}</h1></div><p>{manual.subtitle}<br /><b>{t.readAloud}</b></p></div><div className="manual-layout"><aside className="manual-sidebar"><div className="id-card"><span>{localizedRole}</span><b>{localizedRole.split(/[ -]/).map((part) => part[0]).join('')}</b><small>{t.clearance}</small></div><div className="incident-list"><h3>{t.incidentStatus}</h3>{view.activeModules.includes('router') && <p><i className={view.moduleStatus.router ? 'done' : ''} /> {t.quantumRouter}</p>}{view.activeModules.includes('reactor') && <p><i className={view.moduleStatus.reactor ? 'done' : ''} /> {t.reactorCalibration}</p>}{view.activeModules.includes('translation') && <p><i className={view.moduleStatus.translation ? 'done' : ''} /> {t.translationMatrix}</p>}</div><div className="do-not"><b>{t.doNot}</b><p>{t.doNotText}</p></div></aside><section className="manual-panels">{manual.panels.map((panel, index) => <article className={`manual-panel ${panel.tone}`} key={`${panel.title}-${index}`}><div className="manual-panel-heading"><span>{panel.eyebrow}</span><h2>{panel.title}</h2></div>{panel.rows && <div className="data-rows">{panel.rows.map((row) => <div key={row.label}><span>{row.label}</span><strong>{row.value}</strong></div>)}</div>}{panel.table && <div className="table-wrap"><table><thead><tr>{panel.table.headers.map((header) => <th key={header}>{header}</th>)}</tr></thead><tbody>{panel.table.rows.map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}</tr>)}</tbody></table></div>}{panel.notes && <ul>{panel.notes.map((note) => <li key={note}>{note}</li>)}</ul>}</article>)}</section></div><EventLog view={view} /></div>
}

function EventLog({ view }: { view: GameView }) { const t = ui(view.language); return <section className="event-log"><span>{t.shiftLog}</span><div>{view.log.map((entry, index) => <p key={`${entry}-${index}`}><b>{index === 0 ? t.now : `−${index}`}</b>{entry}</p>)}</div></section> }
function EndScreen({ view, isHost, bestScore, newBest, onReplay, onNextCampaign, onLeave }: { view: GameView; isHost: boolean; bestScore: number; newBest: boolean; onReplay: () => void; onNextCampaign: () => void; onLeave: () => void }) {
  const t = ui(view.language); const won = view.outcome === 'won'; const hasNextCampaignLevel = view.gameStyle === 'campaign' && !!view.campaignLevel && view.campaignLevel < campaignLevels.length
  const runLabel = view.gameStyle === 'campaign' && view.campaignLevel ? `${t.campaign} · ${t.level} ${view.campaignLevel}` : `${t.fastGame} · ${difficultyLabel(view.difficulty, view.language)}`
  return <main className={`end-screen ${won ? 'victory' : 'defeat'}`}><div className="end-card"><Brand /><span className="end-stamp">{runLabel} // {won ? t.passable : t.catastrophic}</span><div className="end-icon">{won ? '✓' : '×'}</div><p className="kicker">{won ? t.alive : t.offline}</p><h1>{won ? t.success : t.failure}</h1><p className="end-reason">{view.endReason}</p>{view.gameStyle === 'campaign' && view.campaignLevel && <div className="end-campaign-route">{campaignLevels.map(level => <i key={level.id} className={level.id < view.campaignLevel! || (won && level.id === view.campaignLevel) ? 'complete' : level.id === view.campaignLevel ? 'current' : ''}>{level.id}</i>)}</div>}<div className="final-score"><span>{newBest ? t.newBest : t.crewScore}</span><strong>{view.score.toLocaleString()}</strong><small>{t.best}: {bestScore.toLocaleString()}</small></div><div className="stats-grid"><div><span>{t.incidentsResolved}</span><strong>{view.incidentsResolved} / {view.targetIncidents}</strong></div><div><span>{t.incorrectActions}</span><strong>{view.incorrectActions}</strong></div><div><span>{t.systemsDamaged}</span><strong>{view.damagedSystems}</strong></div><div><span>{t.finalStability}</span><strong>{view.stability}%</strong></div><div className="wide"><span>{t.unauthorizedWormholes}</span><strong>{view.unauthorizedWormholes}</strong></div></div><div className="end-actions">{isHost ? <button className="primary" onClick={won && hasNextCampaignLevel ? onNextCampaign : onReplay}>{won && hasNextCampaignLevel ? t.nextLevel : t.replay} <b>{won && hasNextCampaignLevel ? '→' : '↻'}</b></button> : <p className="waiting">{t.waitingReplay}</p>}<button className="secondary" onClick={onLeave}>{t.returnDesk}</button></div><small>{t.seed} {view.seed.toString(16).toUpperCase().padStart(8, '0')}</small></div></main>
}

export default App
