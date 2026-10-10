interface HeaderProps {
  /** Shorter bar while answering questions, to leave room for the answers. */
  compact?: boolean
}

export function Header({ compact = false }: HeaderProps) {
  return (
    <header className="bg-navy">
      <div
        className={`mx-auto flex max-w-5xl items-center justify-between px-5 sm:px-7 ${
          compact ? 'h-14' : 'h-[74px]'
        }`}
      >
        <img
          src={`${import.meta.env.BASE_URL}aptaraLogo.png`}
          alt="Aptara"
          className={`w-auto object-contain ${compact ? 'h-5' : 'h-6 sm:h-7'}`}
        />
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/75 sm:text-xs">
          L&amp;D Assessment
        </span>
      </div>
    </header>
  )
}
