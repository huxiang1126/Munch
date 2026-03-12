"use client";

import { X } from "lucide-react";

import { GlowButton } from "@/components/shared/glow-button";
import { useWorkspaceStore } from "@/stores/workspace-store";

export function TemplateDetailModal() {
  const activeModal = useWorkspaceStore((state) => state.activeModal);
  const viewingTemplateId = useWorkspaceStore((state) => state.viewingTemplateId);
  const templates = useWorkspaceStore((state) => state.templates);
  const closeModal = useWorkspaceStore((state) => state.closeModal);
  const openVariableEditor = useWorkspaceStore((state) => state.openVariableEditor);
  const template = viewingTemplateId ? templates.find((item) => item.id === viewingTemplateId) ?? null : null;

  if (activeModal !== "template-detail" || !template) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[60]">
      <button
        type="button"
        aria-label="关闭模板详情"
        onClick={closeModal}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />
      <div className="relative flex h-full items-center justify-center p-4">
        <div
          className="surface-panel relative flex max-h-[80vh] w-full max-w-[900px] flex-col overflow-hidden rounded-2xl md:flex-row"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="relative flex min-h-64 w-full flex-none items-center justify-center bg-bg-hover/40 p-6 md:w-[45%]">
            <img
              src={template.thumbnail_url ?? "/images/logo.svg"}
              alt={template.name}
              className="h-full w-full object-contain p-6"
            />
          </div>
          <div className="flex-1 space-y-5 overflow-y-auto p-6">
            <button
              type="button"
              onClick={closeModal}
              aria-label="关闭"
              className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-border/70 bg-bg-elevated/80 text-text-tertiary transition hover:-translate-y-0.5 hover:border-border-hover hover:bg-bg-hover hover:text-text-primary"
            >
              <X className="size-5" />
            </button>
            <h2 className="pr-12 text-2xl font-bold text-text-primary">{template.name}</h2>
            <p className="text-sm text-text-secondary">{template.description}</p>
            <div>
              <span className="text-xs uppercase tracking-wider text-text-tertiary">提示词</span>
              <div className="mt-2 max-h-32 overflow-y-auto rounded-lg bg-bg-hover/55 p-3 font-mono text-sm text-text-secondary">
                {template.base_prompt}
              </div>
            </div>
            <div>
              <span className="text-xs uppercase tracking-wider text-text-tertiary">可调变量</span>
              <div className="mt-2 flex flex-wrap gap-2">
                {template.variables.map((variable) => (
                  <span
                    key={variable.id}
                    className="rounded-full border border-border/70 bg-bg-elevated/70 px-3 py-1 text-sm text-text-secondary"
                  >
                    {variable.name}
                  </span>
                ))}
              </div>
            </div>
            <GlowButton size="lg" className="mt-4 w-full" onClick={openVariableEditor}>
              使用此模板创作
            </GlowButton>
          </div>
        </div>
      </div>
    </div>
  );
}
