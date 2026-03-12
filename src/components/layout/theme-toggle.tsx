"use client";

import { MoonStar, SunMedium } from "lucide-react";
import { useRef } from "react";

import { cn } from "@/lib/utils";

import { useTheme } from "./theme-provider";

export function ThemeToggle({
  className,
}: {
  className?: string;
}) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { mounted, theme, toggleTheme, isTransitioning } = useTheme();

  function handleToggle() {
    const rect = buttonRef.current?.getBoundingClientRect();
    toggleTheme(
      rect
        ? {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
          }
        : undefined,
    );
  }

  return (
    <button
      ref={buttonRef}
      type="button"
      aria-pressed={mounted ? theme === "light" : undefined}
      aria-label={mounted && theme === "dark" ? "切换到浅色模式" : "切换到深色模式"}
      onClick={handleToggle}
      disabled={!mounted || isTransitioning}
      className={cn(
        "group relative flex h-10 w-10 items-center justify-center rounded-full border border-border/70 bg-bg-elevated/78 text-text-primary shadow-[0_14px_28px_-22px_rgba(15,15,16,0.28)] transition duration-300 hover:-translate-y-0.5 hover:border-border-hover hover:bg-bg-hover disabled:cursor-default disabled:opacity-80",
        className,
      )}
    >
      <SunMedium
        className={cn(
          "absolute size-[18px] transition duration-300 ease-out",
          mounted && theme === "light"
            ? "scale-100 rotate-0 opacity-100 text-amber-500"
            : "scale-75 -rotate-45 opacity-0 text-amber-500",
        )}
      />
      <MoonStar
        className={cn(
          "absolute size-[18px] transition duration-300 ease-out",
          mounted && theme === "dark"
            ? "scale-100 rotate-0 opacity-100 text-sky-100"
            : "scale-75 rotate-45 opacity-0 text-sky-100",
        )}
      />
    </button>
  );
}
