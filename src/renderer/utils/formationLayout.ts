import type { FormationType, DifficultyLevel } from '@shared/ipc-types'

interface Offsets {
  dx: number
  dy: number
}

export function getFormationOffsets(
  formation: FormationType,
  count: number,
  gridSize: number,
): Offsets[] {
  if (formation === 'saved' || count === 0) {
    return Array.from({ length: count }, () => ({ dx: 0, dy: 0 }))
  }

  const g = gridSize

  switch (formation) {
    case 'line':
      return lineFormation(count, g)
    case 'circle':
      return circleFormation(count, g)
    case 'cluster':
      return clusterFormation(count, g)
    case 'wing':
      return wingFormation(count, g)
    case 'v-formation':
      return vFormation(count, g)
    default:
      return Array.from({ length: count }, () => ({ dx: 0, dy: 0 }))
  }
}

function lineFormation(count: number, g: number): Offsets[] {
  return Array.from({ length: count }, (_, i) => ({
    dx: i * g,
    dy: 0,
  }))
}

function circleFormation(count: number, g: number): Offsets[] {
  if (count <= 1) return [{ dx: 0, dy: 0 }]
  const radius = count <= 4 ? g : count <= 8 ? g * 1.5 : g * 2
  return Array.from({ length: count }, (_, i) => {
    const angle = (2 * Math.PI * i) / count - Math.PI / 2
    return {
      dx: Math.round(Math.cos(angle) * radius),
      dy: Math.round(Math.sin(angle) * radius),
    }
  })
}

function clusterFormation(count: number, g: number): Offsets[] {
  if (count <= 1) return [{ dx: 0, dy: 0 }]
  const offsets: Offsets[] = []
  let row = 0
  let col = 0
  let rowWidth = 1
  let placed = 0
  for (let i = 0; i < count; i++) {
    offsets.push({ dx: col * g, dy: row * g })
    placed++
    col++
    if (placed >= rowWidth) {
      row++
      col = 0
      placed = 0
      rowWidth = row % 2 === 0 ? Math.max(1, rowWidth - 1) : rowWidth + 1
    }
  }
  const centerDx = (offsets.reduce((s, o) => s + o.dx, 0)) / count
  const centerDy = (offsets.reduce((s, o) => s + o.dy, 0)) / count
  return offsets.map((o) => ({
    dx: Math.round(o.dx - centerDx),
    dy: Math.round(o.dy - centerDy),
  }))
}

function wingFormation(count: number, g: number): Offsets[] {
  if (count <= 1) return [{ dx: 0, dy: 0 }]
  const offsets: Offsets[] = [{ dx: 0, dy: 0 }]
  let row = 1
  let left = 1
  let right = 1
  while (offsets.length < count) {
    if (offsets.length < count) {
      offsets.push({ dx: -row * g, dy: row * g })
      left++
    }
    if (offsets.length < count) {
      offsets.push({ dx: row * g, dy: row * g })
      right++
    }
    row++
  }
  return offsets
}

function vFormation(count: number, g: number): Offsets[] {
  if (count <= 1) return [{ dx: 0, dy: 0 }]
  const offsets: Offsets[] = [{ dx: 0, dy: 0 }]
  for (let i = 1; i < count; i++) {
    const side = i % 2 === 1 ? -1 : 1
    const rank = Math.ceil(i / 2)
    offsets.push({ dx: side * rank * g, dy: rank * g })
  }
  return offsets
}

export interface DifficultyConfig {
  hpMultiplier: number
  tokenCountMultiplier: number
  acBonus: number
}

const DIFFICULTY_CONFIGS: Record<DifficultyLevel, DifficultyConfig> = {
  easy: { hpMultiplier: 0.75, tokenCountMultiplier: 0.5, acBonus: -2 },
  normal: { hpMultiplier: 1.0, tokenCountMultiplier: 1.0, acBonus: 0 },
  hard: { hpMultiplier: 1.5, tokenCountMultiplier: 1.5, acBonus: 2 },
  deadly: { hpMultiplier: 2.0, tokenCountMultiplier: 2.0, acBonus: 3 },
}

export function getDifficultyConfig(difficulty: DifficultyLevel): DifficultyConfig {
  return DIFFICULTY_CONFIGS[difficulty]
}

export interface TemplateToken {
  name: string
  imagePath: string | null
  x: number
  y: number
  size: number
  hpCurrent: number
  hpMax: number
  faction: string
  ac: number | null
  visibleToPlayers: boolean
}

export function applyDifficultyToToken(
  token: TemplateToken,
  difficulty: DifficultyLevel,
): TemplateToken {
  const cfg = getDifficultyConfig(difficulty)
  if (difficulty === 'normal') return { ...token }
  return {
    ...token,
    hpMax: Math.round(token.hpMax * cfg.hpMultiplier),
    hpCurrent: Math.round(token.hpCurrent * cfg.hpMultiplier),
    ac: token.ac != null ? token.ac + cfg.acBonus : token.ac,
  }
}

export function selectTokensForDifficulty(
  tokens: TemplateToken[],
  difficulty: DifficultyLevel,
): TemplateToken[] {
  const cfg = getDifficultyConfig(difficulty)
  const targetCount = Math.max(1, Math.round(tokens.length * cfg.tokenCountMultiplier))
  if (targetCount <= tokens.length) return tokens.slice(0, targetCount)
  const result: TemplateToken[] = [...tokens]
  let idx = 0
  while (result.length < targetCount) {
    const clone = { ...tokens[idx % tokens.length] }
    clone.name = `${clone.name} #${Math.floor(idx / tokens.length) + 2}`
    result.push(clone)
    idx++
  }
  return result
}

export function selectRandomTokens(
  tokens: TemplateToken[],
  randomCount: number,
): TemplateToken[] {
  if (randomCount >= tokens.length) return tokens
  if (randomCount <= 0) return tokens
  const shuffled = [...tokens]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled.slice(0, randomCount)
}