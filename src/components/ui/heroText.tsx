import type { ReactNode } from 'react'

const NO_WRAP_PHRASE = /L&D (function|priority)/

/**
 * Keeps "L&D function" and "L&D priority" from splitting across a line wrap
 * at narrow viewport widths.
 */
export function renderHeroLine(text: string): ReactNode {
  const match = text.match(NO_WRAP_PHRASE)
  if (!match || match.index === undefined) return text
  const idx = match.index

  return (
    <>
      {text.slice(0, idx)}
      <span className="whitespace-nowrap">{match[0]}</span>
      {text.slice(idx + match[0].length)}
    </>
  )
}
