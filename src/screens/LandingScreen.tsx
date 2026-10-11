import { motion } from 'framer-motion'
import { questionAccent } from '../theme/tokens'
import { content, setting } from '../content'
import { groupSteps } from '../lib/answers'
import { Hero } from '../components/ui/Hero'
import { renderHeroLine } from '../components/ui/heroText'
import { useReducedMotion } from '../lib/useReducedMotion'

interface LandingScreenProps {
  onStart: () => void
}

// One row per step, straight from the content sheet.
const STEPS = groupSteps(content.questions)
const DISCOVER_ITEMS = STEPS.map((s) => ({
  code: s.questions[0].code,
  name: s.name,
  text: s.questions[0].landing_blurb || s.questions[0].title,
}))

const START_LABEL = setting('start_button', 'Start the assessment')
const STEP_COUNT = setting('step_count_label', `${STEPS.length} short steps`)

const HOW_IT_WORKS = [
  {
    step: 'Answer',
    text: `${STEP_COUNT.charAt(0).toUpperCase()}${STEP_COUNT.slice(1)} about how your organization manages learning.`,
  },
  {
    step: 'Match',
    text: 'Your answers are matched to predefined guidance written for each situation.',
  },
  {
    step: 'Act',
    text: 'Get your priorities, why they matter, and 30- and 90-day actions you can copy or print.',
  },
]

function FadeIn({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode
  delay?: number
  className?: string
}) {
  const prefersReducedMotion = useReducedMotion()

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function LandingScreen({ onStart }: LandingScreenProps) {
  return (
    <div>
      {/* Shader hero, with a static fallback for unsupported/constrained/reduced-motion
          cases — stats, headline, and primary/secondary CTAs all live in the hero
          itself now, so the CTA is reachable without scrolling past supporting sections. */}
      <Hero onStart={onStart} />

      {/* White band: What you'll discover + How it works — the hero's secondary
          CTA ("See how it works") scrolls here. */}
      <div id="discover" className="scroll-mt-6 bg-white py-20">
        <div className="mx-auto max-w-4xl px-5 sm:px-7">
          <FadeIn className="grid gap-10 lg:grid-cols-5 lg:gap-16">
            <div className="lg:col-span-2">
              <p className="text-xs font-bold uppercase tracking-[0.17em] text-slate-500">
                {STEP_COUNT}
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-navy sm:text-4xl">
                What we&apos;ll ask about
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-600">
                Each step covers one part of how learning works in your
                organization. There are no right or wrong answers.
              </p>
            </div>

            <ol className="divide-y divide-slate-200 lg:col-span-3">
              {DISCOVER_ITEMS.map((d, i) => {
                const accent = questionAccent(d.code)
                return (
                  <li key={d.code} className="flex items-start gap-5 py-5 first:pt-0 last:pb-0">
                    {/* Decorative number, drawn by CSS so it isn't read or contrast-checked as text */}
                    <span
                      data-n={String(i + 1).padStart(2, '0')}
                      className="select-none text-4xl font-bold tabular-nums text-slate-200 before:content-[attr(data-n)] sm:text-5xl"
                      aria-hidden="true"
                    />
                    <div className="min-w-0 pt-1">
                      <p className="flex items-center gap-2 text-lg font-semibold text-navy">
                        <span
                          className="h-1.5 w-1.5 shrink-0 rounded-full"
                          style={{ backgroundColor: accent.accent }}
                        />
                        {d.name}
                      </p>
                      <p className="mt-1 text-base leading-6 text-slate-500">{d.text}</p>
                    </div>
                  </li>
                )
              })}
            </ol>
          </FadeIn>

          <FadeIn className="mt-24">
            <p className="text-xs font-bold uppercase tracking-[0.17em] text-slate-500">
              How It Works
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-navy sm:text-4xl">
              From answers to next steps
            </h2>

            <div className="mt-10 grid gap-10 divide-slate-200 sm:grid-cols-3 sm:gap-0 sm:divide-x">
              {HOW_IT_WORKS.map((s, i) => (
                <div key={s.step} className="sm:px-8 sm:first:pl-0 sm:last:pr-0">
                  <span
                    data-n={String(i + 1).padStart(2, '0')}
                    className="block select-none text-4xl font-bold tabular-nums text-slate-200 before:content-[attr(data-n)]"
                    aria-hidden="true"
                  />
                  <p className="mt-3 text-xl font-semibold text-navy">{s.step}</p>
                  <p className="mt-2 text-base leading-6 text-slate-500">{s.text}</p>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-5 pb-20 sm:px-7 sm:pb-28">
        {/* Final CTA — the strong visual close */}
        <FadeIn className="relative mt-16 overflow-hidden rounded-2xl bg-navy px-6 py-14 text-center sm:px-12">
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(circle at 22% 15%, rgba(32,90,158,0.28), transparent 55%), radial-gradient(circle at 85% 85%, rgba(18,133,155,0.18), transparent 50%)',
            }}
          />
          <div className="relative">
            <p className="text-xs font-bold uppercase tracking-[0.17em] text-white/60">
              L&amp;D Assessment
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              {renderHeroLine('Ready to find your next L&D priority?')}
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-white/70">
              Get practical priorities and next steps, with the reasons behind them.
            </p>
            <button type="button" onClick={onStart} className="btn-on-dark-primary mt-7">
              {START_LABEL}
            </button>
            <p className="mt-5 text-sm text-white/50">
              {STEP_COUNT} &middot; {setting('estimated_time', 'About 3 minutes')} &middot; No sign-up
              needed
            </p>
            <p className="mx-auto mt-3 max-w-xl text-xs leading-5 text-white/50">
              {setting('privacy_note')}
            </p>
          </div>
        </FadeIn>
      </div>
    </div>
  )
}
