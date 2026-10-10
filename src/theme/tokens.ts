import type { QuestionCode } from '../lib/types'
import { content } from '../content'

interface AccentTokens {
  accent: string
  /** Darker shade for text, AA contrast on white and the page background. */
  ink: string
  tint: string
  text: string
  bg: string
  border: string
  ring: string
}

/**
 * Accent palette, matching the color coding already used by the
 * current site's result summary cards (extracted from its rendered output).
 * Ties the wizard's answer options and the results screen chips together.
 */
const ACCENT_PALETTE: AccentTokens[] = [
  {
    accent: '#12859B',
    ink: '#0E6B7D',
    tint: '#EAF6F8',
    text: 'text-q1',
    bg: 'bg-q1-tint',
    border: 'border-q1',
    ring: 'ring-q1',
  },
  {
    accent: '#D98B16',
    ink: '#9A5B00',
    tint: '#FFF6E7',
    text: 'text-q2',
    bg: 'bg-q2-tint',
    border: 'border-q2',
    ring: 'ring-q2',
  },
  {
    accent: '#C83252',
    ink: '#B02545',
    tint: '#FFF0F3',
    text: 'text-q3',
    bg: 'bg-q3-tint',
    border: 'border-q3',
    ring: 'ring-q3',
  },
  {
    accent: '#168666',
    ink: '#11704F',
    tint: '#EDF8F4',
    text: 'text-q4',
    bg: 'bg-q4-tint',
    border: 'border-q4',
    ring: 'ring-q4',
  },
  {
    accent: '#205A9E',
    ink: '#205A9E',
    tint: '#EEF3FA',
    text: 'text-q5',
    bg: 'bg-q5-tint',
    border: 'border-q5',
    ring: 'ring-q5',
  },
]

/**
 * Questions take accents from the palette by their position in the content
 * sheet, cycling if there are more questions than colors.
 */
/** One accent per step, so questions on the same screen share a colour. */
export function questionAccent(code: QuestionCode): AccentTokens {
  const steps = [...new Set(content.questions.map((q) => q.step))].sort((a, b) => a - b)
  const step = content.questions.find((q) => q.code === code)?.step
  const index = step === undefined ? 0 : steps.indexOf(step)
  return ACCENT_PALETTE[Math.max(index, 0) % ACCENT_PALETTE.length]
}
