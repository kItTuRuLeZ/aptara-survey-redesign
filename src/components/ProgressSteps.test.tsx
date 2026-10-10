import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ProgressSteps } from './ProgressSteps'

describe('ProgressSteps', () => {
  it('shows one line of progress and counts only completed steps', () => {
    render(<ProgressSteps total={5} currentIndex={1} name="Main challenge" accentCode="Q2" />)
    expect(screen.getByText(/Step 2 of 5/)).toHaveTextContent('Step 2 of 5 · : Main challenge')
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '1')
  })

  it('says "Final step" on the last step instead of implying completion', () => {
    render(<ProgressSteps total={5} currentIndex={4} name="Business goal" accentCode="Q6" />)
    expect(screen.getByText(/Final step/)).toBeInTheDocument()
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuetext', '4 of 5 steps complete')
  })
})
