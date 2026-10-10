import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import type { AnswerCode, Question, QuestionCode } from '../lib/types'
import { ProgressSteps } from '../components/ProgressSteps'
import { QuestionOption } from '../components/QuestionOption'
import { useReducedMotion } from '../lib/useReducedMotion'

interface QuestionScreenProps {
  questions: Question[]
  currentIndex: number
  answers: Partial<Record<QuestionCode, AnswerCode>>
  onSelect: (question: QuestionCode, answer: AnswerCode) => void
  onNext: () => void
  onPrevious: () => void
  onSubmit: () => void
  onStartOver: () => void
}

const START_OVER_CONFIRM_WINDOW_MS = 3000

export function QuestionScreen({
  questions,
  currentIndex,
  answers,
  onSelect,
  onNext,
  onPrevious,
  onSubmit,
  onStartOver,
}: QuestionScreenProps) {
  const question = questions[currentIndex]
  const selected = answers[question.code]
  const isFirst = currentIndex === 0
  const isLast = currentIndex === questions.length - 1
  const prefersReducedMotion = useReducedMotion()
  const headingRef = useRef<HTMLHeadingElement>(null)
  const [confirmingStartOver, setConfirmingStartOver] = useState(false)
  const hintId = `${question.code}-continue-hint`

  // Move focus to the new question and reset scroll on every navigation —
  // prevents focus loss and disorienting scroll position when advancing.
  useEffect(() => {
    headingRef.current?.focus()
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' })
    setConfirmingStartOver(false)
    // Only question changes should trigger this, not motion preference changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex])

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      const letterIndex = 'ABCDE'.indexOf(e.key.toUpperCase())
      const numberIndex = '12345'.indexOf(e.key)
      const index = letterIndex !== -1 ? letterIndex : numberIndex
      if (index !== -1 && index < question.answers.length) {
        onSelect(question.code, question.answers[index].code)
        return
      }
      if (e.key === 'Enter' && selected) {
        if (isLast) onSubmit()
        else onNext()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [question, selected, isLast, onSelect, onNext, onSubmit])

  function handleStartOverClick() {
    if (confirmingStartOver) {
      onStartOver()
      return
    }
    setConfirmingStartOver(true)
    setTimeout(() => setConfirmingStartOver(false), START_OVER_CONFIRM_WINDOW_MS)
  }

  return (
    <div className="mx-auto max-w-2xl px-5 pt-6 sm:px-7 sm:pt-8">
      <div className="flex items-start justify-between gap-6">
        <div className="min-w-0 flex-1">
          <ProgressSteps
            questions={questions}
            currentCode={question.code}
            currentIndex={currentIndex}
          />
        </div>
        <motion.button
          layout={!prefersReducedMotion}
          type="button"
          onClick={handleStartOverClick}
          className={`btn shrink-0 gap-1.5 whitespace-nowrap rounded-md px-2.5 py-1.5 text-xs ${
            confirmingStartOver
              ? 'bg-q3-tint text-q3 hover:bg-q3-tint'
              : 'text-slate-600 hover:bg-slate-100 hover:text-navy'
          }`}
        >
          <motion.svg
            viewBox="0 0 24 24"
            fill="none"
            className="h-3.5 w-3.5 shrink-0"
            aria-hidden="true"
            animate={{ rotate: confirmingStartOver ? -75 : 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.35, ease: 'easeOut' }}
          >
            <path
              d="M3 12a9 9 0 1 0 3-6.7M3 4v4h4"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </motion.svg>
          {confirmingStartOver ? 'Click again to confirm' : 'Start Over'}
        </motion.button>
      </div>

      <motion.div
        key={question.code}
        initial={prefersReducedMotion ? false : { opacity: 0, x: 16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.25 }}
        className="mt-6"
      >
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="text-2xl font-semibold tracking-tight text-navy outline-none sm:text-3xl"
        >
          {question.title}
        </h1>

        <div
          role="radiogroup"
          aria-label={question.title}
          className="mt-5 flex flex-col gap-2.5"
        >
          {question.answers.map((answer) => (
            <QuestionOption
              key={answer.code}
              questionCode={question.code}
              answer={answer}
              selected={selected === answer.code}
              onSelect={(code) => onSelect(question.code, code)}
            />
          ))}
        </div>
      </motion.div>

      {/* Sticky at the bottom of the screen on every size (above the safe
          area on phones), with a solid background so answers never show
          through it, and Continue is always reachable without scrolling. */}
      <div className="sticky bottom-0 z-20 -mx-5 mt-6 border-t border-slate-200 bg-surface px-5 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3 sm:-mx-7 sm:px-7 sm:pb-4 shadow-[0_-8px_16px_-12px_rgba(7,29,61,0.25)]">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onPrevious}
            disabled={isFirst}
            className="btn-secondary whitespace-nowrap px-4 sm:px-7"
          >
            &larr; Previous
          </button>
          <button
            type="button"
            onClick={isLast ? onSubmit : onNext}
            disabled={!selected}
            aria-describedby={hintId}
            className="btn-primary whitespace-nowrap px-5 sm:px-7"
          >
            {isLast ? 'Submit Assessment' : 'Continue'}
          </button>
        </div>
        <p
          id={hintId}
          className={`mt-1.5 flex items-center justify-end gap-1.5 text-right text-sm font-medium ${
            selected ? 'text-q4-ink' : 'text-slate-600'
          }`}
        >
          {selected && (
            <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" aria-hidden="true">
              <path
                d="m5 12 4 4L19 6"
                stroke="currentColor"
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
          {selected ? 'Answer selected' : 'Select one answer to continue'}
        </p>
      </div>
    </div>
  )
}
