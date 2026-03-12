"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { TemplateForm } from "@/components/admin/template-form";
import type { DbTemplate } from "@/types/database";

export default function EditTemplatePage() {
  const params = useParams<{ id: string }>();
  const [template, setTemplate] = useState<DbTemplate | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadTemplate() {
      try {
        const response = await fetch(`/api/admin/templates/${params.id}`, { cache: "no-store" });
        if (!response.ok) {
          throw new Error("模板加载失败");
        }

        const data = (await response.json()) as DbTemplate;
        if (active) {
          setTemplate(data);
        }
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "模板加载失败");
        }
      }
    }

    void loadTemplate();

    return () => {
      active = false;
    };
  }, [params.id]);

  if (error) {
    return <div className="text-sm text-red-400">{error}</div>;
  }

  if (!template) {
    return <div className="text-sm text-text-tertiary">模板加载中...</div>;
  }

  return <TemplateForm initialData={template} />;
}
