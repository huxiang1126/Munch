"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Eye, EyeOff, Pencil, Plus, Sparkles, Trash2 } from "lucide-react";

import { LoadingDots } from "@/components/shared/loading-dots";
import { templateCategoryLabels } from "@/constants/template-categories";
import { getModelLabel } from "@/lib/models";
import type { DbTemplate } from "@/types/database";

export default function AdminTemplatesPage() {
  const [templates, setTemplates] = useState<DbTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function loadTemplates() {
    const response = await fetch("/api/admin/templates", { cache: "no-store" });
    if (response.ok) {
      setTemplates((await response.json()) as DbTemplate[]);
    }
    setLoading(false);
  }

  useEffect(() => {
    void loadTemplates();
  }, []);

  async function togglePublish(template: DbTemplate) {
    const response = await fetch(`/api/admin/templates/${template.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ is_published: !template.is_published }),
    });

    if (!response.ok) {
      window.alert("更新发布状态失败，请稍后重试。");
      return;
    }

    await loadTemplates();
  }

  async function deleteTemplate(template: DbTemplate) {
    if (!window.confirm(`确定删除「${template.name}」？`)) {
      return;
    }

    setDeletingId(template.id);

    try {
      const response = await fetch(`/api/admin/templates/${template.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        window.alert("删除模板失败，请稍后重试。");
        return;
      }

      setTemplates((current) => current.filter((item) => item.id !== template.id));
      await loadTemplates();
    } finally {
      setDeletingId(null);
    }
  }

  const publishedCount = templates.filter((template) => template.is_published).length;
  const imageDrivenCount = templates.filter((template) =>
    template.variables.some((variable) => variable.type === "image"),
  ).length;

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[34px] border border-border/60 bg-bg-elevated/82 shadow-[0_30px_90px_-54px_rgba(15,15,16,0.66)]">
        <div className="grid gap-0 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="border-b border-border/60 p-7 lg:border-b-0 lg:border-r lg:p-9">
            <p className="text-[11px] uppercase tracking-[0.34em] text-text-tertiary">Template Library</p>
            <h1 className="mt-4 font-serif text-4xl leading-tight text-text-primary lg:text-5xl">Shape the library like a product, not a backlog.</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-text-secondary">
              Covers, copy, variables, model support, and publish state all live here. The goal is not just to store
              prompts, but to make every template feel ready for a real user to open.
            </p>
          </div>
          <div className="p-7 lg:p-8">
            <div className="rounded-[28px] border border-border/60 bg-bg-base/55 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,rgba(236,72,153,0.16),rgba(139,92,246,0.16))] text-brand">
                  <Sparkles className="size-4" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.26em] text-text-tertiary">Curate</p>
                  <p className="mt-1 text-sm font-medium text-text-primary">Keep the visible library clean, strong, and easy to scan.</p>
                </div>
              </div>
              <Link
                href="/admin/templates/new"
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,rgba(236,72,153,0.94),rgba(139,92,246,0.88))] px-5 py-3 text-sm font-medium !text-white shadow-[0_24px_48px_-30px_rgba(139,92,246,0.7)] transition hover:-translate-y-0.5"
              >
                <Plus className="size-4" />
                新建模板
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          ["全部模板", templates.length, "Everything currently in the studio"],
          ["已上架", publishedCount, "Visible to the live product"],
          ["图片驱动", imageDrivenCount, "Templates using reference images"],
        ].map(([label, value, note]) => (
          <div key={label} className="rounded-[28px] border border-border/60 bg-bg-elevated/80 p-5">
            <p className="text-[11px] uppercase tracking-[0.26em] text-text-tertiary">{label}</p>
            <p className="mt-3 text-3xl font-semibold text-text-primary">{value}</p>
            <p className="mt-2 text-sm text-text-secondary">{note}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="rounded-[32px] border border-border/60 bg-bg-elevated/80 px-5 py-14">
          <div className="flex items-center justify-center">
            <LoadingDots label="模板加载中" />
          </div>
        </div>
      ) : templates.length === 0 ? (
        <div className="rounded-[32px] border border-border/60 bg-bg-elevated/80 px-5 py-14 text-center text-sm text-text-tertiary">
          暂无模板，点击“新建模板”开始创建。
        </div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          {templates.map((template) => (
            <article
              key={template.id}
              className="group overflow-hidden rounded-[30px] border border-border/60 bg-bg-elevated/82 shadow-[0_24px_48px_-40px_rgba(15,15,16,0.55)] transition hover:-translate-y-1"
            >
              <div className="relative h-48 overflow-hidden border-b border-border/60 bg-bg-hover/55">
                {template.thumbnail_url ? (
                  <img
                    src={template.thumbnail_url}
                    alt={template.name}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_top,rgba(236,72,153,0.16),transparent_60%)]">
                    <span className="font-serif text-6xl text-text-tertiary/70">{template.name.slice(0, 1)}</span>
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 bg-[linear-gradient(180deg,transparent,rgba(15,15,16,0.68))] px-5 pb-4 pt-12 text-white">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={
                        template.is_published
                          ? "rounded-full bg-white/14 px-3 py-1 text-[11px] uppercase tracking-[0.24em]"
                          : "rounded-full bg-black/24 px-3 py-1 text-[11px] uppercase tracking-[0.24em]"
                      }
                    >
                      {template.is_published ? "Published" : "Draft"}
                    </span>
                    <span className="rounded-full bg-black/24 px-3 py-1 text-[11px] uppercase tracking-[0.24em]">
                      {templateCategoryLabels[template.category]}
                    </span>
                  </div>
                  <h2 className="mt-3 font-serif text-2xl">{template.name}</h2>
                </div>
              </div>

              <div className="space-y-5 p-5">
                <p className="line-clamp-2 text-sm leading-6 text-text-secondary">{template.description}</p>

                <div className="flex flex-wrap gap-2">
                  {template.tags.slice(0, 4).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-border/60 bg-bg-base/55 px-3 py-1 text-xs text-text-secondary"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-[22px] border border-border/60 bg-bg-base/55 px-4 py-3">
                    <p className="text-[11px] uppercase tracking-[0.26em] text-text-tertiary">变量</p>
                    <p className="mt-2 text-lg font-medium text-text-primary">{template.variables.length}</p>
                  </div>
                  <div className="rounded-[22px] border border-border/60 bg-bg-base/55 px-4 py-3">
                    <p className="text-[11px] uppercase tracking-[0.26em] text-text-tertiary">模型</p>
                    <p className="mt-2 text-sm font-medium text-text-primary">{getModelLabel(template.default_model)}</p>
                  </div>
                  <div className="rounded-[22px] border border-border/60 bg-bg-base/55 px-4 py-3">
                    <p className="text-[11px] uppercase tracking-[0.26em] text-text-tertiary">计费</p>
                    <p className="mt-2 text-lg font-medium text-text-primary">按模型</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/admin/templates/${template.id}`}
                    className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-bg-base/55 px-4 py-2.5 text-sm font-medium text-text-primary transition hover:border-border-hover hover:bg-bg-hover/60"
                  >
                    <Pencil className="size-4" />
                    编辑
                  </Link>
                  <button
                    type="button"
                    onClick={() => void togglePublish(template)}
                    className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-bg-base/55 px-4 py-2.5 text-sm font-medium text-text-primary transition hover:border-border-hover hover:bg-bg-hover/60"
                  >
                    {template.is_published ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    {template.is_published ? "下架" : "上架"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void deleteTemplate(template)}
                    disabled={deletingId === template.id}
                    className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/8 px-4 py-2.5 text-sm font-medium text-red-400 transition hover:bg-red-500/12 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Trash2 className="size-4" />
                    删除
                  </button>
                  <span className="ml-auto inline-flex items-center gap-2 text-xs uppercase tracking-[0.26em] text-text-tertiary">
                    Open Template
                    <ArrowRight className="size-3.5" />
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
