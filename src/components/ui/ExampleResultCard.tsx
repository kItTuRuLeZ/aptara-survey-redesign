import { EXAMPLE_RESULT } from '../../lib/exampleResult'

/**
 * A compact, clearly illustrative preview of a result, beside the hero copy
 * on wide screens and below the start button on narrow ones. Built from the
 * same rules as a real result (see lib/exampleResult).
 */
export function ExampleResultCard() {
  return (
    <aside
      aria-labelledby="example-result-title"
      className="rounded-2xl border border-white/20 bg-white p-5 text-left shadow-2xl shadow-black/30 sm:p-6"
    >
      <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-q5">
        <span className="h-1.5 w-1.5 rounded-full bg-q5" aria-hidden="true" />
        Example result
      </p>
      <h2 id="example-result-title" className="mt-2 text-xl font-semibold leading-snug text-navy">
        {EXAMPLE_RESULT.title}
      </h2>
      <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-700">
        <div className="flex gap-1">
          <dt>Stage:</dt>
          <dd className="font-semibold text-navy">{EXAMPLE_RESULT.stage}</dd>
        </div>
        <div className="flex gap-1">
          <dt>Goal:</dt>
          <dd className="font-semibold text-navy">{EXAMPLE_RESULT.goal}</dd>
        </div>
      </dl>

      <h3 className="mt-5 text-xs font-bold uppercase tracking-wide text-slate-600">Top priorities</h3>
      <ol className="mt-2 grid gap-2 text-sm text-slate-800">
        {EXAMPLE_RESULT.priorities.map((p, i) => (
          <li key={p} className="flex items-start gap-2.5">
            <span
              className="mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-q4-tint text-xs font-bold text-q4-ink"
              aria-hidden="true"
            >
              {i + 1}
            </span>
            {p}
          </li>
        ))}
      </ol>

      <p className="mt-5 rounded-lg bg-slate-50 px-3.5 py-3 text-sm leading-6 text-slate-700">
        <span className="font-semibold text-navy">First 30 days: </span>
        {EXAMPLE_RESULT.next30}
      </p>
      <p className="mt-4 text-xs leading-5 text-slate-600">Illustrative only. Your result depends on your answers.</p>
    </aside>
  )
}
