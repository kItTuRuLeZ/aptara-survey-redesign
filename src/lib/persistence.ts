import type { AnswerCode, Question, QuestionCode } from './types'

const STORAGE_KEY = 'aptara-assessment-state'
const SCHEMA_VERSION = 1

export interface PersistedState {
  version: number
  currentIndex: number
  answers: Partial<Record<QuestionCode, AnswerCode>>
}

/**
 * sessionStorage only — this is a short-lived, in-progress assessment, not
 * something that should survive across browser sessions, and no personal
 * data is ever stored (just answer codes and a position index).
 */

function isValidPersistedState(
  value: unknown,
  questions: Question[],
): value is PersistedState {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Record<string, unknown>

  if (candidate.version !== SCHEMA_VERSION) return false
  if (
    typeof candidate.currentIndex !== 'number' ||
    candidate.currentIndex < 0 ||
    candidate.currentIndex >= questions.length
  ) {
    return false
  }
  if (typeof candidate.answers !== 'object' || candidate.answers === null) return false

  return Object.entries(candidate.answers as Record<string, unknown>).every(
    ([question, answer]) =>
      questions
        .find((q) => q.code === question)
        ?.answers.some((a) => a.code === answer) ?? false,
  )
}

/**
 * Handles a schema-version bump. Currently a safe no-op — any version other
 * than the current one is discarded rather than guessed at — but gives
 * future version bumps a real place to add field renames/migrations instead
 * of just dropping old state.
 */
function migrate(raw: Record<string, unknown>): PersistedState | null {
  if (raw.version === SCHEMA_VERSION) return null // not actually stale, caller re-validates
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
