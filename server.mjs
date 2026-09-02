import http from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'
import { WebSocketServer, WebSocket } from 'ws'
import { decodeRequestPath } from './request-path.mjs'

const root = fileURLToPath(new URL('.', import.meta.url))
const production = process.env.NODE_ENV === 'production'
const port = Number(process.env.PORT || 5173)

let vite

const mime = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.woff2': 'font/woff2',
}

const server = http.createServer(async (req, res) => {
  if (!production && vite) return vite.middlewares(req, res, () => {})
  const raw = decodeRequestPath(req.url)
  if (raw === null) {
    res.writeHead(400, { 'content-type': 'text/plain; charset=utf-8' }).end('Bad request')
    return
  }
  const safe = normalize(raw).replace(/^(\.\.(\/|\\|$))+/, '')
  let path = join(root, 'dist', safe === '/' ? 'index.html' : safe)
  try {
    if (!(await stat(path)).isFile()) throw new Error('not a file')
  } catch {
    path = join(root, 'dist', 'index.html')
  }
  try {
    res.writeHead(200, { 'content-type': mime[extname(path)] || 'application/octet-stream' })
    res.end(await readFile(path))
  } catch {
    res.writeHead(404).end('Not found')
  }
})

if (!production) {
  const { createServer } = await import('vite')
  vite = await createServer({ server: { middlewareMode: { server }, ws: { server } }, appType: 'spa' })
}

// Ephemeral signaling only. Messages are discarded after being forwarded; game
// state never passes through this server.
const sockets = new Map()
const wss = new WebSocketServer({ noServer: true })
wss.on('connection', (socket) => {
  let key = ''
  socket.on('message', (raw) => {
    try {
      const message = JSON.parse(String(raw))
      if (!message.sessionId || !message.from || !message.id) return
      key = `${message.sessionId}:${message.from}`
      sockets.set(key, socket)
      if (message.to) {
        const peer = sockets.get(`${message.sessionId}:${message.to}`)
        if (peer?.readyState === WebSocket.OPEN) peer.send(String(raw))
      } else {
        for (const [peerKey, peer] of sockets) {
          if (peerKey.startsWith(`${message.sessionId}:`) && peer !== socket && peer.readyState === WebSocket.OPEN) {
            peer.send(String(raw))
          }
        }
      }
    } catch { /* ignore malformed signaling */ }
  })
  socket.on('close', () => { if (key && sockets.get(key) === socket) sockets.delete(key) })
})

server.on('upgrade', (req, socket, head) => {
  if (req.url !== '/signal') return
  wss.handleUpgrade(req, socket, head, (ws) => wss.emit('connection', ws, req))
})

server.listen(port, '0.0.0.0', () => {
  console.log(`Cosmic Helpdesk ready at http://localhost:${port}`)
})
