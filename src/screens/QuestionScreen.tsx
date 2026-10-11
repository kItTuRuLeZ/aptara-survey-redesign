import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import type { AnswerValue, Answers, Question, QuestionCode, Step } from '../lib/types'
import { ProgressSteps } from '../components/ProgressSteps'
import { QuestionOption } from '../components/QuestionOption'
import { StartOverButton } from '../components/StartOverButton'
import { useReducedMotion } from '../lib/useReducedMotion'
import { isAnswered, selectedCodes, toggleCode } from '../lib/answers'

interface QuestionScreenProps {
  steps: Step[]
  currentIndex: number
  answers: Answers
  /** Sets a question's answer; undefined clears it (e.g. the last checkbox unticked). */
  onChange: (question: QuestionCode, value: AnswerValue | undefined) => void
  onNext: () => void
  onPrevious: () => void
  onSubmit: () => void
  onStartOver: () => void
}

function hintFor(step: Step, answers: Answers): { done: boolean; text: string } {
  const done = step.questions.every((q) => isAnswered(q, answers))
  if (done) return { done, text: step.questions.length > 1 ? 'Both answered' : 'Answer selected' }
  if (step.questions.length > 1) return { done, text: 'Answer both questions to continue' }
  return {
    done,
    text: step.questions[0].input_type === 'Multi' ? 'Select at least one to continue' : 'Select one answer to continue',
  }
}

export function QuestionScreen({
  steps,
  currentIndex,
  answers,
  onChange,
  onNext,
  onPrevious,
  onSubmit,
  onStartOver,
}: QuestionScreenProps) {
  const step = steps[currentIndex]
  const isFirst = currentIndex === 0
  const isLast = currentIndex === steps.length - 1
  const prefersReducedMotion = useReducedMotion()
  const headingRef = useRef<HTMLHeadingElement>(null)
  const hint = hintFor(step, answers)
  const hintId = `step-${step.number}-continue-hint`
  const headingId = `step-${step.number}-heading`
  const single = step.questions.length === 1 ? step.questions[0] : null

  function choose(question: Question, code: string) {
    if (question.input_type === 'Multi') onChange(question.code, toggleCode(question, answers[question.code], code))
    else onChange(question.code, code)
  }

  // Move focus to the new step's heading and reset scroll on every
  // navigation — prevents focus loss and disorienting scroll position.
  useEffect(() => {
    headingRef.current?.focus()
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' })
    // Only step changes should trigger this, not motion preference changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex])

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      // Leave keys alone while a button, link or text field has focus, or a dialog is open.
      const target = e.target as HTMLElement | null
      if (document.querySelector('dialog[open]')) return
      if (target?.closest('button, a, textarea, input[type="text"], input[type="email"]')) return
      // Letter/number shortcuts only where there's a single question on screen.
      if (single) {
        const letterIndex = 'ABCDE'.indexOf(e.key.toUpperCase())
        const numberIndex = '12345'.indexOf(e.key)
        const index = letterIndex !== -1 ? letterIndex : numberIndex
        if (index !== -1 && index < single.answers.length && !e.ctrlKey && !e.metaKey && !e.altKey) {
          choose(single, single.answers[index].code)
          return
        }
      }
      if (e.key === 'Enter' && hint.done) {
        if (isLast) onSubmit()
        else onNext()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  })

  return (
    <div className="mx-auto max-w-2xl px-5 pt-6 sm:px-7 sm:pt-8">
      <div className="flex items-start justify-between gap-6">
        <div className="min-w-0 flex-1">
          <ProgressSteps
            total={steps.length}
            currentIndex={currentIndex}
            name={step.name}
            accentCode={step.questions[0].code}
          />
        </div>
        <StartOverButton
          hasProgress={Object.keys(answers).length > 0}
          onConfirm={onStartOver}
          className="btn min-h-11 shrink-0 gap-1.5 whitespace-nowrap rounded-md px-2.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 hover:text-navy"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5 shrink-0" aria-hidden="true">
            <path
              d="M3 12a9 9 0 1 0 3-6.7M3 4v4h4"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Start over
        </StartOverButton>
      </div>

      <motion.div
        key={step.number}
        initial={prefersReducedMotion ? false : { opacity: 0, x: 16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.25 }}
        className="mt-6"
      >
        <h1
          id={headingId}
          ref={headingRef}
          tabIndex={-1}
          className="text-2xl font-semibold tracking-tight text-navy outline-none sm:text-3xl"
        >
          {step.heading}
        </h1>

        {step.questions.map((question) => {
          const multi = question.input_type === 'Multi'
          const helpId = `${question.code}-help`
          const codes = selectedCodes(answers[question.code])
          return (
            <fieldset
              key={question.code}
              aria-labelledby={single ? headingId : undefined}
              aria-describedby={multi ? helpId : undefined}
              className="mt-5 border-0 p-0"
            >
              {!single && (
                <legend className="mt-3 text-lg font-semibold text-navy">{question.title}</legend>
              )}
              {multi && (
                <p id={helpId} className="mt-1 text-base text-slate-600">
                  Select all that apply.
                </p>
              )}
              <div className="mt-3 flex flex-col gap-2.5">
                {question.answers.map((answer) => (
                  <QuestionOption
                    key={answer.code}
                    questionCode={question.code}
                    answer={answer}
                    type={multi ? 'checkbox' : 'radio'}
                    selected={codes.includes(answer.code)}
                    onSelect={(code) => choose(question, code)}
                  />
                ))}
              </div>
            </fieldset>
          )
        })}
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
            className="btn-secondary min-h-11 whitespace-nowrap px-4 sm:px-7"
          >
            &larr; Previous
          </button>
          <button
            type="button"
            onClick={isLast ? onSubmit : onNext}
            disabled={!hint.done}
            aria-describedby={hintId}
            className="btn-primary min-h-11 whitespace-nowrap px-5 sm:px-7"
          >
            {isLast ? 'See my result' : 'Continue'}
          </button>
        </div>
        <p
          id={hintId}
          className={`mt-1.5 flex items-center justify-end gap-1.5 text-right text-sm font-medium ${
            hint.done ? 'text-q4-ink' : 'text-slate-600'
          }`}
        >
          {hint.done && (
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
          {hint.text}
        </p>
      </div>
    </div>
  )
}
