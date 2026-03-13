"use client";

import type { ChangeEvent, ReactNode } from "react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { GripVertical, ImagePlus, Plus, Save, Sparkles, Trash2, Upload } from "lucide-react";

import { templateCategoryOptions } from "@/constants/template-categories";
import { ALL_IMAGE_MODEL_IDS, expandCompatibleModels, getModelLabel, normalizeGenerationModel } from "@/lib/models";
import type { DbTemplate, TemplateVariable } from "@/types/database";
import type { GenerationModel, UserTier } from "@/types/generation";

interface TemplateFormProps {
  initialData?: DbTemplate;
}

const sectionClassName =
  "rounded-[30px] border border-border/60 bg-bg-elevated/82 p-6 shadow-[0_24px_56px_-42px_rgba(15,15,16,0.55)] lg:p-7";
const labelClassName = "mb-1.5 block text-sm font-medium text-text-primary";
const hintClassName = "mt-1 text-xs leading-5 text-text-tertiary";
const inputClassName =
  "w-full rounded-2xl border border-border/70 bg-bg-base/60 px-4 py-3 text-sm text-text-primary placeholder:text-text-tertiary transition focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15";
const textareaClassName = `${inputClassName} resize-none`;

function createEmptyVariable(index: number): TemplateVariable {
  return {
    id: `var_${Date.now()}_${index}`,
    name: "",
    type: "select",
    required: true,
    priority: index + 1,
    options: [{ value: "", label: "", description: "" }],
    defaultValue: "",
  };
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

async function readError(response: Response) {
  try {
    const payload = (await response.json()) as { error?: string };
    return payload.error ?? "未知错误";
  } catch {
    return "未知错误";
  }
}

function SectionHeader({
  eyebrow,
  title,
  description,
  aside,
}: {
  eyebrow: string;
  title: string;
  description: string;
  aside?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <p className="text-[11px] uppercase tracking-[0.28em] text-text-tertiary">{eyebrow}</p>
        <h2 className="mt-3 font-serif text-3xl text-text-primary">{title}</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-text-secondary">{description}</p>
      </div>
      {aside}
    </div>
  );
}

export function TemplateForm({ initialData }: TemplateFormProps) {
  const router = useRouter();
  const isEditing = Boolean(initialData);
  const initialCompatibleModels = expandCompatibleModels(initialData?.compatible_models, {
    hasImageInputs: initialData?.variables.some((variable) => variable.type === "image") ?? false,
  });
  const initialDefaultModel = normalizeGenerationModel(
    initialData?.default_model,
    initialCompatibleModels[0] ?? "nano-banana-2-2k",
  );

  const [slug, setSlug] = useState(initialData?.slug ?? "");
  const [name, setName] = useState(initialData?.name ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [category, setCategory] = useState<DbTemplate["category"]>(initialData?.category ?? "product");
  const [tags, setTags] = useState(initialData?.tags.join(", ") ?? "");
  const [thumbnailPreview, setThumbnailPreview] = useState(initialData?.thumbnail_url ?? "");
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [variables, setVariables] = useState<TemplateVariable[]>(initialData?.variables ?? []);
  const [skillPrompt, setSkillPrompt] = useState(initialData?.skill_prompt ?? "");
  const [basePrompt, setBasePrompt] = useState(initialData?.base_prompt ?? "");
  const [negativePrompt, setNegativePrompt] = useState(initialData?.negative_prompt ?? "");
  const [defaultModel, setDefaultModel] = useState<GenerationModel>(initialDefaultModel);
  const [compatibleModels, setCompatibleModels] = useState<GenerationModel[]>(
    initialCompatibleModels.length > 0 ? initialCompatibleModels : ["nano-banana-2-2k"],
  );
  const [sortOrder, setSortOrder] = useState(initialData?.sort_order ?? 0);
  const [tierRequired, setTierRequired] = useState<UserTier>(initialData?.tier_required ?? "free");
  const [creditMultiplier, setCreditMultiplier] = useState(initialData?.credit_multiplier ?? 1);
  const [isPublished, setIsPublished] = useState(initialData?.is_published ?? false);
  const [saving, setSaving] = useState(false);

  const resolvedSlug = useMemo(() => slugify(slug || name), [name, slug]);
  const imageVariableCount = variables.filter((variable) => variable.type === "image").length;
  const requiredVariableCount = variables.filter((variable) => variable.required).length;

  function addVariable() {
    setVariables((current) => [...current, createEmptyVariable(current.length)]);
  }

  function updateVariable(index: number, updates: Partial<TemplateVariable>) {
    setVariables((current) =>
      current.map((variable, itemIndex) => (itemIndex === index ? { ...variable, ...updates } : variable)),
    );
  }

  function removeVariable(index: number) {
    setVariables((current) =>
      current
        .filter((_, itemIndex) => itemIndex !== index)
        .map((variable, itemIndex) => ({ ...variable, priority: itemIndex + 1 })),
    );
  }

  function addOption(variableIndex: number) {
    const target = variables[variableIndex];
    updateVariable(variableIndex, {
      options: [...(target.options ?? []), { value: "", label: "", description: "" }],
    });
  }

  function updateOption(
    variableIndex: number,
    optionIndex: number,
    updates: Partial<{ value: string; label: string; description?: string }>,
  ) {
    const target = variables[variableIndex];
    updateVariable(variableIndex, {
      options: (target.options ?? []).map((option, itemIndex) =>
        itemIndex === optionIndex ? { ...option, ...updates } : option,
      ),
    });
  }

  function removeOption(variableIndex: number, optionIndex: number) {
    const target = variables[variableIndex];
    updateVariable(variableIndex, {
      options: (target.options ?? []).filter((_, itemIndex) => itemIndex !== optionIndex),
    });
  }

  function handleThumbnailChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setThumbnailFile(file);
    setThumbnailPreview(URL.createObjectURL(file));
  }

  function toggleCompatibleModel(model: GenerationModel) {
    setCompatibleModels((current) => {
      const next = current.includes(model) ? current.filter((item) => item !== model) : [...current, model];
      if (next.length === 0) {
        return [defaultModel];
      }
      return next;
    });
  }

  async function handleSave(publish: boolean) {
    if (!name.trim() || !resolvedSlug) {
      window.alert("模板名称和 slug 不能为空。");
      return;
    }

    setSaving(true);

    try {
      const nextCompatibleModels = Array.from(new Set([...compatibleModels, defaultModel]));
      const payload = {
        slug: resolvedSlug,
        name: name.trim(),
        description: description.trim(),
        category,
        tags: tags
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        thumbnail_url: initialData?.thumbnail_url ?? null,
        thumbnail_path: initialData?.thumbnail_path ?? null,
        default_model: defaultModel,
        compatible_models: nextCompatibleModels,
        default_image_size: { width: 1024, height: 1024 },
        variables: variables.map((variable, index) => ({
          ...variable,
          priority: index + 1,
          id: variable.id.trim() || `var_${index + 1}`,
          name: variable.name.trim(),
          options:
            variable.type === "select"
              ? (variable.options ?? []).map((option) => ({
                  value: option.value.trim(),
                  label: option.label.trim(),
                  description: option.description?.trim() || undefined,
                }))
              : undefined,
        })),
        skill_prompt: skillPrompt.trim(),
        base_prompt: basePrompt.trim(),
        negative_prompt: negativePrompt.trim() || null,
        credit_multiplier: Number(creditMultiplier),
        is_published: publish ? true : isPublished,
        sort_order: Number(sortOrder),
        tier_required: tierRequired,
      };

      let templateId = initialData?.id;

      if (isEditing && templateId) {
        const response = await fetch(`/api/admin/templates/${templateId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error(await readError(response));
        }
      } else {
        const response = await fetch("/api/admin/templates", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error(await readError(response));
        }

        const created = (await response.json()) as DbTemplate;
        templateId = created.id;
      }

      if (thumbnailFile && templateId) {
        const formData = new FormData();
        formData.append("file", thumbnailFile);

        const uploadResponse = await fetch(`/api/admin/templates/${templateId}/upload`, {
          method: "POST",
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error(await readError(uploadResponse));
        }
      }

      router.push("/admin/templates");
      router.refresh();
    } catch (error) {
      window.alert(`保存失败：${error instanceof Error ? error.message : "未知错误"}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-7">
      <section className="overflow-hidden rounded-[34px] border border-border/60 bg-bg-elevated/82 shadow-[0_30px_90px_-54px_rgba(15,15,16,0.66)]">
        <div className="grid gap-0 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="border-b border-border/60 p-7 xl:border-b-0 xl:border-r xl:p-9">
            <p className="text-[11px] uppercase tracking-[0.34em] text-text-tertiary">
              {isEditing ? "Template Editor" : "Template Composer"}
            </p>
            <h1 className="mt-4 font-serif text-4xl leading-tight text-text-primary lg:text-5xl">
              {isEditing ? `Refine ${name || "this template"}` : "Build a template that feels launch-ready."}
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-text-secondary">
              Covers, variables, prompt rules, model compatibility, and publishing all live here. The goal is not to
              dump data, but to shape a template a real user can trust at first glance.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => void handleSave(false)}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-bg-base/60 px-5 py-3 text-sm font-medium text-text-primary transition hover:border-border-hover hover:bg-bg-hover/70 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Save className="size-4" />
                {saving ? "保存中..." : "保存草稿"}
              </button>
              <button
                type="button"
                onClick={() => void handleSave(true)}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,rgba(236,72,153,0.94),rgba(139,92,246,0.88))] px-5 py-3 text-sm font-medium text-white shadow-[0_24px_48px_-30px_rgba(139,92,246,0.7)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Sparkles className="size-4" />
                {saving ? "保存中..." : "保存并上架"}
              </button>
            </div>
          </div>

          <div className="grid gap-4 p-7 xl:p-8">
            {[
              ["Slug", resolvedSlug || "待生成", "Unique identifier for routes and persistence."],
              ["变量", String(variables.length), `${requiredVariableCount} required · ${imageVariableCount} image-driven`],
              ["状态", isPublished ? "Published" : "Draft", "Publishing state used when saving."],
            ].map(([label, value, note]) => (
              <div key={label} className="rounded-[26px] border border-border/60 bg-bg-base/55 p-5">
                <p className="text-[11px] uppercase tracking-[0.28em] text-text-tertiary">{label}</p>
                <p className="mt-3 break-all text-xl font-medium text-text-primary">{value}</p>
                <p className="mt-2 text-sm text-text-secondary">{note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={sectionClassName}>
        <SectionHeader
          eyebrow="Foundation"
          title="Core identity"
          description="Give the template a clear name, a durable slug, and enough metadata for the library card to feel intentional instead of raw."
        />
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className={labelClassName}>模板名称</label>
            <input value={name} onChange={(event) => setName(event.target.value)} className={inputClassName} />
            <p className={hintClassName}>面向用户展示的正式标题，建议像产品名而不是内部备注。</p>
          </div>
          <div>
            <label className={labelClassName}>Slug</label>
            <input
              value={slug}
              onChange={(event) => setSlug(event.target.value)}
              placeholder="例如 skincare-luxury"
              className={inputClassName}
            />
            <p className={hintClassName}>唯一英文标识。留空时会根据模板名称自动生成。</p>
          </div>
          <div>
            <label className={labelClassName}>分类</label>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value as DbTemplate["category"])}
              className={inputClassName}
            >
              {templateCategoryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClassName}>标签</label>
            <input
              value={tags}
              onChange={(event) => setTags(event.target.value)}
              placeholder="用逗号分隔，例如 高级感, 商业海报"
              className={inputClassName}
            />
            <p className={hintClassName}>用于筛选与识别。控制在 3 到 6 个最有辨识度的词会更干净。</p>
          </div>
          <div className="md:col-span-2">
            <label className={labelClassName}>描述</label>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={4}
              className={textareaClassName}
            />
            <p className={hintClassName}>一句话说清主体、场景和风格，首页卡片和详情弹层都会读到这里。</p>
          </div>
        </div>
      </section>

      <section className={sectionClassName}>
        <SectionHeader
          eyebrow="Cover"
          title="Thumbnail direction"
          description="The cover should immediately sell the template. If the image is weak, the whole library starts to feel unfinished."
        />
        <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
          <div className="flex h-[260px] w-full items-center justify-center overflow-hidden rounded-[28px] border border-border/70 bg-bg-base/55">
            {thumbnailPreview ? (
              <img src={thumbnailPreview} alt={name || "模板缩略图"} className="h-full w-full object-cover" />
            ) : (
              <div className="px-8 text-center">
                <ImagePlus className="mx-auto size-8 text-text-tertiary" />
                <p className="mt-4 text-sm text-text-tertiary">上传一张能代表最终质感的封面图。</p>
              </div>
            )}
          </div>
          <div className="space-y-5">
            <div className="rounded-[24px] border border-border/60 bg-bg-base/55 p-5">
              <label className={labelClassName}>上传图片</label>
              <label className="flex cursor-pointer items-center gap-3 rounded-[22px] border border-dashed border-border/70 bg-bg-elevated/80 px-4 py-4 text-sm text-text-secondary transition hover:border-brand/50 hover:text-text-primary">
                <Upload className="size-4" />
                选择 PNG / JPG / WEBP 文件
                <input type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={handleThumbnailChange} />
              </label>
              <p className={hintClassName}>建议选择最能表达模板风格的一张图，不要只放通用占位图。</p>
            </div>
            <div className="rounded-[24px] border border-border/60 bg-bg-base/55 p-5">
              <label className={labelClassName}>当前缩略图 URL</label>
              <input value={thumbnailPreview} readOnly className={inputClassName} />
            </div>
          </div>
        </div>
      </section>

      <section className={sectionClassName}>
        <SectionHeader
          eyebrow="Variables"
          title="User-facing controls"
          description="Only expose controls a user should actually touch. Everything else belongs in the prompt system, not the UI."
          aside={
            <button
              type="button"
              onClick={addVariable}
              className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-bg-base/60 px-4 py-2.5 text-sm font-medium text-text-primary transition hover:border-border-hover hover:bg-bg-hover/70"
            >
              <Plus className="size-4" />
              添加变量
            </button>
          }
        />

        {variables.length === 0 ? (
          <div className="rounded-[26px] border border-dashed border-border/70 bg-bg-base/45 px-4 py-12 text-center text-sm text-text-tertiary">
            还没有变量。先加 2 到 4 个真正有价值的控制项，而不是把 prompt 里的所有细枝末节都暴露给用户。
          </div>
        ) : (
          <div className="space-y-4">
            {variables.map((variable, variableIndex) => (
              <div
                key={variable.id || variableIndex}
                className="rounded-[28px] border border-border/60 bg-bg-base/52 p-5 shadow-[0_16px_36px_-32px_rgba(15,15,16,0.5)]"
              >
                <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3 text-text-secondary">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border/60 bg-bg-elevated/70">
                      <GripVertical className="size-4" />
                    </span>
                    <div>
                      <p className="text-sm font-medium text-text-primary">变量 {variableIndex + 1}</p>
                      <p className="text-xs uppercase tracking-[0.24em] text-text-tertiary">{variable.type}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeVariable(variableIndex)}
                    className="inline-flex items-center gap-2 self-start rounded-full border border-red-500/20 bg-red-500/8 px-4 py-2 text-sm text-red-400 transition hover:bg-red-500/12 hover:text-red-300"
                  >
                    <Trash2 className="size-4" />
                    删除变量
                  </button>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <div>
                    <label className={labelClassName}>变量 ID</label>
                    <input
                      value={variable.id}
                      onChange={(event) => updateVariable(variableIndex, { id: event.target.value })}
                      placeholder="例如 lighting"
                      className={inputClassName}
                    />
                    <p className={hintClassName}>必须和 Base Prompt 里的占位符完全一致，例如 {`{{lighting}}`}。</p>
                  </div>
                  <div>
                    <label className={labelClassName}>变量名称</label>
                    <input
                      value={variable.name}
                      onChange={(event) => updateVariable(variableIndex, { name: event.target.value })}
                      placeholder="例如 光线"
                      className={inputClassName}
                    />
                  </div>
                  <div>
                    <label className={labelClassName}>类型</label>
                    <select
                      value={variable.type}
                      onChange={(event) => {
                        const nextType = event.target.value as TemplateVariable["type"];
                        updateVariable(variableIndex, {
                          type: nextType,
                          options:
                            nextType === "select"
                              ? variable.options ?? [{ value: "", label: "", description: "" }]
                              : undefined,
                          defaultValue: nextType === "select" ? variable.defaultValue ?? "" : undefined,
                          min: nextType === "slider" ? variable.min ?? 0 : undefined,
                          max: nextType === "slider" ? variable.max ?? 100 : undefined,
                          step: nextType === "slider" ? variable.step ?? 1 : undefined,
                          defaultNumber: nextType === "slider" ? variable.defaultNumber ?? 50 : undefined,
                          unit: nextType === "slider" ? variable.unit ?? "" : undefined,
                          accept:
                            nextType === "image"
                              ? variable.accept ?? "image/jpeg,image/png,image/webp"
                              : undefined,
                          maxSizeMB: nextType === "image" ? variable.maxSizeMB ?? 10 : undefined,
                          uploadHint: nextType === "image" ? variable.uploadHint ?? "" : undefined,
                        });
                      }}
                      className={inputClassName}
                    >
                      <option value="select">下拉选项</option>
                      <option value="slider">数值滑杆</option>
                      <option value="image">图片上传</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClassName}>优先级</label>
                    <input
                      type="number"
                      value={variable.priority}
                      onChange={(event) => updateVariable(variableIndex, { priority: Number(event.target.value) || 0 })}
                      className={inputClassName}
                    />
                  </div>
                </div>

                <label className="mt-5 inline-flex items-center gap-2 text-sm text-text-secondary">
                  <input
                    type="checkbox"
                    checked={variable.required}
                    onChange={(event) => updateVariable(variableIndex, { required: event.target.checked })}
                    className="size-4 rounded border-border/70 bg-bg-hover"
                  />
                  必填变量
                </label>

                {variable.type === "select" ? (
                  <div className="mt-6 space-y-4">
                    <div>
                      <label className={labelClassName}>默认值</label>
                      <input
                        value={variable.defaultValue ?? ""}
                        onChange={(event) => updateVariable(variableIndex, { defaultValue: event.target.value })}
                        className={inputClassName}
                      />
                      <p className={hintClassName}>这里填真正注入 prompt 的 value，不是给用户看的 label。</p>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-text-primary">选项列表</p>
                        <button
                          type="button"
                          onClick={() => addOption(variableIndex)}
                          className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-bg-elevated/70 px-4 py-2 text-sm text-text-primary transition hover:border-border-hover hover:bg-bg-hover/70"
                        >
                          <Plus className="size-4" />
                          添加选项
                        </button>
                      </div>

                      {(variable.options ?? []).map((option, optionIndex) => (
                        <div
                          key={`${option.value}-${optionIndex}`}
                          className="grid gap-3 rounded-[24px] border border-border/60 bg-bg-elevated/70 p-4 md:grid-cols-[1fr_1fr_1.2fr_auto]"
                        >
                          <input
                            value={option.value}
                            onChange={(event) =>
                              updateOption(variableIndex, optionIndex, { value: event.target.value })
                            }
                            placeholder="value"
                            className={inputClassName}
                          />
                          <input
                            value={option.label}
                            onChange={(event) =>
                              updateOption(variableIndex, optionIndex, { label: event.target.value })
                            }
                            placeholder="label"
                            className={inputClassName}
                          />
                          <input
                            value={option.description ?? ""}
                            onChange={(event) =>
                              updateOption(variableIndex, optionIndex, { description: event.target.value })
                            }
                            placeholder="description"
                            className={inputClassName}
                          />
                          <button
                            type="button"
                            onClick={() => removeOption(variableIndex, optionIndex)}
                            className="rounded-2xl border border-red-500/20 px-3 text-red-400 transition hover:bg-red-500/10 hover:text-red-300"
                          >
                            删除
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : variable.type === "image" ? (
                  <div className="mt-6 grid gap-4 md:grid-cols-3">
                    <div>
                      <label className={labelClassName}>允许文件类型</label>
                      <input
                        value={variable.accept ?? "image/jpeg,image/png,image/webp"}
                        onChange={(event) => updateVariable(variableIndex, { accept: event.target.value })}
                        placeholder="image/jpeg,image/png,image/webp"
                        className={inputClassName}
                      />
                    </div>
                    <div>
                      <label className={labelClassName}>最大文件大小 (MB)</label>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={variable.maxSizeMB ?? 10}
                        onChange={(event) =>
                          updateVariable(variableIndex, { maxSizeMB: Number(event.target.value) })
                        }
                        className={inputClassName}
                      />
                    </div>
                    <div className="md:col-span-3">
                      <label className={labelClassName}>上传提示文案</label>
                      <input
                        value={variable.uploadHint ?? ""}
                        onChange={(event) => updateVariable(variableIndex, { uploadHint: event.target.value })}
                        placeholder="例如：请上传一张清晰的正面人脸照片"
                        className={inputClassName}
                      />
                      <p className={hintClassName}>这类变量会在前台变成图片上传控件，不会作为普通文字值注入。</p>
                    </div>
                  </div>
                ) : (
                  <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                    <div>
                      <label className={labelClassName}>最小值</label>
                      <input
                        type="number"
                        value={variable.min ?? 0}
                        onChange={(event) => updateVariable(variableIndex, { min: Number(event.target.value) })}
                        className={inputClassName}
                      />
                    </div>
                    <div>
                      <label className={labelClassName}>最大值</label>
                      <input
                        type="number"
                        value={variable.max ?? 100}
                        onChange={(event) => updateVariable(variableIndex, { max: Number(event.target.value) })}
                        className={inputClassName}
                      />
                    </div>
                    <div>
                      <label className={labelClassName}>步长</label>
                      <input
                        type="number"
                        value={variable.step ?? 1}
                        onChange={(event) => updateVariable(variableIndex, { step: Number(event.target.value) })}
                        className={inputClassName}
                      />
                    </div>
                    <div>
                      <label className={labelClassName}>默认数值</label>
                      <input
                        type="number"
                        value={variable.defaultNumber ?? 0}
                        onChange={(event) =>
                          updateVariable(variableIndex, { defaultNumber: Number(event.target.value) })
                        }
                        className={inputClassName}
                      />
                    </div>
                    <div>
                      <label className={labelClassName}>单位</label>
                      <input
                        value={variable.unit ?? ""}
                        onChange={(event) => updateVariable(variableIndex, { unit: event.target.value })}
                        placeholder="% / px / deg"
                        className={inputClassName}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className={sectionClassName}>
        <SectionHeader
          eyebrow="Prompt System"
          title="Prompt architecture"
          description="Lock the non-negotiable visual rules in the skill layer, keep the composable structure in the base prompt, and use negatives sparingly."
        />
        <div className="space-y-5">
          <div>
            <label className={labelClassName}>Skill Prompt</label>
            <textarea
              value={skillPrompt}
              onChange={(event) => setSkillPrompt(event.target.value)}
              rows={5}
              className={textareaClassName}
            />
            <p className={hintClassName}>这里放高层规则、风格纪律、随机化逻辑和不可妥协的约束。</p>
          </div>
          <div>
            <label className={labelClassName}>Base Prompt</label>
            <textarea
              value={basePrompt}
              onChange={(event) => setBasePrompt(event.target.value)}
              rows={8}
              className={textareaClassName}
            />
            <p className={hintClassName}>使用 {`{{变量id}}`} 占位，例如 {`{{lighting}}`} 或 {`{{face_ref}}`}。</p>
          </div>
          <div>
            <label className={labelClassName}>Negative Prompt</label>
            <textarea
              value={negativePrompt}
              onChange={(event) => setNegativePrompt(event.target.value)}
              rows={4}
              className={textareaClassName}
            />
          </div>
        </div>
      </section>

      <section className={sectionClassName}>
        <SectionHeader
          eyebrow="Model Strategy"
          title="Compatibility and default behavior"
          description="Set a safe default, then expose only the models that can actually preserve the template's look."
        />
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-[24px] border border-border/60 bg-bg-base/55 p-5">
            <label className={labelClassName}>默认模型</label>
            <select
              value={defaultModel}
              onChange={(event) => setDefaultModel(event.target.value as GenerationModel)}
              className={inputClassName}
            >
              {ALL_IMAGE_MODEL_IDS.map((model) => (
                <option key={model} value={model}>
                  {getModelLabel(model)}
                </option>
              ))}
            </select>
          </div>
          <div className="rounded-[24px] border border-border/60 bg-bg-base/55 p-5">
            <label className={labelClassName}>兼容模型</label>
            <div className="space-y-2">
              {ALL_IMAGE_MODEL_IDS.map((model) => (
                <label
                  key={model}
                  className="flex items-center gap-3 rounded-2xl border border-border/60 bg-bg-elevated/70 px-4 py-3 text-sm text-text-secondary"
                >
                  <input
                    type="checkbox"
                    checked={compatibleModels.includes(model)}
                    onChange={() => toggleCompatibleModel(model)}
                    className="size-4 rounded border-border/70 bg-bg-hover"
                  />
                  <span className="text-text-primary">{getModelLabel(model)}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className={sectionClassName}>
        <SectionHeader
          eyebrow="Operations"
          title="Publishing controls"
          description="Use sorting and tier gating to make the public library feel intentionally curated. Billing is now decided only by the selected model."
        />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[24px] border border-border/60 bg-bg-base/55 p-5">
            <label className={labelClassName}>排序值</label>
            <input
              type="number"
              value={sortOrder}
              onChange={(event) => setSortOrder(Number(event.target.value))}
              className={inputClassName}
            />
          </div>
          <div className="rounded-[24px] border border-border/60 bg-bg-base/55 p-5">
            <label className={labelClassName}>用户等级限制</label>
            <select
              value={tierRequired}
              onChange={(event) => setTierRequired(event.target.value as UserTier)}
              className={inputClassName}
            >
              <option value="free">Free</option>
              <option value="basic">Basic</option>
              <option value="pro">Pro</option>
            </select>
          </div>
          <div className="rounded-[24px] border border-border/60 bg-bg-base/55 p-5">
            <label className={labelClassName}>历史倍率（已停用）</label>
            <input
              type="number"
              min="0.1"
              step="0.1"
              value={creditMultiplier}
              onChange={(event) => setCreditMultiplier(Number(event.target.value))}
              className={inputClassName}
              disabled
            />
          </div>
          <div className="flex items-center rounded-[24px] border border-border/60 bg-bg-base/55 p-5">
            <label className="flex items-center gap-3 text-sm text-text-secondary">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(event) => setIsPublished(event.target.checked)}
                className="size-4 rounded border-border/70 bg-bg-hover"
              />
              保存草稿时维持上架状态
            </label>
          </div>
        </div>
      </section>
    </div>
  );
}
