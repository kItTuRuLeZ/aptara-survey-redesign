import { lazy, Suspense, useMemo } from 'react'
import { isWebGLAvailable } from '../../lib/webgl'
import { shouldSkip3D } from '../../lib/deviceCapability'
import { useReducedMotion } from '../../lib/useReducedMotion'
import { HeroErrorBoundary } from './HeroErrorBoundary'
import { HeroBackdrop } from './HeroBackdrop'
import { HeroCopy } from './HeroCopy'

const ShaderHero = lazy(() =>
  import('./shaderHero').then((m) => ({ default: m.ShaderHero })),
)

interface HeroProps {
  onStart: () => void
}

/**
 * Fires the same instant this module evaluates (before React has mounted
 * anything), rather than waiting for Hero's first render to reach the
 * Suspense boundary — starts the shader chunk's network request as early as
 * possible. React.lazy's later import() call to the same specifier reuses
 * this in-flight/cached module, so there's no double fetch.
 */
if (
  typeof window !== 'undefined' &&
  isWebGLAvailable() &&
  !shouldSkip3D() &&
  !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
) {
  import('./shaderHero')
}

/**
 * The hero copy is rendered once, in front of a static backdrop. Only the
 * animated shader background is lazy: it fades in behind the copy when its
 * chunk arrives, so the text never swaps layout while the page loads. Three
 * checks happen before the WebGL bundle is even requested (device-capability
 * heuristic, prefers-reduced-motion, WebGL feature detection), so
 * constrained devices and reduced-motion users never pay for the shader
 * chunk at all and keep the static backdrop.
 */
export function Hero({ onStart }: HeroProps) {
  const prefersReducedMotion = useReducedMotion()

  const canUseShader = useMemo(
    () => isWebGLAvailable() && !shouldSkip3D(),
    [],
  )
  const showShader = canUseShader && !prefersReducedMotion

  return (
    <div className="relative min-h-[85vh] w-full overflow-hidden bg-[#040d1c] sm:min-h-[90vh]">
      <HeroBackdrop />
      {showShader && (
        <HeroErrorBoundary fallback={null}>
          <Suspense fallback={null}>
            <ShaderHero />
          </Suspense>
        </HeroErrorBoundary>
      )}
      <HeroCopy onStart={onStart} animate={!prefersReducedMotion} />
    </div>
  )
}
