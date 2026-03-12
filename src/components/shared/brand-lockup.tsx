import Image from "next/image";

import { cn } from "@/lib/utils";

const sizeClasses = {
  sm: {
    px: 32,
    src: "/brand/logo-72.png",
    mark: "h-8 w-8 rounded-[10px]",
    text: "text-sm tracking-[0.14em]",
  },
  md: {
    px: 36,
    src: "/brand/logo-72.png",
    mark: "h-9 w-9 rounded-[12px]",
    text: "text-base tracking-[0.16em]",
  },
  lg: {
    px: 48,
    src: "/brand/logo-96.png",
    mark: "h-12 w-12 rounded-[16px]",
    text: "text-lg tracking-[0.18em]",
  },
} as const;

export function BrandLockup({
  className,
  markClassName,
  size = "md",
  showWordmark = true,
}: {
  className?: string;
  markClassName?: string;
  size?: keyof typeof sizeClasses;
  showWordmark?: boolean;
}) {
  const sizeClass = sizeClasses[size];

  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span
        className={cn(
          "relative block overflow-hidden border border-black/5 shadow-[0_16px_28px_-22px_rgba(15,15,16,0.35)]",
          sizeClass.mark,
          markClassName,
        )}
      >
        <Image
          src={sizeClass.src}
          alt="Munch logo"
          width={sizeClass.px}
          height={sizeClass.px}
          unoptimized
          priority={size !== "sm"}
          className="h-full w-full object-contain"
        />
      </span>
      {showWordmark ? <span className={cn("font-semibold text-text-primary", sizeClass.text)}>Munch</span> : null}
    </span>
  );
}
