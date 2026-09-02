import type { Player } from './game'

export function reconnectOrAddPlayer(players: Player[], incoming: Player, capacity = 4) {
  if (players.some((player) => player.id === incoming.id)) {
    return {
      accepted: true,
      players: players.map((player) => player.id === incoming.id ? { ...player, name: incoming.name, connected: true } : player),
    }
  }

  const connected = players.filter((player) => player.connected)
  if (connected.length >= capacity) return { accepted: false, players }
  return { accepted: true, players: [...connected, incoming] }
}
