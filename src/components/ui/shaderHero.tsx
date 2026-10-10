import { motion } from 'framer-motion'
import { MeshGradient } from '@paper-design/shaders-react'
import { HERO_CHAPTERS, HERO_STATS } from './heroContent'
import { renderHeroLine } from './heroText'

interface ShaderHeroProps {
  onStart: () => void
}

/**
 * Note: MeshGradient/PulsingBorder create their own WebGL context inside an
 * effect, with no onError prop to hook into. Hero.tsx's pre-mount capability
 * check (isWebGLAvailable + shouldSkip3D + reduced-motion) is the primary
 * defense against that; HeroErrorBoundary catches any synchronous
 * render-phase throw as a second layer, same as the previous 3D hero.
 */
const [heroChapter] = HERO_CHAPTERS

export function ShaderHero({ onStart }: ShaderHeroProps) {
  const chapter = heroChapter

  return (
    <div className="relative min-h-[85vh] w-full overflow-hidden bg-[#040d1c] sm:min-h-[90vh]">
      <svg className="absolute inset-0 h-0 w-0">
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

      <MeshGradient
        className="absolute inset-0 h-full w-full"
        colors={['#040d1c', '#071d3d', '#12859B', '#205A9E', '#040d1c']}
        speed={0.3}
        distortion={0.8}
        swirl={0.3}
      />
      <MeshGradient
        className="absolute inset-0 h-full w-full opacity-40"
        colors={['#040d1c', '#ffffff', '#12859B']}
        speed={0.15}
        distortion={0.4}
        swirl={0.6}
      />

      <div className="relative z-10 flex min-h-[85vh] flex-col justify-center px-6 py-24 sm:min-h-[90vh] sm:px-10 lg:px-16">
        <div className="mx-auto w-full max-w-4xl">
          <motion.div
            className="relative inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 backdrop-blur-sm"
            style={{ filter: 'url(#glass-effect)' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[#12859B]" aria-hidden="true" />
            <span className="text-sm font-medium tracking-wide text-white/90">
              L&amp;D Assessment
            </span>
          </motion.div>

          <motion.h1
            className="mt-6 text-4xl font-bold leading-[1.05] tracking-tight text-white min-[375px]:text-5xl sm:text-6xl lg:text-7xl"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
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

          <motion.div
            className="mt-7 max-w-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
          >
            {chapter.lines.map((line) => (
              <p key={line} className="text-lg leading-8 text-white/70">
                {renderHeroLine(line)}
              </p>
            ))}
          </motion.div>

          <motion.div
            className="mt-9 flex flex-wrap items-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.9 }}
          >
            <button type="button" onClick={onStart} className="btn-on-dark-primary">
              Get Started
            </button>
            <a href="#discover" className="btn-on-dark-secondary">
              See how it works
            </a>
          </motion.div>

          <motion.div
            className="mt-8 flex flex-wrap gap-x-8 gap-y-2 text-sm text-white/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.1 }}
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
    </div>
  )
}
