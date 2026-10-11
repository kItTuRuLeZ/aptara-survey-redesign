import { useEffect, useMemo, useState } from 'react'
import { Header } from './components/Header'
import { Footer } from './components/Footer'
import { LandingScreen } from './screens/LandingScreen'
import { QuestionScreen } from './screens/QuestionScreen'
import { ProcessingScreen } from './screens/ProcessingScreen'
import { ResultsScreen } from './screens/ResultsScreen'
import { getQuestions, submitAssessment } from './lib/localAssessment'
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

function App() {
  const [screen, setScreen] = useState<Screen>('landing')
  const [questions, setQuestions] = useState<Question[]>([])
  const [questionsError, setQuestionsError] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Answers>({})
  const [result, setResult] = useState<AssessmentResult | null>(null)
  const [submitError, setSubmitError] = useState('')
  const [isNavigating, setIsNavigating] = useState(false)

  const steps = useMemo(() => groupSteps(questions), [questions])

  const mockKey = useMemo(
    () => new URLSearchParams(window.location.search).get('mock'),
    [],
  )

  useEffect(() => {
    getQuestions()
      .then((res) => setQuestions(res.questions))
      .catch(() => setQuestionsError('Unable to load assessment questions.'))
  }, [])

  // After a refresh in the same tab, return to the question or the result
  // the visitor was on. A result is recomposed from the validated answers,
  // never read back from storage.
  useEffect(() => {
    if (mockKey || questions.length === 0) return
    const saved = loadPersistedState(questions)
    if (!saved || Object.keys(saved.answers).length === 0) return
    setAnswers(saved.answers)
    setCurrentIndex(saved.currentIndex)
    if (saved.view === 'results') {
      setResult(composeResult(content, saved.answers))
      setScreen('results')
    } else {
      setScreen('question')
    }
  }, [mockKey, questions])

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

  // Shortcut: ?mock=A-B-A+C-B-B-A jumps straight to the result for those
  // answers (one entry per question, in order; join several selections of a
  // select-all question with +), for reviewing result content quickly.
  useEffect(() => {
    if (!mockKey || questions.length === 0) return
    const entries = mockKey.split('-')
    if (entries.length !== questions.length) return
    const mockAnswers: Answers = {}
    for (const [i, q] of questions.entries()) {
      const value = q.input_type === 'Multi' ? entries[i].split('+') : entries[i]
      if (!isValidValue(q, value)) return
      mockAnswers[q.code] = value
    }
    setAnswers(mockAnswers)
    setResult(composeResult(content, mockAnswers))
    setScreen('results')
  }, [mockKey, questions])

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
        {questionsError && (
          <p className="mx-auto mt-10 max-w-md text-center text-sm text-q3">
            {questionsError}
          </p>
        )}

        {!questionsError && screen === 'landing' && (
          <LandingScreen onStart={handleStart} />
        )}

        {!questionsError && screen === 'question' && steps.length > 0 && (
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

        {!questionsError && screen === 'processing' && <ProcessingScreen />}

        {!questionsError && screen === 'results' && result && (
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
