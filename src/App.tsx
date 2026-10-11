import { useEffect, useMemo, useState } from 'react'
import { Header } from './components/Header'
import { Footer } from './components/Footer'
import { LandingScreen } from './screens/LandingScreen'
import { QuestionScreen } from './screens/QuestionScreen'
import { ProcessingScreen } from './screens/ProcessingScreen'
import { ResultsScreen } from './screens/ResultsScreen'
import { submitAssessment } from './lib/localAssessment'
import {
  clearPersistedState,
  loadPersistedState,
  savePersistedState,
  PERSISTENCE_SCHEMA_VERSION,
} from './lib/persistence'
import type { AnswerValue, Answers, AssessmentResult, Question, QuestionCode } from './lib/types'
import { content } from './content'
import { composeResult } from './lib/composeResult'
import { groupSteps, isValidValue } from './lib/answers'

type Screen = 'landing' | 'question' | 'processing' | 'results'

// Questions ship with the page, so the first render can already show the
// right screen; there is nothing to load.
const QUESTIONS: Question[] = content.questions

interface InitialState {
  screen: Screen
  currentIndex: number
  answers: Answers
  result: AssessmentResult | null
}

/**
 * Shortcut: ?mock=A-B-A+C-B-B-A opens the result for those answers (one
 * entry per question, in order; join several selections of a select-all
 * question with +), for reviewing result content quickly.
 */
function mockAnswers(mockKey: string): Answers | null {
  const entries = mockKey.split('-')
  if (entries.length !== QUESTIONS.length) return null
  const answers: Answers = {}
  for (const [i, q] of QUESTIONS.entries()) {
    const value = q.input_type === 'Multi' ? entries[i].split('+') : entries[i]
    if (!isValidValue(q, value)) return null
    answers[q.code] = value
  }
  return answers
}

/**
 * Decides the first screen before anything renders, so a refresh returns
 * straight to the question or result the visitor was on, with no flash of
 * the landing page. A result is recomposed from the validated answers, never
 * read back from storage.
 */
function initialState(mockKey: string | null): InitialState {
  const empty: InitialState = { screen: 'landing', currentIndex: 0, answers: {}, result: null }
  if (mockKey) {
    const answers = mockAnswers(mockKey)
    return answers ? { ...empty, screen: 'results', answers, result: composeResult(content, answers) } : empty
  }
  const saved = loadPersistedState(QUESTIONS)
  if (!saved || Object.keys(saved.answers).length === 0) return empty
  if (saved.view === 'results') {
    return {
      screen: 'results',
      currentIndex: saved.currentIndex,
      answers: saved.answers,
      result: composeResult(content, saved.answers),
    }
  }
  return { ...empty, screen: 'question', currentIndex: saved.currentIndex, answers: saved.answers }
}

function App() {
  const [mockKey] = useState(() => new URLSearchParams(window.location.search).get('mock'))
  const [initial] = useState(() => initialState(mockKey))
  const [screen, setScreen] = useState<Screen>(initial.screen)
  const questions = QUESTIONS
  const [currentIndex, setCurrentIndex] = useState(initial.currentIndex)
  const [answers, setAnswers] = useState<Answers>(initial.answers)
  const [result, setResult] = useState<AssessmentResult | null>(initial.result)
  const [submitError, setSubmitError] = useState('')
  const [isNavigating, setIsNavigating] = useState(false)

  const steps = useMemo(() => groupSteps(questions), [questions])

  // Persist answers, position and view while on a question or the result.
  useEffect(() => {
    if (mockKey) return
    if (screen !== 'question' && screen !== 'results') return
    savePersistedState({
      version: PERSISTENCE_SCHEMA_VERSION,
      view: screen,
      currentIndex,
      answers,
    })
  }, [mockKey, screen, currentIndex, answers])

  function handleStart() {
    if (questions.length > 0) setScreen('question')
  }

  function handleChange(question: QuestionCode, value: AnswerValue | undefined) {
    setAnswers((prev) => {
      const next = { ...prev }
      if (value === undefined) delete next[question]
      else next[question] = value
      return next
    })
  }

  function handleNext() {
    if (isNavigating) return
    setCurrentIndex((i) => Math.min(i + 1, steps.length - 1))
  }

  function handlePrevious() {
    if (isNavigating) return
    setCurrentIndex((i) => Math.max(i - 1, 0))
  }

  async function handleSubmit() {
    if (isNavigating) return
    setIsNavigating(true)
    setScreen('processing')
    setSubmitError('')
    const [res] = await Promise.all([
      submitAssessment(answers),
      new Promise((resolve) => setTimeout(resolve, 700)),
    ])
      .catch((err) => {
        setSubmitError('Something went wrong preparing your result. Please try again.')
        setScreen('question')
        throw err
      })
      .finally(() => setIsNavigating(false))

    if (res) {
      setResult(res)
      setScreen('results')
    }
  }

  function handleRestart() {
    // Drop the ?mock= review shortcut so a refresh doesn't jump back to it.
    if (mockKey) window.history.replaceState(null, '', window.location.pathname)
    setAnswers({})
    setCurrentIndex(0)
    setResult(null)
    setSubmitError('')
    setScreen('landing')
    clearPersistedState()
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header compact={screen === 'question' || screen === 'processing'} />
      <main className="flex-1">
        {screen === 'landing' && (
          <LandingScreen onStart={handleStart} />
        )}

        {screen === 'question' && steps.length > 0 && (
          <>
            <QuestionScreen
              steps={steps}
              currentIndex={currentIndex}
              answers={answers}
              onChange={handleChange}
              onNext={handleNext}
              onPrevious={handlePrevious}
              onSubmit={handleSubmit}
              onStartOver={handleRestart}
            />
            {submitError && (
              <p className="mx-auto -mt-4 max-w-2xl px-5 text-center text-sm text-q3">
                {submitError}
              </p>
            )}
          </>
        )}

        {screen === 'processing' && <ProcessingScreen />}

        {screen === 'results' && result && (
          <ResultsScreen
            result={result}
            questions={questions}
            answers={answers}
            onRestart={handleRestart}
          />
        )}
      </main>
      <Footer />
    </div>
  )
}

export default App
