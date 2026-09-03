export type CampaignStoryProgress = {
  completedIntermissions: number[]
  archiveFragments: number[]
}

export type CampaignSave = CampaignStoryProgress & {
  progress: number
  scores: number[]
}

export const emptyCampaignStoryProgress: CampaignStoryProgress = { completedIntermissions: [], archiveFragments: [] }

function campaignChecksum(value: string) {
  let hash = 2166136261
  for (const character of value) { hash ^= character.charCodeAt(0); hash = Math.imul(hash, 16777619) }
  return (hash >>> 0).toString(36).toUpperCase().padStart(7, '0')
}

function validLevels(levels: number[], levelCount: number) {
  return [...new Set(levels)].filter(level => Number.isInteger(level) && level >= 1 && level <= levelCount).sort((a, b) => a - b)
}

function levelsToMask(levels: number[], levelCount: number) {
  return validLevels(levels, levelCount).reduce((mask, level) => mask + 2 ** (level - 1), 0).toString(36)
}

function maskToLevels(raw: string, levelCount: number) {
  const mask = Number.parseInt(raw, 36)
  if (!Number.isSafeInteger(mask) || mask < 0 || mask >= 2 ** levelCount) return null
  return Array.from({ length: levelCount }, (_, index) => index + 1).filter(level => Math.floor(mask / 2 ** (level - 1)) % 2 === 1)
}

function normalizeScores(scores: number[], levelCount: number) {
  if (scores.length > levelCount || scores.some(score => !Number.isSafeInteger(score) || score < 0)) return null
  return [...scores, ...Array(levelCount - scores.length).fill(0)]
}

export function encodeCampaignRecovery(save: CampaignSave, levelCount: number) {
  if (!Number.isInteger(save.progress) || save.progress < 1 || save.progress > levelCount) throw new Error('Invalid campaign progress')
  const scores = normalizeScores(save.scores, levelCount)
  if (!scores) throw new Error('Invalid campaign scores')
  const fields = [
    save.progress.toString(36),
    scores.map(score => score.toString(36)).join('.'),
    levelsToMask(save.completedIntermissions, levelCount),
    levelsToMask(save.archiveFragments, levelCount),
  ]
  const payload = `2|${fields.join('|')}`
  return `CHD2-${fields.map(field => field.toUpperCase()).join('-')}-${campaignChecksum(payload)}`
}

export function decodeCampaignRecovery(code: string, levelCount: number): CampaignSave | null {
  const normalized = code.trim().toLowerCase()
  const current = normalized.match(/^chd2-([0-9a-z]+)-([0-9a-z.]+)-([0-9a-z]+)-([0-9a-z]+)-([0-9a-z]+)$/)
  if (!current) return null
  const [, progressRaw, scoresRaw, intermissionsRaw, fragmentsRaw, checksum] = current
  const progress = Number.parseInt(progressRaw, 36)
  const scores = normalizeScores(scoresRaw.split('.').map(score => Number.parseInt(score, 36)), levelCount)
  const completedIntermissions = maskToLevels(intermissionsRaw, levelCount)
  const archiveFragments = maskToLevels(fragmentsRaw, levelCount)
  const payload = `2|${progressRaw}|${scoresRaw}|${intermissionsRaw}|${fragmentsRaw}`
  if (campaignChecksum(payload).toLowerCase() !== checksum || !Number.isInteger(progress) || progress < 1 || progress > levelCount || !scores || !completedIntermissions || !archiveFragments) return null
  return { progress, scores, completedIntermissions, archiveFragments }
}

export function nextCampaignProgress(currentProgress: number, completedLevel: number, levelCount: number) {
  if (!Number.isInteger(currentProgress) || !Number.isInteger(completedLevel) || levelCount < 1) throw new Error('Invalid campaign level')
  return Math.max(1, Math.min(levelCount, Math.max(currentProgress, completedLevel + 1)))
}

export function normalizeCampaignStoryProgress(value: unknown, levelCount: number): CampaignStoryProgress {
  if (!value || typeof value !== 'object') return { ...emptyCampaignStoryProgress }
  const candidate = value as Partial<CampaignStoryProgress>
  return {
    completedIntermissions: validLevels(Array.isArray(candidate.completedIntermissions) ? candidate.completedIntermissions : [], levelCount),
    archiveFragments: validLevels(Array.isArray(candidate.archiveFragments) ? candidate.archiveFragments : [], levelCount),
  }
}
