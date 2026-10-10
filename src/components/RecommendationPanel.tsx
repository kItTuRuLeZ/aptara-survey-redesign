interface RecommendationPanelProps {
  next30: string
  next90: string
}

export function RecommendationPanel({ next30, next90 }: RecommendationPanelProps) {
  return (
    <div className="grid gap-8 sm:grid-cols-2 print:gap-4">
      <div className="relative break-inside-avoid pl-11">
        <span className="absolute left-0 top-0 flex h-8 w-8 items-center justify-center rounded-full bg-q5 text-sm font-bold text-white print:border print:border-slate-500 print:bg-white print:text-slate-900">
          1
        </span>
        <h3 className="pt-1.5 text-sm font-bold uppercase tracking-[0.17em] text-q5">
          Next 30 days
        </h3>
        <p className="mt-2 text-base leading-7 text-slate-600">{next30}</p>
      </div>
      <div className="relative break-inside-avoid pl-11">
        <span className="absolute left-0 top-0 flex h-8 w-8 items-center justify-center rounded-full bg-q4 text-sm font-bold text-white print:border print:border-slate-500 print:bg-white print:text-slate-900">
          2
        </span>
        <h3 className="pt-1.5 text-sm font-bold uppercase tracking-[0.17em] text-q4-ink">
          Next 90 days
        </h3>
        <p className="mt-2 text-base leading-7 text-slate-600">{next90}</p>
      </div>
    </div>
  )
}
