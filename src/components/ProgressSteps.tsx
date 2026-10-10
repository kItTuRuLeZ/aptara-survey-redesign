import type { QuestionCode } from '../lib/types'
import { questionAccent } from '../theme/tokens'

interface ProgressStepsProps {
  /** Number of steps (screens), not questions. */
  total: number
  currentIndex: number
  /** Short name of the current step. */
  name: string
  /** A question on the current step, for its accent colour. */
  accentCode: QuestionCode
}

/**
 * One line of progress text plus a bar. The bar shows steps completed
 * before this one, so the last step doesn't read as already complete.
 */
export function ProgressSteps({ total, currentIndex, name, accentCode }: ProgressStepsProps) {
  const accent = questionAccent(accentCode)
  const isLast = currentIndex === total - 1
  const percent = Math.round((currentIndex / total) * 100)
  const label = isLast ? 'Final step' : `Step ${currentIndex + 1} of ${total}`

  return (
    <div>
      <p className="text-sm font-semibold text-slate-600">
        {label}
        <span aria-hidden="true"> &middot; </span>
        <span className="sr-only">: </span>
        {name}
      </p>
      <div
        role="progressbar"
        aria-label="Assessment progress"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={currentIndex}
        aria-valuetext={`${currentIndex} of ${total} steps complete`}
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
