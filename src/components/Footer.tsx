export function Footer() {
  return (
    <footer className="bg-navy mt-4 print:hidden">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 px-5 py-7 sm:flex-row sm:px-7">
        <img
          src={`${import.meta.env.BASE_URL}aptaraLogo.png`}
          alt="Aptara"
          className="h-5 w-auto object-contain opacity-90"
        />
        <p className="text-[11px] text-white/50">
          &copy; 2026 Aptara. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
