import { motion } from 'framer-motion'
import { useReducedMotion } from '../lib/useReducedMotion'

const STEPS = [
  'Understanding your L&D maturity',
  'Identifying your biggest challenge',
  'Assessing your current capacity',
  'Mapping your future priorities',
]

export function ProcessingScreen() {
  const prefersReducedMotion = useReducedMotion()

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-5 py-24 text-center sm:py-32">
      <p className="text-xs font-bold uppercase tracking-[0.17em] text-q5">
        Analyzing Your Responses
      </p>

      {prefersReducedMotion ? (
        <motion.div
          animate={{ opacity: [1, 0.4, 1] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
          className="mt-6 h-10 w-10 rounded-full border-2 border-q5"
        />
      ) : (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.1, repeat: Infinity, ease: 'linear' }}
          className="mt-6 h-10 w-10 rounded-full border-2 border-slate-200 border-t-q5"
        />
      )}
      <h2 className="mt-6 text-2xl font-semibold text-navy">
        Building your L&amp;D profile
      </h2>
      <p className="mt-2 text-base text-slate-500">
        We&apos;re validating your responses and loading the best available
        summary for your selected combination.
      </p>

      <p className="mt-6 text-xs font-bold uppercase tracking-wide text-slate-600">
        Preparing your insights &middot; 100%
      </p>
      <ul className="mt-3 space-y-2 text-left">
        {STEPS.map((step, i) => (
          <motion.li
            key={step}
            initial={prefersReducedMotion ? false : { opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: prefersReducedMotion ? 0 : 0.12 * i, duration: prefersReducedMotion ? 0 : 0.3 }}
            className="flex items-center gap-2 text-sm text-slate-500"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-q5" />
            {step}
          </motion.li>
        ))}
      </ul>

      <p className="mt-6 text-sm text-slate-600">This will only take a moment.</p>
    </div>
  )
}
