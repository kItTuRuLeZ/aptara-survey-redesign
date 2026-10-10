import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LeadForm } from './LeadForm'

async function fillValid(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Name'), 'Priya Shah')
  await user.type(screen.getByLabelText('Work email'), 'priya@example.com')
  await user.type(screen.getByLabelText('Company'), 'Example Co')
  await user.click(screen.getByRole('checkbox'))
}

describe('LeadForm', () => {
  it('shows inline errors and does not submit when fields are missing', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<LeadForm onSubmit={onSubmit} />)

    await user.click(screen.getByRole('button', { name: 'Send request' }))

    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.getByText('Enter your name.')).toBeInTheDocument()
    expect(screen.getByText('Please confirm you agree so we can follow up.')).toBeInTheDocument()
    expect(screen.getByLabelText('Name')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByLabelText('Name')).toHaveFocus()
  })

  it('rejects a malformed email', async () => {
    const user = userEvent.setup()
    render(<LeadForm onSubmit={vi.fn()} />)
    await fillValid(user)
    await user.clear(screen.getByLabelText('Work email'))
    await user.type(screen.getByLabelText('Work email'), 'not-an-email')
    await user.click(screen.getByRole('button', { name: 'Send request' }))
    expect(screen.getByText(/Enter a valid email/)).toBeInTheDocument()
  })

  it('submits valid details and confirms', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    render(<LeadForm onSubmit={onSubmit} />)
    await fillValid(user)
    await user.click(screen.getByRole('button', { name: 'Send request' }))

    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Priya Shah',
      email: 'priya@example.com',
      company: 'Example Co',
      message: '',
    })
    expect(await screen.findByRole('status')).toHaveTextContent('Thanks, Priya')
  })

  it('keeps the details and offers a retry when sending fails', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn().mockRejectedValue(new Error('network'))
    render(<LeadForm onSubmit={onSubmit} />)
    await fillValid(user)
    await user.click(screen.getByRole('button', { name: 'Send request' }))

    expect(await screen.findByRole('alert')).toHaveTextContent("couldn't send")
    expect(screen.getByLabelText('Name')).toHaveValue('Priya Shah')
    expect(screen.getByRole('button', { name: 'Send request' })).toBeEnabled()
  })
})
