import { useId, useRef } from 'react'

interface StartOverButtonProps {
  /** When there is nothing to lose, Start over acts at once with no question. */
  hasProgress: boolean
  onConfirm: () => void
  className?: string
  children: React.ReactNode
}

/**
 * Start over, with a confirmation when answers or a result would be lost.
 * Uses the native modal <dialog>, which traps focus, closes on Escape and
 * hides the page behind it from assistive technology. "Keep my answers" has
 * the initial focus, and focus returns to the button after cancelling.
 */
export function StartOverButton({ hasProgress, onConfirm, className, children }: StartOverButtonProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)
  const confirmed = useRef(false)
  const titleId = useId()
  const messageId = useId()

  function handleClick() {
    if (!hasProgress) {
      onConfirm()
      return
    }
    confirmed.current = false
    dialogRef.current?.showModal()
    cancelRef.current?.focus()
  }

  function handleConfirm() {
    confirmed.current = true
    dialogRef.current?.close()
    onConfirm()
  }

  return (
    <>
      <button ref={triggerRef} type="button" onClick={handleClick} className={className}>
        {children}
      </button>
      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        aria-describedby={messageId}
        onClose={() => {
          if (!confirmed.current) triggerRef.current?.focus()
        }}
        className="m-auto w-[calc(100%-2.5rem)] max-w-sm rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-2xl backdrop:bg-[rgba(7,29,61,0.6)] print:hidden"
      >
        <h2 id={titleId} className="text-lg font-semibold text-navy">
          Start a new assessment?
        </h2>
        <p id={messageId} className="mt-2 text-base leading-6 text-slate-700">
          This will clear your current answers and result.
        </p>
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button
            ref={cancelRef}
            type="button"
            onClick={() => dialogRef.current?.close()}
            className="btn-secondary min-h-11 px-5 py-2.5"
          >
            Keep my answers
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="btn min-h-11 bg-q3 px-5 py-2.5 text-white hover:bg-q3-ink"
          >
            Start over
          </button>
        </div>
      </dialog>
    </>
  )
}
