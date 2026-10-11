import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// The landing hero's WebGL background isn't needed to test the flow.
vi.mock('./components/ui/Hero', () => ({
  Hero: ({ onStart }: { onStart: () => void }) => (
    <button type="button" onClick={onStart}>
      Start the assessment
    </button>
  ),
}))

import App from './App'

// jsdom has neither; the landing page's scroll-in fades and step changes use them.
class NoopObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return []
  }
}
vi.stubGlobal('IntersectionObserver', NoopObserver)
window.scrollTo = vi.fn() as unknown as typeof window.scrollTo

const STORAGE_KEY = 'aptara-assessment-state'

async function start(user: ReturnType<typeof userEvent.setup>) {
  render(<App />)
  await user.click((await screen.findAllByRole('button', { name: /start the assessment/i }))[0])
}

const continueButton = () => screen.getByRole('button', { name: /continue|see my result/i })

async function answerAll(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('radio', { name: /Developing/ }))
  await user.click(continueButton())
  await user.click(screen.getByRole('radio', { name: /Content upkeep/ }))
  await user.click(continueButton())
  await user.click(screen.getByRole('checkbox', { name: /In-person ILT/ }))
  await user.click(screen.getByRole('checkbox', { name: /Self-paced eLearning/ }))
  await user.click(screen.getByRole('checkbox', { name: /Microlearning/ }))
  await user.click(continueButton())
  await user.click(screen.getByRole('radio', { name: /Small team/ }))
  await user.click(screen.getByRole('radio', { name: /our own people and external partners/ }))
  await user.click(continueButton())
  await user.click(screen.getByRole('radio', { name: /Business impact/ }))
  await user.click(continueButton())
}

describe('assessment flow', () => {
  beforeEach(() => {
    sessionStorage.clear()
    vi.useRealTimers()
  })
  afterEach(() => sessionStorage.clear())

  it('keeps Continue unavailable until every input on the step is complete', async () => {
    const user = userEvent.setup()
    await start(user)
    expect(continueButton()).toBeDisabled()
    await user.click(screen.getByRole('radio', { name: /Foundational/ }))
    await user.click(continueButton())
    await user.click(screen.getByRole('radio', { name: /Delivery capacity/ }))
    await user.click(continueButton())

    // Multi-select: needs at least one; unticking the last disables it again.
    expect(screen.getByText('Select all that apply.')).toBeInTheDocument()
    const ilt = screen.getByRole('checkbox', { name: /In-person ILT/ })
    await user.click(ilt)
    expect(continueButton()).toBeEnabled()
    await user.click(ilt)
    expect(continueButton()).toBeDisabled()
    await user.click(ilt)
    await user.click(continueButton())

    // Team step: both inputs are required.
    expect(screen.getByRole('heading', { level: 1, name: 'Your team' })).toHaveFocus()
    await user.click(screen.getByRole('radio', { name: /No dedicated internal L&D team/ }))
    expect(continueButton()).toBeDisabled()
    expect(screen.getByText('Answer both questions to continue')).toBeInTheDocument()
    await user.click(screen.getByRole('radio', { name: /Mainly by external partners/ }))
    expect(continueButton()).toBeEnabled()
  })

  it('keeps the other selections when one delivery method is deselected, through to the result', async () => {
    const user = userEvent.setup()
    await start(user)
    await user.click(screen.getByRole('radio', { name: /Established/ }))
    await user.click(continueButton())
    await user.click(screen.getByRole('radio', { name: /Content upkeep/ }))
    await user.click(continueButton())
    for (const name of [/In-person ILT/, /Virtual instructor-led/, /Self-paced eLearning/]) {
      await user.click(screen.getByRole('checkbox', { name }))
    }
    await user.click(screen.getByRole('checkbox', { name: /Virtual instructor-led/ }))
    expect(screen.getByRole('checkbox', { name: /In-person ILT/ })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: /Self-paced eLearning/ })).toBeChecked()
    await user.click(continueButton())

    // Previous keeps every answer.
    await user.click(screen.getByRole('button', { name: /previous/i }))
    expect(screen.getByRole('checkbox', { name: /In-person ILT/ })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: /Virtual instructor-led/ })).not.toBeChecked()
    await user.click(continueButton())

    await user.click(screen.getByRole('radio', { name: /Large team/ }))
    await user.click(screen.getByRole('radio', { name: /our own people and external partners/ }))
    await user.click(continueButton())
    await user.click(screen.getByRole('radio', { name: /Quality and consistency/ }))
    await user.click(continueButton())

    const responses = await screen.findByRole('region', { name: /your responses/i })
    expect(within(responses).getByText('In-person ILT')).toBeInTheDocument()
    expect(within(responses).getByText('Self-paced eLearning')).toBeInTheDocument()
    expect(within(responses).queryByText('Virtual ILT')).not.toBeInTheDocument()
    expect(within(responses).getByText('Large team')).toBeInTheDocument()
    expect(within(responses).getByText('Mixed')).toBeInTheDocument()
    expect(within(responses).getByText('Quality and consistency')).toBeInTheDocument()
    expect(screen.getByText(/In-person ILT and Self-paced eLearning/)).toBeInTheDocument()
  })

  it('restores the same step and answers after a refresh halfway through', async () => {
    const user = userEvent.setup()
    await start(user)
    await user.click(screen.getByRole('radio', { name: /Optimizing/ }))
    await user.click(continueButton())
    await user.click(screen.getByRole('radio', { name: /Learner engagement/ }))
    await user.click(continueButton())
    await user.click(screen.getByRole('checkbox', { name: /Microlearning/ }))

    document.body.innerHTML = ''
    render(<App />)
    expect(await screen.findByRole('checkbox', { name: /Microlearning/ })).toBeChecked()
    expect(screen.getByText(/Step 3 of 5/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /previous/i }))
    expect(screen.getByRole('radio', { name: /Learner engagement/ })).toBeChecked()
  })

  it('restores the result after a refresh, recomposed from the saved answers', async () => {
    const user = userEvent.setup()
    await start(user)
    await answerAll(user)
    const title = (await screen.findByRole('heading', { level: 1 })).textContent
    expect(JSON.parse(sessionStorage.getItem(STORAGE_KEY)!).view).toBe('results')

    document.body.innerHTML = ''
    render(<App />)
    expect(await screen.findByRole('heading', { level: 1, name: title! })).toBeInTheDocument()
  })

  it('recovers safely from malformed stored state, without a fabricated result', async () => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 2, view: 'results', currentIndex: 4, answers: { Q1: 'A' } }))
    render(<App />)
    expect(await screen.findAllByRole('button', { name: /start the assessment/i })).not.toHaveLength(0)
    expect(screen.queryByRole('heading', { level: 1, name: /your next l&d priority/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /top priorities/i })).not.toBeInTheDocument()
  })

  it('Start over clears answers, the result and saved state', async () => {
    const user = userEvent.setup()
    await start(user)
    await answerAll(user)
    await screen.findByRole('heading', { name: /top priorities/i })
    await user.click(screen.getByRole('button', { name: /start over/i }))
    expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull()

    await user.click(screen.getAllByRole('button', { name: /start the assessment/i })[0])
    expect(screen.getByRole('radio', { name: /Developing/ })).not.toBeChecked()
    expect(continueButton()).toBeDisabled()
  })

  it('does not claim success when the clipboard is blocked, and offers the text to copy by hand', async () => {
    const user = userEvent.setup()
    await start(user)
    await answerAll(user)
    await screen.findByRole('heading', { name: /top priorities/i })
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockRejectedValue(new Error('denied')) },
    })
    await user.click(screen.getByRole('button', { name: /copy summary/i }))
    expect(await screen.findByText(/didn't allow copying/)).toBeInTheDocument()
    expect(screen.queryByText(/copied to your clipboard/i)).not.toBeInTheDocument()
    const fallback = screen.getByLabelText('Your summary') as HTMLTextAreaElement
    expect(fallback.value).toContain('In-person ILT, Self-paced eLearning, Microlearning')
    expect(fallback.value).toContain('Next 90 days:')
  })

  it('copies the full plain-text summary when the clipboard works', async () => {
    const user = userEvent.setup()
    await start(user)
    await answerAll(user)
    await screen.findByRole('heading', { name: /top priorities/i })
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } })
    await user.click(screen.getByRole('button', { name: /copy summary/i }))
    expect(await screen.findByText(/copied to your clipboard/i)).toBeInTheDocument()
    const text = writeText.mock.calls[0][0] as string
    for (const part of ['TOP PRIORITIES', 'Why this matters for you', 'Delivery methods: In-person ILT, Self-paced eLearning, Microlearning', 'Internal team: Small team', 'Sourcing: Mixed', 'Business goal: Business impact', 'Next 30 days:', 'Next 90 days:']) {
      expect(text).toContain(part)
    }
  })
})
