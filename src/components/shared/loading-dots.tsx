"use client";

import { cn } from "@/lib/utils";

interface LoadingDotsProps {
  label?: string;
  className?: string;
  tone?: "default" | "inverse";
  compact?: boolean;
}

export function LoadingDots({
  label = "加载中",
  className,
  tone = "default",
  compact = false,
}: LoadingDotsProps) {
  const dotClassName =
    tone === "inverse" ? "bg-white/72 shadow-[0_0_18px_rgba(255,255,255,0.2)]" : "bg-text-secondary/72";
  const labelClassName = tone === "inverse" ? "text-white/72" : "text-text-tertiary";

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "inline-flex flex-col items-center justify-center",
        compact ? "gap-2" : "gap-3",
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <span className={cn("loading-dot", dotClassName)} />
        <span className={cn("loading-dot [animation-delay:0.18s]", dotClassName)} />
        <span className={cn("loading-dot [animation-delay:0.36s]", dotClassName)} />
      </div>
      {label ? <p className={cn(compact ? "text-xs" : "text-sm", labelClassName)}>{label}</p> : null}
    </div>
  );
}
