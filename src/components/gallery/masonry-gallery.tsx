"use client";

import { useEffect, useState } from "react";

import { templates as staticTemplates } from "@/data/templates";
import { staticTemplateToDb } from "@/lib/template-adapters";
import { useWorkspaceStore } from "@/stores/workspace-store";

import { GalleryCard } from "./gallery-card";

export function MasonryGallery() {
  const filter = useWorkspaceStore((state) => state.activeCategoryFilter);
  const templates = useWorkspaceStore((state) => state.templates);
  const setTemplates = useWorkspaceStore((state) => state.setTemplates);
  const [loading, setLoading] = useState(templates.length === 0);

  useEffect(() => {
    let active = true;

    async function loadTemplates() {
      try {
        const response = await fetch("/api/templates", { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Failed to load templates");
        }

        const items = (await response.json()) as typeof templates;
        if (active) {
          setTemplates(items);
        }
      } catch {
        if (active) {
          setTemplates(staticTemplates.map(staticTemplateToDb));
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadTemplates();

    return () => {
      active = false;
    };
  }, [setTemplates]);

  const filteredTemplates = filter ? templates.filter((template) => template.category === filter) : templates;

  if (loading && filteredTemplates.length === 0) {
    return (
      <div className="px-4 pb-36 pt-8 text-sm text-text-tertiary xl:pl-16 xl:pr-6">
        模板加载中...
      </div>
    );
  }

  return (
    <div className="columns-2 gap-1 px-1 pb-36 md:columns-3 xl:columns-4 2xl:columns-5 xl:pl-14 xl:pr-5">
      {filteredTemplates.map((template) => (
        <GalleryCard key={template.id} template={template} />
      ))}
    </div>
  );
}
