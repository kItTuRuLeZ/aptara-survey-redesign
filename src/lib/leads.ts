import type { Answers, AssessmentResult, Question } from './types'
import { setting } from '../content'

/**
 * Where optional follow-up requests are sent. VITE_LEAD_ENDPOINT (set at
 * build time) wins; otherwise the `lead_endpoint` value in the content
 * sheet's Settings tab is used. When neither is set, the follow-up form is
 * hidden and nothing leaves the browser.
 *
 * Any endpoint that accepts a JSON POST works. For FormSubmit
 * (https://formsubmit.co/ajax/<email>), requests arrive as an email; the
 * first one sends an activation email that must be confirmed once.
 */
export function leadEndpoint(): string {
  return import.meta.env.VITE_LEAD_ENDPOINT || setting('lead_endpoint')
}

export function isLeadCaptureEnabled(endpoint = leadEndpoint()): boolean {
  return Boolean(endpoint)
}

export interface LeadContact {
  name: string
  email: string
  company: string
  message: string
}

/**
 * Flat key/value fields so each one reads as its own line in an email or a
 * CRM form mapping. Keys starting with "_" are FormSubmit options and are
 * ignored by other endpoints.
 */
export type LeadPayload = Record<string, string>

export function buildLeadPayload(
  contact: LeadContact,
  answers: Answers,
  result: AssessmentResult,
  questions: Question[],
): LeadPayload {
  const company = contact.company.trim()
  const payload: LeadPayload = {
    _subject: `L&D assessment follow-up: ${company}`,
    _template: 'table',
    _captcha: 'false',
    _replyto: contact.email.trim(),
    Name: contact.name.trim(),
    Email: contact.email.trim(),
    Company: company,
    Message: contact.message.trim() || '(none)',
    'Result title': result.title,
    Maturity: result.classification,
  }
  for (const q of questions) {
    const answer = q.answers.find((a) => a.code === answers[q.code])
    if (answer) payload[q.name] = `${answer.category}: ${answer.text}`
  }
  payload['Submitted at'] = new Date().toISOString()
  return payload
}

export async function submitLead(
  payload: LeadPayload,
  endpoint = leadEndpoint(),
): Promise<void> {
  if (!endpoint) throw new Error('Lead endpoint is not configured.')
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`Lead submission failed: ${res.status}`)
  // Some services (FormSubmit among them) answer 200 with success: false,
  // e.g. before the destination address has been activated.
  const body = (await res.json().catch(() => null)) as { success?: unknown } | null
  if (body && (body.success === false || body.success === 'false')) {
    throw new Error('Lead submission was not accepted.')
  }
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export type LeadErrors = Partial<Record<'name' | 'email' | 'company' | 'consent', string>>

export function validateLead(contact: LeadContact, consent: boolean): LeadErrors {
  const errors: LeadErrors = {}
  if (!contact.name.trim()) errors.name = 'Enter your name.'
  if (!contact.email.trim()) errors.email = 'Enter your work email.'
  else if (!EMAIL_PATTERN.test(contact.email.trim())) errors.email = 'Enter a valid email, like name@company.com.'
  if (!contact.company.trim()) errors.company = 'Enter your company name.'
  if (!consent) errors.consent = 'Please confirm you agree so we can follow up.'
  return errors
}
