"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import useSWR from "swr";

import { cn } from "@/lib/utils";
import { VariableEditor } from "@/components/creation/variable-editor";
import { GenerationDetailModal } from "@/components/gallery/generation-detail-modal";
import { BottomBar } from "@/components/layout/bottom-bar";
import { useSse } from "@/hooks/use-sse";
import { getModelLabel } from "@/lib/models";
import { useWorkspaceStore } from "@/stores/workspace-store";
import type { GenerationStatusEvent, HistoryItem, HistoryResponse } from "@/types/api";

async function fetcher<T>(url: string) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("请求失败");
  }
  return (await response.json()) as T;
}

const defaultMessageByStatus: Partial<Record<HistoryItem["status"], string>> = {
  pending: "任务已创建，准备进入队列",
  compiling: "正在编译模板参数",
  generating: "正在调用模型生成图片",
  completed: "生成完成",
  failed: "生成失败",
};

const statusLabelByStatus: Partial<Record<HistoryItem["status"], string>> = {
  pending: "Queued",
  compiling: "Preparing",
  generating: "Generating",
  failed: "Failed",
};

function PendingGenerationCard({
  item,
  event,
}: {
  item: HistoryItem;
  event?: GenerationStatusEvent;
}) {
  const message = event?.message ?? defaultMessageByStatus[item.status] ?? "任务处理中";
  const isFailed = item.status === "failed" || event?.status === "failed";
  const statusLabel = statusLabelByStatus[event?.status ?? item.status] ?? "Processing";

  return (
    <div className="relative mb-1 break-inside-avoid overflow-hidden rounded-[6px] border border-white/[0.06] bg-black">
      <div className="relative aspect-[2/3] overflow-hidden bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.12),rgba(13,13,14,0.92)_48%,rgba(6,6,7,1)_100%)]">
        <div className="absolute inset-0 animate-pulse bg-[linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0)_42%)]" />
        <div className="absolute inset-x-0 top-0 h-px bg-white/10" />
        <div className="absolute inset-x-0 top-0 h-1 overflow-hidden bg-white/6">
          <div
            className={cn(
              "h-full w-1/2 -translate-x-full",
              !isFailed && "animate-[studio-loading-bar_1.6s_ease-in-out_infinite]",
              isFailed ? "bg-[#dc2626]" : "bg-[linear-gradient(90deg,#f97316,#fb7185,#facc15)]",
            )}
            style={isFailed ? { transform: "translateX(0)", width: "100%" } : undefined}
          />
        </div>

        <div className="flex h-full flex-col justify-between p-4">
          <div className="flex items-center justify-between gap-3">
            <span
              className={`rounded-full px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.18em] ${
                isFailed
                  ? "border border-red-500/30 bg-red-500/12 text-red-300"
                  : "border border-white/10 bg-white/8 text-white/70"
              }`}
            >
              {statusLabel}
            </span>
            <span className="text-xs text-white/45">
              {isFailed ? "Provider error" : "Waiting for result"}
            </span>
          </div>

          <div className="space-y-3">
            <div className="h-24 rounded-2xl border border-white/6 bg-white/[0.04] backdrop-blur-sm" />
            <div>
              <p className="text-sm font-medium text-white">{item.templateName}</p>
              <p className="mt-1 text-xs text-white/55">{getModelLabel(item.model)}</p>
              <p className="mt-3 text-xs leading-5 text-white/58">{message}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CompletedGenerationCard({
  item,
  highlight,
  onSelect,
}: {
  item: HistoryItem;
  highlight: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(item.id)}
      className={`group relative mb-1 cursor-pointer break-inside-avoid overflow-hidden rounded-[6px] border border-white/[0.04] bg-black text-left transition duration-200 hover:border-white/18 active:scale-[0.985] ${
        highlight ? "studio-card-reveal" : ""
      }`}
    >
      <div className="relative aspect-[2/3] overflow-hidden bg-black">
        <img
          src={item.thumbnailUrl}
          alt={item.templateName}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0)_42%,rgba(0,0,0,0.16)_72%,rgba(0,0,0,0.76)_100%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-2 px-4 pb-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <p className="text-sm font-medium text-white drop-shadow-[0_1px_8px_rgba(0,0,0,0.45)]">
            {item.templateName}
          </p>
          <p className="mt-1 text-xs text-white/60">
            {getModelLabel(item.model)}
          </p>
        </div>
      </div>
    </button>
  );
}

export function StudioPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data, isLoading, mutate } = useSWR<HistoryResponse>("/api/history?pageSize=100", fetcher);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [taskEvents, setTaskEvents] = useState<Record<string, GenerationStatusEvent>>({});
  const [recentlyCompletedId, setRecentlyCompletedId] = useState<string | null>(null);
  const activeTaskId = searchParams.get("taskId");
  const selectedTemplateId = useWorkspaceStore((state) => state.selectedTemplateId);
  const selectedModel = useWorkspaceStore((state) => state.selectedModel);
  const templates = useWorkspaceStore((state) => state.templates);
  const currentTemplate = useMemo(
    () => templates.find((item) => item.id === selectedTemplateId) ?? null,
    [selectedTemplateId, templates],
  );

  useSse(activeTaskId, (event) => {
    if (!activeTaskId) {
      return;
    }

    setTaskEvents((current) => ({
      ...current,
      [activeTaskId]: event,
    }));
    void mutate();

    if (event.status === "completed") {
      setRecentlyCompletedId(activeTaskId);
      window.setTimeout(() => {
        router.replace("/studio", { scroll: false });
        void mutate();
      }, 160);
    }

    if (event.status === "failed") {
      window.setTimeout(() => {
        router.replace("/studio", { scroll: false });
        void mutate();
      }, 160);
    }
  });

  useEffect(() => {
    if (!recentlyCompletedId) {
      return;
    }

    const timeoutId = window.setTimeout(() => setRecentlyCompletedId(null), 650);
    return () => window.clearTimeout(timeoutId);
  }, [recentlyCompletedId]);

  const items = data?.items ?? [];
  const optimisticTask =
    activeTaskId && !items.some((item) => item.id === activeTaskId)
      ? ({
        id: activeTaskId,
        templateId: currentTemplate?.id ?? selectedTemplateId,
        templateName: currentTemplate?.name ?? "正在生成",
        variables: {},
        model: selectedModel,
        status: "pending",
        imageCount: 1,
        creditsCost: 0,
        thumbnailUrl: "",
        createdAt: new Date().toISOString(),
      } satisfies HistoryItem)
      : null;
  const displayItems = optimisticTask ? [optimisticTask, ...items] : items;

  if (isLoading && !optimisticTask) {
    return (
      <>
        <div className="px-4 pb-36 pt-8 text-sm text-text-tertiary">
          图片加载中...
        </div>
        <BottomBar />
      </>
    );
  }

  if (displayItems.length === 0) {
    return (
      <>
        <div className="flex min-h-[60vh] items-center justify-center px-4">
          <div className="text-center">
            <p className="text-lg font-medium text-text-primary">你的 Studio 还没有作品</p>
            <p className="mt-2 text-sm text-text-secondary">
              先去首页挑一个模板，生成第一张图。
            </p>
            <Link
              href="/"
              className="mt-6 inline-flex items-center rounded-full border border-border/70 bg-bg-elevated/70 px-4 py-2 text-sm text-text-primary transition hover:-translate-y-0.5 hover:border-border-hover hover:bg-bg-hover"
            >
              去选模板
            </Link>
          </div>
        </div>
        <BottomBar />
      </>
    );
  }

  return (
    <>
      <div className="columns-2 gap-1 px-1 pb-36 pt-4 md:columns-3 xl:columns-4 2xl:columns-5">
        {displayItems.map((item) =>
          item.status === "completed" ? (
            <CompletedGenerationCard
              key={item.id}
              item={item}
              highlight={item.id === recentlyCompletedId}
              onSelect={setSelectedId}
            />
          ) : (
            <PendingGenerationCard
              key={item.id}
              item={item}
              event={taskEvents[item.id]}
            />
          ),
        )}
      </div>

      <BottomBar />
      <GenerationDetailModal generationId={selectedId} onClose={() => setSelectedId(null)} />
      <VariableEditor />
    </>
  );
}
