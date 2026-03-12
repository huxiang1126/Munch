"use client";

import { useWorkspaceStore } from "@/stores/workspace-store";
import type { DbTemplate } from "@/types/database";

export function GalleryCard({ template }: { template: DbTemplate }) {
  const openTemplateDetail = useWorkspaceStore((state) => state.openTemplateDetail);
  const hasThumbnail = Boolean(template.thumbnail_url);
  const { width, height } = template.default_image_size;
  const thumbnailSrc = hasThumbnail
    ? `${template.thumbnail_url}?v=${encodeURIComponent(template.updated_at)}`
    : "/images/logo.svg";

  return (
    <button
      type="button"
      onClick={() => openTemplateDetail(template.id)}
      className="group relative mb-1 cursor-pointer break-inside-avoid overflow-hidden rounded-[6px] border border-white/[0.04] bg-black text-left transition duration-200 hover:border-white/18 active:scale-[0.985]"
    >
      <div className="relative overflow-hidden bg-black" style={{ aspectRatio: `${width}/${height}` }}>
        <img
          src={thumbnailSrc}
          alt={template.name}
          loading="lazy"
          className={`h-full w-full transition-transform duration-500 group-hover:scale-[1.03] ${
            hasThumbnail ? "object-cover" : "object-contain p-6"
          }`}
        />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0)_42%,rgba(0,0,0,0.16)_72%,rgba(0,0,0,0.76)_100%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-2 px-4 pb-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <p className="line-clamp-2 text-sm font-medium leading-6 text-white drop-shadow-[0_1px_8px_rgba(0,0,0,0.45)]">
            {template.name}
          </p>
        </div>
      </div>
    </button>
  );
}
