"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

type GlowButtonSize = "lg" | "md" | "sm" | "icon";

export interface GlowButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: GlowButtonSize;
  loading?: boolean;
  children: React.ReactNode;
}

const frameClasses: Record<GlowButtonSize, string> = {
  lg: "h-12 rounded-xl",
  md: "h-10 rounded-lg",
  sm: "h-8 rounded-lg",
  icon: "h-11 w-11 rounded-full",
};

const innerClasses: Record<GlowButtonSize, string> = {
  lg: "px-6 text-base",
  md: "px-5 text-sm",
  sm: "px-4 text-xs",
  icon: "w-full px-0 text-sm",
};

export const GlowButton = React.forwardRef<HTMLButtonElement, GlowButtonProps>(
  (
    {
      children,
      className,
      disabled = false,
      loading = false,
      size = "md",
      style,
      type = "button",
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        className={cn(
          "inline-flex items-stretch justify-center overflow-hidden font-semibold text-white transition duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98]",
          "bg-brand shadow-[0_18px_36px_-22px_rgba(193,39,45,0.58)]",
          !loading && "hover:-translate-y-0.5 hover:bg-brand-hover",
          frameClasses[size],
          className,
        )}
        style={style}
        {...props}
      >
        <span
          className={cn(
            "inline-flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-[inherit] px-0 text-white transition duration-200 ease-out",
            loading && "animate-pulse",
            innerClasses[size],
          )}
        >
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              {size !== "icon" ? <span>处理中...</span> : null}
            </>
          ) : (
            children
          )}
        </span>
      </button>
    );
  },
);

GlowButton.displayName = "GlowButton";
