import type { SummaryResponse } from '../lib/summary'
import { questionAccent } from '../theme/tokens'

interface ResponseSummaryProps {
  responses: SummaryResponse[]
}

/** Every response, including all selected delivery methods, team size, sourcing and goal. */
export function ResponseSummary({ responses }: ResponseSummaryProps) {
  return (
    <dl className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
      {responses.map((r) => {
        const accent = questionAccent(r.code)
        return (
          <div key={r.code} className="px-5 py-4 print:py-2">
            <dt
              className="flex items-center gap-3 text-xs font-bold uppercase tracking-wide"
              style={{ color: accent.ink }}
            >
              <span
                className="h-2 w-2 shrink-0 rounded-full print:hidden"
                style={{ backgroundColor: accent.accent }}
                aria-hidden="true"
              />
              {r.label}
            </dt>
            {r.texts.map((t, i) => (
              <dd key={t} className="mt-1 pl-5 text-base text-navy">
                <span className="font-semibold">{r.values[i]}</span>
                <span className="text-slate-600"> · {t}</span>
              </dd>
            ))}
          </div>
        )
      })}
    </dl>
  )
}
