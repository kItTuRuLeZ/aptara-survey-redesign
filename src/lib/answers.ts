import type { AnswerValue, Answers, Question, Step } from './types'

/** The selected answer codes, as a list, whether the question is Single or Multi. */
export function selectedCodes(value: AnswerValue | undefined): string[] {
  if (value === undefined) return []
  return Array.isArray(value) ? value : [value]
}

export function isAnswered(question: Question, answers: Answers): boolean {
  return selectedCodes(answers[question.code]).length > 0
}

/** True when the value is a valid answer for the question, in the right shape. */
export function isValidValue(question: Question, value: unknown): value is AnswerValue {
  const known = (code: unknown) => question.answers.some((a) => a.code === code)
  if (question.input_type === 'Multi') {
    return (
      Array.isArray(value) &&
      value.length > 0 &&
      new Set(value).size === value.length &&
      value.every(known)
    )
  }
  return typeof value === 'string' && known(value)
}

/**
 * Toggles one answer of a Multi question, keeping the other selections and
 * the questionnaire's display order. Returns undefined when nothing is left.
 */
export function toggleCode(question: Question, value: AnswerValue | undefined, code: string) {
  const current = selectedCodes(value)
  const next = current.includes(code) ? current.filter((c) => c !== code) : [...current, code]
  const ordered = question.answers.map((a) => a.code).filter((c) => next.includes(c))
  return ordered.length > 0 ? ordered : undefined
}

/** Groups questions into screens by their Step number, in order. */
export function groupSteps(questions: Question[]): Step[] {
  const steps = new Map<number, Question[]>()
  for (const q of [...questions].sort((a, b) => a.display_order - b.display_order)) {
    steps.set(q.step, [...(steps.get(q.step) ?? []), q])
  }
  return [...steps.entries()]
    .sort(([a], [b]) => a - b)
    .map(([number, qs]) => {
      const heading = qs.length > 1 ? qs[0].step_heading || qs[0].name : qs[0].title
      return { number, heading, name: qs[0].step_heading || qs[0].name, questions: qs }
    })
}

/** "A", "A and B", "A, B and C". */
export function joinList(items: string[]): string {
  if (items.length <= 1) return items[0] ?? ''
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`
}
