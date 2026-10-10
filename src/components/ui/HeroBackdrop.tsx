// Fixed, deterministic star positions — no Math.random() at render time, so
// the pattern doesn't shift between renders/hydration.
const STARS = Array.from({ length: 60 }, (_, i) => {
  const seed = i * 137.51 // golden-angle spacing gives an even, non-grid spread
  return {
    x: (seed * 7.3) % 100,
    y: (seed * 3.1) % 100,
    r: 0.4 + ((i * 13) % 10) / 10,
    opacity: 0.25 + ((i * 7) % 10) / 14,
  }
})

/**
 * Static navy/teal background behind the hero copy. It is always rendered,
 * so it shows while the shader chunk loads and stays as the whole background
 * when WebGL is unavailable, the device is constrained, the shader fails, or
 * the user has asked for reduced motion.
 */
export function HeroBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 20% 20%, rgba(32,90,158,0.35), transparent 55%), radial-gradient(circle at 80% 80%, rgba(18,133,155,0.28), transparent 55%)',
        }}
      />
      <svg className="absolute inset-0 h-full w-full" focusable="false">
        {STARS.map((star, i) => (
          <circle
            key={i}
            cx={`${star.x}%`}
            cy={`${star.y}%`}
            r={star.r}
            fill="white"
            opacity={star.opacity}
          />
        ))}
      </svg>
    </div>
  )
}
