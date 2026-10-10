import type { Answers, AssessmentResult, Question } from './types'

/**
 * Where optional follow-up requests are sent. Set VITE_LEAD_ENDPOINT at build
 * time (e.g. a Formspree form URL or a small serverless function). When it
 * isn't set, the follow-up form is hidden and nothing leaves the browser.
 */
const LEAD_ENDPOINT: string | undefined = import.meta.env.VITE_LEAD_ENDPOINT

export function isLeadCaptureEnabled(endpoint = LEAD_ENDPOINT): boolean {
  return Boolean(endpoint)
}

export interface LeadContact {
  name: string
  email: string
  company: string
  message: string
}

export interface LeadPayload {
  name: string
  email: string
  company: string
  message: string
  result_title: string
  classification: string
  answers: Array<{ question: string; answer: string }>
  submitted_at: string
}

export function buildLeadPayload(
  contact: LeadContact,
  answers: Answers,
  result: AssessmentResult,
  questions: Question[],
): LeadPayload {
  return {
    name: contact.name.trim(),
    email: contact.email.trim(),
    company: contact.company.trim(),
    message: contact.message.trim(),
    result_title: result.title,
    classification: result.classification,
    answers: questions
      .filter((q) => answers[q.code])
      .map((q) => ({
        question: q.name,
        answer: q.answers.find((a) => a.code === answers[q.code])?.category ?? '',
      })),
    submitted_at: new Date().toISOString(),
  }
}

export async function submitLead(
  payload: LeadPayload,
  endpoint = LEAD_ENDPOINT,
): Promise<void> {
  if (!endpoint) throw new Error('Lead endpoint is not configured.')
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`Lead submission failed: ${res.status}`)
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
