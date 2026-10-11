import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'

afterEach(() => {
  cleanup()
})

// jsdom's modal dialog doesn't move focus or close on Escape. Stand in with
// what the browser's native <dialog> does.
if (typeof HTMLDialogElement !== 'undefined') {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.open = true
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      document.removeEventListener('keydown', onKey)
      this.close()
    }
    document.addEventListener('keydown', onKey)
  }
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    if (!this.open) return
    this.open = false
    this.dispatchEvent(new Event('close'))
  }
}
