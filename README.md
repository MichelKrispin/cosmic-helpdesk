# Cosmic Helpdesk

A 2–4 player asymmetric co-op browser game about surviving a shift at an interdimensional technical-support station.

## Run locally

Requirements: Node.js 20 or newer.

```bash
npm install
npm run dev
```

Open `http://localhost:5173`, create a game, and paste the copied invite link into one to three other browser windows. The host starts once at least two players are connected.

For a production build:

```bash
npm run build
npm run preview
```

Set `PORT` to change the default port.

## Deploy to GitHub Pages

This repository includes a workflow that builds `dist/` and publishes it as a static GitHub Pages site. No Node.js installation is needed for players.

1. Push the repository to GitHub with `main` as its default branch.
2. In the repository, open **Settings → Pages** and select **GitHub Actions** as the source.
3. Push to `main`, or run **Deploy to GitHub Pages** from the Actions tab.
4. Open the published Pages URL, create a game, and share the generated invite link.

The production build uses relative asset paths, so the same `dist/` also works on other static hosts and under GitHub project paths such as `https://name.github.io/repository/`. Internet multiplayer still uses PeerJS for connection setup; the host must keep the game tab open.

## How to start occasional games

To play over the internet without router port forwarding, use a free Cloudflare Quick Tunnel. Install [`cloudflared`](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/downloads/), then run the game and tunnel in separate terminals:

```bash
# Terminal 1
npm run dev

# Terminal 2
cloudflared tunnel --url http://localhost:5173
```

Open the generated `https://…trycloudflare.com` address yourself, create the game there, and share its invite link. Keep both terminals and the host's browser tab open during the session.

Quick Tunnels are intended for occasional testing and games: the address changes when the tunnel is restarted and uptime is not guaranteed. Once everyone has loaded the app, PeerJS handles rendezvous independently and gameplay travels peer-to-peer, so a brief tunnel interruption should not stop the current round. It can still prevent page refreshes or new players from loading the game.

## Networking

By default, browsers use PeerJS's public PeerServer to find the host and exchange the WebRTC handshake. The random host ID and session ID are carried in the invite URL. PeerJS does not receive gameplay data: once connected, lobby updates, actions, and game state travel directly between browsers over WebRTC DataChannels.

For offline development or local-only play, start with `VITE_SIGNAL_MODE=local npm run dev`. This uses the included ephemeral WebSocket endpoint at `/signal` plus `BroadcastChannel`, without contacting PeerJS's public service.

The host owns the canonical game state, validates unique action IDs, advances the timer, and sends every client a role-specific view. Full puzzle answers are never sent to specialist clients.

PeerJS supplies the default ICE configuration used for NAT traversal. To use your own TURN relay on restrictive networks, set `VITE_TURN_URL`, `VITE_TURN_USERNAME`, and `VITE_TURN_CREDENTIAL` before building or starting the app. When supplied, the game uses Google's public STUN server plus that TURN relay. Remote pages should be served over HTTPS.

No database, gameplay relay, voice chat, account, or analytics is used. PeerJS's public service is used only for rendezvous and signaling.

## Gameplay notes

- Fast Game is the original complete three-system challenge with selectable difficulty.
- Campaign follows an eight-level map. It starts with one system, introduces the others gradually, then unlocks additional procedures, palettes, reading directions, and stronger pressure. Campaign progress and per-level best scores are saved in the host browser.
- A deterministic seed creates the caller species, glyphs, telemetry, node layout, and valid solutions.
- The host selects Training, Standard, or Emergency. Harder shifts are shorter, apply stronger recurring stability damage, and award larger score multipliers.
- A shift is won only by resolving every active incident. Running out of time or stability loses the shift.
- Scores reward resolved incidents, remaining time, and stability while penalizing mistakes and damaged systems. Personal bests are saved per difficulty in each browser.
- Seeds also select one of three router protocols, one of three reactor procedures, four translation palettes, and either reading direction.
- Two-player crews receive one merged Specialist manual.
- Three-player crews use an Engineer and a combined Analyst/Archivist role.
- Four-player crews use all four distinct roles.
- Reactor stability changes the Quantum Router frequency, so solving one module can change another module's required connection.

## License

[MIT](LICENSE) — use, copy, modify, distribute, sublicense, or sell it, provided the copyright and license notice remain included.
