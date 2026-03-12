"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Check,
  Copy,
  ImageUp,
  Layers3,
  Plus,
  Save,
  Sparkles,
  Trash2,
} from "lucide-react";

import { templateCategoryOptions } from "@/constants/template-categories";
import { templates } from "@/data/templates";
import { ALL_IMAGE_MODEL_IDS, getModelLabel } from "@/lib/models";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { GenerationModel } from "@/types/generation";
import type { Template, TemplateCategory, TemplateVariable, VariableOption } from "@/types/template";

const STORAGE_KEY = "munch-template-admin-drafts";
const categoryOptions: Array<{ value: TemplateCategory; label: string }> = [...templateCategoryOptions];
const modelOptions: Array<{ value: GenerationModel; label: string }> = ALL_IMAGE_MODEL_IDS.map((model) => ({
  value: model,
  label: getModelLabel(model),
}));

type TemplateDraft = Template & {
  draftId: string;
  updatedAt: string;
};

function deepCloneTemplate<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
  }

  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function createVariableOption(index: number): VariableOption {
  return {
    value: `option-${index}`,
    label: `选项 ${index}`,
    description: "",
  };
}

function createTemplateVariable(index: number): TemplateVariable {
  return {
    id: `variable-${index}`,
    name: `变量 ${index}`,
    type: "select",
    required: true,
    priority: index,
    options: [createVariableOption(1)],
    defaultValue: "option-1",
  };
}

function createEmptyDraft(): TemplateDraft {
  return {
    draftId: createId("draft"),
    updatedAt: new Date().toISOString(),
    id: createId("template"),
    name: "新模板",
    description: "",
    category: "product",
    tags: [],
    thumbnailUrl: "",
    defaultModel: "nano-banana-2-2k",
    compatibleModels: ["nano-banana-2-2k"],
    defaultImageSize: {
      width: 1024,
      height: 1024,
    },
    variables: [createTemplateVariable(1)],
    skillPrompt: "",
    basePrompt: "",
    negativePrompt: "",
    creditMultiplier: 1,
  };
}

function templateToDraft(template: Template): TemplateDraft {
  return {
    ...deepCloneTemplate(template),
    draftId: createId(template.id),
    updatedAt: new Date().toISOString(),
  };
}

function toExportTemplate(draft: TemplateDraft): Template {
  return {
    id: draft.id.trim(),
    name: draft.name.trim(),
    description: draft.description.trim(),
    category: draft.category,
    tags: draft.tags.filter(Boolean),
    thumbnailUrl: draft.thumbnailUrl.trim(),
    defaultModel: draft.defaultModel,
    compatibleModels: draft.compatibleModels,
    defaultImageSize: draft.defaultImageSize,
    variables: draft.variables.map((variable) => ({
      ...variable,
      id: variable.id.trim(),
      name: variable.name.trim(),
      options:
        variable.type === "select"
          ? (variable.options ?? []).map((option) => ({
              value: option.value.trim(),
              label: option.label.trim(),
              description: option.description?.trim() || undefined,
            }))
          : undefined,
      defaultValue: variable.type === "select" ? variable.defaultValue?.trim() : undefined,
      min: variable.type === "slider" ? variable.min ?? 0 : undefined,
      max: variable.type === "slider" ? variable.max ?? 100 : undefined,
      step: variable.type === "slider" ? variable.step ?? 1 : undefined,
      defaultNumber: variable.type === "slider" ? variable.defaultNumber ?? 0 : undefined,
      unit: variable.type === "slider" ? variable.unit?.trim() : undefined,
    })),
    skillPrompt: draft.skillPrompt.trim(),
    basePrompt: draft.basePrompt.trim(),
    negativePrompt: draft.negativePrompt?.trim() || undefined,
    creditMultiplier: draft.creditMultiplier,
  };
}

function parseDrafts(raw: string | null) {
  if (!raw) {
    return [] as TemplateDraft[];
  }

  try {
    return JSON.parse(raw) as TemplateDraft[];
  } catch {
    return [] as TemplateDraft[];
  }
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="glass-panel rounded-[28px] border border-border/70 p-5">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-text-primary">{title}</h2>
        {description ? <p className="mt-1 text-sm text-text-secondary">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-text-tertiary">{children}</label>;
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        "min-h-[108px] w-full rounded-2xl border border-border/70 bg-bg-elevated/82 px-4 py-3 text-sm text-text-primary outline-none transition placeholder:text-text-tertiary focus:border-border-hover",
        props.className,
      )}
    />
  );
}

export function TemplateAdmin() {
  const [drafts, setDrafts] = useState<TemplateDraft[]>([]);
  const [editor, setEditor] = useState<TemplateDraft>(() => createEmptyDraft());
  const [hydrated, setHydrated] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const storedDrafts = parseDrafts(window.localStorage.getItem(STORAGE_KEY));
    setDrafts(storedDrafts);
    if (storedDrafts[0]) {
      setEditor(storedDrafts[0]);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
  }, [drafts, hydrated]);

  useEffect(() => {
    if (!notice) {
      return;
    }

    const timer = window.setTimeout(() => {
      setNotice(null);
    }, 2200);

    return () => window.clearTimeout(timer);
  }, [notice]);

  const exportTemplate = useMemo(() => toExportTemplate(editor), [editor]);
  const exportJson = useMemo(() => JSON.stringify(exportTemplate, null, 2), [exportTemplate]);

  function patchEditor(patch: Partial<TemplateDraft>) {
    setEditor((current) => ({ ...current, ...patch }));
  }

  function saveDraft() {
    const nextDraft = {
      ...editor,
      updatedAt: new Date().toISOString(),
    };

    setEditor(nextDraft);
    setDrafts((current) => {
      const exists = current.some((item) => item.draftId === nextDraft.draftId);
      if (exists) {
        return current.map((item) => (item.draftId === nextDraft.draftId ? nextDraft : item));
      }

      return [nextDraft, ...current];
    });
    setNotice("模板草稿已保存到本地");
  }

  async function copyTemplateJson() {
    await navigator.clipboard.writeText(exportJson);
    setNotice("模板 JSON 已复制");
  }

  function loadBuiltinTemplate(template: Template) {
    setEditor(templateToDraft(template));
    setNotice(`已载入 ${template.name}`);
  }

  function createNewDraft() {
    setEditor(createEmptyDraft());
    setNotice("已创建空白模板");
  }

  function removeDraft(draftId: string) {
    setDrafts((current) => current.filter((item) => item.draftId !== draftId));
    if (editor.draftId === draftId) {
      setEditor(createEmptyDraft());
    }
  }

  function updateVariable(index: number, patch: Partial<TemplateVariable>) {
    setEditor((current) => {
      const nextVariables = [...current.variables];
      const existing = nextVariables[index];
      const nextVariable = { ...existing, ...patch };

      if (patch.type === "slider") {
        nextVariable.options = undefined;
        nextVariable.defaultValue = undefined;
        nextVariable.min = existing.min ?? 0;
        nextVariable.max = existing.max ?? 100;
        nextVariable.step = existing.step ?? 1;
        nextVariable.defaultNumber = existing.defaultNumber ?? 50;
      }

      if (patch.type === "select") {
        nextVariable.options = existing.options?.length ? existing.options : [createVariableOption(1)];
        nextVariable.defaultValue = existing.defaultValue ?? nextVariable.options?.[0]?.value;
        nextVariable.min = undefined;
        nextVariable.max = undefined;
        nextVariable.step = undefined;
        nextVariable.defaultNumber = undefined;
        nextVariable.unit = undefined;
      }

      nextVariables[index] = nextVariable;
      return { ...current, variables: nextVariables };
    });
  }

  function updateVariableOption(variableIndex: number, optionIndex: number, patch: Partial<VariableOption>) {
    setEditor((current) => {
      const nextVariables = [...current.variables];
      const variable = nextVariables[variableIndex];
      const options = [...(variable.options ?? [])];
      options[optionIndex] = { ...options[optionIndex], ...patch };
      nextVariables[variableIndex] = { ...variable, options };
      return { ...current, variables: nextVariables };
    });
  }

  function addVariable() {
    setEditor((current) => ({
      ...current,
      variables: [...current.variables, createTemplateVariable(current.variables.length + 1)],
    }));
  }

  function removeVariable(index: number) {
    setEditor((current) => ({
      ...current,
      variables: current.variables.filter((_, variableIndex) => variableIndex !== index),
    }));
  }

  function addVariableOption(variableIndex: number) {
    setEditor((current) => {
      const nextVariables = [...current.variables];
      const variable = nextVariables[variableIndex];
      const nextOptions = [...(variable.options ?? []), createVariableOption((variable.options?.length ?? 0) + 1)];
      nextVariables[variableIndex] = {
        ...variable,
        options: nextOptions,
        defaultValue: variable.defaultValue ?? nextOptions[0]?.value,
      };
      return { ...current, variables: nextVariables };
    });
  }

  function removeVariableOption(variableIndex: number, optionIndex: number) {
    setEditor((current) => {
      const nextVariables = [...current.variables];
      const variable = nextVariables[variableIndex];
      const nextOptions = (variable.options ?? []).filter((_, currentIndex) => currentIndex !== optionIndex);
      nextVariables[variableIndex] = {
        ...variable,
        options: nextOptions,
        defaultValue: nextOptions[0]?.value,
      };
      return { ...current, variables: nextVariables };
    });
  }

  function toggleCompatibleModel(model: GenerationModel) {
    setEditor((current) => {
      const exists = current.compatibleModels.includes(model);
      const compatibleModels = exists
        ? current.compatibleModels.filter((item) => item !== model)
        : [...current.compatibleModels, model];

      return {
        ...current,
        compatibleModels: compatibleModels.length ? compatibleModels : [model],
      };
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-text-tertiary">Template Console</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-text-primary">模板后台</h1>
          <p className="mt-2 max-w-2xl text-sm text-text-secondary">
            这是一版前端模板管理台。你现在可以录入模板名、缩略图、Prompt、变量结构，并先保存为本地草稿。
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {notice ? (
            <div className="rounded-full border border-brand/20 bg-brand-muted px-3 py-1.5 text-sm text-text-primary">
              {notice}
            </div>
          ) : null}
          <Button variant="outline" onClick={createNewDraft}>
            <Plus />
            新建模板
          </Button>
          <Button variant="outline" onClick={copyTemplateJson}>
            <Copy />
            复制 JSON
          </Button>
          <Button onClick={saveDraft}>
            <Save />
            保存草稿
          </Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <div className="space-y-6 xl:sticky xl:top-20 xl:self-start">
          <Section title="内置模板" description="点击任一模板，把它载入右侧编辑器当成起点。">
            <div className="space-y-2">
              {templates.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => loadBuiltinTemplate(template)}
                  className="flex w-full items-center justify-between rounded-2xl border border-border/70 bg-bg-elevated/72 px-4 py-3 text-left transition hover:border-border-hover hover:bg-bg-hover"
                >
                  <div>
                    <p className="text-sm font-medium text-text-primary">{template.name}</p>
                    <p className="mt-1 text-xs text-text-secondary">{template.id}</p>
                  </div>
                  <span className="rounded-full border border-border/70 px-2.5 py-1 text-[11px] text-text-tertiary">
                    {categoryOptions.find((item) => item.value === template.category)?.label}
                  </span>
                </button>
              ))}
            </div>
          </Section>

          <Section title="本地草稿" description="保存在浏览器本地，不写入真实模板库。">
            <div className="space-y-2">
              {drafts.length ? (
                drafts.map((draft) => (
                  <div
                    key={draft.draftId}
                    className="flex items-center gap-2 rounded-2xl border border-border/70 bg-bg-elevated/72 px-3 py-3"
                  >
                    <button
                      type="button"
                      onClick={() => setEditor(draft)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <p className="truncate text-sm font-medium text-text-primary">{draft.name}</p>
                      <p className="mt-1 truncate text-xs text-text-secondary">{draft.id}</p>
                    </button>
                    <button
                      type="button"
                      aria-label={`删除 ${draft.name}`}
                      onClick={() => removeDraft(draft.draftId)}
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-border/70 bg-bg-base/60 text-text-tertiary transition hover:border-border-hover hover:text-text-primary"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-border/70 px-4 py-5 text-sm text-text-secondary">
                  还没有本地草稿。右侧编辑后点“保存草稿”即可。
                </div>
              )}
            </div>
          </Section>

          <Section title="实时预览" description="录入缩略图地址后，这里会即时预览。">
            <div className="overflow-hidden rounded-[24px] border border-border/70 bg-bg-elevated/72">
              {editor.thumbnailUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={editor.thumbnailUrl} alt={editor.name} className="aspect-[4/5] w-full object-cover" />
              ) : (
                <div className="flex aspect-[4/5] items-center justify-center bg-bg-base/72 text-text-tertiary">
                  <div className="text-center">
                    <ImageUp className="mx-auto mb-3 size-8" />
                    <p className="text-sm">输入模板缩略图 URL</p>
                  </div>
                </div>
              )}
            </div>
          </Section>
        </div>

        <div className="space-y-6">
          <Section title="模板基础信息" description="这里对应模板主信息、分类、封面和默认模型。">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <FieldLabel>模板 ID</FieldLabel>
                <Input
                  value={editor.id}
                  onChange={(event) => patchEditor({ id: event.target.value })}
                  className="h-11 rounded-2xl border-border/70 bg-bg-elevated/82 text-text-primary"
                />
              </div>
              <div>
                <FieldLabel>模板名称</FieldLabel>
                <Input
                  value={editor.name}
                  onChange={(event) => patchEditor({ name: event.target.value })}
                  className="h-11 rounded-2xl border-border/70 bg-bg-elevated/82 text-text-primary"
                />
              </div>
              <div className="md:col-span-2">
                <FieldLabel>模板描述</FieldLabel>
                <Textarea
                  value={editor.description}
                  onChange={(event) => patchEditor({ description: event.target.value })}
                  className="min-h-[88px]"
                />
              </div>
              <div>
                <FieldLabel>分类</FieldLabel>
                <select
                  value={editor.category}
                  onChange={(event) => patchEditor({ category: event.target.value as TemplateCategory })}
                  className="h-11 w-full rounded-2xl border border-border/70 bg-bg-elevated/82 px-4 text-sm text-text-primary outline-none transition focus:border-border-hover"
                >
                  {categoryOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <FieldLabel>标签（逗号分隔）</FieldLabel>
                <Input
                  value={editor.tags.join(", ")}
                  onChange={(event) =>
                    patchEditor({
                      tags: event.target.value
                        .split(",")
                        .map((item) => item.trim())
                        .filter(Boolean),
                    })
                  }
                  className="h-11 rounded-2xl border-border/70 bg-bg-elevated/82 text-text-primary"
                />
              </div>
              <div className="md:col-span-2">
                <FieldLabel>缩略图 URL</FieldLabel>
                <Input
                  value={editor.thumbnailUrl}
                  onChange={(event) => patchEditor({ thumbnailUrl: event.target.value })}
                  className="h-11 rounded-2xl border-border/70 bg-bg-elevated/82 text-text-primary"
                />
              </div>
            </div>
          </Section>

          <Section title="生成参数" description="模型兼容性、默认尺寸和积分倍率都在这里。">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <FieldLabel>默认模型</FieldLabel>
                <select
                  value={editor.defaultModel}
                  onChange={(event) => patchEditor({ defaultModel: event.target.value as GenerationModel })}
                  className="h-11 w-full rounded-2xl border border-border/70 bg-bg-elevated/82 px-4 text-sm text-text-primary outline-none transition focus:border-border-hover"
                >
                  {modelOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <FieldLabel>积分倍率</FieldLabel>
                <Input
                  type="number"
                  step="0.1"
                  value={editor.creditMultiplier}
                  onChange={(event) =>
                    patchEditor({
                      creditMultiplier: Number(event.target.value) || 1,
                    })
                  }
                  className="h-11 rounded-2xl border-border/70 bg-bg-elevated/82 text-text-primary"
                />
              </div>
              <div>
                <FieldLabel>默认宽度</FieldLabel>
                <Input
                  type="number"
                  value={editor.defaultImageSize.width}
                  onChange={(event) =>
                    patchEditor({
                      defaultImageSize: {
                        ...editor.defaultImageSize,
                        width: Number(event.target.value) || 1024,
                      },
                    })
                  }
                  className="h-11 rounded-2xl border-border/70 bg-bg-elevated/82 text-text-primary"
                />
              </div>
              <div>
                <FieldLabel>默认高度</FieldLabel>
                <Input
                  type="number"
                  value={editor.defaultImageSize.height}
                  onChange={(event) =>
                    patchEditor({
                      defaultImageSize: {
                        ...editor.defaultImageSize,
                        height: Number(event.target.value) || 1024,
                      },
                    })
                  }
                  className="h-11 rounded-2xl border-border/70 bg-bg-elevated/82 text-text-primary"
                />
              </div>
            </div>

            <div className="mt-4">
              <FieldLabel>兼容模型</FieldLabel>
              <div className="flex flex-wrap gap-2">
                {modelOptions.map((option) => {
                  const active = editor.compatibleModels.includes(option.value);
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => toggleCompatibleModel(option.value)}
                      className={cn(
                        "flex h-10 items-center gap-2 rounded-full border px-4 text-sm transition",
                        active
                          ? "border-brand/25 bg-brand-muted text-text-primary"
                          : "border-border/70 bg-bg-elevated/72 text-text-secondary hover:border-border-hover hover:text-text-primary",
                      )}
                    >
                      {active ? <Check className="size-4" /> : <Layers3 className="size-4" />}
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </Section>

          <Section title="Prompt 区" description="和产品约定好的技能提示、基础 Prompt、负向 Prompt 都在这。">
            <div className="space-y-4">
              <div>
                <FieldLabel>Skill Prompt</FieldLabel>
                <Textarea
                  value={editor.skillPrompt}
                  onChange={(event) => patchEditor({ skillPrompt: event.target.value })}
                />
              </div>
              <div>
                <FieldLabel>Base Prompt</FieldLabel>
                <Textarea
                  value={editor.basePrompt}
                  onChange={(event) => patchEditor({ basePrompt: event.target.value })}
                />
              </div>
              <div>
                <FieldLabel>Negative Prompt</FieldLabel>
                <Textarea
                  value={editor.negativePrompt ?? ""}
                  onChange={(event) => patchEditor({ negativePrompt: event.target.value })}
                  className="min-h-[88px]"
                />
              </div>
            </div>
          </Section>

          <Section title="变量定义" description="每个模板的变量都在这里配置，支持 Select 和 Slider 两种。">
            <div className="space-y-4">
              {editor.variables.map((variable, variableIndex) => (
                <div
                  key={`${variable.id}-${variableIndex}`}
                  className="rounded-[24px] border border-border/70 bg-bg-elevated/60 p-4"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-text-primary">{variable.name || `变量 ${variableIndex + 1}`}</p>
                      <p className="mt-1 text-xs text-text-secondary">{variable.id || "未命名变量"}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeVariable(variableIndex)}
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-border/70 bg-bg-base/60 text-text-tertiary transition hover:border-border-hover hover:text-text-primary"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <div>
                      <FieldLabel>变量 ID</FieldLabel>
                      <Input
                        value={variable.id}
                        onChange={(event) => updateVariable(variableIndex, { id: event.target.value })}
                        className="h-11 rounded-2xl border-border/70 bg-bg-base/62 text-text-primary"
                      />
                    </div>
                    <div>
                      <FieldLabel>变量名</FieldLabel>
                      <Input
                        value={variable.name}
                        onChange={(event) => updateVariable(variableIndex, { name: event.target.value })}
                        className="h-11 rounded-2xl border-border/70 bg-bg-base/62 text-text-primary"
                      />
                    </div>
                    <div>
                      <FieldLabel>类型</FieldLabel>
                      <select
                        value={variable.type}
                        onChange={(event) =>
                          updateVariable(variableIndex, {
                            type: event.target.value as TemplateVariable["type"],
                          })
                        }
                        className="h-11 w-full rounded-2xl border border-border/70 bg-bg-base/62 px-4 text-sm text-text-primary outline-none transition focus:border-border-hover"
                      >
                        <option value="select">Select</option>
                        <option value="slider">Slider</option>
                      </select>
                    </div>
                    <div>
                      <FieldLabel>优先级</FieldLabel>
                      <Input
                        type="number"
                        value={variable.priority}
                        onChange={(event) =>
                          updateVariable(variableIndex, {
                            priority: Number(event.target.value) || variableIndex + 1,
                          })
                        }
                        className="h-11 rounded-2xl border-border/70 bg-bg-base/62 text-text-primary"
                      />
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => updateVariable(variableIndex, { required: !variable.required })}
                      className={cn(
                        "rounded-full border px-4 py-2 text-sm transition",
                        variable.required
                          ? "border-brand/25 bg-brand-muted text-text-primary"
                          : "border-border/70 bg-bg-base/62 text-text-secondary",
                      )}
                    >
                      必填：{variable.required ? "是" : "否"}
                    </button>
                  </div>

                  {variable.type === "select" ? (
                    <div className="mt-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <FieldLabel>选项列表</FieldLabel>
                        <Button variant="outline" size="sm" onClick={() => addVariableOption(variableIndex)}>
                          <Plus />
                          新增选项
                        </Button>
                      </div>
                      {(variable.options ?? []).map((option, optionIndex) => (
                        <div
                          key={`${option.value}-${optionIndex}`}
                          className="grid gap-3 rounded-2xl border border-border/70 bg-bg-base/58 p-3 md:grid-cols-[1fr_1fr_1.3fr_40px]"
                        >
                          <Input
                            value={option.value}
                            onChange={(event) =>
                              updateVariableOption(variableIndex, optionIndex, { value: event.target.value })
                            }
                            placeholder="value"
                            className="h-10 rounded-xl border-border/70 bg-bg-elevated/82 text-text-primary"
                          />
                          <Input
                            value={option.label}
                            onChange={(event) =>
                              updateVariableOption(variableIndex, optionIndex, { label: event.target.value })
                            }
                            placeholder="label"
                            className="h-10 rounded-xl border-border/70 bg-bg-elevated/82 text-text-primary"
                          />
                          <Input
                            value={option.description ?? ""}
                            onChange={(event) =>
                              updateVariableOption(variableIndex, optionIndex, { description: event.target.value })
                            }
                            placeholder="描述（可选）"
                            className="h-10 rounded-xl border-border/70 bg-bg-elevated/82 text-text-primary"
                          />
                          <button
                            type="button"
                            onClick={() => removeVariableOption(variableIndex, optionIndex)}
                            className="flex h-10 w-10 items-center justify-center rounded-xl border border-border/70 bg-bg-elevated/82 text-text-tertiary transition hover:border-border-hover hover:text-text-primary"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      ))}

                      <div>
                        <FieldLabel>默认值</FieldLabel>
                        <Input
                          value={variable.defaultValue ?? ""}
                          onChange={(event) => updateVariable(variableIndex, { defaultValue: event.target.value })}
                          className="h-11 rounded-2xl border-border/70 bg-bg-base/62 text-text-primary"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                      <div>
                        <FieldLabel>最小值</FieldLabel>
                        <Input
                          type="number"
                          value={variable.min ?? 0}
                          onChange={(event) => updateVariable(variableIndex, { min: Number(event.target.value) })}
                          className="h-11 rounded-2xl border-border/70 bg-bg-base/62 text-text-primary"
                        />
                      </div>
                      <div>
                        <FieldLabel>最大值</FieldLabel>
                        <Input
                          type="number"
                          value={variable.max ?? 100}
                          onChange={(event) => updateVariable(variableIndex, { max: Number(event.target.value) })}
                          className="h-11 rounded-2xl border-border/70 bg-bg-base/62 text-text-primary"
                        />
                      </div>
                      <div>
                        <FieldLabel>步进</FieldLabel>
                        <Input
                          type="number"
                          value={variable.step ?? 1}
                          onChange={(event) => updateVariable(variableIndex, { step: Number(event.target.value) })}
                          className="h-11 rounded-2xl border-border/70 bg-bg-base/62 text-text-primary"
                        />
                      </div>
                      <div>
                        <FieldLabel>默认值</FieldLabel>
                        <Input
                          type="number"
                          value={variable.defaultNumber ?? 0}
                          onChange={(event) =>
                            updateVariable(variableIndex, {
                              defaultNumber: Number(event.target.value),
                            })
                          }
                          className="h-11 rounded-2xl border-border/70 bg-bg-base/62 text-text-primary"
                        />
                      </div>
                      <div>
                        <FieldLabel>单位</FieldLabel>
                        <Input
                          value={variable.unit ?? ""}
                          onChange={(event) => updateVariable(variableIndex, { unit: event.target.value })}
                          className="h-11 rounded-2xl border-border/70 bg-bg-base/62 text-text-primary"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}

              <Button variant="outline" onClick={addVariable}>
                <Plus />
                新增变量
              </Button>
            </div>
          </Section>

          <Section title="导出预览" description="这里就是后台录完后，准备交给模板库或后端的结构。">
            <div className="rounded-[24px] border border-border/70 bg-bg-base/72 p-4">
              <div className="mb-3 flex items-center gap-2 text-sm text-text-secondary">
                <Sparkles className="size-4" />
                当前输出基于右侧编辑器实时生成
              </div>
              <pre className="max-h-[520px] overflow-auto text-xs leading-6 text-text-secondary">{exportJson}</pre>
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}
