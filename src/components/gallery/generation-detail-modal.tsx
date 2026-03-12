"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, RefreshCw, X } from "lucide-react";

import { useWorkspaceStore } from "@/stores/workspace-store";
import type { GenerationModel } from "@/types/generation";

interface GenerationDetail {
  id: string;
  templateId: string;
  templateName: string;
  variables: Record<string, string>;
  prompt?: string;
  customPrompt?: string;
  thinkingEnabled?: boolean;
  generationMode?: "template" | "free";
  aspectRatio?: string;
  model: GenerationModel;
  imageCount: number;
  creditsCost: number;
  compiledPrompt?: string;
  createdAt: string;
  images: Array<{ id: string; url: string; width: number; height: number }>;
}

interface Props {
  generationId: string | null;
  onClose: () => void;
}

export function GenerationDetailModal({ generationId, onClose }: Props) {
  const [detail, setDetail] = useState<GenerationDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [imageLoading, setImageLoading] = useState(false);
  const router = useRouter();
  const selectTemplate = useWorkspaceStore((state) => state.selectTemplate);
  const setFreePrompt = useWorkspaceStore((state) => state.setFreePrompt);
  const setThinkingEnabled = useWorkspaceStore((state) => state.setThinkingEnabled);
  const setVariable = useWorkspaceStore((state) => state.setVariable);
  const setCustomPrompt = useWorkspaceStore((state) => state.setCustomPrompt);
  const setModel = useWorkspaceStore((state) => state.setModel);
  const setAspectRatio = useWorkspaceStore((state) => state.setAspectRatio);
  const setImageCount = useWorkspaceStore((state) => state.setImageCount);

  useEffect(() => {
    if (!generationId) {
      setDetail(null);
      setActiveImageIndex(0);
      setImageLoading(false);
      return;
    }

    setLoading(true);
    setImageLoading(true);
    fetch(`/api/history/${generationId}`)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("加载详情失败");
        }
        return (await response.json()) as GenerationDetail;
      })
      .then((data) => {
        setDetail(data);
        setActiveImageIndex(0);
      })
      .catch(() => setDetail(null))
      .finally(() => setLoading(false));
  }, [generationId]);

  useEffect(() => {
    if (!detail?.images[activeImageIndex]) {
      setImageLoading(false);
      return;
    }

    setImageLoading(true);
  }, [activeImageIndex, detail]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    if (generationId) {
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [generationId, onClose]);

  if (!generationId) {
    return null;
  }

  function handleRegenerate() {
    if (!detail) {
      return;
    }

    if (detail.generationMode === "free") {
      setFreePrompt(detail.prompt ?? "");
      setThinkingEnabled(detail.thinkingEnabled ?? false);
      if (detail.aspectRatio) {
        setAspectRatio(detail.aspectRatio);
      }
      setCustomPrompt("");
    } else {
      selectTemplate(detail.templateId);
      for (const [key, value] of Object.entries(detail.variables)) {
        setVariable(key, value);
      }
      setCustomPrompt(detail.customPrompt ?? "");
    }
    setModel(detail.model);
    setImageCount(detail.imageCount as 1 | 2 | 3 | 4);
    onClose();
    router.push("/studio");
  }

  const activeImage = detail?.images[activeImageIndex];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative z-10 flex max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-2xl border border-border/60 bg-bg-elevated/95 shadow-2xl">
        <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-black p-4">
          {(loading || imageLoading) ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),rgba(12,12,13,0.86)_42%,rgba(0,0,0,0.98)_100%)]" />
              <div className="absolute inset-0 bg-black/48 backdrop-blur-md" />
              <div className="relative w-[min(56%,420px)] space-y-4 rounded-[28px] border border-white/[0.08] bg-white/[0.04] px-6 py-7 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.85)] backdrop-blur-xl">
                <div className="h-3 w-24 rounded-full bg-white/10" />
                <div className="space-y-2">
                  <div className="h-3 w-full rounded-full bg-white/[0.08]" />
                  <div className="h-3 w-4/5 rounded-full bg-white/[0.06]" />
                </div>
                <div className="h-48 rounded-[22px] bg-[linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.015))]" />
              </div>
            </div>
          ) : null}
          {!loading && activeImage ? (
            <img
              src={activeImage.url}
              alt=""
              onLoad={() => setImageLoading(false)}
              onError={() => setImageLoading(false)}
              className={`max-h-[80vh] max-w-full rounded-lg object-contain transition duration-300 ${
                imageLoading ? "scale-[0.985] opacity-0" : "scale-100 opacity-100"
              }`}
            />
          ) : null}
          {!loading && !activeImage ? (
            <p className="relative z-10 text-sm text-text-tertiary">暂无图片</p>
          ) : null}
        </div>

        <div className="relative w-80 shrink-0 overflow-y-auto border-l border-border/40 p-6">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full p-1.5 text-text-secondary transition hover:bg-bg-hover hover:text-text-primary"
          >
            <X className="size-5" />
          </button>

          {detail ? (
            <div className="space-y-6 pt-4">
              <div>
                <h3 className="text-lg font-semibold text-text-primary">
                  {detail.templateName}
                </h3>
                <p className="mt-1 text-xs text-text-tertiary">
                  {detail.model} · {detail.creditsCost} 积分
                </p>
              </div>

              {detail.prompt ? (
                <div>
                  <p className="mb-2 text-sm font-medium text-text-secondary">
                    自由输入 {detail.thinkingEnabled ? "· Thinking 已开启" : "· 原样直出"}
                  </p>
                  <div className="rounded-xl bg-bg-hover/60 px-3 py-3 text-sm leading-6 text-text-primary">
                    {detail.prompt}
                  </div>
                </div>
              ) : null}

              {detail.customPrompt ? (
                <div>
                  <p className="mb-2 text-sm font-medium text-text-secondary">补充想法</p>
                  <div className="rounded-xl bg-bg-hover/60 px-3 py-3 text-sm leading-6 text-text-primary">
                    {detail.customPrompt}
                  </div>
                </div>
              ) : null}

              {detail.compiledPrompt ? (
                <div>
                  <p className="mb-2 text-sm font-medium text-text-secondary">最终编译 Prompt</p>
                  <div className="max-h-48 overflow-y-auto rounded-xl bg-bg-hover/60 px-3 py-3 font-mono text-xs leading-5 text-text-primary">
                    {detail.compiledPrompt}
                  </div>
                </div>
              ) : null}

              {detail.images.length > 1 ? (
                <div>
                  <p className="mb-2 text-sm font-medium text-text-secondary">
                    全部图片 ({detail.images.length})
                  </p>
                  <div className="grid grid-cols-4 gap-1.5">
                    {detail.images.map((image, index) => (
                      <button
                        key={image.id}
                        type="button"
                        onClick={() => setActiveImageIndex(index)}
                        className={`overflow-hidden rounded-lg border-2 transition ${
                          index === activeImageIndex
                            ? "border-brand"
                            : "border-transparent hover:border-white/20"
                        }`}
                      >
                        <img
                          src={image.url}
                          alt=""
                          className="aspect-square w-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={handleRegenerate}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-sm font-medium text-white transition hover:bg-brand-hover"
                >
                  <RefreshCw className="size-4" />
                  用相同参数重新生成
                </button>
                {activeImage ? (
                  <a
                    href={activeImage.url}
                    download
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-border/60 px-4 py-3 text-sm text-text-secondary transition hover:bg-bg-hover hover:text-text-primary"
                  >
                    <Download className="size-4" />
                    下载原图
                  </a>
                ) : null}
              </div>
            </div>
          ) : loading ? null : (
            <div className="pt-10 text-sm text-text-tertiary">暂无详情</div>
          )}
        </div>
      </div>
    </div>
  );
}
