import type { Question, QuestionCode } from '../lib/types'
import { questionAccent } from '../theme/tokens'

interface ProgressStepsProps {
  questions: Question[]
  currentCode: QuestionCode
  currentIndex: number
}

export function ProgressSteps({
  questions,
  currentCode,
  currentIndex,
}: ProgressStepsProps) {
  const current = questions.find((q) => q.code === currentCode)
  const accent = questionAccent(currentCode)
  const percent = Math.round(((currentIndex + 1) / questions.length) * 100)

  return (
    <div>
      <div className="flex items-center justify-between text-sm font-semibold text-slate-500">
        <span>
          Question {currentIndex + 1} of {questions.length}
        </span>
        <span style={{ color: accent.accent }}>{current?.name}</span>
        <span>{percent}%</span>
      </div>
      <div className="mt-2 h-1.5 w-full rounded-full bg-slate-200">
        <div
          className="h-1.5 rounded-full transition-all duration-300"
          style={{ width: `${percent}%`, backgroundColor: accent.accent }}
        />
      </div>
    </div>
  )
}
