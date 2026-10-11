import { describe, expect, it } from 'vitest'
import { composeResult, fillPlaceholders } from './composeResult'
import { content } from '../content'
import type { Answers, ContentRule, Question, SurveyContent } from './types'

// ------------------------------------------------------------ engine (fixture)

const q = (code: string, input_type: 'Single' | 'Multi', role: Question['result_role'], step: number): Question => ({
  code,
  name: `${code} name`,
  title: `${code} title`,
  supporting_text: '',
  landing_blurb: '',
  result_role: role,
  input_type,
  step,
  step_heading: '',
  display_order: step,
  answers: ['A', 'B', 'C'].map((a, i) => ({ code: a, text: `${code}${a} text`, category: `${code}${a}`, display_order: i })),
})

const block = (text: string, heading = '', why = '') => ({ heading, text, why })
const rule = (r: Partial<ContentRule> & Pick<ContentRule, 'id' | 'when' | 'section' | 'mode'>): ContentRule => ({
  heading: '',
  text: '',
  why: '',
  priority: 0,
  ...r,
})

const fixture: SurveyContent = {
  generated_at: '',
  includes_drafts: false,
  settings: {},
  questions: [q('Q1', 'Single', 'Classification', 1), q('Q2', 'Multi', 'Signal', 2)],
  sections: [
    { id: 'title', label: 'Title', owner: 'Q1', required: true },
    { id: 'mix', label: 'Mix', owner: 'Q2', required: true },
    { id: 'extra', label: 'Extra', owner: 'Q1', required: true },
  ],
  blocks: {
    title: { A: block('Title A', 'Head A', 'Why A'), B: block('Title B'), C: block('Title C') },
    mix: { A: block('Only A'), B: block('Only B'), C: block('Only C'), MULTI: block('Several: {Q2}') },
    extra: { A: block('Extra A'), B: block('Extra B'), C: block('Extra C') },
  },
  rules: [],
}

describe('composeResult engine', () => {
  it('uses the single answer block, with heading and why', () => {
    const r = composeResult(fixture, { Q1: 'A', Q2: ['B'] })
    expect(r.title).toBe('Title A')
    expect(r.sections.find((s) => s.id === 'title')).toMatchObject({ heading: 'Head A', why: 'Why A' })
    expect(r.sections.find((s) => s.id === 'mix')?.text).toBe('Only B')
    expect(r.classification).toBe('Q1A')
  })

  it('uses the MULTI block and lists every selection when several are chosen', () => {
    const r = composeResult(fixture, { Q1: 'A', Q2: ['A', 'C'] })
    expect(r.sections.find((s) => s.id === 'mix')?.text).toBe('Several: Q2A and Q2C')
    expect(r.signals).toEqual([{ code: 'Q2', label: 'Q2 name', value: 'Q2A and Q2C' }])
  })

  it('matches a multi-select condition when the answer is among the selections', () => {
    const c = { ...fixture, rules: [rule({ id: 'R', when: [{ question: 'Q2', answer: 'C' }], section: 'extra', mode: 'Add after', text: 'Has C.' })] }
    expect(composeResult(c, { Q1: 'A', Q2: ['A', 'C'] }).sections.find((s) => s.id === 'extra')?.text).toBe('Extra A Has C.')
    expect(composeResult(c, { Q1: 'A', Q2: ['A', 'B'] }).sections.find((s) => s.id === 'extra')?.text).toBe('Extra A')
  })

  it('applies the highest-priority Replace, then Add before/after, and keeps the block heading', () => {
    const c = {
      ...fixture,
      rules: [
        rule({ id: 'low', when: [{ question: 'Q1', answer: 'A' }], section: 'title', mode: 'Replace', text: 'Low', priority: 1 }),
        rule({ id: 'high', when: [{ question: 'Q1', answer: 'A' }], section: 'title', mode: 'Replace', text: 'High', priority: 5 }),
        rule({ id: 'b', when: [{ question: 'Q1', answer: 'A' }], section: 'title', mode: 'Add before', text: 'Before.' }),
        rule({ id: 'a', when: [{ question: 'Q1', answer: 'A' }], section: 'title', mode: 'Add after', text: 'After.' }),
      ],
    }
    const title = composeResult(c, { Q1: 'A', Q2: ['A'] }).sections.find((s) => s.id === 'title')
    expect(title).toMatchObject({ text: 'Before. High After.', heading: 'Head A' })
  })

  it('removes a section when a Remove rule matches', () => {
    const c = { ...fixture, rules: [rule({ id: 'x', when: [{ question: 'Q1', answer: 'B' }], section: 'extra', mode: 'Remove' })] }
    expect(composeResult(c, { Q1: 'B', Q2: ['A'] }).sections.map((s) => s.id)).toEqual(['title', 'mix'])
  })

  it('fills {Q1} and {Q1.text} placeholders', () => {
    expect(fillPlaceholders('{Q1} / {Q1.text}', fixture, { Q1: 'B' })).toBe('Q1B / Q1B text')
  })
})

// ------------------------------------------------------- real content, every path

const Q = (code: string) => content.questions.find((x) => x.code === code)!
const codes = (code: string) => Q(code).answers.map((a) => a.code)

/** Every non-empty subset of the delivery methods. */
function subsets(items: string[]): string[][] {
  const out: string[][] = []
  for (let mask = 1; mask < 1 << items.length; mask++) out.push(items.filter((_, i) => mask & (1 << i)))
  return out
}

function* everyCombination(): Generator<Answers> {
  for (const q1 of codes('Q1'))
    for (const q2 of codes('Q2'))
      for (const q3 of subsets(codes('Q3')))
        for (const q4 of codes('Q4'))
          for (const q5 of codes('Q5'))
            for (const q6 of codes('Q6')) yield { Q1: q1, Q2: q2, Q3: q3, Q4: q4, Q5: q5, Q6: q6 }
}

const REQUIRED = ['title', 'situation', 'priority_challenge', 'priority_process', 'delivery', 'team', 'sourcing', 'next30', 'next90']

describe('composeResult with the content sheet', () => {
  it('gives every answer combination a complete, consistent result', () => {
    const problems: string[] = []
    let n = 0
    for (const answers of everyCombination()) {
      n++
      const r = composeResult(content, answers)
      const where = JSON.stringify(answers)
      const ids = r.sections.map((s) => s.id)
      for (const id of REQUIRED) if (!ids.includes(id)) problems.push(`${where}: missing ${id}`)

      for (const s of r.sections) {
        if (/\{|\}|undefined|null/.test(`${s.heading} ${s.text} ${s.why}`)) problems.push(`${where}: bad text in ${s.id}`)
        if (!s.text) problems.push(`${where}: empty ${s.id}`)
      }

      // Two or three priorities, each with a heading and a reason, never the same heading twice.
      const priorities = r.sections.filter((s) => s.id.startsWith('priority_'))
      if (priorities.length < 2) problems.push(`${where}: only ${priorities.length} priorities`)
      if (new Set(priorities.map((p) => p.heading)).size !== priorities.length) problems.push(`${where}: duplicate priority`)
      if (priorities.some((p) => !p.heading || !p.why)) problems.push(`${where}: priority without heading or why`)

      // The title names the first priority.
      const first = r.sections.find((s) => s.id === 'priority_challenge')
      if (first && !r.title.toLowerCase().includes(first.heading.toLowerCase())) problems.push(`${where}: title doesn't match priority`)

      // Several delivery methods are all named; never silently the first one only.
      const delivery = r.sections.find((s) => s.id === 'delivery')?.text ?? ''
      const methods = answers.Q3 as string[]
      if (methods.length > 1) {
        for (const code of methods) {
          const category = Q('Q3').answers.find((a) => a.code === code)!.category
          if (!delivery.includes(category)) problems.push(`${where}: delivery omits ${category}`)
        }
      }
      if (problems.length > 20) break
    }
    expect(problems).toEqual([])
    expect(n).toBe(4 * 5 * 31 * 4 * 3 * 5)
  }, 60_000)

  it('shows the goal priority only when it differs from the challenge priority', () => {
    const same = composeResult(content, { Q1: 'B', Q2: 'B', Q3: ['A'], Q4: 'B', Q5: 'A', Q6: 'A' })
    expect(same.sections.map((s) => s.id)).not.toContain('priority_goal')
    expect(same.sections.find((s) => s.id === 'priority_challenge')!.text).toMatch(/listed once/)

    const different = composeResult(content, { Q1: 'B', Q2: 'B', Q3: ['A'], Q4: 'B', Q5: 'A', Q6: 'E' })
    expect(different.sections.map((s) => s.id)).toContain('priority_goal')
  })
})

// ------------------------------------------------------------ named scenarios

const text = (answers: Answers) =>
  composeResult(content, answers)
    .sections.map((s) => `${s.heading} ${s.text} ${s.why}`)
    .join(' ')

describe('scenarios from the improvement brief', () => {
  it('foundational, small internal team, live delivery, capacity goal: practical, no eLearning assumed', () => {
    const t = text({ Q1: 'A', Q2: 'B', Q3: ['A'], Q4: 'B', Q5: 'A', Q6: 'A' })
    expect(t).toMatch(/intake process/i)
    expect(t).toMatch(/small team/i)
    expect(t).not.toMatch(/eLearning/)
  })

  it('established, large hybrid team, eLearning + ILT + microlearning, content upkeep: all methods kept', () => {
    const t = text({ Q1: 'C', Q2: 'A', Q3: ['A', 'C', 'D'], Q4: 'D', Q5: 'B', Q6: 'C' })
    expect(t).toContain('In-person ILT, Self-paced eLearning and Microlearning')
    expect(t).toMatch(/highest-use eLearning/)
    expect(t).toMatch(/review ownership and quality standards across internal teams and partners/)
    expect(t).not.toMatch(/relies? (only|mainly|exclusively) on/i)
  })

  it('optimizing, medium internal team, eLearning, business impact: measurement, not set-up', () => {
    const t = text({ Q1: 'D', Q2: 'C', Q3: ['C'], Q4: 'C', Q5: 'A', Q6: 'E' })
    expect(t).toMatch(/Connect an existing learning measure to a relevant operational outcome/)
    expect(t).not.toMatch(/intake process/i)
  })

  it('no dedicated team, mainly external delivery: ownership and partner coordination, no internal production team', () => {
    const t = text({ Q1: 'B', Q2: 'D', Q3: ['C', 'E'], Q4: 'A', Q5: 'C', Q6: 'C' })
    expect(t).toMatch(/name an internal owner/)
    expect(t).toMatch(/sign-off inside your organization/)
    expect(t).not.toMatch(/your (internal )?(team|designers) (build|produce)/i)
  })

  it('small internal team with external partners is a valid hybrid profile', () => {
    const t = text({ Q1: 'B', Q2: 'B', Q3: ['B'], Q4: 'B', Q5: 'B', Q6: 'B' })
    expect(t).toMatch(/small team/i)
    expect(t).toMatch(/your own people and partners/)
  })
})
