import { afterEach, describe, expect, it, vi } from 'vitest'
import { buildLeadPayload, isLeadCaptureEnabled, submitLead } from './leads'
import { content } from '../content'
import { composeResult } from './composeResult'

const answers = { Q1: 'C', Q2: 'C', Q3: 'C', Q4: 'B', Q5: 'C' }
const contact = { name: ' Priya ', email: 'priya@example.com', company: 'Example Co', message: '' }

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('leads', () => {
  it('is disabled when no endpoint is configured', () => {
    expect(isLeadCaptureEnabled('')).toBe(false)
    expect(isLeadCaptureEnabled('https://example.com/lead')).toBe(true)
  })

  it('sends answer categories and the result headline, not raw codes', () => {
    const result = composeResult(content, answers)
    const payload = buildLeadPayload(contact, answers, result, content.questions)
    expect(payload.name).toBe('Priya')
    expect(payload.result_title).toBe(result.title)
    expect(payload.answers[0]).toEqual({ question: 'Maturity Stage', answer: 'Scaling' })
    expect(payload.answers).toHaveLength(5)
  })

  it('posts JSON and throws on a failed response', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 500 })
    vi.stubGlobal('fetch', fetchMock)
    const payload = buildLeadPayload(contact, answers, composeResult(content, answers), content.questions)
    await expect(submitLead(payload, 'https://example.com/lead')).rejects.toThrow('500')
    expect(fetchMock).toHaveBeenCalledWith(
      'https://example.com/lead',
      expect.objectContaining({ method: 'POST', body: JSON.stringify(payload) }),
    )
  })
})
