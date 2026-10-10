import { motion } from 'framer-motion'
import { questionAccent } from '../theme/tokens'
import { content, questionCountWord, setting } from '../content'
import { Hero } from '../components/ui/Hero'
import { renderHeroLine } from '../components/ui/heroText'
import { useReducedMotion } from '../lib/useReducedMotion'

interface LandingScreenProps {
  onStart: () => void
}

// One row per question, straight from the content sheet.
const DISCOVER_ITEMS = content.questions.map((q) => ({
  code: q.code,
  name: q.name,
  text: q.landing_blurb || q.title,
}))

const HOW_IT_WORKS = [
  {
    step: 'Answer',
    text: `Respond to ${questionCountWord()} focused questions about your L&D function.`,
  },
  {
    step: 'Assess',
    text: 'Your responses are evaluated against the key areas of L&D maturity.',
  },
  {
    step: 'Discover',
    text: 'Receive a personalized snapshot highlighting priorities and opportunities.',
  },
]

const SNAPSHOT_BULLETS = [
  'Established learning foundations',
  'Opportunity to improve scalability',
  'Capacity is an important next priority',
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
                What you&apos;ll discover
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-navy sm:text-4xl">
                {renderHeroLine('See your L&D function more clearly.')}
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-600">
                The assessment looks beyond individual questions to give you a
                clearer picture of where your learning function is today and
                where attention may be needed next.
              </p>
            </div>

            <ol className="divide-y divide-slate-200 lg:col-span-3">
              {DISCOVER_ITEMS.map((d, i) => {
                const accent = questionAccent(d.code)
                return (
                  <li key={d.code} className="flex items-start gap-5 py-5 first:pt-0 last:pb-0">
                    <span
                      className="select-none text-4xl font-bold tabular-nums text-slate-200 sm:text-5xl"
                      aria-hidden="true"
                    >
                      {String(i + 1).padStart(2, '0')}
                    </span>
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
              Simple questions. Useful direction.
            </h2>

            <div className="mt-10 grid gap-10 divide-slate-200 sm:grid-cols-3 sm:gap-0 sm:divide-x">
              {HOW_IT_WORKS.map((s, i) => (
                <div key={s.step} className="sm:px-8 sm:first:pl-0 sm:last:pr-0">
                  <span
                    className="select-none text-4xl font-bold tabular-nums text-slate-200"
                    aria-hidden="true"
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <p className="mt-3 text-xl font-semibold text-navy">{s.step}</p>
                  <p className="mt-2 text-base leading-6 text-slate-500">{s.text}</p>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-5 pb-20 sm:px-7 sm:pb-28">
        {/* Sample snapshot — framed like a product preview */}
        <FadeIn className="mt-20">
          <p className="text-xs font-bold uppercase tracking-[0.17em] text-slate-600">
            Your L&amp;D Snapshot
          </p>
          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60">
            <div className="flex items-center gap-1.5 border-b border-slate-100 bg-slate-50 px-5 py-3">
              <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
              <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
              <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
            </div>
            <div className="p-7 sm:p-9">
              <div className="flex flex-wrap items-center justify-between gap-6">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    Current L&amp;D maturity
                  </p>
                  <p className="mt-1.5 text-2xl font-semibold text-q1-ink">Scaling</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    Primary Priority
                  </p>
                  <p className="mt-1.5 text-2xl font-semibold text-q2-ink">Capacity</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    Future Focus
                  </p>
                  <p className="mt-1.5 text-2xl font-semibold text-q5">Sustainable Growth</p>
                </div>
              </div>
              <p className="mt-6 text-base leading-7 text-slate-600">
                Your L&amp;D function has established foundations and is
                positioned for growth, but capacity and scalability may
                require greater attention.
              </p>
              <ul className="mt-4 flex flex-wrap gap-x-8 gap-y-2 text-sm text-slate-500">
                {SNAPSHOT_BULLETS.map((b) => (
                  <li key={b} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-q4" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </FadeIn>

        {/* Your result — plain, no card, leads into the final CTA */}
        <FadeIn className="mt-20 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.17em] text-slate-600">
            Your Result
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-navy sm:text-4xl">
            Turn your responses into a clearer view of what comes next.
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-slate-600">
            At the end of the assessment, you&apos;ll receive a personalized
            snapshot that highlights your current position, key priority, and
            potential area of focus.
          </p>
          <button
            type="button"
            onClick={onStart}
            className="btn mt-7 border border-navy px-8 py-3.5 text-navy hover:-translate-y-0.5 hover:bg-navy hover:text-white hover:shadow-md"
          >
            Start Assessment
          </button>
        </FadeIn>

        {/* Final CTA — the strong visual close */}
        <FadeIn className="relative mt-14 overflow-hidden rounded-2xl bg-navy px-6 py-14 text-center sm:px-12">
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
              {renderHeroLine('Ready to understand your L&D function?')}
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-white/70">
              Complete {questionCountWord()} focused questions and discover what your current
              learning environment may need next.
            </p>
            <button type="button" onClick={onStart} className="btn-on-dark-primary mt-7">
              Get Started
            </button>
            <p className="mt-5 text-sm text-white/50">
              {content.questions.length} questions &middot;{' '}
              {setting('estimated_time', 'About 2 minutes')} &middot; Personalized
              assessment
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
