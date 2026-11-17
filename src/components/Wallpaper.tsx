// Classy "Aurora Borealis" wallpaper — pure CSS/SVG, no image files.
// A dark teal-navy night sky with soft drifting green/teal/blue light curtains,
// a faint horizon glow, and a deterministic twinkling star field.

// Deterministic PRNG so the star field is stable across renders / hydration.
function mulberry32(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const rnd = mulberry32(20240602)
const STARS = Array.from({ length: 78 }, () => ({
  top: rnd() * 64, // keep stars in the upper sky
  left: rnd() * 100,
  size: 0.7 + rnd() * 1.8,
  delay: rnd() * 6,
  dur: 3 + rnd() * 5,
  op: 0.3 + rnd() * 0.6,
  bluish: rnd() > 0.7,
}))

export function Wallpaper() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* base night-sky gradient */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, #05121a 0%, #07202b 42%, #0a2a34 66%, #061a22 100%)',
        }}
      />

      {/* star field */}
      <div className="absolute inset-0">
        {STARS.map((s, i) => (
          <span
            key={i}
            className="absolute rounded-full"
            style={{
              top: `${s.top}%`,
              left: `${s.left}%`,
              width: `${s.size}px`,
              height: `${s.size}px`,
              background: s.bluish ? '#aee3ff' : '#eafff6',
              opacity: s.op,
              boxShadow: s.size > 1.8 ? '0 0 4px rgba(174,227,255,0.7)' : undefined,
              animation: `twinkle ${s.dur}s ease-in-out ${s.delay}s infinite`,
            }}
          />
        ))}
      </div>

      {/* aurora curtain — primary (green/teal) */}
      <div
        className="absolute -top-[12%] right-[-10%] left-[-10%] h-[80%] origin-top"
        style={{
          background:
            'radial-gradient(48% 65% at 28% 18%, rgba(67,224,143,0.26), transparent 72%),' +
            'radial-gradient(42% 80% at 55% 8%, rgba(31,214,192,0.22), transparent 72%),' +
            'radial-gradient(40% 70% at 78% 22%, rgba(79,156,246,0.18), transparent 72%)',
          filter: 'blur(34px)',
          mixBlendMode: 'screen',
          animation: 'aurora-drift 19s ease-in-out infinite alternate',
        }}
      />

      {/* aurora curtain — secondary (teal/blue), offset timing for depth */}
      <div
        className="absolute -top-[8%] right-[-12%] left-[-12%] h-[72%] origin-top"
        style={{
          background:
            'radial-gradient(40% 70% at 18% 14%, rgba(43,214,230,0.16), transparent 72%),' +
            'radial-gradient(46% 75% at 48% 24%, rgba(67,224,143,0.16), transparent 72%),' +
            'radial-gradient(38% 65% at 84% 12%, rgba(122,167,255,0.14), transparent 72%)',
          filter: 'blur(46px)',
          mixBlendMode: 'screen',
          animation: 'aurora-drift-2 25s ease-in-out infinite alternate',
        }}
      />

      {/* faint horizon glow grounding the scene */}
      <div
        className="absolute inset-x-0 bottom-0 h-[42%]"
        style={{
          background:
            'radial-gradient(120% 90% at 50% 120%, rgba(31,214,192,0.16), transparent 65%)',
        }}
      />

      {/* subtle vignette so windows + dock pop */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(120% 100% at 50% 38%, transparent 55%, rgba(4,12,16,0.55) 100%)',
        }}
      />
    </div>
  )
}
