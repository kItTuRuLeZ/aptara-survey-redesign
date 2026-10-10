import type { Answers, AssessmentResult, Question } from './types'
import { selectedCodes } from './answers'
import { setting } from '../content'

export interface SummaryResponse {
  code: string
  label: string
  /** Short labels of every selection, e.g. "In-person ILT and Self-paced eLearning". */
  values: string[]
  /** Full answer texts, in the same order. */
  texts: string[]
}

export interface SummaryPriority {
  id: string
  heading: string
  text: string
  why: string
}

/**
 * One structured summary of a result. The results page, the copied text and
 * the printed page are all built from it, so they always agree.
 */
export interface ResultSummary {
  title: string
  scope: string
  stage: string
  situation: string
  priorities: SummaryPriority[]
  context: Array<{ id: string; label: string; text: string }>
  next30: string
  next90: string
  responses: SummaryResponse[]
  methodology: string
}

const PRIORITY_SECTIONS = ['priority_challenge', 'priority_goal', 'priority_process']

export function buildSummary(
  result: AssessmentResult,
  questions: Question[],
  answers: Answers,
): ResultSummary {
  const section = (id: string) => result.sections.find((s) => s.id === id)
  const text = (id: string) => section(id)?.text ?? ''

  // Team and sourcing read as one paragraph under one label.
  const capacity = [text('team'), text('sourcing')].filter(Boolean).join(' ')
  const context = [
    { id: 'delivery', label: section('delivery')?.label ?? 'Your delivery mix', text: text('delivery') },
    { id: 'capacity', label: section('team')?.label ?? 'Your team and capacity', text: capacity },
  ].filter((c) => c.text)

  return {
    title: result.title,
    scope: setting('result_scope'),
    stage: result.classification,
    situation: text('situation'),
    priorities: PRIORITY_SECTIONS.map(section)
      .filter((s): s is NonNullable<typeof s> => Boolean(s?.text))
      .map((s) => ({ id: s.id, heading: s.heading || s.label, text: s.text, why: s.why })),
    context,
    next30: text('next30'),
    next90: text('next90'),
    responses: questions
      .map((q) => {
        const codes = selectedCodes(answers[q.code])
        const picked = q.answers.filter((a) => codes.includes(a.code))
        return {
          code: q.code,
          label: q.name,
          values: picked.map((a) => a.category),
          texts: picked.map((a) => a.text),
        }
      })
      .filter((r) => r.values.length > 0),
    methodology: setting('result_methodology'),
  }
}

/** Plain text for the clipboard: readable when pasted into an email or document. */
export function summaryToText(summary: ResultSummary): string {
  const lines: string[] = [summary.title]
  if (summary.scope) lines.push(summary.scope)
  lines.push('', `Maturity stage (self-reported): ${summary.stage}`, summary.situation, '', 'TOP PRIORITIES')
  summary.priorities.forEach((p, i) => {
    lines.push(`${i + 1}. ${p.heading}`, `   ${p.text}`)
    if (p.why) lines.push(`   Why this matters for you: ${p.why}`)
  })
  for (const c of summary.context) lines.push('', c.label.toUpperCase(), c.text)
  lines.push('', 'WHAT TO DO NEXT', `Next 30 days: ${summary.next30}`, `Next 90 days: ${summary.next90}`)
  lines.push('', 'YOUR RESPONSES')
  for (const r of summary.responses) lines.push(`${r.label}: ${r.values.join(', ')}`)
  if (summary.methodology) lines.push('', summary.methodology)
  return lines.join('\n')
}
