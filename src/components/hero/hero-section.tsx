"use client";

export function HeroSection() {
  return (
    <section
      className="relative flex h-[280px] items-center justify-center overflow-hidden sm:h-[320px] lg:h-[400px]"
      style={{
        background:
          "radial-gradient(ellipse at 30% 20%, rgba(193,39,45,0.18), transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(100,100,255,0.08), transparent 50%), var(--bg-base)",
      }}
    >
      <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
        <p className="text-5xl font-bold tracking-[0.3em] text-text-primary lg:text-6xl">MUNCH</p>
        <p className="mt-3 text-lg text-text-secondary">Where Vision Becomes Visual</p>
        <p className="mt-2 text-sm text-text-tertiary">把脑海里的画面，变成眼前的作品</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {["选模板", "调参数", "出成片"].map((item) => (
            <span
              key={item}
              className="rounded-full border border-border/70 bg-glass-bg px-4 py-2 text-xs uppercase tracking-[0.24em] text-text-secondary backdrop-blur-xl"
            >
              {item}
            </span>
          ))}
        </div>
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 hero-gradient" />
    </section>
  );
}
