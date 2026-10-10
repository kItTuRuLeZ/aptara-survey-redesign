import { Component, type ErrorInfo, type ReactNode } from 'react'

interface HeroErrorBoundaryProps {
  fallback: ReactNode
  children: ReactNode
}

interface HeroErrorBoundaryState {
  hasError: boolean
}

/**
 * Catches synchronous render-phase errors from the shader background.
 * This is defense-in-depth, not the primary safety net — Three.js
 * initialization happens inside a useEffect, and React error boundaries do
 * not catch errors thrown from effects. The primary protection is the
 * pre-mount WebGL/device check plus the try/catch + onError callback inside
 * the hero component itself (see Hero.tsx and horizon-hero-section.tsx).
 */
export class HeroErrorBoundary extends Component<
  HeroErrorBoundaryProps,
  HeroErrorBoundaryState
> {
  state: HeroErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): HeroErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Hero render error, falling back to static hero:', error, info)
  }

  render() {
    if (this.state.hasError) return this.props.fallback
    return this.props.children
  }
}
