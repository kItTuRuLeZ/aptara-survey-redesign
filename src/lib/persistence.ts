import type { Answers, Question } from './types'
import { groupSteps, isValidValue } from './answers'

const STORAGE_KEY = 'aptara-assessment-state'
const SCHEMA_VERSION = 2

export type PersistedView = 'question' | 'results'

export interface PersistedState {
  version: number
  /** Which screen to return to. 'results' is only honoured when every question is answered. */
  view: PersistedView
  /** Index of the current step (screen), not of the question. */
  currentIndex: number
  answers: Answers
}

/**
 * sessionStorage only — this is a short-lived assessment, not something that
 * should survive across browser sessions, and no personal data is ever
 * stored (just answer codes, a position index and which screen was open).
 * The result itself is never stored; it is recomposed from the answers.
 */

function isValidPersistedState(
  value: unknown,
  questions: Question[],
): value is PersistedState {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Record<string, unknown>

  if (candidate.version !== SCHEMA_VERSION) return false
  if (candidate.view !== 'question' && candidate.view !== 'results') return false
  if (
    typeof candidate.currentIndex !== 'number' ||
    !Number.isInteger(candidate.currentIndex) ||
    candidate.currentIndex < 0 ||
    candidate.currentIndex >= groupSteps(questions).length
  ) {
    return false
  }
  if (typeof candidate.answers !== 'object' || candidate.answers === null) return false

  const answers = candidate.answers as Record<string, unknown>
  const answersValid = Object.entries(answers).every(([code, value]) => {
    const question = questions.find((q) => q.code === code)
    return question ? isValidValue(question, value) : false
  })
  if (!answersValid) return false

  // Never produce a result from incomplete answers.
  if (candidate.view === 'results') {
    return questions.every((q) => answers[q.code] !== undefined)
  }
  return true
}

/**
 * Upgrades older saved state. Version 1 belonged to the earlier question set
 * (one answer per question, different options), so it is deliberately
 * discarded rather than mapped onto questions it was never answered for.
 * Future versions can add real migrations here.
 */
function migrate(raw: Record<string, unknown>): PersistedState | null {
  void raw
  return null
}

/**
 * Saved answers are checked against the current questions, so state saved
 * before a content update that removed a question or answer is discarded.
 */
export function loadPersistedState(questions: Question[]): PersistedState | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw) as Record<string, unknown>
    if (isValidPersistedState(parsed, questions)) return parsed

    const migrated = migrate(parsed)
    return migrated && isValidPersistedState(migrated, questions) ? migrated : null
  } catch {
    // Corrupt JSON, storage disabled (private browsing), or any other
    // unexpected shape — treat as if there were no saved state.
    return null
  }
}

export function savePersistedState(state: PersistedState): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Quota exceeded or storage unavailable — losing resume capability is
    // acceptable; the assessment itself must keep working.
  }
}

export function clearPersistedState(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // Ignore.
  }
}

export const PERSISTENCE_SCHEMA_VERSION = SCHEMA_VERSION
