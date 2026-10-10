import { motion } from 'framer-motion'
import { HERO_CHAPTERS, HERO_STATS } from './heroContent'
import { renderHeroLine } from './heroText'

interface HeroCopyProps {
  onStart: () => void
  /** Play the entrance animation. Off for reduced motion. */
  animate: boolean
}

const [chapter] = HERO_CHAPTERS

/**
 * The hero's text and buttons. Rendered once, in front of whichever
 * background is showing, so the layout is the same with or without the
 * shader and never swaps while the page loads.
 */
export function HeroCopy({ onStart, animate }: HeroCopyProps) {
  const enter = (delay: number, y = 20) =>
    animate
      ? {
          initial: { opacity: 0, y },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.6, delay },
        }
      : { initial: false as const }

  return (
    <div className="relative z-10 flex min-h-[85vh] flex-col justify-center px-6 py-24 sm:min-h-[90vh] sm:px-10 lg:px-16">
      <svg className="absolute inset-0 h-0 w-0" aria-hidden="true" focusable="false">
        <defs>
          <filter id="glass-effect" x="-50%" y="-50%" width="200%" height="200%">
            <feTurbulence baseFrequency="0.005" numOctaves="1" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="0.3" />
          </filter>
          <filter id="text-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      </svg>

      <div className="mx-auto w-full max-w-4xl">
        <motion.div
          className="relative inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 backdrop-blur-sm"
          style={{ filter: 'url(#glass-effect)' }}
          {...enter(0.2)}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-[#12859B]" aria-hidden="true" />
          <span className="text-sm font-medium tracking-wide text-white/90">
            L&amp;D Assessment
          </span>
        </motion.div>

        <motion.h1
          className="mt-6 text-4xl font-bold leading-[1.05] tracking-tight text-white min-[375px]:text-5xl sm:text-6xl lg:text-7xl"
          {...enter(0.4, 30)}
        >
          <span
            className="block text-xl font-light tracking-wide text-white/80 min-[375px]:text-2xl sm:text-3xl"
            style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #12859B 50%, #ffffff 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              filter: 'url(#text-glow)',
            }}
          >
            Understand your
          </span>
          <span className="block">{renderHeroLine('L&D function.')}</span>
          <span className="block font-light italic text-white/80">Find your direction.</span>
        </motion.h1>

        <motion.div className="mt-7 max-w-xl" {...enter(0.7)}>
          {chapter.lines.map((line) => (
            <p key={line} className="text-lg leading-8 text-white/70">
              {renderHeroLine(line)}
            </p>
          ))}
        </motion.div>

        <motion.div className="mt-9 flex flex-wrap items-center gap-4" {...enter(0.9)}>
          <button type="button" onClick={onStart} className="btn-on-dark-primary">
            Get Started
          </button>
          <a href="#discover" className="btn-on-dark-secondary">
            See how it works
          </a>
        </motion.div>

        <motion.div
          className="mt-8 flex flex-wrap gap-x-8 gap-y-2 text-sm text-white/60"
          {...enter(1.1, 0)}
        >
          {HERO_STATS.map((stat) => (
            <span key={stat} className="flex items-center gap-2">
              <span className="h-1 w-1 rounded-full bg-white/40" aria-hidden="true" />
              {stat}
            </span>
          ))}
        </motion.div>
      </div>
    </div>
  )
}
