# CODEX-IMAGE-VARS: 图片上传变量类型

> 目标：让模板变量系统支持 `type: "image"`，用户在出图前必须上传参考图（如人脸五官、服装照片等），未上传则不能生成。

---

## Part 1：类型定义

### 文件：`src/types/database.ts`

在 `TemplateVariable` 接口的 `type` 字段中增加 `"image"` 类型，并添加图片变量专属字段：

```typescript
export interface TemplateVariable {
  id: string;
  name: string;
  type: "select" | "slider" | "image";  // ← 新增 "image"
  required: boolean;
  priority: number;
  // select 专属
  options?: TemplateVariableOption[];
  defaultValue?: string;
  // slider 专属
  min?: number;
  max?: number;
  step?: number;
  defaultNumber?: number;
  unit?: string;
  // image 专属（新增以下 3 个字段）
  accept?: string;       // 允许的文件类型，默认 "image/jpeg,image/png,image/webp"
  maxSizeMB?: number;    // 最大文件大小（MB），默认 10
  uploadHint?: string;   // 上传提示文案，例如 "请上传清晰正面人脸照片，确保五官清晰可见"
}
```

> 数据库 `templates.variables` 字段是 JSONB，无需修改 SQL schema。新字段直接存储在 JSON 中。

---

## Part 2：后台模板表单（Admin Template Form）

### 文件：`src/components/admin/template-form.tsx`

#### 2.1 变量类型下拉框增加 "图片上传" 选项

找到变量类型 `<select>` 的位置（约第 410-429 行），添加第三个 `<option>`：

```tsx
<select
  value={variable.type}
  onChange={(event) => {
    const nextType = event.target.value as TemplateVariable["type"];
    updateVariable(variableIndex, {
      type: nextType,
      // select 字段
      options: nextType === "select" ? variable.options ?? [{ value: "", label: "", description: "" }] : undefined,
      defaultValue: nextType === "select" ? variable.defaultValue ?? "" : undefined,
      // slider 字段
      min: nextType === "slider" ? variable.min ?? 0 : undefined,
      max: nextType === "slider" ? variable.max ?? 100 : undefined,
      step: nextType === "slider" ? variable.step ?? 1 : undefined,
      defaultNumber: nextType === "slider" ? variable.defaultNumber ?? 50 : undefined,
      unit: nextType === "slider" ? variable.unit ?? "" : undefined,
      // image 字段
      accept: nextType === "image" ? variable.accept ?? "image/jpeg,image/png,image/webp" : undefined,
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
```

#### 2.2 图片变量配置面板

在变量卡片内，当 `variable.type === "image"` 时，显示图片变量的 3 个配置字段。在现有的 `{variable.type === "select" ? (...) : (...)}` 三元表达式中，改为三路判断：

```tsx
{variable.type === "select" ? (
  /* 现有的 select 选项配置 UI，保持不变 */
) : variable.type === "image" ? (
  <div className="mt-5 grid gap-4 md:grid-cols-3">
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
        onChange={(event) => updateVariable(variableIndex, { maxSizeMB: Number(event.target.value) })}
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
    </div>
  </div>
) : (
  /* 现有的 slider 配置 UI，保持不变 */
)}
```

---

## Part 3：工作区状态管理（Workspace Store）

### 文件：`src/stores/workspace-store.ts`

图片变量的值是 File 对象，不能序列化到 localStorage。需要在 store 中增加一个 **不持久化** 的 imageFiles 字段。

#### 3.1 接口扩展

在 `WorkspaceState` 接口中添加：

```typescript
interface WorkspaceState {
  // ... 现有字段 ...
  imageFiles: Record<string, File>;             // 新增：图片变量存储 { variableId: File }
  setImageFile: (variableId: string, file: File | null) => void;  // 新增
  clearImageFiles: () => void;                  // 新增
}
```

#### 3.2 初始值 + action

在 `create` 函数体中添加：

```typescript
imageFiles: {},

setImageFile: (variableId, file) =>
  set((state) => {
    const next = { ...state.imageFiles };
    if (file) {
      next[variableId] = file;
    } else {
      delete next[variableId];
    }
    return { imageFiles: next };
  }),

clearImageFiles: () => set({ imageFiles: {} }),
```

#### 3.3 排除持久化

在 `persist` 配置的 `partialize`（如果有）或自定义 `merge` 中，确保 `imageFiles` 不被序列化。

在 persist 的选项对象中增加 `partialize`：

```typescript
persist(
  (set) => ({ /* ... */ }),
  {
    name: "munch-workspace",
    partialize: (state) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { imageFiles, ...rest } = state;
      return rest;
    },
    merge: (persistedState, currentState) => {
      // 现有 merge 逻辑保持不变 ...
      return {
        // ... 现有 merge 结果 ...
        imageFiles: {},  // 始终重置为空
      };
    },
  },
),
```

#### 3.4 切换模板时清空图片

在 `selectTemplate` action 中加入清空逻辑：

```typescript
selectTemplate: (templateId) => {
  set((state) => {
    const nextTemplate = state.templates.find((template) => template.id === templateId);
    if (!nextTemplate) return state;
    return {
      ...state,
      ...getTemplateState(nextTemplate.id, state.templates),
      imageFiles: {},  // ← 新增：切换模板时清空已上传图片
    };
  });
},
```

---

## Part 4：前端变量编辑器（Image Upload UI）

### 文件：`src/components/creation/variable-editor.tsx`

#### 4.1 新增 ImageUploadField 组件

在文件顶部（`VariableField` 之前或之后）新增图片上传组件：

```tsx
import { ImagePlus, X } from "lucide-react";
import { useWorkspaceStore } from "@/stores/workspace-store";

function ImageUploadField({
  variable,
}: {
  variable: TemplateVariable;
}) {
  const imageFiles = useWorkspaceStore((state) => state.imageFiles);
  const setImageFile = useWorkspaceStore((state) => state.setImageFile);
  const file = imageFiles[variable.id] ?? null;
  const previewUrl = file ? URL.createObjectURL(file) : null;

  const accept = variable.accept ?? "image/jpeg,image/png,image/webp";
  const maxSizeMB = variable.maxSizeMB ?? 10;

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0];
    if (!selected) return;

    if (selected.size > maxSizeMB * 1024 * 1024) {
      window.alert(`文件大小不能超过 ${maxSizeMB}MB`);
      return;
    }

    setImageFile(variable.id, selected);
  }

  function handleRemove() {
    setImageFile(variable.id, null);
  }

  return (
    <div className="space-y-2">
      {previewUrl ? (
        <div className="relative inline-block">
          <img
            src={previewUrl}
            alt={variable.name}
            className="h-32 w-32 rounded-xl border border-border/70 object-cover"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute -right-2 -top-2 rounded-full bg-bg-elevated border border-border/70 p-1 text-text-secondary hover:text-red-400 transition"
          >
            <X className="size-3.5" />
          </button>
        </div>
      ) : (
        <label className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border border-dashed border-border/70 bg-bg-elevated/70 px-4 py-6 text-sm text-text-secondary transition hover:border-brand/50 hover:text-text-primary">
          <ImagePlus className="size-6" />
          <span>点击上传{variable.name}</span>
          {variable.uploadHint ? (
            <span className="text-xs text-text-tertiary">{variable.uploadHint}</span>
          ) : null}
          <input
            type="file"
            accept={accept}
            hidden
            onChange={handleFileChange}
          />
        </label>
      )}
    </div>
  );
}
```

#### 4.2 在 VariableField 中路由 image 类型

修改 `VariableField` 组件，在函数开头添加 image 类型的判断：

```tsx
function VariableField({
  variable,
  value,
  onChange,
}: {
  variable: TemplateVariable;
  value: string;
  onChange: (value: string) => void;
}) {
  // ── 新增：图片类型直接渲染 ImageUploadField ──
  if (variable.type === "image") {
    return <ImageUploadField variable={variable} />;
  }

  // 以下是现有的 slider / select 逻辑，保持不变
  const options = variable.options ?? [];
  // ...
}
```

#### 4.3 生成按钮校验

在 `VariableEditor` 组件中，找到 `handleGenerate` 函数和"开始生成"按钮处，添加校验逻辑：

```tsx
// 在 VariableEditor 组件内部，现有变量之后添加
const imageFiles = useWorkspaceStore((state) => state.imageFiles);

// 计算是否所有必填图片都已上传
const requiredImageVars = template.variables.filter(
  (v) => v.type === "image" && v.required
);
const allRequiredImagesUploaded = requiredImageVars.every(
  (v) => imageFiles[v.id] != null
);

// 修改 GlowButton 的 disabled 条件
<GlowButton
  size="lg"
  className="w-full"
  onClick={() => void handleGenerate()}
  loading={isGenerating}
  disabled={!allRequiredImagesUploaded}  // ← 新增 disabled 判断
>
  {allRequiredImagesUploaded ? "开始生成" : `请上传必要的参考图 (${requiredImageVars.filter((v) => !imageFiles[v.id]).length} 张未传)`}
</GlowButton>
```

#### 4.4 Prompt 预览排除 image 变量

在 `compiledPreview` 的 `useMemo` 中，image 类型变量不应该被插值到 prompt 文本中（它们作为图片附件传给 API）。修改：

```tsx
const compiledPreview = useMemo(() => {
  if (!template) return "";

  let prompt = template.base_prompt;
  for (const [key, value] of Object.entries(variables)) {
    // 跳过 image 类型变量（不插值到文本 prompt）
    const varDef = template.variables.find((v) => v.id === key);
    if (varDef?.type === "image") continue;

    prompt = prompt.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
  }
  return prompt;
}, [template, variables]);
```

---

## Part 5：生成 API 适配

### 5.1 前端提交（变量编辑器 handleGenerate）

修改 `handleGenerate`，将图片文件转为 base64 一并提交：

```tsx
async function handleGenerate() {
  setIsGenerating(true);

  try {
    // 将图片变量转为 base64
    const imageData: Record<string, string> = {};
    for (const [varId, file] of Object.entries(imageFiles)) {
      const buffer = await file.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
      );
      imageData[varId] = `data:${file.type};base64,${base64}`;
    }

    const response = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        templateId: currentTemplate.id,
        model: selectedModel,
        imageCount,
        variables,
        referenceImages: imageData,  // 新增：图片 base64 数据
      }),
    });

    if (!response.ok) {
      throw new Error("生成失败");
    }

    // TODO: 处理生成结果
  } catch (error) {
    window.alert(`生成失败：${error instanceof Error ? error.message : "未知错误"}`);
  } finally {
    setIsGenerating(false);
  }
}
```

### 5.2 后端 API Route

#### 文件：`src/app/api/generate/route.ts`

在请求 body 的 zod schema 中增加 `referenceImages` 字段：

```typescript
const generateSchema = z.object({
  templateId: z.string(),
  model: z.enum(["nano-banana-2", "nano-banana-pro-4k", "nano-banana-pro-2k"]),
  imageCount: z.number().int().min(1).max(4),
  variables: z.record(z.string()),
  referenceImages: z.record(z.string()).optional(),  // ← 新增：{ varId: "data:image/...;base64,..." }
});
```

在调用 AI 模型生成时，将 `referenceImages` 传递给 AI client。具体如何传递取决于模型 API 格式。预留接口即可，实际对接时补充：

```typescript
// 传给 AI client 时
const result = await aigcClient.generate({
  prompt: compiledPrompt,
  negativePrompt,
  model,
  imageSize: template.default_image_size,
  referenceImages: body.referenceImages,  // ← 透传
});
```

---

## 验收标准

1. 后台新建模板时，变量类型下拉框出现「图片上传」选项
2. 选择图片上传类型后，显示 accept / maxSizeMB / uploadHint 三个配置字段
3. 前端变量编辑器遇到 image 变量时，显示上传区域（dropzone + 预览 + 删除）
4. 必填 image 变量未上传时，"开始生成" 按钮 disabled，显示提示文案
5. 切换模板时，已上传的图片自动清空
6. image 变量不参与 prompt 文本插值
7. 生成请求 body 中包含 `referenceImages` 字段（base64 格式）
