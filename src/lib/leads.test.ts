import { afterEach, describe, expect, it, vi } from 'vitest'
import { buildLeadPayload, isLeadCaptureEnabled, submitLead } from './leads'
import { content } from '../content'
import { composeResult } from './composeResult'

const answers = { Q1: 'C', Q2: 'C', Q3: ['A', 'C', 'D'], Q4: 'B', Q5: 'B', Q6: 'E' }
const contact = { name: ' Priya ', email: 'priya@example.com', company: 'Example Co', message: '' }
const URL = 'https://example.com/lead'

function payload() {
  return buildLeadPayload(contact, answers, composeResult(content, answers), content.questions)
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('leads', () => {
  it('is disabled when no endpoint is configured', () => {
    expect(isLeadCaptureEnabled('')).toBe(false)
    expect(isLeadCaptureEnabled(URL)).toBe(true)
  })

  it('builds flat, readable fields with each answer spelled out', () => {
    const p = payload()
    expect(p.Name).toBe('Priya')
    expect(p.Company).toBe('Example Co')
    expect(p.Message).toBe('(none)')
    expect(p._subject).toBe('L&D assessment follow-up: Example Co')
    expect(p._replyto).toBe('priya@example.com')
    expect(p['Maturity stage']).toMatch(/^Established: /)
    expect(p['Maturity stage (self-reported)']).toBe('Established')
    // Every selected delivery method, plus team size, sourcing and goal.
    expect(p['Delivery methods']).toBe(
      'In-person ILT: In-person instructor-led training (ILT). | Self-paced eLearning: Self-paced eLearning. | Microlearning: Microlearning or performance support, such as short videos and job aids.',
    )
    expect(p['Internal team']).toMatch(/^Small team/)
    expect(p.Sourcing).toMatch(/^Mixed/)
    expect(p['Business goal']).toMatch(/^Business impact/)
    expect(p['Result title']).toBe(composeResult(content, answers).title)
  })

  it('posts JSON and resolves on success', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ success: 'true' }) })
    vi.stubGlobal('fetch', fetchMock)
    const p = payload()
    await expect(submitLead(p, URL)).resolves.toBeUndefined()
    expect(fetchMock).toHaveBeenCalledWith(URL, expect.objectContaining({ method: 'POST', body: JSON.stringify(p) }))
  })

  it('throws on an HTTP error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }))
    await expect(submitLead(payload(), URL)).rejects.toThrow('500')
  })

  it('throws when the service answers 200 but success is false (e.g. not yet activated)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ success: 'false', message: 'needs activation' }) }),
    )
    await expect(submitLead(payload(), URL)).rejects.toThrow('not accepted')
  })
})
