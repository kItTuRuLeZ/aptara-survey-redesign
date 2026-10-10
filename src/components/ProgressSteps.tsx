import type { Question, QuestionCode } from '../lib/types'
import { questionAccent } from '../theme/tokens'

interface ProgressStepsProps {
  questions: Question[]
  currentCode: QuestionCode
  currentIndex: number
}

/**
 * One line of progress text plus a bar. The bar shows questions answered
 * before this one, so the last question doesn't read as already complete.
 */
export function ProgressSteps({
  questions,
  currentCode,
  currentIndex,
}: ProgressStepsProps) {
  const current = questions.find((q) => q.code === currentCode)
  const accent = questionAccent(currentCode)
  const total = questions.length
  const isLast = currentIndex === total - 1
  const percent = Math.round((currentIndex / total) * 100)
  const label = isLast ? 'Final question' : `Question ${currentIndex + 1} of ${total}`

  return (
    <div>
      <p className="text-sm font-semibold text-slate-600">
        {label}
        {current && (
          <>
            <span aria-hidden="true"> &middot; </span>
            <span className="sr-only">: </span>
            {current.name}
          </>
        )}
      </p>
      <div
        role="progressbar"
        aria-label="Assessment progress"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={currentIndex}
        aria-valuetext={`${currentIndex} of ${total} questions answered`}
        className="mt-2 h-1.5 w-full rounded-full bg-slate-200"
      >
        <div
          className="h-1.5 rounded-full transition-all duration-300"
          style={{ width: `${Math.max(percent, 4)}%`, backgroundColor: accent.accent }}
        />
      </div>
    </div>
  )
}
