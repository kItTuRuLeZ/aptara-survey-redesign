import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('../../lib/webgl', () => ({
  isWebGLAvailable: vi.fn(),
}))
vi.mock('../../lib/deviceCapability', () => ({
  shouldSkip3D: vi.fn(),
}))
vi.mock('../../lib/useReducedMotion', () => ({
  useReducedMotion: vi.fn(),
}))

const shaderHeroState = vi.hoisted(() => ({ shouldThrow: false }))
vi.mock('./shaderHero', () => ({
  ShaderHero: () => {
    if (shaderHeroState.shouldThrow) {
      throw new Error('shader init failed')
    }
    return <div data-testid="hero-3d" />
  },
}))

import { isWebGLAvailable } from '../../lib/webgl'
import { shouldSkip3D } from '../../lib/deviceCapability'
import { useReducedMotion } from '../../lib/useReducedMotion'
import { Hero } from './Hero'

const mockIsWebGLAvailable = vi.mocked(isWebGLAvailable)
const mockShouldSkip3D = vi.mocked(shouldSkip3D)
const mockUseReducedMotion = vi.mocked(useReducedMotion)

describe('Hero', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    shaderHeroState.shouldThrow = false
  })

  it('renders the shader hero when WebGL is supported and the device is not constrained', async () => {
    mockIsWebGLAvailable.mockReturnValue(true)
    mockShouldSkip3D.mockReturnValue(false)
    mockUseReducedMotion.mockReturnValue(false)

    render(<Hero onStart={vi.fn()} />)

    expect(await screen.findByTestId('hero-3d')).toBeInTheDocument()
  })

  it('shows the same heading and CTA while the shader loads as after, so the layout never swaps', async () => {
    mockIsWebGLAvailable.mockReturnValue(true)
    mockShouldSkip3D.mockReturnValue(false)
    mockUseReducedMotion.mockReturnValue(false)

    render(<Hero onStart={vi.fn()} />)

    // The copy is in the first render, without waiting for the lazy shader.
    const heading = screen.getByRole('heading', { level: 1 })
    const cta = screen.getByRole('button', { name: /start the assessment/i })
    expect(heading).toHaveTextContent(/Discover your next\s*L&D priority\./)

    // Once it resolves, the very same elements are still mounted.
    await screen.findByTestId('hero-3d')
    expect(screen.getByRole('heading', { level: 1 })).toBe(heading)
    expect(screen.getByRole('button', { name: /start the assessment/i })).toBe(cta)
  })

  it('renders the static fallback when WebGL is unavailable, and the primary CTA still works', async () => {
    mockIsWebGLAvailable.mockReturnValue(false)
    mockShouldSkip3D.mockReturnValue(false)
    mockUseReducedMotion.mockReturnValue(false)
    const onStart = vi.fn()

    render(<Hero onStart={onStart} />)

    expect(screen.queryByTestId('hero-3d')).not.toBeInTheDocument()
    const cta = await screen.findByRole('button', { name: /start the assessment/i })
    await userEvent.click(cta)
    expect(onStart).toHaveBeenCalledOnce()
  })

  it('renders the static fallback when the device is constrained, even if WebGL is supported', async () => {
    mockIsWebGLAvailable.mockReturnValue(true)
    mockShouldSkip3D.mockReturnValue(true)
    mockUseReducedMotion.mockReturnValue(false)

    render(<Hero onStart={vi.fn()} />)

    expect(screen.queryByTestId('hero-3d')).not.toBeInTheDocument()
    expect(await screen.findByRole('button', { name: /start the assessment/i })).toBeInTheDocument()
  })

  it('renders the static fallback when prefers-reduced-motion is set', async () => {
    mockIsWebGLAvailable.mockReturnValue(true)
    mockShouldSkip3D.mockReturnValue(false)
    mockUseReducedMotion.mockReturnValue(true)

    render(<Hero onStart={vi.fn()} />)

    expect(screen.queryByTestId('hero-3d')).not.toBeInTheDocument()
    expect(await screen.findByRole('button', { name: /start the assessment/i })).toBeInTheDocument()
  })

  it('falls back to the static hero when the shader hero throws during render, and the CTA remains usable', async () => {
    mockIsWebGLAvailable.mockReturnValue(true)
    mockShouldSkip3D.mockReturnValue(false)
    mockUseReducedMotion.mockReturnValue(false)
    shaderHeroState.shouldThrow = true
    const onStart = vi.fn()
    // React logs the error to the console by default; silence it for this test.
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(<Hero onStart={onStart} />)

    await waitFor(() => {
      expect(screen.queryByTestId('hero-3d')).not.toBeInTheDocument()
    })
    const cta = screen.getByRole('button', { name: /start the assessment/i })
    await userEvent.click(cta)
    expect(onStart).toHaveBeenCalledOnce()

    consoleError.mockRestore()
  })
})
