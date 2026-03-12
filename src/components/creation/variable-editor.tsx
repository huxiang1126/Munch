"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ImagePlus, Images, X } from "lucide-react";

import { AssetPickerDialog } from "@/components/assets/asset-picker-dialog";
import { GlowButton } from "@/components/shared/glow-button";
import { useGeneration } from "@/hooks/use-generation";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { getCreditCost } from "@/lib/constants";
import { getModelDisplayText } from "@/lib/models";
import { cn } from "@/lib/utils";
import { useWorkspaceStore } from "@/stores/workspace-store";
import type { TemplateVariable } from "@/types/database";

function ImageUploadField({
  variable,
}: {
  variable: TemplateVariable;
}) {
  const [assetPickerOpen, setAssetPickerOpen] = useState(false);
  const imageFiles = useWorkspaceStore((state) => state.imageFiles);
  const setImageFile = useWorkspaceStore((state) => state.setImageFile);
  const file = imageFiles[variable.id] ?? null;
  const previewUrl = file ? URL.createObjectURL(file) : null;

  const accept = variable.accept ?? "image/jpeg,image/png,image/webp";
  const maxSizeMB = variable.maxSizeMB ?? 10;

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0];
    if (!selected) {
      return;
    }

    if (selected.size > maxSizeMB * 1024 * 1024) {
      window.alert(`文件大小不能超过 ${maxSizeMB}MB`);
      return;
    }

    setImageFile(variable.id, selected);
  }

  function handleRemove() {
    setImageFile(variable.id, null);
  }

  async function handleSelectAsset(selectedFile: File) {
    setImageFile(variable.id, selectedFile);
  }

  return (
    <div className="space-y-2">
      <AssetPickerDialog
        open={assetPickerOpen}
        onOpenChange={setAssetPickerOpen}
        onSelect={handleSelectAsset}
        title={`${variable.name}素材库`}
        description="从你已经上传过的参考图里选一张，或上传新的素材。"
        accept={accept}
      />
      {previewUrl ? (
        <div className="space-y-3">
          <div className="relative inline-block">
            <img
              src={previewUrl}
              alt={variable.name}
              className="h-32 w-32 rounded-xl border border-border/70 object-cover"
            />
            <button
              type="button"
              onClick={handleRemove}
              className="absolute -right-2 -top-2 rounded-full border border-border/70 bg-bg-elevated p-1 text-text-secondary transition hover:text-red-400"
            >
              <X className="size-3.5" />
            </button>
          </div>
          <button
            type="button"
            onClick={() => setAssetPickerOpen(true)}
            className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-bg-elevated/80 px-3 py-2 text-xs font-medium text-text-secondary transition hover:border-border-hover hover:bg-bg-hover hover:text-text-primary"
          >
            <Images className="size-3.5" />
            从素材库换一张
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <label className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border border-dashed border-border/70 bg-bg-elevated/70 px-4 py-6 text-sm text-text-secondary transition hover:border-brand/50 hover:text-text-primary">
            <ImagePlus className="size-6" />
            <span>点击上传{variable.name}</span>
            {variable.uploadHint ? (
              <span className="text-xs text-text-tertiary">{variable.uploadHint}</span>
            ) : null}
            <input type="file" accept={accept} hidden onChange={handleFileChange} />
          </label>
          <button
            type="button"
            onClick={() => setAssetPickerOpen(true)}
            className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-bg-elevated/80 px-3 py-2 text-xs font-medium text-text-secondary transition hover:border-border-hover hover:bg-bg-hover hover:text-text-primary"
          >
            <Images className="size-3.5" />
            从素材库选择
          </button>
        </div>
      )}
    </div>
  );
}

function VariableField({
  variable,
  value,
  onChange,
}: {
  variable: TemplateVariable;
  value: string;
  onChange: (value: string) => void;
}) {
  if (variable.type === "image") {
    return <ImageUploadField variable={variable} />;
  }

  const options = variable.options ?? [];
  const sliderValue = Number(value || (variable.defaultNumber ?? variable.min ?? 0));

  if (variable.type === "slider") {
    return (
      <div className="space-y-3 rounded-2xl border border-border/70 bg-bg-elevated/70 px-4 py-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-text-secondary">
            {variable.min ?? 0} - {variable.max ?? 100}
            {variable.unit ? ` ${variable.unit}` : ""}
          </span>
          <span className="font-medium text-text-primary">
            {sliderValue}
            {variable.unit ?? ""}
          </span>
        </div>
        <Slider
          min={variable.min ?? 0}
          max={variable.max ?? 100}
          step={variable.step ?? 1}
          value={[sliderValue]}
          onValueChange={([nextValue]) => onChange(String(nextValue))}
        />
      </div>
    );
  }

  if (options.length <= 3) {
    return (
      <RadioGroup value={value} onValueChange={onChange} className="gap-2">
        {options.map((option) => (
          <label
            key={option.value}
            className={cn(
              "flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition hover:-translate-y-0.5",
              value === option.value
                ? "border-brand/40 bg-brand-muted text-text-primary"
                : "border-border/70 bg-bg-elevated/70 text-text-secondary hover:border-border-hover hover:bg-bg-hover hover:text-text-primary",
            )}
          >
            <RadioGroupItem value={option.value} className="mt-0.5 border-border-hover text-brand" />
            <span className="space-y-1">
              <span className="block text-sm font-medium">{option.label}</span>
              {option.description ? (
                <span className="block text-xs text-text-tertiary">{option.description}</span>
              ) : null}
            </span>
          </label>
        ))}
      </RadioGroup>
    );
  }

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-11 rounded-xl border-border/70 bg-bg-elevated/80 text-text-primary">
        <SelectValue placeholder={`选择${variable.name}`} />
      </SelectTrigger>
      <SelectContent className="border-border/70 bg-bg-elevated text-text-primary">
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function VariableEditor() {
  const router = useRouter();
  const { isSubmitting, startGeneration } = useGeneration();
  const activeModal = useWorkspaceStore((state) => state.activeModal);
  const selectedTemplateId = useWorkspaceStore((state) => state.selectedTemplateId);
  const templates = useWorkspaceStore((state) => state.templates);
  const variables = useWorkspaceStore((state) => state.variables);
  const customPrompt = useWorkspaceStore((state) => state.customPrompt);
  const imageFiles = useWorkspaceStore((state) => state.imageFiles);
  const selectedModel = useWorkspaceStore((state) => state.selectedModel);
  const imageCount = useWorkspaceStore((state) => state.imageCount);
  const setVariable = useWorkspaceStore((state) => state.setVariable);
  const setCustomPrompt = useWorkspaceStore((state) => state.setCustomPrompt);
  const setModel = useWorkspaceStore((state) => state.setModel);
  const setImageCount = useWorkspaceStore((state) => state.setImageCount);
  const closeModal = useWorkspaceStore((state) => state.closeModal);
  const template = templates.find((item) => item.id === selectedTemplateId) ?? null;

  useEffect(() => {
    if (template && !template.compatible_models.includes(selectedModel)) {
      setModel(template.default_model);
    }
  }, [selectedModel, setModel, template]);

  const compiledPreview = useMemo(() => {
    if (!template) {
      return "";
    }

    let prompt = template.base_prompt;
    for (const [key, value] of Object.entries(variables)) {
      const varDef = template.variables.find((variable) => variable.id === key);
      if (varDef?.type === "image") {
        continue;
      }
      prompt = prompt.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
    }
    return prompt;
  }, [template, variables]);

  if (activeModal !== "variable-editor" || !template) {
    return null;
  }

  const currentTemplate = template;
  const requiredVars = template.variables
    .filter((variable) => variable.required)
    .sort((left, right) => left.priority - right.priority);
  const optionalVars = template.variables.filter((variable) => !variable.required);
  const requiredImageVars = template.variables.filter(
    (variable) => variable.type === "image" && variable.required,
  );
  const allRequiredImagesUploaded = requiredImageVars.every((variable) => imageFiles[variable.id] != null);
  const cost = getCreditCost(selectedModel).perImage * imageCount;

  async function handleGenerate() {
    try {
      const data = await startGeneration({
          templateId: currentTemplate.id,
          model: selectedModel,
          imageCount,
          variables,
          imageFiles,
          customPrompt,
      });
      closeModal();
      router.push(`/studio?taskId=${encodeURIComponent(data.taskId)}`);
    } catch (error) {
      window.alert(`生成失败：${error instanceof Error ? error.message : "未知错误"}`);
    }
  }

  return (
    <div className="fixed inset-0 z-[60]">
      <button
        type="button"
        aria-label="关闭变量编辑面板"
        onClick={closeModal}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />
      <div className="relative flex h-full items-center justify-center p-4 lg:p-8">
        <div
          className="surface-panel relative max-h-[85vh] w-full max-w-[1000px] overflow-hidden rounded-2xl"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
            <button
              type="button"
              onClick={closeModal}
              className="flex items-center gap-1 rounded-full border border-border/70 bg-bg-elevated/80 px-4 py-2 text-sm text-text-secondary transition hover:-translate-y-0.5 hover:border-border-hover hover:bg-bg-hover hover:text-text-primary"
            >
              <ArrowLeft className="size-4" />
              返回画廊
            </button>
            <h3 className="text-base font-medium text-text-primary">{template.name}</h3>
            <div className="w-20" />
          </div>
          <div className="flex h-[calc(85vh-64px)] flex-col overflow-hidden lg:flex-row">
            <div className="w-full space-y-6 overflow-y-auto border-b border-border/60 p-6 lg:w-[55%] lg:border-b-0 lg:border-r">
              {requiredVars.map((variable) => (
                <div key={variable.id} className="space-y-3">
                  <label className="text-sm font-medium text-text-primary">{variable.name}</label>
                  <VariableField
                    variable={variable}
                    value={variables[variable.id] ?? ""}
                    onChange={(value) => setVariable(variable.id, value)}
                  />
                </div>
              ))}

              {optionalVars.length > 0 ? (
                <details className="group">
                  <summary className="cursor-pointer text-sm text-text-tertiary transition hover:text-text-secondary">
                    更多选项 ({optionalVars.length})
                  </summary>
                  <div className="mt-4 space-y-6">
                    {optionalVars.map((variable) => (
                      <div key={variable.id} className="space-y-3">
                        <label className="text-sm font-medium text-text-primary">{variable.name}</label>
                        <VariableField
                          variable={variable}
                          value={variables[variable.id] ?? ""}
                          onChange={(value) => setVariable(variable.id, value)}
                        />
                      </div>
                    ))}
                  </div>
                </details>
              ) : null}
            </div>

            <div className="w-full space-y-6 overflow-y-auto p-6 lg:w-[45%]">
              <div>
                <span className="text-xs uppercase tracking-wider text-text-tertiary">补充想法</span>
                <textarea
                  value={customPrompt}
                  onChange={(event) => setCustomPrompt(event.target.value)}
                  placeholder="例如：氛围再冷一点、镜头更贴近人物、背景更留白"
                  rows={5}
                  className="mt-2 min-h-28 w-full resize-none rounded-lg border border-border/70 bg-bg-elevated/70 p-3 text-sm text-text-primary placeholder:text-text-tertiary focus:border-border-hover focus:outline-none"
                />
                <p className="mt-2 text-xs leading-5 text-text-tertiary">
                  这段内容会和模板变量一起交给 AI 重新编译，最终成图后的完整 Prompt 可在作品详情查看。
                </p>
              </div>

              <div>
                <span className="text-xs uppercase tracking-wider text-text-tertiary">基础 Prompt 预览</span>
                <div className="mt-2 max-h-40 overflow-y-auto rounded-lg bg-bg-hover/55 p-3 font-mono text-sm text-text-secondary">
                  {compiledPreview}
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-xs uppercase tracking-wider text-text-tertiary">模型</span>
                {template.compatible_models.map((model) => (
                  <button
                    key={model}
                    type="button"
                    onClick={() => setModel(model)}
                    className={cn(
                      "w-full rounded-lg border px-3 py-2.5 text-left text-sm transition hover:-translate-y-0.5",
                      selectedModel === model
                        ? "border-brand/40 bg-brand-muted text-text-primary"
                        : "border-border/70 bg-bg-elevated/70 text-text-secondary hover:border-border-hover hover:bg-bg-hover hover:text-text-primary",
                    )}
                  >
                    {getModelDisplayText(model)}
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                <span className="text-xs uppercase tracking-wider text-text-tertiary">张数</span>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 4].map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setImageCount(count as 1 | 2 | 3 | 4)}
                      className={cn(
                        "rounded-lg border py-2 text-sm transition hover:-translate-y-0.5",
                        imageCount === count
                          ? "border-brand/40 bg-brand-muted font-medium text-text-primary"
                          : "border-border/70 bg-bg-elevated/80 text-text-tertiary hover:border-border-hover hover:bg-bg-hover hover:text-text-primary",
                      )}
                    >
                      {count} 张
                    </button>
                  ))}
                </div>
              </div>

              <p className="text-sm text-text-secondary">
                消耗：<span className="font-medium text-text-primary">{cost} 积分</span>
              </p>

              <GlowButton
                size="lg"
                className="w-full"
                onClick={() => void handleGenerate()}
                loading={isSubmitting}
                disabled={!allRequiredImagesUploaded}
              >
                {allRequiredImagesUploaded
                  ? "开始生成"
                  : `请上传必要的参考图 (${requiredImageVars.filter((variable) => !imageFiles[variable.id]).length} 张未传)`}
              </GlowButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
