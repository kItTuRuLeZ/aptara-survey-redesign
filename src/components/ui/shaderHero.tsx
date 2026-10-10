import { motion } from 'framer-motion'
import { MeshGradient } from '@paper-design/shaders-react'

/**
 * The animated WebGL background, loaded as its own chunk. It fades in over
 * the static backdrop, so the hero copy in front never moves or re-renders
 * when it arrives.
 *
 * Note: MeshGradient creates its own WebGL context inside an effect, with no
 * onError prop to hook into. Hero.tsx's pre-mount capability check
 * (isWebGLAvailable + shouldSkip3D + reduced-motion) is the primary defense;
 * HeroErrorBoundary catches any synchronous render-phase throw as a second
 * layer.
 */
export function ShaderHero() {
  return (
    <motion.div
      className="pointer-events-none absolute inset-0"
      aria-hidden="true"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.2, ease: 'easeOut' }}
    >
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
    </motion.div>
  )
}
