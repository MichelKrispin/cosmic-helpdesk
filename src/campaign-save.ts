import { dialogueChoiceLevels, isDialogueChoice, type DialogueSelection } from './intermission'

export type CampaignStoryProgress = {
  completedIntermissions: number[]
  archiveFragments: number[]
  dialogueChoices: DialogueSelection[]
}

export type CampaignSave = CampaignStoryProgress & {
  progress: number
  scores: number[]
}

export const emptyCampaignStoryProgress: CampaignStoryProgress = { completedIntermissions: [], archiveFragments: [], dialogueChoices: [] }

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

function normalizeDialogueChoices(value: unknown): DialogueSelection[] {
  if (!Array.isArray(value)) return []
  const choices = new Map<number, DialogueSelection>()
  for (const candidate of value) {
    if (!candidate || typeof candidate !== 'object') continue
    const { levelId, choiceId } = candidate as Partial<DialogueSelection>
    if (typeof levelId === 'number' && isDialogueChoice(levelId, choiceId)) choices.set(levelId, { levelId, choiceId })
  }
  return [...choices.values()].sort((a, b) => a.levelId - b.levelId)
}

function choicesToCode(choices: DialogueSelection[]) {
  const normalized = normalizeDialogueChoices(choices)
  const value = dialogueChoiceLevels.reduce((total, levelId, index) => {
    const choiceId = normalized.find(choice => choice.levelId === levelId)?.choiceId
    const optionIndex = choiceId ? dialoguePromptsOptionIndex(levelId, choiceId) + 1 : 0
    return total + optionIndex * 3 ** index
  }, 0)
  return value.toString(36)
}

function dialoguePromptsOptionIndex(levelId: number, choiceId: string) {
  if (!isDialogueChoice(levelId, choiceId)) return -1
  const firstIds: Record<number, string> = { 4: 'trust-mara', 8: 'warn-callers', 12: 'hear-assembly', 15: 'welcome-relay', 16: 'open-final-route' }
  return firstIds[levelId] === choiceId ? 0 : 1
}

function codeToChoices(raw: string): DialogueSelection[] | null {
  const value = Number.parseInt(raw, 36)
  if (!Number.isSafeInteger(value) || value < 0 || value >= 3 ** dialogueChoiceLevels.length) return null
  const firstIds: Record<number, DialogueSelection['choiceId']> = { 4: 'trust-mara', 8: 'warn-callers', 12: 'hear-assembly', 15: 'welcome-relay', 16: 'open-final-route' }
  const secondIds: Record<number, DialogueSelection['choiceId']> = { 4: 'verify-mara', 8: 'secure-route', 12: 'answer-without-assembly', 15: 'audit-relay', 16: 'wait-final-route' }
  return dialogueChoiceLevels.flatMap((levelId, index) => {
    const digit = Math.floor(value / 3 ** index) % 3
    return digit === 0 ? [] : [{ levelId, choiceId: digit === 1 ? firstIds[levelId] : secondIds[levelId] }]
  })
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
    choicesToCode(save.dialogueChoices),
  ]
  const payload = `3|${fields.join('|')}`
  return `CHD3-${fields.map(field => field.toUpperCase()).join('-')}-${campaignChecksum(payload)}`
}

export function decodeCampaignRecovery(code: string, levelCount: number): CampaignSave | null {
  const normalized = code.trim().toLowerCase()
  const current = normalized.match(/^chd3-([0-9a-z]+)-([0-9a-z.]+)-([0-9a-z]+)-([0-9a-z]+)-([0-9a-z]+)-([0-9a-z]+)$/)
  if (!current) return null
  const [, progressRaw, scoresRaw, intermissionsRaw, fragmentsRaw, choicesRaw, checksum] = current
  const progress = Number.parseInt(progressRaw, 36)
  const scores = normalizeScores(scoresRaw.split('.').map(score => Number.parseInt(score, 36)), levelCount)
  const completedIntermissions = maskToLevels(intermissionsRaw, levelCount)
  const archiveFragments = maskToLevels(fragmentsRaw, levelCount)
  const dialogueChoices = codeToChoices(choicesRaw)
  const payload = `3|${progressRaw}|${scoresRaw}|${intermissionsRaw}|${fragmentsRaw}|${choicesRaw}`
  if (campaignChecksum(payload).toLowerCase() !== checksum || !Number.isInteger(progress) || progress < 1 || progress > levelCount || !scores || !completedIntermissions || !archiveFragments || !dialogueChoices) return null
  return { progress, scores, completedIntermissions, archiveFragments, dialogueChoices }
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
    dialogueChoices: normalizeDialogueChoices(candidate.dialogueChoices),
  }
}
