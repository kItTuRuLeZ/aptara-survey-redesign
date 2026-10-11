import type {
  Answers,
  AssessmentResult,
  ContentBlock,
  ContentRule,
  Question,
  QuestionCode,
  ResultSection,
  SurveyContent,
} from './types'
import { joinList, selectedCodes } from './answers'

function questionFor(content: SurveyContent, code: QuestionCode): Question | undefined {
  return content.questions.find((q) => q.code === code)
}

function chosen(content: SurveyContent, answers: Answers, code: QuestionCode) {
  const question = questionFor(content, code)
  const codes = selectedCodes(answers[code])
  return question?.answers.filter((a) => codes.includes(a.code)) ?? []
}

/**
 * Replaces {Q1} with the chosen answer's category (a list, for a Multi
 * question) and {Q1.text} with the full answer text.
 */
export function fillPlaceholders(text: string, content: SurveyContent, answers: Answers): string {
  return text.replace(/\{([A-Za-z0-9_]+)(\.text)?\}/g, (_, code: string, isText?: string) => {
    const picked = chosen(content, answers, code)
    return isText ? picked.map((a) => a.text).join(' ') : joinList(picked.map((a) => a.category))
  })
}

function matches(rule: ContentRule, answers: Answers): boolean {
  return rule.when.every((c) => selectedCodes(answers[c.question]).includes(c.answer))
}

const byPriority = (a: ContentRule, b: ContentRule) => b.priority - a.priority

/** The block for this section: the one answer's block, or MULTI when several are selected. */
function baseBlock(content: SurveyContent, sectionId: string, codes: string[]): ContentBlock | undefined {
  if (codes.length === 0) return undefined
  const key = codes.length > 1 ? 'MULTI' : codes[0]
  return content.blocks[sectionId]?.[key]
}

/** The highest-priority rule, or the first in sheet order on a tie. */
function top(rules: ContentRule[]): ContentRule | undefined {
  return [...rules].sort(byPriority)[0]
}

type Draft = ResultSection & { action?: string }

/**
 * Priority cards that share a central action are shown once: the later card
 * is dropped and its section's merge note is added to the earlier card's
 * reason, so the visitor still sees why it fits both answers. Sections are
 * in sheet order, so the main challenge wins over the goal, and both over
 * the stage-based card.
 */
function mergeSharedActions(
  drafts: Draft[],
  content: SurveyContent,
  answers: Answers,
): ResultSection[] {
  const kept = new Map<string, Draft>()
  const out: Draft[] = []
  for (const d of drafts) {
    const first = d.action ? kept.get(d.action) : undefined
    if (!first) {
      if (d.action) kept.set(d.action, d)
      out.push(d)
      continue
    }
    const note = content.sections.find((x) => x.id === d.id)?.merge_note ?? ''
    if (note) first.why = [first.why, fillPlaceholders(note, content, answers)].filter(Boolean).join(' ')
  }
  return out.map(({ action: _action, ...section }) => section)
}

/**
 * Assembles a result from the content sheet: each section starts with the
 * block written for the person's answer to that section's owning question,
 * then matching combination rules hide it, replace it, or add text
 * before/after. Of several matching rules with the same mode, only the
 * highest-priority one applies. Priority cards with the same action are
 * then merged. Nothing is stored or generated: the same answers always give
 * the same result.
 */
export function composeResult(content: SurveyContent, answers: Answers): AssessmentResult {
  const drafts = content.sections.flatMap((section): Draft[] => {
    const rules = content.rules.filter((r) => r.section === section.id && matches(r, answers))
    if (rules.some((r) => r.mode === 'Remove')) return []

    const block = baseBlock(content, section.id, selectedCodes(answers[section.owner]))
    let { heading, text, why } = block ?? { heading: '', text: '', why: '' }

    const replace = top(rules.filter((r) => r.mode === 'Replace'))
    if (replace) {
      text = replace.text
      heading = replace.heading || heading
      why = replace.why || why
    }
    const before = top(rules.filter((r) => r.mode === 'Add before'))
    const after = top(rules.filter((r) => r.mode === 'Add after'))
    text = [before?.text, text, after?.text].filter(Boolean).join(' ')

    const fill = (t: string) => fillPlaceholders(t, content, answers)
    return [
      {
        id: section.id,
        label: section.label,
        heading: fill(heading),
        text: fill(text),
        why: fill(why),
        action: block?.action,
      },
    ]
  })
  const sections = mergeSharedActions(drafts, content, answers)

  const classifier = content.questions.find((q) => q.result_role === 'Classification')
  const categories = (code: QuestionCode) => joinList(chosen(content, answers, code).map((a) => a.category))

  return {
    title: sections.find((s) => s.id === 'title')?.text ?? '',
    classification: classifier ? categories(classifier.code) : '',
    signals: content.questions
      .filter((q) => q.result_role === 'Signal')
      .map((q) => ({ code: q.code, label: q.name, value: categories(q.code) })),
    sections,
  }
}
