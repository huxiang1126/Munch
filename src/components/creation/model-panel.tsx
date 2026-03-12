"use client";

import { useEffect, useMemo } from "react";

import { getCreditCost } from "@/lib/constants";
import { TIER_LIMITS } from "@/lib/constants";
import { getModelDisplayText } from "@/lib/models";
import { cn } from "@/lib/utils";
import { useCredits } from "@/hooks/use-credits";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useAuthStore } from "@/stores/auth-store";
import type { GenerationModel } from "@/types/generation";

type ToggleOption = {
  value: string;
  label: string;
  icon?: string;
};

function ToggleRow({
  options,
  selected,
  onChange,
}: {
  options: ToggleOption[];
  selected: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex gap-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            "flex-1 rounded-full border px-3 py-1.5 text-center text-sm transition hover:-translate-y-0.5",
            selected === option.value
              ? "border-brand/40 bg-brand-muted font-medium text-text-primary"
              : "border-border/70 bg-bg-elevated/80 text-text-tertiary hover:border-border-hover hover:bg-bg-hover hover:text-text-primary",
          )}
        >
          {option.icon ? `${option.icon} ${option.label}` : option.label}
        </button>
      ))}
    </div>
  );
}

const ratioOptions = {
  landscape: ["1:1", "4:3", "3:2", "16:9"],
  portrait: ["1:1", "3:4", "2:3", "9:16"],
} as const;

export function ModelPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const creationMode = useWorkspaceStore((state) => state.creationMode);
  const orientation = useWorkspaceStore((state) => state.orientation);
  const aspectRatio = useWorkspaceStore((state) => state.aspectRatio);
  const imageCount = useWorkspaceStore((state) => state.imageCount);
  const selectedModel = useWorkspaceStore((state) => state.selectedModel);
  const setCreationMode = useWorkspaceStore((state) => state.setCreationMode);
  const setOrientation = useWorkspaceStore((state) => state.setOrientation);
  const setAspectRatio = useWorkspaceStore((state) => state.setAspectRatio);
  const setImageCount = useWorkspaceStore((state) => state.setImageCount);
  const setModel = useWorkspaceStore((state) => state.setModel);
  const user = useAuthStore((state) => state.user);
  const { data: creditData } = useCredits();

  const availableRatios = useMemo(() => ratioOptions[orientation], [orientation]);
  const tier = creditData?.tier ?? user?.tier ?? "free";
  const availableModels = useMemo(
    () => TIER_LIMITS[tier].availableModels,
    [tier],
  );
  const cost = getCreditCost(selectedModel).perImage * imageCount;

  useEffect(() => {
    if (!availableRatios.some((value) => value === aspectRatio)) {
      setAspectRatio(availableRatios[0]);
    }
  }, [aspectRatio, availableRatios, setAspectRatio]);

  useEffect(() => {
    if (!availableModels.length) {
      return;
    }

    if (!availableModels.includes(selectedModel)) {
      setModel(availableModels[0]);
    }
  }, [availableModels, selectedModel, setModel]);

  if (!open) {
    return null;
  }

  return (
    <>
      <button type="button" aria-label="关闭模型面板" onClick={onClose} className="fixed inset-0 z-[70]" />
      <div className="absolute bottom-[calc(100%+12px)] left-0 z-[70] w-[min(400px,calc(100vw-2rem))]">
        <div className="glass-panel space-y-4 rounded-2xl p-4">
          <ToggleRow
            options={[
              { value: "image", label: "Image", icon: "🖼" },
              { value: "video", label: "Video", icon: "🎬" },
            ]}
            selected={creationMode}
            onChange={(value) => setCreationMode(value as "image" | "video")}
          />
          <ToggleRow
            options={[
              { value: "landscape", label: "横向" },
              { value: "portrait", label: "纵向" },
            ]}
            selected={orientation}
            onChange={(value) => setOrientation(value as "landscape" | "portrait")}
          />
          <ToggleRow
            options={availableRatios.map((value) => ({ value, label: value }))}
            selected={aspectRatio}
            onChange={setAspectRatio}
          />
          <ToggleRow
            options={["1", "2", "3", "4"].map((value) => ({ value, label: `x${value}` }))}
            selected={String(imageCount)}
            onChange={(value) => setImageCount(Number(value) as 1 | 2 | 3 | 4)}
          />
          <select
            value={selectedModel}
            onChange={(event) => setModel(event.target.value as GenerationModel)}
            className="w-full rounded-lg border border-border/70 bg-bg-elevated/80 px-3 py-2 text-sm text-text-primary focus:border-brand focus:outline-none"
          >
            {availableModels.map((model) => (
              <option key={model} value={model}>
                {getModelDisplayText(model)}
              </option>
            ))}
          </select>
          <p className="text-center text-xs text-text-secondary">
            生成将消耗 <span className="font-medium text-text-primary">{cost}</span> 积分
          </p>
        </div>
      </div>
    </>
  );
}
