"use client";

import type { LucideIcon } from "lucide-react";
import { BadgePercent, Camera, ChevronRight, LayoutGrid, Package2, Shirt, Soup, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";
import { useWorkspaceStore } from "@/stores/workspace-store";

const categories = [
  { value: null, label: "全部", icon: LayoutGrid },
  { value: "skincare", label: "护肤美容", icon: Sparkles },
  { value: "fashion", label: "服装穿搭", icon: Shirt },
  { value: "portrait", label: "时尚写真", icon: Camera },
  { value: "food", label: "食品饮品", icon: Soup },
  { value: "product", label: "通用产品", icon: Package2 },
  { value: "poster", label: "海报广告", icon: BadgePercent },
] as const;

function CategoryChip({
  active,
  label,
  icon: Icon,
  onClick,
}: {
  active: boolean;
  label: string;
  icon: LucideIcon;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cn(
        "group/item relative flex h-11 w-11 items-center justify-center rounded-2xl border transition-all duration-200",
        active
          ? "border-brand/25 bg-bg-elevated/92 text-text-primary shadow-[0_14px_28px_-22px_rgba(193,39,45,0.42)]"
          : "border-transparent bg-bg-base/48 text-text-tertiary hover:border-border-default hover:bg-bg-elevated/84 hover:text-text-secondary",
      )}
    >
      <Icon className="size-[18px]" strokeWidth={2} />
      <span
        className={cn(
          "pointer-events-none absolute left-[calc(100%+12px)] top-1/2 hidden -translate-y-1/2 whitespace-nowrap rounded-full border px-3 py-1.5 text-[12px] font-medium shadow-[0_14px_28px_-22px_rgba(15,15,16,0.36)] transition-all duration-200 xl:block",
          active
            ? "border-brand/18 bg-bg-elevated/96 text-text-primary"
            : "border-border/70 bg-bg-elevated/94 text-text-secondary",
          "translate-x-2 opacity-0 group-hover/item:translate-x-0 group-hover/item:opacity-100 group-focus-visible/item:translate-x-0 group-focus-visible/item:opacity-100",
        )}
      >
        {label}
      </span>
    </button>
  );
}

export function CategoryTabs() {
  const activeCategoryFilter = useWorkspaceStore((state) => state.activeCategoryFilter);
  const setCategoryFilter = useWorkspaceStore((state) => state.setCategoryFilter);

  return (
    <aside className="pointer-events-none fixed left-0 top-1/2 z-30 hidden -translate-y-1/2 xl:block">
      <div className="group/rail pointer-events-none relative w-[148px] pl-3">
        <div
          aria-hidden="true"
          className="pointer-events-auto absolute left-0 top-1/2 flex h-[372px] w-8 -translate-y-1/2 items-center justify-center rounded-r-[26px] border border-border/50 bg-bg-base/34 text-text-tertiary shadow-[0_18px_40px_-32px_rgba(15,15,16,0.34)] backdrop-blur-xl transition duration-300 group-hover/rail:scale-95 group-hover/rail:opacity-0 group-focus-within/rail:scale-95 group-focus-within/rail:opacity-0"
        >
          <ChevronRight className="size-3.5 transition duration-300 group-hover/rail:translate-x-0.5 group-focus-within/rail:translate-x-0.5" />
        </div>
        <div className="absolute left-3 top-1/2 h-[300px] w-px -translate-y-1/2 bg-gradient-to-b from-transparent via-border-default/55 to-transparent opacity-0 transition duration-300 group-hover/rail:opacity-100 group-focus-within/rail:opacity-100" />
        <div className="pointer-events-auto relative flex w-fit -translate-x-[56px] flex-col gap-2 rounded-r-[26px] border border-border/50 bg-bg-base/34 px-2 py-2 opacity-0 shadow-[0_18px_40px_-32px_rgba(15,15,16,0.34)] backdrop-blur-xl transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/rail:translate-x-0 group-hover/rail:opacity-100 group-focus-within/rail:translate-x-0 group-focus-within/rail:opacity-100">
          {categories.map((category) => (
            <CategoryChip
              key={`${category.label}-rail`}
              active={activeCategoryFilter === category.value}
              label={category.label}
              icon={category.icon}
              onClick={() => setCategoryFilter(category.value)}
            />
          ))}
        </div>
      </div>
    </aside>
  );
}
