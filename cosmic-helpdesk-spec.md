# Cosmic Helpdesk — MVP Spec

Build a browser-based 2–4 player asymmetric co-op game inspired by the communication structure of *Keep Talking and Nobody Explodes*, but themed as an interdimensional technical-support station.

## Goal

Players jointly survive a timed shift by resolving malfunctioning station systems.

Information is intentionally split between players:
- One player is the **Operator** and directly manipulates the station.
- Other players are **Specialists** with manuals, telemetry, lookup tables, and contextual rules the Operator cannot see.
- Players must communicate externally. **Do not implement voice chat in the MVP.**

A round should last about 8–12 minutes.

---

## Tech

Preferred stack:
- React
- TypeScript
- Vite
- CSS / SVG for rendering
- WebRTC DataChannels for gameplay networking

Avoid a permanent game server.

The app may use a minimal public STUN server for NAT traversal. If browser-to-browser connection cannot be established without TURN in some network environments, document that limitation rather than adding a game relay server in the MVP.

No database is required.

---

## P2P Multiplayer

Networking must be fully peer-to-peer for gameplay.

### User flow

1. Player opens the site.
2. Player clicks **Create Game**.
3. App creates a game session and generates a shareable URL.
4. Host clicks **Copy Link**.
5. Other players paste/open the link.
6. Peers establish direct WebRTC DataChannel connections.
7. Lobby shows connected players.
8. Host starts the game once 2–4 players are connected.

Example:

`https://example.com/game#<connection-data>`

The invite mechanism should not require users to manually copy SDP blobs.

Use a practical signaling/bootstrap mechanism suitable for a small web prototype. Signaling may use a tiny stateless endpoint if absolutely necessary, but after connection establishment all game state and messages must travel peer-to-peer. Do not route gameplay through a central server.

### Networking model

Use the creator as the session authority/host.

Host:
- owns the canonical game state
- generates the random seed
- assigns roles
- advances timers
- validates interactions
- broadcasts state updates

Clients:
- send player actions to host
- receive role-specific state
- render only information appropriate for their role

Handle:
- player join
- player leave
- disconnect state
- duplicate/replayed actions
- host ending the session

Host migration is out of scope for MVP.

---

## Roles

Support 2–4 players.

### Operator

Sees the station UI and can manipulate:
- buttons
- switches
- dials
- cables
- symbols
- gauges

The Operator should not see the rules required to solve modules.

### Engineer

Sees:
- schematics
- wiring rules
- repair procedures
- dependency diagrams

### Analyst

Sees:
- telemetry
- changing numerical readings
- lookup tables
- diagnostic values

### Archivist

Sees:
- alien species information
- symbol meanings
- historical notes
- exception rules

For 2 or 3 players, merge Specialist information so every required clue remains available.

---

## Core Gameplay

A shift contains several station modules.

Each active problem requires information held by at least two players.

Prefer chained communication such as:

`Operator observation → Archivist classification → Analyst lookup → Engineer procedure → Operator action`

Incorrect actions reduce stability or create new complications.

Players win by surviving until the shift timer ends or resolving a target number of incidents.

Players lose when station stability reaches zero.

---

## MVP Modules

Implement at least 3.

### 1. Quantum Router

Operator sees several nodes and connectors.

Specialists receive rules determining which nodes must connect based on:
- node symbols
- current frequency
- alien species
- node count

Correct routing resolves the incident.

### 2. Reactor Calibration

Operator sees:
- 3 dials
- indicator lights
- current reactor state

Analyst sees telemetry.

Engineer sees calibration rules.

Correct dial values stabilize the reactor.

### 3. Translation Matrix

Operator sees alien symbols.

Archivist maps symbols to categories.

Another Specialist receives a table converting category + current station condition into a button sequence.

---

## System Dependencies

The key differentiator is that modules affect each other.

Examples:
- reactor instability changes router frequency
- rerouting power disables one telemetry value temporarily
- translation errors create additional incidents
- shutting down one subsystem makes another easier but decreases station stability

Implement at least one dependency between two MVP modules.

---

## Procedural Generation

Use a deterministic seeded RNG.

The host generates a seed at game start.

The seed controls:
- symbols
- module configuration
- valid solutions
- exception rules
- initial incidents

Given the same seed and player count, generated puzzle data should be reproducible.

Do not generate impossible puzzles.

---

## UI

Style:
- playful retro sci-fi
- chunky terminal controls
- readable typography
- simple CSS/SVG animations
- no 3D requirement

Required screens:

### Home
- title
- Create Game
- short explanation

### Lobby
- player list
- role placeholders
- Copy Link
- Start Game

### Game
Operator:
- station modules
- timer
- station stability

Specialists:
- role-specific manuals/tools
- timer
- limited shared status

### End Screen
Show humorous statistics such as:
- incidents resolved
- incorrect actions
- systems damaged
- station stability
- random joke metric such as "Unauthorized Wormholes"

---

## State Separation

Never send all hidden puzzle information to every player and merely hide it in the UI.

Send each peer only the information their assigned role is allowed to know.

The host may retain full authoritative puzzle state.

---

## No Voice Chat

Do not implement:
- WebRTC audio
- microphone permissions
- voice rooms
- speech recognition

Players are expected to use Discord, a phone call, or another external voice channel.

---

## MVP Acceptance Criteria

The MVP is complete when:

- [ ] 2–4 browsers can join one game from a copied invite link.
- [ ] Gameplay traffic after connection setup is peer-to-peer.
- [ ] Host controls authoritative game state.
- [ ] Players receive asymmetric role information.
- [ ] At least 3 playable puzzle modules exist.
- [ ] At least one module affects another module.
- [ ] A deterministic game seed is used.
- [ ] A complete round can be won or lost.
- [ ] Disconnects do not crash remaining clients.
- [ ] No voice functionality exists.
- [ ] The game works locally with multiple browser windows.
- [ ] The project includes a README with local development instructions.

---

## Suggested Development Order

1. Create React/Vite project.
2. Implement Home and Lobby.
3. Implement invite-link WebRTC connection flow.
4. Implement host-authoritative state synchronization.
5. Add role assignment.
6. Build one end-to-end puzzle.
7. Add remaining MVP modules.
8. Add cross-module dependency.
9. Add timer, stability, win/loss conditions.
10. Add styling, animations, end-of-round statistics.
11. Test with 2, 3, and 4 browser instances.

Keep the architecture modular so new station modules can be added as independent components with their own generated state, role-visible information, actions, validation logic, and side effects.
