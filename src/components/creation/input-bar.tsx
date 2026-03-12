"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Brain, Plus, X } from "lucide-react";

import { AssetPickerDialog } from "@/components/assets/asset-picker-dialog";
import { useGeneration } from "@/hooks/use-generation";
import { ModelBadge } from "@/components/creation/model-badge";
import { ModelPanel } from "@/components/creation/model-panel";
import { GlowButton } from "@/components/shared/glow-button";
import { useWorkspaceStore } from "@/stores/workspace-store";

const MIN_PROMPT_HEIGHT = 92;
const MAX_PROMPT_HEIGHT = 386;

export function InputBar() {
  const [panelOpen, setPanelOpen] = useState(false);
  const [assetPickerOpen, setAssetPickerOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const router = useRouter();
  const { isSubmitting, startGeneration } = useGeneration();
  const selectedModel = useWorkspaceStore((state) => state.selectedModel);
  const imageCount = useWorkspaceStore((state) => state.imageCount);
  const aspectRatio = useWorkspaceStore((state) => state.aspectRatio);
  const freePrompt = useWorkspaceStore((state) => state.freePrompt);
  const thinkingEnabled = useWorkspaceStore((state) => state.thinkingEnabled);
  const freeImageFiles = useWorkspaceStore((state) => state.freeImageFiles);
  const setFreePrompt = useWorkspaceStore((state) => state.setFreePrompt);
  const setThinkingEnabled = useWorkspaceStore((state) => state.setThinkingEnabled);
  const addFreeImageFiles = useWorkspaceStore((state) => state.addFreeImageFiles);
  const clearFreeImageFiles = useWorkspaceStore((state) => state.clearFreeImageFiles);
  const removeFreeImageFile = useWorkspaceStore((state) => state.removeFreeImageFile);

  const canGenerate = freePrompt.trim().length > 0;
  const freeImageEntries = useMemo(() => Object.entries(freeImageFiles), [freeImageFiles]);
  const freeImagePreviews = useMemo(
    () =>
      freeImageEntries.map(([id, file]) => ({
        id,
        name: file.name,
        url: URL.createObjectURL(file),
      })),
    [freeImageEntries],
  );

  useEffect(
    () => () => {
      freeImagePreviews.forEach((item) => URL.revokeObjectURL(item.url));
    },
    [freeImagePreviews],
  );

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }

    textarea.style.height = `${MIN_PROMPT_HEIGHT}px`;

    const nextHeight = Math.min(
      Math.max(textarea.scrollHeight, MIN_PROMPT_HEIGHT),
      MAX_PROMPT_HEIGHT,
    );

    textarea.style.height = `${nextHeight}px`;
    textarea.style.overflowY = textarea.scrollHeight > MAX_PROMPT_HEIGHT ? "auto" : "hidden";
  }, [freePrompt]);

  async function handleGenerate() {
    if (!canGenerate) {
      return;
    }

    try {
      const data = await startGeneration({
        prompt: freePrompt.trim(),
        variables: {},
        model: selectedModel,
        imageCount,
        thinkingEnabled,
        aspectRatio,
        imageFiles: freeImageFiles,
      });
      setFreePrompt("");
      clearFreeImageFiles();
      router.push(`/studio?taskId=${encodeURIComponent(data.taskId)}`);
    } catch (error) {
      window.alert(`生成失败：${error instanceof Error ? error.message : "未知错误"}`);
    }
  }

  async function handleSelectAsset(file: File) {
    addFreeImageFiles([file]);
  }

  return (
    <>
      <AssetPickerDialog
        open={assetPickerOpen}
        onOpenChange={setAssetPickerOpen}
        onSelect={handleSelectAsset}
        title="素材库"
        description="最近上传的素材会显示在这里，也可以继续上传新的参考图。"
      />
      <div className="glass-panel rounded-[28px] p-3 shadow-[0_24px_60px_-30px_rgba(193,39,45,0.32)]">
        {freeImagePreviews.length > 0 ? (
          <div className="mb-2 flex flex-wrap gap-2 px-2 pt-1">
            {freeImagePreviews.map((image) => (
              <div key={image.id} className="relative">
                <img
                  src={image.url}
                  alt={image.name}
                  className="h-14 w-14 rounded-xl border border-border/70 object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeFreeImageFile(image.id)}
                  className="absolute -right-1.5 -top-1.5 rounded-full border border-border/70 bg-bg-elevated/90 p-1 text-text-secondary transition hover:text-text-primary"
                  aria-label="移除参考图"
                >
                  <X className="size-3" />
                </button>
              </div>
            ))}
          </div>
        ) : null}
        <textarea
          ref={textareaRef}
          value={freePrompt}
          onChange={(event) => setFreePrompt(event.target.value)}
          placeholder="Write your prompt..."
          rows={1}
          className="w-full resize-none bg-transparent px-2 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none"
          style={{ minHeight: `${MIN_PROMPT_HEIGHT}px`, maxHeight: `${MAX_PROMPT_HEIGHT}px` }}
        />
        <div className="mt-2 flex items-end justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAssetPickerOpen(true)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border/70 bg-bg-elevated/80 text-text-tertiary transition hover:-translate-y-0.5 hover:border-border-hover hover:bg-bg-hover hover:text-text-primary"
              aria-label="打开素材库"
            >
              <Plus className="size-5" />
            </button>
            <div className="relative">
              <ModelBadge onClick={() => setPanelOpen((current) => !current)} />
              <ModelPanel open={panelOpen} onClose={() => setPanelOpen(false)} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setThinkingEnabled(!thinkingEnabled)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition ${
                thinkingEnabled
                  ? "thinking-pill-active text-text-primary"
                  : "border-border/60 bg-bg-elevated/80 text-text-tertiary hover:border-border-hover hover:text-text-primary"
              }`}
            >
              <Brain className="size-3.5" />
              Thinking
            </button>
            <GlowButton
              size="icon"
              className="h-11 w-11 flex-none"
              aria-label="发送创作请求"
              onClick={() => void handleGenerate()}
              disabled={!canGenerate}
              loading={isSubmitting}
            >
              <ArrowRight className="size-4" />
            </GlowButton>
          </div>
        </div>
      </div>
    </>
  );
}
