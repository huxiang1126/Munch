"use client";

import { Images, Sparkles } from "lucide-react";

import { getModelConfig } from "@/lib/models";
import { useWorkspaceStore } from "@/stores/workspace-store";

export function ModelBadge({ onClick }: { onClick?: () => void }) {
  const selectedModel = useWorkspaceStore((state) => state.selectedModel);
  const imageCount = useWorkspaceStore((state) => state.imageCount);
  const config = getModelConfig(selectedModel);

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-11 items-center gap-2 whitespace-nowrap rounded-full border border-border/70 bg-bg-elevated/80 px-4 py-2 text-xs text-text-secondary transition hover:-translate-y-0.5 hover:border-border-hover hover:bg-bg-hover hover:text-text-primary"
    >
      <Sparkles className="size-3.5 text-brand" />
      <span>{config.label}</span>
      <Images className="size-3.5 text-text-tertiary" />
      <span className="text-text-tertiary">x{imageCount}</span>
    </button>
  );
}
