import { motion } from 'framer-motion'
import type { AnswerCode, QuestionAnswer, QuestionCode } from '../lib/types'
import { questionAccent } from '../theme/tokens'
import { useReducedMotion } from '../lib/useReducedMotion'

interface QuestionOptionProps {
  questionCode: QuestionCode
  answer: QuestionAnswer
  selected: boolean
  onSelect: (code: AnswerCode) => void
  disabled?: boolean
  error?: boolean
}

/**
 * A real <input type="radio"> grouped by `name={questionCode}`, visually
 * hidden inside a clickable <label>. This gets correct native radio
 * semantics for free — Tab enters/exits the group as a single stop, arrow
 * keys move the selection between options, Space toggles — rather than
 * hand-rolling roving tabindex + keydown handling on a role="radio" button.
 * Visual states (hover/focus-visible/selected/disabled/error) are driven by
 * real CSS pseudo-classes via Tailwind's has-[]/peer variants wherever the
 * state is truly native; decorative accent coloring below still reads the
 * `selected` prop directly since it's kept in lockstep with the input's own
 * checked state.
 */
export function QuestionOption({
  questionCode,
  answer,
  selected,
  onSelect,
  disabled = false,
  error = false,
}: QuestionOptionProps) {
  const accent = questionAccent(questionCode)
  const inputId = `${questionCode}-${answer.code}`
  const prefersReducedMotion = useReducedMotion()

  return (
    <label
      htmlFor={inputId}
      className={`group relative flex w-full items-start gap-5 overflow-hidden rounded-xl border bg-white py-5 pl-6 pr-5 transition-all duration-150 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-navy-light has-[:focus-visible]:ring-offset-2 ${
        disabled
          ? 'cursor-not-allowed opacity-50'
          : 'cursor-pointer has-[:hover]:-translate-y-0.5 has-[:hover]:shadow-sm'
      } ${
        error
          ? 'border-q3'
          : selected
            ? 'border-slate-200 shadow-md shadow-slate-200/60'
            : 'border-slate-200'
      }`}
    >
      <input
        type="radio"
        id={inputId}
        name={questionCode}
        value={answer.code}
        checked={selected}
        disabled={disabled}
        aria-invalid={error || undefined}
        onChange={() => onSelect(answer.code)}
        className="sr-only"
      />

      <span
        className="absolute inset-y-0 left-0 w-1 transition-colors duration-150"
        style={{ backgroundColor: selected ? accent.accent : 'transparent' }}
        aria-hidden="true"
      />

      <span
        className="select-none text-2xl font-bold tabular-nums transition-colors duration-150"
        style={{ color: selected ? accent.accent : '#cbd5e1' }}
        aria-hidden="true"
      >
        {answer.code}
      </span>

      <span className="min-w-0 flex-1 pt-0.5">
        <span
          className="block text-xs font-bold uppercase tracking-wide transition-colors duration-150"
          style={{ color: selected ? accent.accent : '#94a3b8' }}
        >
          {answer.category}
        </span>
        <span className="mt-1 block text-base text-navy sm:text-lg">
          {answer.text}
        </span>
      </span>

      <span
        className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all duration-150"
        style={{
          borderColor: selected ? accent.accent : '#e2e8f0',
          backgroundColor: selected ? accent.accent : 'transparent',
        }}
        aria-hidden="true"
      >
        {selected && (
          <motion.svg
            viewBox="0 0 24 24"
            fill="none"
            className="h-3 w-3 text-white"
            initial={prefersReducedMotion ? false : { scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.2, ease: 'easeOut' }}
          >
            <path
              d="m5 12 4 4L19 6"
              stroke="currentColor"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </motion.svg>
        )}
      </span>
    </label>
  )
}
