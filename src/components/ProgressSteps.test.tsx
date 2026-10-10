import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ProgressSteps } from './ProgressSteps'
import { content } from '../content'

const questions = content.questions

describe('ProgressSteps', () => {
  it('shows one line of progress and counts only answered questions', () => {
    render(<ProgressSteps questions={questions} currentCode="Q2" currentIndex={1} />)
    expect(screen.getByText(/Question 2 of 5/)).toHaveTextContent('Question 2 of 5 · : Business Pain Points')
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '1')
  })

  it('says "Final question" on the last step instead of implying completion', () => {
    render(<ProgressSteps questions={questions} currentCode="Q5" currentIndex={4} />)
    expect(screen.getByText(/Final question/)).toBeInTheDocument()
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuetext', '4 of 5 questions answered')
  })
})
