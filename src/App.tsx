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
import type { AnswerCode, Answers, AssessmentResult, Question, QuestionCode } from './lib/types'
import { content } from './content'
import { composeResult } from './lib/composeResult'

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

  const mockKey = useMemo(
    () => new URLSearchParams(window.location.search).get('mock'),
    [],
  )

  useEffect(() => {
    getQuestions()
      .then((res) => setQuestions(res.questions))
      .catch(() => setQuestionsError('Unable to load assessment questions.'))
  }, [])

  // Resume an in-progress assessment (answers + position) after a refresh
  // or a closed/reopened tab, once the question set has loaded.
  useEffect(() => {
    if (mockKey || questions.length === 0) return
    const saved = loadPersistedState(questions)
    if (!saved || Object.keys(saved.answers).length === 0) return
    setAnswers(saved.answers)
    setCurrentIndex(saved.currentIndex)
    setScreen('question')
  }, [mockKey, questions])

  // Persist answers/position while the assessment is in progress.
  useEffect(() => {
    if (screen !== 'question') return
    savePersistedState({
      version: PERSISTENCE_SCHEMA_VERSION,
      currentIndex,
      answers,
    })
  }, [screen, currentIndex, answers])

  // Shortcut: ?mock=A-B-B-A-A jumps straight to the result for those answers
  // (one code per question, in order), for reviewing result content quickly.
  useEffect(() => {
    if (!mockKey || questions.length === 0) return
    const codes = mockKey.split('-')
    if (codes.length !== questions.length) return
    const mockAnswers: Answers = {}
    for (const [i, q] of questions.entries()) {
      if (!q.answers.some((a) => a.code === codes[i])) return
      mockAnswers[q.code] = codes[i]
    }
    setAnswers(mockAnswers)
    setResult(composeResult(content, mockAnswers))
    setScreen('results')
  }, [mockKey, questions])

  function handleStart() {
    if (questions.length > 0) setScreen('question')
  }

  function handleSelect(question: QuestionCode, answer: AnswerCode) {
    setAnswers((prev) => ({ ...prev, [question]: answer }))
  }

  function handleNext() {
    if (isNavigating) return
    setCurrentIndex((i) => Math.min(i + 1, questions.length - 1))
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
      clearPersistedState()
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

        {!questionsError && screen === 'question' && questions.length > 0 && (
          <>
            <QuestionScreen
              questions={questions}
              currentIndex={currentIndex}
              answers={answers}
              onSelect={handleSelect}
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
