import type { Answers } from './types'
import { content } from '../content'
import { composeResult } from './composeResult'
import { buildSummary } from './summary'

/**
 * The answers behind the landing page's example result: Developing, content
 * upkeep, self-paced eLearning, a small team with partners, and quality and
 * consistency as the goal. The example is composed by the same rules as a
 * real result, so it can't drift from them when the content changes.
 */
export const EXAMPLE_ANSWERS: Answers = { Q1: 'B', Q2: 'A', Q3: ['C'], Q4: 'B', Q5: 'B', Q6: 'C' }

const summary = buildSummary(composeResult(content, EXAMPLE_ANSWERS), content.questions, EXAMPLE_ANSWERS)
const goalQuestion = content.questions.find((q) => q.code === 'Q6')

export const EXAMPLE_RESULT = {
  title: summary.priorities[0]?.heading ?? '',
  stage: summary.stage,
  goal: summary.responses.find((r) => r.code === goalQuestion?.code)?.values.join(', ') ?? '',
  priorities: summary.priorities.map((p) => p.heading),
  next30: summary.next30,
}
