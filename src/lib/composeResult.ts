import type {
  Answers,
  AssessmentResult,
  ContentRule,
  QuestionCode,
  SurveyContent,
} from './types'

function answerFor(content: SurveyContent, answers: Answers, code: QuestionCode) {
  const question = content.questions.find((q) => q.code === code)
  return question?.answers.find((a) => a.code === answers[code])
}

/** Replaces {Q1} with the answer's category and {Q1.text} with its full text. */
export function fillPlaceholders(text: string, content: SurveyContent, answers: Answers): string {
  return text.replace(/\{([A-Za-z0-9_]+)(\.text)?\}/g, (_, code: string, isText?: string) => {
    const answer = answerFor(content, answers, code)
    if (!answer) return ''
    return isText ? answer.text : answer.category
  })
}

function matches(rule: ContentRule, answers: Answers): boolean {
  return rule.when.every((c) => answers[c.question] === c.answer)
}

const byPriority = (a: ContentRule, b: ContentRule) => b.priority - a.priority

/**
 * Assembles a result from the content sheet: each section starts with the
 * block written for the person's answer to that section's owning question,
 * then any matching combination rules replace it or add text before/after.
 * The highest-priority Replace rule wins; Add rules stack in priority order.
 */
export function composeResult(content: SurveyContent, answers: Answers): AssessmentResult {
  const sections = content.sections.map((section) => {
    const owned = answers[section.owner]
    let base = owned ? (content.blocks[section.id]?.[owned] ?? '') : ''

    const rules = content.rules.filter((r) => r.section === section.id && matches(r, answers))
    const replace = rules.filter((r) => r.mode === 'Replace').sort(byPriority)[0]
    if (replace) base = replace.text
    const before = rules.filter((r) => r.mode === 'Add before').sort(byPriority)
    const after = rules.filter((r) => r.mode === 'Add after').sort(byPriority)

    const text = [...before.map((r) => r.text), base, ...after.map((r) => r.text)]
      .filter(Boolean)
      .map((t) => fillPlaceholders(t, content, answers))
      .join(' ')

    return { id: section.id, label: section.label, text }
  })

  const classifier = content.questions.find((q) => q.result_role === 'Classification')

  return {
    title: sections.find((s) => s.id === 'title')?.text ?? '',
    classification: classifier ? (answerFor(content, answers, classifier.code)?.category ?? '') : '',
    signals: content.questions
      .filter((q) => q.result_role === 'Signal')
      .map((q) => ({
        code: q.code,
        label: q.name,
        value: answerFor(content, answers, q.code)?.category ?? '',
      })),
    sections,
  }
}
