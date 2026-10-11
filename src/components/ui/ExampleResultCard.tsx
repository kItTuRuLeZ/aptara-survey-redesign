import { motion, useMotionTemplate, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { EXAMPLE_RESULT } from '../../lib/exampleResult'
import { useReducedMotion } from '../../lib/useReducedMotion'

/** Badge colours for the priority rows, in order. */
const PRIORITY_ACCENTS = [
  'bg-q1-tint text-q1-ink ring-q1/25',
  'bg-q5-tint text-q5-ink ring-q5/25',
  'bg-q4-tint text-q4-ink ring-q4/25',
]

const MAX_TILT = 7 // degrees
const SPRING = { stiffness: 160, damping: 18, mass: 0.6 }

/**
 * A compact, clearly illustrative preview of a result, beside the hero copy
 * on wide screens and below the start button on narrow ones. Built from the
 * same rules as a real result (see lib/exampleResult).
 *
 * With a mouse or pen, the card tilts gently toward the cursor and a soft
 * highlight follows it. Touch, keyboard and reduced-motion users get the
 * same card, standing still.
 */
export function ExampleResultCard() {
  const reduceMotion = useReducedMotion()

  // Cursor position over the card, from -0.5 (left/top) to 0.5 (right/bottom).
  const px = useMotionValue(0)
  const py = useMotionValue(0)
  const x = useSpring(px, SPRING)
  const y = useSpring(py, SPRING)
  const rotateY = useTransform(x, [-0.5, 0.5], [-MAX_TILT, MAX_TILT])
  const rotateX = useTransform(y, [-0.5, 0.5], [MAX_TILT, -MAX_TILT])
  const glareX = useTransform(x, [-0.5, 0.5], ['0%', '100%'])
  const glareY = useTransform(y, [-0.5, 0.5], ['0%', '100%'])
  const glare = useMotionTemplate`radial-gradient(420px circle at ${glareX} ${glareY}, rgba(18,133,155,0.16), transparent 55%)`
  const glowX = useTransform(x, [-0.5, 0.5], [-18, 18])
  const glowY = useTransform(y, [-0.5, 0.5], [-14, 14])

  function handleMove(e: React.PointerEvent<HTMLDivElement>) {
    if (e.pointerType === 'touch') return
    const r = e.currentTarget.getBoundingClientRect()
    px.set((e.clientX - r.left) / r.width - 0.5)
    py.set((e.clientY - r.top) / r.height - 0.5)
  }

  function handleLeave() {
    px.set(0)
    py.set(0)
  }

  const interactive = !reduceMotion

  return (
    <div className="relative [perspective:1200px]">
      {/* Soft teal glow behind the card; drifts slightly opposite the tilt. */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-6 rounded-[2rem] bg-[radial-gradient(closest-side,rgba(18,133,155,0.45),transparent)] blur-2xl"
        style={interactive ? { x: glowX, y: glowY } : undefined}
      />

      <motion.div
        onPointerMove={interactive ? handleMove : undefined}
        onPointerLeave={interactive ? handleLeave : undefined}
        style={interactive ? { rotateX, rotateY, transformStyle: 'preserve-3d' } : undefined}
        className="relative rounded-2xl bg-gradient-to-br from-[#5fd0e0]/70 via-white/30 to-[#205a9e]/60 p-px shadow-2xl shadow-black/40"
      >
        <aside
          aria-labelledby="example-result-title"
          className="relative overflow-hidden rounded-[calc(1rem-1px)] bg-white p-5 text-left sm:p-6"
        >
          {interactive && (
            <motion.div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: glare }} />
          )}

          <div className="relative flex items-center justify-between gap-3">
            <p className="inline-flex items-center gap-2 rounded-full bg-q1-tint px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-q1-ink">
              <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" aria-hidden="true">
                <path
                  d="M12 3l2.4 5.6L20 11l-5.6 2.4L12 19l-2.4-5.6L4 11l5.6-2.4L12 3z"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinejoin="round"
                />
              </svg>
              Example result
            </p>
            <span className="text-xs font-medium text-slate-600">Sample answers</span>
          </div>

          <h2
            id="example-result-title"
            className="relative mt-4 border-l-4 border-q1 pl-3 text-xl font-semibold leading-snug text-navy sm:text-[1.35rem]"
          >
            {EXAMPLE_RESULT.title}
          </h2>

          <dl className="relative mt-4 flex flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
              <dt className="text-slate-600">Stage</dt>
              <dd className="font-semibold text-navy">{EXAMPLE_RESULT.stage}</dd>
            </div>
            <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
              <dt className="text-slate-600">Goal</dt>
              <dd className="font-semibold text-navy">{EXAMPLE_RESULT.goal}</dd>
            </div>
          </dl>

          <h3 className="relative mt-5 text-xs font-bold uppercase tracking-wide text-slate-600">Top priorities</h3>
          <ol className="relative mt-2 grid gap-2">
            {EXAMPLE_RESULT.priorities.map((p, i) => (
              <li
                key={p}
                className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white px-3 py-2.5 text-sm font-medium text-navy shadow-sm"
              >
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-bold ring-1 ${
                    PRIORITY_ACCENTS[i % PRIORITY_ACCENTS.length]
                  }`}
                  aria-hidden="true"
                >
                  {i + 1}
                </span>
                {p}
              </li>
            ))}
          </ol>

          <div className="relative mt-4 flex gap-3 rounded-xl bg-gradient-to-br from-navy to-[#0c3a63] p-3.5 text-sm leading-6 text-white/90">
            <svg viewBox="0 0 24 24" fill="none" className="mt-0.5 h-5 w-5 shrink-0 text-[#5fd0e0]" aria-hidden="true">
              <rect x="3.5" y="5" width="17" height="15" rx="2.5" stroke="currentColor" strokeWidth={1.8} />
              <path d="M3.5 10h17M8 3v4M16 3v4" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
            </svg>
            <p>
              <span className="font-semibold text-white">First 30 days: </span>
              {EXAMPLE_RESULT.next30}
            </p>
          </div>

          <p className="relative mt-4 text-xs leading-5 text-slate-600">
            Illustrative only. Your result depends on your answers.
          </p>
        </aside>
      </motion.div>
    </div>
  )
}
