import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import type { Answers, AssessmentResult, Question } from '../lib/types'
import { setting } from '../content'
import { LeadForm } from '../components/LeadForm'
import { buildLeadPayload, isLeadCaptureEnabled, submitLead } from '../lib/leads'
import { RecommendationPanel } from '../components/RecommendationPanel'
import { ResponseSummary } from '../components/ResponseSummary'
import { buildSummary, summaryToText } from '../lib/summary'
import { useReducedMotion } from '../lib/useReducedMotion'

interface ResultsScreenProps {
  result: AssessmentResult
  questions: Question[]
  answers: Answers
  onRestart: () => void
}

const leadCaptureEnabled = isLeadCaptureEnabled()

const sectionHeading = 'text-sm font-bold uppercase tracking-[0.17em] text-slate-600'

export function ResultsScreen({
  result,
  questions,
  answers,
  onRestart,
}: ResultsScreenProps) {
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle')
  const prefersReducedMotion = useReducedMotion()
  const headingRef = useRef<HTMLHeadingElement>(null)
  const fallbackRef = useRef<HTMLTextAreaElement>(null)
  const summary = useMemo(() => buildSummary(result, questions, answers), [result, questions, answers])
  const summaryText = useMemo(() => summaryToText(summary), [summary])

  // Land on the result heading, so keyboard and screen-reader users start at the top.
  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  async function handleCopy() {
    try {
      // Some browsers, and pages embedded in an iframe, block the clipboard.
      await navigator.clipboard.writeText(summaryText)
      setCopyState('copied')
      setTimeout(() => setCopyState('idle'), 3000)
    } catch {
      // Show the text so it can be copied by hand; stays until copied again.
      setCopyState('failed')
      requestAnimationFrame(() => fallbackRef.current?.select())
    }
  }

  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.4 }}
      className="mx-auto max-w-3xl px-5 py-10 sm:px-7 sm:py-14 print:max-w-none print:px-0 print:py-0"
    >
      <p className="text-xs font-bold uppercase tracking-[0.17em] text-q5 print:text-slate-700">
        {setting('survey_title', 'L&D Assessment')}: your result
      </p>
      <h1
        ref={headingRef}
        tabIndex={-1}
        className="mt-3 text-3xl font-semibold tracking-tight text-navy outline-none sm:text-4xl"
      >
        {summary.title}
      </h1>
      {summary.scope && (
        <p className="mt-2 hidden text-sm text-slate-700 print:block">{summary.scope}</p>
      )}

      <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-q5/30 bg-q5-tint px-4 py-1.5 print:border-slate-400 print:bg-white">
        <span className="h-1.5 w-1.5 rounded-full bg-q5 print:hidden" aria-hidden="true" />
        <span className="text-xs font-bold uppercase tracking-wide text-q5 print:text-slate-800">
          Self-reported stage: {summary.stage}
        </span>
      </div>

      <p className="mt-5 max-w-2xl text-lg leading-8 text-navy">{summary.situation}</p>

      <section aria-labelledby="priorities-heading" className="mt-12">
        <h2 id="priorities-heading" className={sectionHeading}>
          Top priorities
        </h2>
        <ol className="mt-4 grid gap-4">
          {summary.priorities.map((p, i) => (
            <li
              key={p.id}
              className="break-inside-avoid rounded-xl border border-slate-200 bg-white p-6 print:p-4"
            >
              <p className="text-xs font-bold uppercase tracking-wide text-slate-600">
                Priority {i + 1}
              </p>
              <h3 className="mt-1 text-lg font-semibold text-navy">{p.heading}</h3>
              <p className="mt-2 text-base leading-7 text-slate-700">{p.text}</p>
              {p.why && (
                <p className="mt-3 border-t border-slate-100 pt-3 text-sm leading-6 text-slate-600">
                  <span className="font-semibold text-navy">Why this matters for you: </span>
                  {p.why}
                </p>
              )}
            </li>
          ))}
        </ol>
      </section>

      {summary.context.length > 0 && (
        <section aria-labelledby="context-heading" className="mt-12">
          <h2 id="context-heading" className={sectionHeading}>
            Tailored to how you work
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 print:grid-cols-1">
            {summary.context.map((c) => (
              <div key={c.id} className="break-inside-avoid rounded-xl border border-slate-200 bg-white p-6 print:p-4">
                <h3 className="text-base font-semibold text-navy">{c.label}</h3>
                <p className="mt-2 text-base leading-7 text-slate-700">{c.text}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section aria-labelledby="next-heading" className="mt-12 border-t border-slate-200 pt-10">
        <h2 id="next-heading" className={sectionHeading}>
          What to do next
        </h2>
        <div className="mt-4">
          <RecommendationPanel next30={summary.next30} next90={summary.next90} />
        </div>
      </section>

      <section aria-labelledby="responses-heading" className="mt-12 break-inside-avoid">
        <h2 id="responses-heading" className={sectionHeading}>
          Your responses
        </h2>
        <div className="mt-3">
          <ResponseSummary responses={summary.responses} />
        </div>
      </section>

      <p className="mt-8 border-t border-slate-200 pt-6 text-sm leading-6 text-slate-600">
        <span className="font-semibold text-slate-700">How this result was generated: </span>
        {summary.methodology}
      </p>

      <div className="mt-10 flex flex-wrap items-center justify-center gap-3 border-t border-slate-200 pt-7 print:hidden">
        <button type="button" onClick={handleCopy} className="btn-secondary min-h-11 px-5 py-2.5">
          {copyState === 'copied' && (
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-q4" aria-hidden="true">
              <path
                d="m5 12 4 4L19 6"
                stroke="currentColor"
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
          {copyState === 'copied' ? 'Copied' : 'Copy summary'}
        </button>
        <button type="button" onClick={() => window.print()} className="btn-secondary min-h-11 px-5 py-2.5">
          Print / Save as PDF
        </button>
        <button
          type="button"
          onClick={onRestart}
          className="btn min-h-11 border border-q5/30 px-5 py-2.5 text-q5 hover:-translate-y-0.5 hover:border-q5 hover:bg-q5-tint hover:shadow-sm"
        >
          Start over
        </button>
      </div>
      <p role="status" className="mt-3 text-center text-sm text-slate-700 print:hidden">
        {copyState === 'copied' && 'Summary copied to your clipboard.'}
        {copyState === 'failed' &&
          "Your browser didn't allow copying. The summary is selected below, so you can copy it yourself."}
      </p>
      {copyState === 'failed' && (
        <div className="mt-2 print:hidden">
          <label htmlFor="summary-text" className="block text-sm font-semibold text-navy">
            Your summary
          </label>
          <textarea
            id="summary-text"
            ref={fallbackRef}
            readOnly
            rows={12}
            value={summaryText}
            className="mt-1.5 block w-full rounded-lg border border-slate-300 bg-white p-3 font-mono text-sm text-navy"
          />
        </div>
      )}

      {leadCaptureEnabled && (
        <div className="mt-12 print:hidden">
          <LeadForm
            onSubmit={(contact) =>
              submitLead(buildLeadPayload(contact, answers, result, questions))
            }
          />
        </div>
      )}

      <p className="mt-6 border-t border-slate-200 pt-4 text-xs leading-5 text-slate-600 print:hidden">
        {setting('privacy_note')}
      </p>
    </motion.div>
  )
}
