import { spawn } from 'node:child_process'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import WebSocket from 'ws'

const root = new URL('..', import.meta.url).pathname
const appPort = 5187
const children = []
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function waitFor(check, label, timeout = 15000) {
  const start = Date.now()
  while (Date.now() - start < timeout) {
    try { const value = await check(); if (value) return value } catch { /* retry */ }
    await delay(150)
  }
  throw new Error(`Timed out waiting for ${label}`)
}

async function launchBrowser(port) {
  const profile = await mkdtemp(join(tmpdir(), 'cosmic-smoke-'))
  const child = spawn('chromium', [
    '--headless', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage',
    `--user-data-dir=${profile}`, `--remote-debugging-port=${port}`, 'about:blank',
  ], { stdio: 'ignore' })
  children.push(child)
  await waitFor(async () => (await fetch(`http://127.0.0.1:${port}/json/version`)).ok, `Chromium on ${port}`)
  const target = await fetch(`http://127.0.0.1:${port}/json/new?http://localhost:${appPort}/`, { method: 'PUT' }).then((response) => response.json())
  return new Cdp(target.webSocketDebuggerUrl)
}

class Cdp {
  constructor(url) {
    this.id = 0
    this.pending = new Map()
    this.errors = []
    this.socket = new WebSocket(url)
    this.ready = new Promise((resolve, reject) => {
      this.socket.once('open', resolve)
      this.socket.once('error', reject)
    })
    this.socket.on('message', (raw) => {
      const message = JSON.parse(String(raw))
      if (message.id) {
        const pending = this.pending.get(message.id)
        if (!pending) return
        this.pending.delete(message.id)
        return message.error ? pending.reject(new Error(message.error.message)) : pending.resolve(message.result)
      }
      if (message.method === 'Runtime.exceptionThrown') this.errors.push(message.params.exceptionDetails.text)
    })
  }
  async send(method, params = {}) {
    await this.ready
    const id = ++this.id
    this.socket.send(JSON.stringify({ id, method, params }))
    return new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }))
  }
  async eval(expression) {
    const result = await this.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text)
    return result.result.value
  }
  async navigate(url) {
    await this.send('Page.navigate', { url })
    await waitFor(() => this.eval('document.readyState === "complete"'), `navigation to ${url}`)
  }
  close() { this.socket.close() }
}

try {
  const serverEnv = { ...process.env, PORT: String(appPort) }
  if (process.env.SIGNAL_MODE !== 'peerjs') serverEnv.VITE_SIGNAL_MODE = 'local'
  const server = spawn(process.execPath, ['server.mjs'], {
    cwd: root, env: serverEnv, stdio: 'ignore',
  })
  children.push(server)
  await waitFor(async () => (await fetch(`http://localhost:${appPort}/`)).ok, 'game server')

  const host = await launchBrowser(9331)
  await host.send('Runtime.enable')
  await host.navigate(`http://localhost:${appPort}/`)
  await waitFor(() => host.eval('document.documentElement.lang === "de" && document.body.innerText.includes("SPIEL ERSTELLEN")'), 'German home screen')
  await host.eval('document.querySelector(".audio-toggle").click()')
  await waitFor(() => host.eval('document.querySelector(".audio-panel")?.innerText.includes("Sprachausgabe")'), 'German audio controls')
  await host.eval('document.querySelector("nav .language-selector button:first-child").click()')
  await waitFor(() => host.eval('document.documentElement.lang === "en" && document.querySelector(".audio-panel")?.innerText.includes("Narration")'), 'English audio controls')
  await host.eval('document.querySelector("nav .language-selector button:last-child").click()')
  await host.eval(`(() => { const controls = document.querySelectorAll('.audio-panel input[type="checkbox"]'); controls[2].click(); const volume = document.querySelector('.audio-panel input[type="range"]'); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(volume, '0.35'); volume.dispatchEvent(new Event('input', { bubbles: true })) })()`)
  await waitFor(() => host.eval(`(() => { const saved = JSON.parse(localStorage.getItem('cosmic-helpdesk-audio-v1')); return saved?.ambience === true && saved?.volume === 0.35 })()`), 'persistent audio settings')
  await host.eval('document.querySelector(".audio-toggle").click()')
  await host.eval('[...document.querySelectorAll("button")].find(b => b.textContent.includes("SPIEL ERSTELLEN")).click()')
  const invite = await waitFor(async () => {
    const url = await host.eval('location.href')
    return url.includes('#session=') ? url : false
  }, 'invite link')

  const client = await launchBrowser(9332)
  await client.send('Runtime.enable')
  await client.navigate(`http://localhost:${appPort}/`)
  await waitFor(() => client.eval('document.body.innerText.includes("SPIEL ERSTELLEN")'), 'client home screen before same-document invite')
  await client.eval('window.__inviteNavigationMarker = true')
  await client.navigate(invite)
  await waitFor(() => client.eval('window.__inviteNavigationMarker === true && location.hash.includes("session=")'), 'invite handled without reload')
  await client.eval('document.querySelector(".audio-toggle").click()')
  await waitFor(() => client.eval('document.querySelector(".audio-panel")?.innerText.includes("Sprachausgabe")'), 'client audio controls')
  await client.eval('document.querySelector(".audio-toggle").click()')
  await waitFor(() => host.eval('document.body.innerText.includes("2 / 4")'), 'two-player lobby')
  await host.eval('document.querySelector(".language-row .language-selector button:last-child").click()')
  await waitFor(() => client.eval('document.documentElement.lang === "de" && document.body.innerText.includes("Einweisung zur Nachtschicht")'), 'shared German language')
  await waitFor(() => host.eval('document.querySelector(".style-selector button.selected")?.textContent.includes("KAMPAGNE")'), 'Campaign default')
  await host.eval('[...document.querySelectorAll(".style-selector button")].find(b => b.textContent.includes("SCHNELLES SPIEL")).click()')
  await waitFor(() => client.eval('document.querySelector(".style-selector button.selected")?.textContent.includes("SCHNELLES SPIEL")'), 'shared Fast Game style')
  await host.eval('[...document.querySelectorAll(".difficulty-selector button")].find(b => b.textContent.includes("Notfall")).click()')
  await waitFor(() => client.eval('document.querySelector(".difficulty-selector button.selected")?.textContent.includes("Notfall")'), 'shared Emergency difficulty')
  await host.eval('[...document.querySelectorAll("button")].find(b => b.textContent.includes("SCHICHT STARTEN")).click()')
  await waitFor(() => host.eval('document.body.innerText.includes("Operatorkonsole")'), 'German operator console')
  await waitFor(() => client.eval('document.body.innerText.includes("Missionsspezialist")'), 'German specialist manual')

  const clientHasOperatorSecrets = await client.eval('document.body.innerText.includes("NACHRICHTENPUFFER") || document.body.innerText.includes("VERBINDUNG FIXIEREN")')
  if (clientHasOperatorSecrets) throw new Error('Specialist received Operator-only controls')

  const reactorData = await client.eval(`(() => {
    const panels = [...document.querySelectorAll('.manual-panel')]
    const values = (panel) => Object.fromEntries([...panel.querySelectorAll('.data-rows > div')].map(row => [row.querySelector('span').textContent, row.querySelector('strong').textContent]))
    const telemetry = values(panels.find(panel => panel.querySelector('h2')?.textContent === 'Reaktordaten'))
    const dossier = values(panels.find(panel => panel.textContent.includes('Reaktor-Offset')))
    const procedure = panels.find(panel => panel.querySelector('h2')?.textContent === 'Energiepfade verfolgen').textContent
    const reading = (fragment) => Number.parseInt(Object.entries(telemetry).find(([label]) => label.includes(fragment))[1], 10)
    const mode = procedure.includes('Kühlkreislauf') ? 'coolant-loop' : procedure.includes('Phasensperre') ? 'phase-lock' : 'crossfeed'
    return { flux: reading('Fluss'), phase: reading('Phase'), coolant: reading('Kühlmittel'), offset: +dossier['Reaktor-Offset'], mode }
  })()`)
  const wrap = (value) => ((value % 6) + 6) % 6
  const desiredDials = reactorData.mode === 'coolant-loop'
    ? [wrap(reactorData.flux + reactorData.coolant), wrap(reactorData.phase + reactorData.offset), wrap(reactorData.coolant - reactorData.flux)]
    : reactorData.mode === 'phase-lock'
      ? [wrap(reactorData.phase + reactorData.coolant + reactorData.offset), wrap(reactorData.flux - reactorData.phase), wrap(reactorData.flux + reactorData.phase)]
      : [wrap(reactorData.flux + reactorData.phase), wrap(reactorData.coolant - reactorData.phase), wrap(reactorData.flux + reactorData.coolant + reactorData.offset)]
  await host.eval(`(() => { const desired = ${JSON.stringify(desiredDials)}; [...document.querySelectorAll('.dial-control')].forEach((dial, i) => { for (let n = 0; n < desired[i]; n++) dial.querySelector('button').click() }) })()`)
  await delay(250)
  await host.eval('[...document.querySelectorAll("button")].find(b => b.textContent.includes("KALIBRIERUNG AKTIVIEREN")).click()')
  await waitFor(() => client.eval('[...document.querySelectorAll(".incident-list p")].some(p => p.textContent.includes("Reaktorkalibrierung") && p.querySelector("i.done"))'), 'reactor resolution')

  const translationData = await client.eval(`(() => {
    const panels = [...document.querySelectorAll('.manual-panel')]
    const archive = panels.find(panel => panel.querySelector('h2')?.textContent === 'Archivkarte 88-B')
    const procedure = panels.find(panel => panel.querySelector('h2')?.textContent === 'Kategorie in Farbe umwandeln')
    const categoriesByGlyph = Object.fromEntries([...archive.querySelectorAll('.data-rows > div')].map(row => [row.querySelector('span').textContent.trim().split(/\\s+/)[0], row.querySelector('strong').textContent]))
    const map = Object.fromEntries([...procedure.querySelectorAll('tbody tr')].map(row => {
      const cells = [...row.querySelectorAll('td')].map(cell => cell.textContent)
      return [cells[0], cells[1]]
    }))
    const reverse = procedure.querySelector('.manual-panel-heading span').textContent.includes('rechts nach links')
    return { categoriesByGlyph, map, reverse }
  })()`)
  const messageGlyphs = await host.eval(`[...document.querySelectorAll('.alien-message b')].map(node => node.textContent)`)
  const colorIds = { BERNSTEIN: 'amber', CYAN: 'cyan', MAGENTA: 'magenta', LIMETTE: 'lime' }
  const messageCategories = messageGlyphs.map((glyph) => translationData.categoriesByGlyph[glyph])
  const orderedCategories = translationData.reverse ? [...messageCategories].reverse() : messageCategories
  const response = orderedCategories.map((category) => colorIds[translationData.map[category].trim().split(/\s+/).at(-1)])
  await host.eval(`(() => { const colors = ${JSON.stringify(response)}; colors.forEach(color => document.querySelector('.color-buttons .color-' + color).click()) })()`)
  await delay(250)
  await host.eval('[...document.querySelectorAll("button")].find(b => b.textContent.includes("SENDEN")).click()')
  await waitFor(() => client.eval('[...document.querySelectorAll(".incident-list p")].some(p => p.textContent.includes("Übersetzungsmatrix") && p.querySelector("i.done"))'), 'translation resolution')

  const routerData = await client.eval(`(() => {
    const panel = [...document.querySelectorAll('.manual-panel')].find(panel => panel.textContent.includes('Routeraffinität'))
    const rawAffinity = [...panel.querySelectorAll('.data-rows > div')].find(row => row.textContent.includes('Routeraffinität')).querySelector('strong').textContent
    const telemetry = [...document.querySelectorAll('.manual-panel')].find(panel => panel.querySelector('h2')?.textContent === 'Router & Station')
    const rawBand = [...telemetry.querySelectorAll('.data-rows > div')].find(row => row.textContent.includes('Frequenzband')).querySelector('strong').textContent
    const affinity = rawAffinity === 'ECKIG' ? 'angular' : 'curved'
    const band = rawBand === 'HOCH' ? 'high' : 'low'
    return { affinity, band }
  })()`)
  const routerRule = await client.eval(`(() => {
    const panel = [...document.querySelectorAll('.manual-panel')].find(panel => panel.querySelector('h2')?.textContent === 'Router-Verbindungstabelle')
    return [...panel.querySelectorAll('tbody tr')].map(row => [...row.querySelectorAll('td')].map(cell => cell.textContent))
  })()`)
  const bandLabel = routerData.band === 'high' ? 'HOCH' : 'NIEDRIG'
  const affinityLabel = routerData.affinity === 'angular' ? 'Eckig' : 'Kurvig'
  const symbolGlyphs = { Nova: '✦', Halo: '◉', Riss: 'ϟ', Prisma: '◇' }
  const selectedRule = routerRule.find(row => row[0] === bandLabel && row[1] === affinityLabel)[2]
  const glyphPair = selectedRule.split(' ↔ ').map(name => symbolGlyphs[name])
  await host.eval(`(() => { const glyphs = ${JSON.stringify(glyphPair)}; glyphs.forEach(glyph => [...document.querySelectorAll('.node')].find(node => node.textContent.includes(glyph)).click()) })()`)
  await delay(250)
  await host.eval('[...document.querySelectorAll("button")].find(b => b.textContent.includes("VERBINDUNG FIXIEREN")).click()')
  await waitFor(() => host.eval('document.body.innerText.includes("Technisch gesehen ein Erfolg")'), 'winning end screen')
  const resolved = await host.eval('document.body.innerText.includes("3 / 3")')
  if (!resolved) throw new Error('Win screen did not report all incidents resolved')
  const score = await host.eval('+document.querySelector(".final-score strong").textContent.replace(/\\D/g, "")')
  if (!(score > 0)) throw new Error('Win screen did not report a positive crew score')
  await host.eval('[...document.querySelectorAll("button")].find(b => b.textContent.includes("NEUE SCHICHT")).click()')
  await waitFor(() => host.eval('document.body.innerText.includes("Operatorkonsole") && !document.body.innerText.includes("Technisch gesehen ein Erfolg")'), 'host replay')
  await waitFor(() => client.eval('document.body.innerText.includes("Missionsspezialist") && !document.body.innerText.includes("Technisch gesehen ein Erfolg")'), 'client replay')
  await host.send('Emulation.setDeviceMetricsOverride', { width: 320, height: 800, deviceScaleFactor: 1, mobile: true })
  await client.send('Emulation.setDeviceMetricsOverride', { width: 320, height: 800, deviceScaleFactor: 1, mobile: true })
  const hostOverflow = await host.eval('document.documentElement.scrollWidth > window.innerWidth')
  const clientOverflow = await client.eval('document.documentElement.scrollWidth > window.innerWidth')
  if (hostOverflow || clientOverflow) throw new Error(`Horizontal overflow at 320px: host=${hostOverflow}, client=${clientOverflow}`)

  await host.send('Emulation.clearDeviceMetricsOverride')
  await client.send('Emulation.clearDeviceMetricsOverride')
  await host.eval('document.querySelector(".icon-button").click()')
  await waitFor(() => host.eval('document.body.innerText.includes("SPIEL ERSTELLEN")'), 'host returned home for campaign story check')
  await waitFor(() => client.eval('document.body.innerText.includes("SITZUNG VERLASSEN")'), 'client received session end')
  await client.eval('document.querySelector(".text-button").click()')
  await host.eval('[...document.querySelectorAll("button")].find(b => b.textContent.includes("SPIEL ERSTELLEN")).click()')
  const campaignInvite = await waitFor(async () => {
    const url = await host.eval('location.href')
    return url.includes('#session=') ? url : false
  }, 'campaign invite link')
  await client.navigate(campaignInvite)
  await waitFor(() => host.eval('document.body.innerText.includes("2 / 4")'), 'campaign crew connection')
  await host.eval('[...document.querySelectorAll(".style-selector button")].find(b => b.textContent.includes("KAMPAGNE")).click()')
  await waitFor(() => client.eval('document.querySelector(".style-selector button.selected")?.textContent.includes("KAMPAGNE")'), 'shared Campaign style')
  await host.eval('scrollTo(0, document.documentElement.scrollHeight)')
  await host.eval('[...document.querySelectorAll("button")].find(b => b.textContent.includes("SCHICHT STARTEN")).click()')
  await waitFor(() => host.eval('document.querySelector(".mission-dossier .story-contact-name")?.textContent.includes("UNBEKANNTE ZUKUNFTSCREW")'), 'campaign transmission in host briefing')
  await waitFor(() => host.eval('scrollY === 0'), 'top scroll on campaign start')
  await waitFor(() => client.eval('document.querySelector(".mission-dossier .story-contact-name")?.textContent.includes("UNBEKANNTE ZUKUNFTSCREW")'), 'campaign transmission in client briefing')
  await host.eval('[...document.querySelectorAll("button")].find(b => b.textContent.includes("MISSION BEGINNEN")).click()')
  await waitFor(() => host.eval('document.querySelector(".campaign-story")?.innerText.includes("WARUM DAS WICHTIG IST")'), 'operator story panel')
  await waitFor(() => client.eval('document.querySelector(".specialist-story-shell .campaign-story")?.innerText.includes("MISSIONSFORTSCHRITT")'), 'specialist story panel')

  const storyReactor = await client.eval(`(() => {
    const panels = [...document.querySelectorAll('.manual-panel')]
    const values = (panel) => Object.fromEntries([...panel.querySelectorAll('.data-rows > div')].map(row => [row.querySelector('span').textContent, row.querySelector('strong').textContent]))
    const telemetry = values(panels.find(panel => panel.querySelector('h2')?.textContent === 'Reaktordaten'))
    const dossier = values(panels.find(panel => panel.textContent.includes('Reaktor-Offset')))
    const reading = (fragment) => Number.parseInt(Object.entries(telemetry).find(([label]) => label.includes(fragment))[1], 10)
    return { flux: reading('Fluss'), phase: reading('Phase'), coolant: reading('Kühlmittel'), offset: +dossier['Reaktor-Offset'] }
  })()`)
  const storyDials = [wrap(storyReactor.flux + storyReactor.phase), wrap(storyReactor.coolant - storyReactor.phase), wrap(storyReactor.flux + storyReactor.coolant + storyReactor.offset)]
  await host.eval(`(() => { const desired = ${JSON.stringify(storyDials)}; [...document.querySelectorAll('.dial-control')].forEach((dial, i) => { for (let n = 0; n < desired[i]; n++) dial.querySelector('button').click() }) })()`)
  await host.eval('[...document.querySelectorAll("button")].find(b => b.textContent.includes("KALIBRIERUNG AKTIVIEREN")).click()')
  await waitFor(() => host.eval('document.body.innerText.includes("Technisch gesehen ein Erfolg")'), 'campaign chapter win')
  await host.eval('[...document.querySelectorAll("button")].find(b => b.textContent.includes("DESKTOP ÖFFNEN")).click()')
  await waitFor(() => host.eval('document.querySelector(".chat-presence")?.innerText.includes("MARA VALE") && document.querySelector(".chat-message.mara")?.innerText.includes("MARA VALE")'), 'Mara visible in host story chat')
  await waitFor(() => client.eval('document.querySelector(".chat-presence")?.innerText.includes("MARA VALE") && document.querySelector(".chat-message.mara")?.innerText.includes("MARA VALE")'), 'Mara visible in client story chat')
  await host.send('Emulation.setDeviceMetricsOverride', { width: 320, height: 800, deviceScaleFactor: 1, mobile: true })
  await client.send('Emulation.setDeviceMetricsOverride', { width: 320, height: 800, deviceScaleFactor: 1, mobile: true })
  const storyHostOverflow = await host.eval('document.documentElement.scrollWidth > window.innerWidth')
  const storyClientOverflow = await client.eval('document.documentElement.scrollWidth > window.innerWidth')
  if (storyHostOverflow || storyClientOverflow) throw new Error(`Story UI horizontal overflow at 320px: host=${storyHostOverflow}, client=${storyClientOverflow}`)
  if (host.errors.length || client.errors.length) throw new Error(`Browser exceptions: ${[...host.errors, ...client.errors].join(', ')}`)
  host.close(); client.close()
  console.log('Two-browser WebRTC smoke test passed: shared settings, varied procedures, story/Mara visibility, win/replay sync, and 320px layouts.')
} finally {
  for (const child of children.reverse()) child.kill('SIGTERM')
}
