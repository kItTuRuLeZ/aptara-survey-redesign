import type { AnswerCode, Question, QuestionCode } from '../lib/types'
import { questionAccent } from '../theme/tokens'

interface AnswerChipStripProps {
  questions: Question[]
  answers: Partial<Record<QuestionCode, AnswerCode>>
}

export function AnswerChipStrip({ questions, answers }: AnswerChipStripProps) {
  return (
    <div className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white sm:grid sm:grid-cols-2 sm:divide-y-0 sm:divide-x">
      {questions.map((q) => {
        const answerCode = answers[q.code]
        const answer = q.answers.find((a) => a.code === answerCode)
        if (!answer) return null
        const accent = questionAccent(q.code)

        return (
          <div key={q.code} className="flex items-start gap-3 px-5 py-4">
            <span
              className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: accent.accent }}
              aria-hidden="true"
            />
            <div className="min-w-0">
              <p
                className="text-xs font-bold uppercase tracking-wide"
                style={{ color: accent.accent }}
              >
                {q.code} &middot; {q.name}
              </p>
              <p className="mt-1 text-base font-medium text-navy">{answer.text}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
