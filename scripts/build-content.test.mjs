import { describe, expect, it } from 'vitest'
import { buildContent, parseCondition, parseCsv, toRecords } from './build-content.mjs'

const APPROVED = { publishable: new Set(['Approved']) }

function baseTabs() {
  return {
    Settings: [{ Key: 'survey_title', Value: 'L&D Assessment', Status: 'Approved' }],
    Questions: [
      { Order: '1', 'Question code': 'Q1', 'Short name': 'Maturity', Question: 'Where are you?', 'Helper text (internal)': '', 'Result role': 'Classification', Status: 'Approved' },
      { Order: '2', 'Question code': 'Q2', 'Short name': 'Pain', Question: 'What hurts?', 'Helper text (internal)': '', 'Result role': 'Signal', Status: 'Approved' },
    ],
    Answers: [
      { 'Question code': 'Q1', 'Answer code': 'A', Order: '1', 'Category (short label)': 'Early', 'Answer text': 'Early', Status: 'Approved' },
      { 'Question code': 'Q1', 'Answer code': 'B', Order: '2', 'Category (short label)': 'Growing', 'Answer text': 'Growing', Status: 'Approved' },
      { 'Question code': 'Q2', 'Answer code': 'A', Order: '1', 'Category (short label)': 'Onboarding', 'Answer text': 'Onboarding', Status: 'Approved' },
      { 'Question code': 'Q2', 'Answer code': 'B', Order: '2', 'Category (short label)': 'Compliance', 'Answer text': 'Compliance', Status: 'Approved' },
    ],
    Sections: [
      { Section: 'title', 'Label on result page': 'Title', 'Written by question': 'Q1', 'Max characters': '20', Required: 'Yes' },
    ],
    'Result Blocks': [
      { Section: 'title', 'Question code': 'Q1', 'Answer code': 'A', Text: 'Foundations', Status: 'Approved' },
      { Section: 'title', 'Question code': 'Q1', 'Answer code': 'B', Text: 'Growing {Q2}', Status: 'Approved' },
    ],
    Rules: [],
  }
}

describe('parseCsv / toRecords', () => {
  it('handles quotes, commas, newlines and a guidance row above the headers', () => {
    const csv = 'Guidance text,,\nKey,Value,Status\nhello,"a, ""quoted""\nvalue",Approved\n'
    expect(toRecords(parseCsv(csv), 'Key')).toEqual([
      { Key: 'hello', Value: 'a, "quoted"\nvalue', Status: 'Approved' },
    ])
  })
})

describe('parseCondition', () => {
  it('reads AND-joined pairs and rejects malformed ones', () => {
    expect(parseCondition('Q1=A AND q4 = B')).toEqual([
      { question: 'Q1', answer: 'A' },
      { question: 'q4', answer: 'B' },
    ])
    expect(parseCondition('Q1 is A')).toEqual([null])
  })
})

describe('buildContent', () => {
  it('builds clean content with no problems', () => {
    const { problems, content } = buildContent(baseTabs(), APPROVED)
    expect(problems).toEqual([])
    expect(content.questions.map((q) => q.code)).toEqual(['Q1', 'Q2'])
    expect(content.blocks.title).toEqual({ A: 'Foundations', B: 'Growing {Q2}' })
  })

  it('ignores drafts unless asked, and reports the missing approved block', () => {
    const tabs = baseTabs()
    tabs['Result Blocks'][1].Status = 'In review'
    expect(buildContent(tabs, APPROVED).problems).toEqual([
      'Result Blocks: no approved "title" text for Q1-B.',
    ])
    expect(buildContent(tabs, { publishable: new Set(['Approved', 'In review']) }).problems).toEqual([])
  })

  it('flags text over the section limit, bad placeholders and bad rules', () => {
    const tabs = baseTabs()
    tabs['Result Blocks'][0].Text = 'This title is far too long {Q9}'
    tabs.Rules = [
      { 'Rule ID': 'R1', 'When (all must match)': 'Q1=Z', Section: 'title', Mode: 'Swap', Text: 'x', Priority: '1', Status: 'Approved' },
    ]
    const { problems } = buildContent(tabs, APPROVED)
    expect(problems).toEqual(
      expect.arrayContaining([
        'Result Blocks: title for Q1-A: 31 characters, limit is 20.',
        'Result Blocks: title for Q1-A: placeholder {Q9} refers to an unknown question.',
        'Rules: R1: Q1 has no answer Z.',
        'Rules: R1: Mode must be one of Replace, Add before, Add after.',
      ]),
    )
  })

  it('requires exactly one classification question', () => {
    const tabs = baseTabs()
    tabs.Questions[1]['Result role'] = 'Classification'
    expect(buildContent(tabs, APPROVED).problems).toContain(
      'Questions: exactly one question must have Result role "Classification" (found 2).',
    )
  })
})
