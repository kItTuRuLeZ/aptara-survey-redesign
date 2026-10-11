import { useState } from 'react'
import type { FormEvent } from 'react'
import { validateLead } from '../lib/leads'
import type { LeadContact, LeadErrors } from '../lib/leads'
import { setting } from '../content'

interface LeadFormProps {
  onSubmit: (contact: LeadContact) => Promise<void>
}

type Status = 'idle' | 'submitting' | 'sent' | 'failed'

const EMPTY: LeadContact = { name: '', email: '', company: '', message: '' }

// Only a real URL from the content sheet is ever linked; there is no default.
const privacyUrl = setting('privacy_policy_url')

/**
 * Optional follow-up request, shown only after the full result. Validates
 * inline, keeps what was typed if sending fails, and never blocks the result.
 */
export function LeadForm({ onSubmit }: LeadFormProps) {
  const [contact, setContact] = useState<LeadContact>(EMPTY)
  const [consent, setConsent] = useState(false)
  const [errors, setErrors] = useState<LeadErrors>({})
  const [touched, setTouched] = useState(false)
  const [status, setStatus] = useState<Status>('idle')

  function update(field: keyof LeadContact, value: string) {
    const next = { ...contact, [field]: value }
    setContact(next)
    if (touched) setErrors(validateLead(next, consent))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setTouched(true)
    const found = validateLead(contact, consent)
    setErrors(found)
    if (Object.keys(found).length > 0) {
      const first = Object.keys(found)[0]
      document.getElementById(`lead-${first}`)?.focus()
      return
    }
    setStatus('submitting')
    try {
      await onSubmit(contact)
      setStatus('sent')
    } catch {
      setStatus('failed')
    }
  }

  if (status === 'sent') {
    return (
      <div role="status" className="rounded-xl border border-q4/30 bg-q4-tint px-6 py-5 text-base text-navy">
        Thanks, {contact.name.trim().split(/\s+/)[0]}. An Aptara L&amp;D specialist will be in touch at{' '}
        <span className="font-semibold">{contact.email.trim()}</span>.
      </div>
    )
  }

  const field = (
    id: keyof LeadContact,
    label: string,
    type: string,
    autoComplete: string,
  ) => {
    const error = id in errors ? errors[id as keyof LeadErrors] : undefined
    return (
      <div>
        <label htmlFor={`lead-${id}`} className="block text-sm font-semibold text-navy">
          {label} <span className="font-normal text-slate-600">(required)</span>
        </label>
        <input
          id={`lead-${id}`}
          type={type}
          required
          aria-required="true"
          autoComplete={autoComplete}
          value={contact[id]}
          onChange={(e) => update(id, e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `lead-${id}-error` : undefined}
          className={`mt-1.5 block min-h-11 w-full rounded-lg border bg-white px-3.5 py-2.5 text-base text-navy outline-none focus-visible:ring-2 focus-visible:ring-navy-light ${
            error ? 'border-q3' : 'border-slate-300'
          }`}
        />
        {error && (
          <p id={`lead-${id}-error`} className="mt-1.5 text-sm text-q3">
            {error}
          </p>
        )}
      </div>
    )
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-6 sm:p-7">
      <p className="text-lg font-semibold text-navy">{setting('cta_label', 'Talk to an L&D specialist')}</p>
      <p className="mt-1.5 text-base leading-7 text-slate-600">
        {setting(
          'lead_form_intro',
          'Want to talk through your result? Leave your details and an Aptara L&D specialist will get in touch.',
        )}
      </p>

      <p className="mt-3 text-sm text-slate-600">All fields are required unless marked optional.</p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {field('name', 'Name', 'text', 'name')}
        {field('email', 'Work email', 'email', 'email')}
        <div className="sm:col-span-2">{field('company', 'Company', 'text', 'organization')}</div>
        <div className="sm:col-span-2">
          <label htmlFor="lead-message" className="block text-sm font-semibold text-navy">
            Anything we should know? <span className="font-normal text-slate-600">(optional)</span>
          </label>
          <textarea
            id="lead-message"
            rows={3}
            value={contact.message}
            onChange={(e) => update('message', e.target.value)}
            className="mt-1.5 block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-base text-navy outline-none focus-visible:ring-2 focus-visible:ring-navy-light"
          />
        </div>
      </div>

      <div className="mt-5">
        <label htmlFor="lead-consent" className="flex min-h-11 cursor-pointer items-start gap-3 text-sm leading-6 text-slate-600">
          <input
            id="lead-consent"
            type="checkbox"
            checked={consent}
            onChange={(e) => {
              setConsent(e.target.checked)
              if (touched) setErrors(validateLead(contact, e.target.checked))
            }}
            aria-invalid={errors.consent ? true : undefined}
            aria-describedby={errors.consent ? 'lead-consent-error' : undefined}
            className="mt-1 h-4 w-4 shrink-0 accent-navy"
          />
          <span>
            {setting(
              'lead_form_privacy',
              "We'll send your details and your assessment answers to Aptara's team, only to follow up on this request.",
            )}{' '}
            <span className="font-normal text-slate-600">(required)</span>
          </span>
        </label>
        {privacyUrl && (
          <p className="mt-1 pl-7 text-sm text-slate-600">
            See Aptara&apos;s{' '}
            <a
              href={privacyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-navy-light underline underline-offset-2 hover:text-navy"
            >
              privacy and cookie policy
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
            .
          </p>
        )}
        {errors.consent && (
          <p id="lead-consent-error" className="mt-1 pl-7 text-sm text-q3">
            {errors.consent}
          </p>
        )}
      </div>

      {status === 'failed' && (
        <p role="alert" className="mt-4 text-sm text-q3">
          We couldn&apos;t send that just now. Your details are still here, so please try again.
        </p>
      )}

      <button
        type="submit"
        disabled={status === 'submitting'}
        aria-busy={status === 'submitting' || undefined}
        className="btn-primary mt-5"
      >
        {status === 'submitting' ? 'Sending…' : 'Send request'}
      </button>
    </form>
  )
}
