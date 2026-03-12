"use client";

import { useRef, useState } from "react";
import useSWR from "swr";
import { Images, LoaderCircle, Trash2, Upload } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { UserAsset, UserAssetsResponse } from "@/types/api";

async function fetcher<T>(url: string) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("请求失败");
  }
  return (await response.json()) as T;
}

async function assetToFile(asset: UserAsset) {
  const response = await fetch(asset.url);
  if (!response.ok) {
    throw new Error("素材读取失败");
  }

  const blob = await response.blob();
  return new File([blob], asset.name, { type: asset.mimeType || blob.type || "image/jpeg" });
}

interface AssetPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (file: File) => Promise<void> | void;
  title?: string;
  description?: string;
  accept?: string;
}

export function AssetPickerDialog({
  open,
  onOpenChange,
  onSelect,
  title = "素材库",
  description = "上传一次，之后直接复用。",
  accept = "image/jpeg,image/png,image/webp",
}: AssetPickerDialogProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const { data, isLoading, mutate } = useSWR<UserAssetsResponse>(open ? "/api/assets" : null, fetcher);

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.currentTarget.value = "";

    if (!file) {
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/assets", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("上传素材失败");
      }

      await mutate();
      await onSelect(file);
      onOpenChange(false);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "上传素材失败");
    } finally {
      setUploading(false);
    }
  }

  async function handleSelect(asset: UserAsset) {
    setBusyId(asset.id);

    try {
      await fetch(`/api/assets/${asset.id}`, { method: "PATCH" });
      const file = await assetToFile(asset);
      await onSelect(file);
      await mutate();
      onOpenChange(false);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "读取素材失败");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(assetId: string) {
    setBusyId(assetId);

    try {
      const response = await fetch(`/api/assets/${assetId}`, { method: "DELETE" });
      if (!response.ok) {
        throw new Error("删除素材失败");
      }
      await mutate();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "删除素材失败");
    } finally {
      setBusyId(null);
    }
  }

  const items = data?.items ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-panel max-w-3xl rounded-[28px] border-border/60 bg-bg-elevated/92 p-0 text-text-primary shadow-[0_40px_120px_-60px_rgba(0,0,0,0.88)]">
        <DialogHeader className="border-b border-border/60 px-6 py-5">
          <DialogTitle className="text-lg font-medium">{title}</DialogTitle>
          <DialogDescription className="text-sm text-text-secondary">{description}</DialogDescription>
        </DialogHeader>
        <div className="max-h-[70vh] overflow-y-auto px-6 py-5">
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            hidden
            onChange={handleUpload}
          />
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="group flex aspect-square flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 bg-bg-hover/45 p-4 text-text-secondary transition hover:border-border-hover hover:bg-bg-hover hover:text-text-primary disabled:opacity-60"
            >
              {uploading ? <LoaderCircle className="size-6 animate-spin" /> : <Upload className="size-6" />}
              <span className="mt-3 text-sm font-medium">上传新素材</span>
              <span className="mt-1 text-center text-xs text-text-tertiary">保存到你的素材库</span>
            </button>

            {items.map((asset) => {
              const active = busyId === asset.id;

              return (
                <button
                  key={asset.id}
                  type="button"
                  onClick={() => void handleSelect(asset)}
                  className={cn(
                    "group relative aspect-square overflow-hidden rounded-2xl border border-border/70 bg-black text-left transition hover:-translate-y-0.5 hover:border-border-hover",
                    active && "pointer-events-none opacity-80",
                  )}
                >
                  <img
                    src={asset.url}
                    alt={asset.name}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0)_35%,rgba(0,0,0,0.16)_68%,rgba(0,0,0,0.78)_100%)]" />
                  <div className="absolute inset-x-0 bottom-0 px-3 pb-3">
                    <p className="line-clamp-2 text-sm font-medium text-white drop-shadow-[0_1px_10px_rgba(0,0,0,0.5)]">
                      {asset.name}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      void handleDelete(asset.id);
                    }}
                    className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/12 bg-black/55 text-white/72 transition hover:bg-black/80 hover:text-white"
                    aria-label="删除素材"
                  >
                    {active ? <LoaderCircle className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                  </button>
                </button>
              );
            })}
          </div>

          {!isLoading && items.length === 0 ? (
            <div className="mt-6 flex min-h-40 flex-col items-center justify-center rounded-2xl border border-border/50 bg-bg-hover/30 text-center">
              <Images className="size-7 text-text-tertiary" />
              <p className="mt-3 text-sm font-medium text-text-primary">你的素材库还是空的</p>
              <p className="mt-1 text-sm text-text-secondary">先上传一张参考图，之后就能反复复用。</p>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
