import { Peer, type DataConnection, type PeerOptions } from 'peerjs'

type SignalKind = 'register' | 'join' | 'offer' | 'answer' | 'ice' | 'leave'

type Signal = {
  id: string
  sessionId: string
  from: string
  to?: string
  kind: SignalKind
  name?: string
  payload?: unknown
}

export type MeshEvent =
  | { type: 'peer-open'; peerId: string; name: string }
  | { type: 'peer-closed'; peerId: string }
  | { type: 'message'; peerId: string; data: unknown }
  | { type: 'host-unavailable' }

type MeshOptions = {
  mode: 'host' | 'client'
  sessionId: string
  selfId: string
  hostId: string
  name: string
  onEvent: (event: MeshEvent) => void
}

type MeshBackend = { send: (peerId: string, data: unknown) => void; broadcast: (dataForPeer: (peerId: string) => unknown) => void; close: () => void }

type PeerEntry = {
  connection: RTCPeerConnection
  channel?: RTCDataChannel
  name: string
  candidates: RTCIceCandidateInit[]
}

const rtcConfig: RTCConfiguration = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
}

const randomId = () => crypto.randomUUID().replaceAll('-', '').slice(0, 12)

class SignalBus {
  private channel = new BroadcastChannel('cosmic-helpdesk-signal-v1')
  private socket?: WebSocket
  private queue: string[] = []
  private seen = new Set<string>()

  constructor(private sessionId: string, private selfId: string, private receive: (signal: Signal) => void) {
    this.channel.onmessage = (event) => this.handle(event.data)
    try {
      const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:'
      this.socket = new WebSocket(`${protocol}//${location.host}/signal`)
      this.socket.onmessage = (event) => {
        try { this.handle(JSON.parse(String(event.data))) } catch { /* ignore */ }
      }
      this.socket.onopen = () => {
        for (const message of this.queue.splice(0)) this.socket?.send(message)
        this.send({ kind: 'register' })
      }
    } catch { /* local BroadcastChannel still works */ }
  }

  private handle(value: unknown) {
    const signal = value as Signal
    if (!signal || signal.sessionId !== this.sessionId || signal.from === this.selfId || this.seen.has(signal.id)) return
    if (signal.to && signal.to !== this.selfId) return
    this.seen.add(signal.id)
    if (this.seen.size > 500) this.seen.clear()
    this.receive(signal)
  }

  send(partial: Pick<Signal, 'kind'> & Partial<Signal>) {
    const signal: Signal = { id: randomId(), sessionId: this.sessionId, from: this.selfId, ...partial }
    this.channel.postMessage(signal)
    const encoded = JSON.stringify(signal)
    if (this.socket?.readyState === WebSocket.OPEN) this.socket.send(encoded)
    else this.queue.push(encoded)
  }

  close() {
    this.channel.close()
    this.socket?.close()
  }
}

class LegacyPeerMesh implements MeshBackend {
  private bus: SignalBus
  private peers = new Map<string, PeerEntry>()
  private closed = false

  constructor(
    private options: MeshOptions,
  ) {
    this.bus = new SignalBus(options.sessionId, options.selfId, (signal) => void this.onSignal(signal))
    this.bus.send({ kind: 'register' })
    if (options.mode === 'client') {
      const announce = () => this.bus.send({ kind: 'join', to: options.hostId, name: options.name })
      announce()
      setTimeout(announce, 700)
      setTimeout(announce, 1800)
      setTimeout(() => {
        if (!this.closed && !this.peers.get(options.hostId)?.channel) options.onEvent({ type: 'host-unavailable' })
      }, 9000)
    }
  }

  private createPeer(peerId: string, name: string): PeerEntry {
    const existing = this.peers.get(peerId)
    if (existing) { existing.name = name || existing.name; return existing }
    const connection = new RTCPeerConnection(rtcConfig)
    const entry: PeerEntry = { connection, name: name || 'Visiting Technician', candidates: [] }
    this.peers.set(peerId, entry)
    connection.onicecandidate = (event) => {
      if (event.candidate) this.bus.send({ kind: 'ice', to: peerId, payload: event.candidate.toJSON() })
    }
    connection.ondatachannel = (event) => this.attachChannel(peerId, entry, event.channel)
    connection.onconnectionstatechange = () => {
      if (['failed', 'closed', 'disconnected'].includes(connection.connectionState)) {
        this.options.onEvent({ type: 'peer-closed', peerId })
      }
    }
    return entry
  }

  private attachChannel(peerId: string, entry: PeerEntry, channel: RTCDataChannel) {
    entry.channel = channel
    channel.onopen = () => this.options.onEvent({ type: 'peer-open', peerId, name: entry.name })
    channel.onmessage = (event) => {
      try { this.options.onEvent({ type: 'message', peerId, data: JSON.parse(event.data) }) } catch { /* ignore */ }
    }
    channel.onclose = () => this.options.onEvent({ type: 'peer-closed', peerId })
  }

  private async onSignal(signal: Signal) {
    if (this.closed) return
    if (this.options.mode === 'host' && signal.kind === 'join') {
      const entry = this.createPeer(signal.from, signal.name || 'Visiting Technician')
      if (entry.connection.signalingState !== 'stable' || entry.channel?.readyState === 'open') return
      const channel = entry.connection.createDataChannel('cosmic-helpdesk', { ordered: true })
      this.attachChannel(signal.from, entry, channel)
      const offer = await entry.connection.createOffer()
      await entry.connection.setLocalDescription(offer)
      this.bus.send({ kind: 'offer', to: signal.from, payload: offer })
      return
    }
    if (this.options.mode === 'client' && signal.kind === 'offer' && signal.from === this.options.hostId) {
      const entry = this.createPeer(signal.from, 'Shift Host')
      await entry.connection.setRemoteDescription(signal.payload as RTCSessionDescriptionInit)
      for (const candidate of entry.candidates.splice(0)) await entry.connection.addIceCandidate(candidate)
      const answer = await entry.connection.createAnswer()
      await entry.connection.setLocalDescription(answer)
      this.bus.send({ kind: 'answer', to: signal.from, payload: answer })
      return
    }
    const entry = this.peers.get(signal.from)
    if (!entry) return
    if (signal.kind === 'answer' && this.options.mode === 'host') {
      await entry.connection.setRemoteDescription(signal.payload as RTCSessionDescriptionInit)
      for (const candidate of entry.candidates.splice(0)) await entry.connection.addIceCandidate(candidate)
    }
    if (signal.kind === 'ice') {
      const candidate = signal.payload as RTCIceCandidateInit
      if (entry.connection.remoteDescription) await entry.connection.addIceCandidate(candidate).catch(() => {})
      else entry.candidates.push(candidate)
    }
    if (signal.kind === 'leave') this.options.onEvent({ type: 'peer-closed', peerId: signal.from })
  }

  send(peerId: string, data: unknown) {
    const channel = this.peers.get(peerId)?.channel
    if (channel?.readyState === 'open') channel.send(JSON.stringify(data))
  }

  broadcast(dataForPeer: (peerId: string) => unknown) {
    for (const [peerId, peer] of this.peers) {
      if (peer.channel?.readyState === 'open') peer.channel.send(JSON.stringify(dataForPeer(peerId)))
    }
  }

  close() {
    this.closed = true
    this.bus.send({ kind: 'leave' })
    this.bus.close()
    for (const peer of this.peers.values()) peer.connection.close()
    this.peers.clear()
  }
}

class PeerJsMesh implements MeshBackend {
  private peer: Peer
  private connections = new Map<string, DataConnection>()
  private closed = false
  private connectedToHost = false
  private retryTimers: number[] = []

  constructor(private options: MeshOptions) {
    const peerOptions: PeerOptions = { debug: 1 }
    const turnUrl = import.meta.env.VITE_TURN_URL
    if (turnUrl) {
      peerOptions.config = { iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: turnUrl, username: import.meta.env.VITE_TURN_USERNAME || '', credential: import.meta.env.VITE_TURN_CREDENTIAL || '' },
      ] }
    }
    this.peer = new Peer(options.selfId, peerOptions)
    this.peer.on('open', () => {
      if (options.mode === 'client') {
        this.connectToHost()
        this.retryTimers.push(window.setTimeout(() => this.connectToHost(), 1200), window.setTimeout(() => this.connectToHost(), 3500), window.setTimeout(() => {
          if (!this.closed && !this.connectedToHost) options.onEvent({ type: 'host-unavailable' })
        }, 9000))
      }
    })
    this.peer.on('connection', (connection) => {
      if (options.mode !== 'host' || connection.metadata?.sessionId !== options.sessionId) { connection.close(); return }
      this.attach(connection, String(connection.metadata?.name || 'Visiting Technician'))
    })
    this.peer.on('disconnected', () => {
      if (!this.closed && !this.peer.destroyed) {
        try { this.peer.reconnect() } catch { /* active P2P connections can continue */ }
      }
    })
    this.peer.on('error', (error) => {
      if (!this.closed && options.mode === 'client' && ['peer-unavailable', 'network', 'server-error', 'socket-error'].includes(error.type)) options.onEvent({ type: 'host-unavailable' })
    })
  }

  private connectToHost() {
    if (this.closed || this.connectedToHost || this.options.mode !== 'client' || !this.peer.open) return
    const current = this.connections.get(this.options.hostId)
    if (current) return
    this.attach(this.peer.connect(this.options.hostId, { reliable: true, serialization: 'json', metadata: { sessionId: this.options.sessionId, name: this.options.name } }), 'Shift Host')
  }

  private attach(connection: DataConnection, name: string) {
    const previous = this.connections.get(connection.peer)
    if (previous && previous !== connection) previous.close()
    this.connections.set(connection.peer, connection)
    connection.on('open', () => {
      if (this.closed) { connection.close(); return }
      if (connection.peer === this.options.hostId) this.connectedToHost = true
      this.options.onEvent({ type: 'peer-open', peerId: connection.peer, name })
    })
    connection.on('data', (data) => this.options.onEvent({ type: 'message', peerId: connection.peer, data }))
    connection.on('close', () => {
      if (this.connections.get(connection.peer) !== connection) return
      this.connections.delete(connection.peer)
      if (connection.peer === this.options.hostId) this.connectedToHost = false
      if (!this.closed) this.options.onEvent({ type: 'peer-closed', peerId: connection.peer })
      if (!this.closed && this.options.mode === 'client' && connection.peer === this.options.hostId) this.retryTimers.push(window.setTimeout(() => this.connectToHost(), 800))
    })
    connection.on('error', () => {
      if (!connection.open && connection.peer === this.options.hostId && !this.closed) { this.options.onEvent({ type: 'host-unavailable' }); connection.close() }
    })
  }

  send(peerId: string, data: unknown) {
    const connection = this.connections.get(peerId)
    if (connection?.open) void connection.send(data)
  }

  broadcast(dataForPeer: (peerId: string) => unknown) {
    for (const [peerId, connection] of this.connections) if (connection.open) void connection.send(dataForPeer(peerId))
  }

  close() {
    this.closed = true
    for (const timer of this.retryTimers) clearTimeout(timer)
    for (const connection of this.connections.values()) connection.close()
    this.connections.clear()
    this.peer.destroy()
  }
}

export class PeerMesh implements MeshBackend {
  private backend: MeshBackend
  constructor(options: MeshOptions) {
    this.backend = import.meta.env.VITE_SIGNAL_MODE === 'local' ? new LegacyPeerMesh(options) : new PeerJsMesh(options)
  }
  send(peerId: string, data: unknown) { this.backend.send(peerId, data) }
  broadcast(dataForPeer: (peerId: string) => unknown) { this.backend.broadcast(dataForPeer) }
  close() { this.backend.close() }
}

export function makeId() { return randomId() }
