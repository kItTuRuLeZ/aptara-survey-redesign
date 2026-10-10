import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  clearPersistedState,
  loadPersistedState,
  savePersistedState,
  PERSISTENCE_SCHEMA_VERSION,
} from './persistence'
import { content } from '../content'

const questions = content.questions

const STORAGE_KEY = 'aptara-assessment-state'

describe('persistence', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })
  afterEach(() => {
    sessionStorage.clear()
  })

  it('returns null when nothing has been saved', () => {
    expect(loadPersistedState(questions)).toBeNull()
  })

  it('restores a previously saved valid state', () => {
    const state = {
      version: PERSISTENCE_SCHEMA_VERSION,
      view: 'question' as const,
      currentIndex: 2,
      answers: { Q1: 'A', Q2: 'C' } as const,
    }
    savePersistedState(state)
    expect(loadPersistedState(questions)).toEqual(state)
  })

  it('discards state from an unrecognized schema version instead of guessing', () => {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 999, currentIndex: 1, answers: { Q1: 'A' } }),
    )
    expect(loadPersistedState(questions)).toBeNull()
  })

  it('restores a completed result view when every question is answered', () => {
    const answers = Object.fromEntries(
      questions.map((q) => [q.code, q.input_type === 'Multi' ? [q.answers[0].code] : q.answers[0].code]),
    )
    const state = { version: PERSISTENCE_SCHEMA_VERSION, view: 'results' as const, currentIndex: 4, answers }
    savePersistedState(state)
    expect(loadPersistedState(questions)).toEqual(state)
  })

  it('refuses a result view with incomplete answers rather than fabricating a result', () => {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: PERSISTENCE_SCHEMA_VERSION, view: 'results', currentIndex: 4, answers: { Q1: 'A' } }),
    )
    expect(loadPersistedState(questions)).toBeNull()
  })

  it('discards version 1 state, which belonged to the earlier question set', () => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, currentIndex: 1, answers: { Q1: 'B' } }))
    expect(loadPersistedState(questions)).toBeNull()
  })

  it('keeps every selection of a multi-select question', () => {
    const state = {
      version: PERSISTENCE_SCHEMA_VERSION,
      view: 'question' as const,
      currentIndex: 3,
      answers: { Q1: 'B', Q2: 'A', Q3: ['A', 'C', 'D'] },
    }
    savePersistedState(state)
    expect(loadPersistedState(questions)).toEqual(state)
  })

  it('discards a multi-select answer saved in the wrong shape', () => {
    for (const bad of ['A', [], ['A', 'A'], ['A', 'Z']]) {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ version: PERSISTENCE_SCHEMA_VERSION, view: 'question', currentIndex: 2, answers: { Q3: bad } }),
      )
      expect(loadPersistedState(questions)).toBeNull()
    }
  })

  it('still works when storage is unavailable', () => {
    const original = Object.getOwnPropertyDescriptor(window, 'sessionStorage')
    Object.defineProperty(window, 'sessionStorage', {
      configurable: true,
      get() {
        throw new Error('blocked')
      },
    })
    expect(() =>
      savePersistedState({ version: PERSISTENCE_SCHEMA_VERSION, view: 'question', currentIndex: 0, answers: {} }),
    ).not.toThrow()
    expect(loadPersistedState(questions)).toBeNull()
    expect(() => clearPersistedState()).not.toThrow()
    Object.defineProperty(window, 'sessionStorage', original!)
  })

  it('discards corrupt JSON safely instead of throwing', () => {
    sessionStorage.setItem(STORAGE_KEY, '{not valid json::')
    expect(() => loadPersistedState(questions)).not.toThrow()
    expect(loadPersistedState(questions)).toBeNull()
  })

  it('discards a structurally invalid payload (out-of-range index)', () => {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: PERSISTENCE_SCHEMA_VERSION, view: 'question', currentIndex: 99, answers: {} }),
    )
    expect(loadPersistedState(questions)).toBeNull()
  })

  it('discards a payload with an invalid answer code (tampered data)', () => {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: PERSISTENCE_SCHEMA_VERSION,
        view: 'question',
        currentIndex: 0,
        answers: { Q1: 'Z' },
      }),
    )
    expect(loadPersistedState(questions)).toBeNull()
  })

  it('discards answers to a question that no longer exists', () => {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: PERSISTENCE_SCHEMA_VERSION,
        view: 'question',
        currentIndex: 0,
        answers: { Q1: 'A', Q99: 'A' },
      }),
    )
    expect(loadPersistedState(questions)).toBeNull()
  })

  it('clears state (simulating restart)', () => {
    savePersistedState({ version: PERSISTENCE_SCHEMA_VERSION, view: 'question', currentIndex: 1, answers: {} })
    expect(loadPersistedState(questions)).not.toBeNull()
    clearPersistedState()
    expect(loadPersistedState(questions)).toBeNull()
  })
})
