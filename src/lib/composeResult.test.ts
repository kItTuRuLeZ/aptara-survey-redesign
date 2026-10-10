import { describe, expect, it } from 'vitest'
import { composeResult, fillPlaceholders } from './composeResult'
import type { SurveyContent } from './types'

function makeContent(overrides: Partial<SurveyContent> = {}): SurveyContent {
  return {
    generated_at: '',
    includes_drafts: false,
    settings: {},
    questions: [
      {
        code: 'Q1', name: 'Maturity', title: '', supporting_text: '', landing_blurb: '',
        result_role: 'Classification', display_order: 1,
        answers: [
          { code: 'A', text: 'Just starting out', category: 'Early Stage', display_order: 1 },
          { code: 'B', text: 'Some programs', category: 'Growing', display_order: 2 },
        ],
      },
      {
        code: 'Q2', name: 'Team', title: '', supporting_text: '', landing_blurb: '',
        result_role: 'Signal', display_order: 2,
        answers: [
          { code: 'A', text: 'Just me', category: 'Single Person', display_order: 1 },
          { code: 'B', text: 'Large team', category: 'Large Team', display_order: 2 },
        ],
      },
    ],
    sections: [
      { id: 'title', label: 'Title', owner: 'Q1', required: true },
      { id: 'risk', label: 'Reduce the risk', owner: 'Q2', required: true },
    ],
    blocks: {
      title: { A: 'Building Foundations', B: 'Growing With Intent' },
      risk: { A: 'You carry everything.', B: 'Focus is the risk for a {Q2}.' },
    },
    rules: [],
    ...overrides,
  }
}

describe('composeResult', () => {
  it('assembles sections from the block for each owning answer', () => {
    const result = composeResult(makeContent(), { Q1: 'B', Q2: 'A' })
    expect(result.title).toBe('Growing With Intent')
    expect(result.classification).toBe('Growing')
    expect(result.signals).toEqual([{ code: 'Q2', label: 'Team', value: 'Single Person' }])
    expect(result.sections.find((s) => s.id === 'risk')?.text).toBe('You carry everything.')
  })

  it('fills {Q2} placeholders with the answer category', () => {
    const result = composeResult(makeContent(), { Q1: 'A', Q2: 'B' })
    expect(result.sections[1].text).toBe('Focus is the risk for a Large Team.')
  })

  it('applies only matching rules: highest Replace wins, Add rules stack around it', () => {
    const content = makeContent({
      rules: [
        { id: 'R1', when: [{ question: 'Q1', answer: 'A' }, { question: 'Q2', answer: 'A' }], section: 'risk', mode: 'Replace', text: 'Low-priority replacement.', priority: 1 },
        { id: 'R2', when: [{ question: 'Q2', answer: 'A' }], section: 'risk', mode: 'Replace', text: 'Solo and early.', priority: 5 },
        { id: 'R3', when: [{ question: 'Q1', answer: 'A' }], section: 'risk', mode: 'Add before', text: 'First,', priority: 0 },
        { id: 'R4', when: [{ question: 'Q1', answer: 'A' }], section: 'risk', mode: 'Add after', text: 'Then grow.', priority: 0 },
        { id: 'R5', when: [{ question: 'Q1', answer: 'B' }], section: 'risk', mode: 'Add after', text: 'Never shown.', priority: 9 },
      ],
    })
    const result = composeResult(content, { Q1: 'A', Q2: 'A' })
    expect(result.sections[1].text).toBe('First, Solo and early. Then grow.')
  })

  it('leaves unknown placeholders empty rather than showing braces', () => {
    expect(fillPlaceholders('A {Q9} B', makeContent(), {})).toBe('A  B')
  })
})
