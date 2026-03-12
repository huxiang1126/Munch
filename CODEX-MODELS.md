# Codex 任务：模型系统全面更新（3 图像模型 + 1 LLM）

你在 `/Volumes/HX/Munch` 项目中工作。这是 Next.js 15 + React 19 + TypeScript + Tailwind CSS 4 + Supabase 项目。纯暗色主题（#0f0f10）。

## 总览

原来的模型系统是 `"flux-pro"` + `"gpt-image"` 两个占位模型。现在更换为真实模型：

**3 个图像模型**（通过统一 API 网关调用）：
| 内部 ID | API model 参数 | 用途 | 环境变量 |
|---------|---------------|------|---------|
| `nano-banana-2` | `Nano Banana 2` | 基础出图 | `NANO_BANANA_2_API_KEY` |
| `nano-banana-pro-4k` | `Nano Banana Pro（4K）` | 高清出图 | `NANO_BANANA_PRO_4K_API_KEY` |
| `nano-banana-pro-2k` | `Nano Banana Pro（2K）` | 中等出图 | `NANO_BANANA_PRO_2K_API_KEY` |

**1 个 LLM 模型**（Prompt 重编译）：
| 内部 ID | API model 参数 | 用途 | 环境变量 |
|---------|---------------|------|---------|
| `gpt-5.3` | `GPT5.3` | Prompt 重编译 | `GPT53_API_KEY` |

**统一 API 网关**：`https://aigcapi.top/v1`（OpenAI 兼容格式）
环境变量：`AIGC_API_BASE_URL`

---

## Part 1：更新类型定义

### 修改 `src/types/generation.ts`

把整个文件替换为：

```typescript
export type GenerationModel = "nano-banana-2" | "nano-banana-pro-4k" | "nano-banana-pro-2k";

export type GenerationStatus =
  | "idle"
  | "pending"
  | "compiling"
  | "generating"
  | "completed"
  | "failed"
  | "cancelled";

export type UserTier = "free" | "basic" | "pro";

export interface GeneratedImage {
  id: string;
  url: string;
  width: number;
  height: number;
}

export interface GenerationTask {
  id: string;
  templateId: string;
  model: GenerationModel;
  imageCount: 1 | 2 | 3 | 4;
  status: GenerationStatus;
  creditsCost: number;
  compiledPrompt?: string;
  createdAt: string;
  images: GeneratedImage[];
  errorMessage?: string;
}
```

---

## Part 2：新建模型配置中心

### 新建 `src/lib/models.ts`

这个文件集中管理所有模型元数据，其他文件从这里引用：

```typescript
import type { GenerationModel } from "@/types/generation";

export interface ModelConfig {
  /** 内部 ID，用于 TypeScript/SQL/路由 */
  id: GenerationModel;
  /** 用户界面显示名 */
  label: string;
  /** 调用 API 时传的 model 参数值 */
  apiModel: string;
  /** API Key 对应的环境变量名 */
  apiKeyEnv: string;
  /** UI 图标 */
  icon: string;
  /** 一句话描述 */
  description: string;
  /** 每张图消耗积分 */
  creditPerImage: number;
}

export const IMAGE_MODELS: Record<GenerationModel, ModelConfig> = {
  "nano-banana-2": {
    id: "nano-banana-2",
    label: "Nano Banana 2",
    apiModel: "Nano Banana 2",
    apiKeyEnv: "NANO_BANANA_2_API_KEY",
    icon: "🍌",
    description: "基础出图，速度快",
    creditPerImage: 5,
  },
  "nano-banana-pro-4k": {
    id: "nano-banana-pro-4k",
    label: "Nano Banana Pro（4K）",
    apiModel: "Nano Banana Pro（4K）",
    apiKeyEnv: "NANO_BANANA_PRO_4K_API_KEY",
    icon: "🍌",
    description: "4K 高清出图",
    creditPerImage: 12,
  },
  "nano-banana-pro-2k": {
    id: "nano-banana-pro-2k",
    label: "Nano Banana Pro（2K）",
    apiModel: "Nano Banana Pro（2K）",
    apiKeyEnv: "NANO_BANANA_PRO_2K_API_KEY",
    icon: "🍌",
    description: "2K 中等质量",
    creditPerImage: 8,
  },
};

/** 所有图像模型 ID 列表 */
export const ALL_IMAGE_MODEL_IDS = Object.keys(IMAGE_MODELS) as GenerationModel[];

/** 获取模型配置，找不到则返回 nano-banana-2 */
export function getModelConfig(modelId: GenerationModel): ModelConfig {
  return IMAGE_MODELS[modelId] ?? IMAGE_MODELS["nano-banana-2"];
}

/** LLM 配置（Prompt 重编译用） */
export const LLM_CONFIG = {
  apiModel: "GPT5.3",
  apiKeyEnv: "GPT53_API_KEY",
} as const;
```

---

## Part 3：更新 constants.ts

### 修改 `src/lib/constants.ts`

把整个文件替换为：

```typescript
import type { GenerationModel, UserTier } from "@/types/generation";
import { IMAGE_MODELS } from "@/lib/models";

export const APP_NAME = "Munch";
export const APP_DOMAIN = "munch.love";
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://munch.love";

export const CREDIT_COSTS: Record<
  GenerationModel,
  { perImage: number; description: string }
> = Object.fromEntries(
  Object.values(IMAGE_MODELS).map((m) => [
    m.id,
    { perImage: m.creditPerImage, description: `${m.label} ${m.description}` },
  ]),
) as Record<GenerationModel, { perImage: number; description: string }>;

export const TIER_LIMITS: Record<
  UserTier,
  {
    maxConcurrentTasks: number;
    maxImagesPerTask: 2 | 4;
    availableModels: GenerationModel[];
  }
> = {
  free: {
    maxConcurrentTasks: 1,
    maxImagesPerTask: 2,
    availableModels: ["nano-banana-2"],
  },
  basic: {
    maxConcurrentTasks: 2,
    maxImagesPerTask: 4,
    availableModels: ["nano-banana-2", "nano-banana-pro-2k"],
  },
  pro: {
    maxConcurrentTasks: 3,
    maxImagesPerTask: 4,
    availableModels: ["nano-banana-2", "nano-banana-pro-4k", "nano-banana-pro-2k"],
  },
};

export const STATUS_STEPS = [
  "选择模板",
  "调整变量",
  "开始出图",
] as const;
```

---

## Part 4：新建统一 API 客户端

### 4.1 新建 `src/lib/ai/aigc-client.ts`

这是统一的图像生成 API 客户端，使用 OpenAI 兼容格式调用 aigcapi.top：

```typescript
import type { GenerationModel } from "@/types/generation";
import { getModelConfig } from "@/lib/models";

const BASE_URL = process.env.AIGC_API_BASE_URL || "https://aigcapi.top/v1";

export interface ImageGenerationInput {
  model: GenerationModel;
  prompt: string;
  negativePrompt?: string;
  imageCount: number;
  size: { width: number; height: number };
}

export interface ImageGenerationResult {
  id: string;
  url: string;
  width: number;
  height: number;
}

export async function generateImages(
  input: ImageGenerationInput,
): Promise<ImageGenerationResult[]> {
  const config = getModelConfig(input.model);
  const apiKey = process.env[config.apiKeyEnv];

  if (!apiKey) {
    throw new Error(`Missing API key: ${config.apiKeyEnv}`);
  }

  const response = await fetch(`${BASE_URL}/images/generations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: config.apiModel,
      prompt: input.prompt,
      n: input.imageCount,
      size: `${input.size.width}x${input.size.height}`,
      ...(input.negativePrompt ? { negative_prompt: input.negativePrompt } : {}),
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "Unknown error");
    throw new Error(
      `Image generation failed (${response.status}): ${errorBody}`,
    );
  }

  const result = (await response.json()) as {
    data: Array<{ url?: string; b64_json?: string }>;
  };

  return result.data.map((item, index) => ({
    id: `${input.model}-${Date.now()}-${index}`,
    url: item.url ?? `data:image/png;base64,${item.b64_json}`,
    width: input.size.width,
    height: input.size.height,
  }));
}
```

### 4.2 新建 `src/lib/ai/llm-client.ts`

LLM 客户端，用于 Prompt 重编译：

```typescript
const BASE_URL = process.env.AIGC_API_BASE_URL || "https://aigcapi.top/v1";

export interface PromptCompilationInput {
  skillPrompt: string;
  basePrompt: string;
  variables: Record<string, string>;
  targetModel: string;
}

/**
 * 用 LLM 重编译 Prompt：
 * 1. 把变量值填入 basePrompt 的 {{}} 占位符
 * 2. 结合 skillPrompt 风格约束
 * 3. 让 LLM 针对目标模型优化措辞
 */
export async function compilePrompt(
  input: PromptCompilationInput,
): Promise<string> {
  const apiKey = process.env.GPT53_API_KEY;

  if (!apiKey) {
    // 降级：手动替换变量，不做 LLM 优化
    return manualCompile(input.basePrompt, input.variables);
  }

  // 先做变量替换
  const filledPrompt = manualCompile(input.basePrompt, input.variables);

  const response = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "GPT5.3",
      messages: [
        {
          role: "system",
          content: `You are a prompt engineering assistant. Your job is to take a base image generation prompt and optimize it for the target model "${input.targetModel}". Apply the following style constraints:\n\n${input.skillPrompt}\n\nOutput ONLY the optimized prompt text. No explanations. No markdown.`,
        },
        {
          role: "user",
          content: filledPrompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 1024,
    }),
  });

  if (!response.ok) {
    // LLM 失败时降级为手动替换
    console.error("LLM compilation failed, falling back to manual compile");
    return filledPrompt;
  }

  const result = (await response.json()) as {
    choices: Array<{ message: { content: string } }>;
  };

  return result.choices[0]?.message?.content?.trim() || filledPrompt;
}

/** 手动变量替换（降级方案） */
function manualCompile(
  template: string,
  variables: Record<string, string>,
): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replaceAll(`{{${key}}}`, value);
  }
  return result;
}
```

---

## Part 5：更新模型路由

### 修改 `src/lib/ai/model-router.ts`

把整个文件替换为：

```typescript
import { generateImages } from "@/lib/ai/aigc-client";
import type { GenerationModel } from "@/types/generation";

export async function generateWithModel(
  model: GenerationModel,
  prompt: string,
  imageCount: number,
  size: { width: number; height: number },
  negativePrompt?: string,
) {
  return generateImages({
    model,
    prompt,
    negativePrompt,
    imageCount,
    size,
  });
}
```

### 删除旧文件

删除以下两个文件（已被 `aigc-client.ts` 替代）：
- `src/lib/ai/flux-client.ts`
- `src/lib/ai/openai-image-client.ts`

---

## Part 6：更新 API 路由

### 修改 `src/app/api/generate/route.ts`

把 zod schema 里的模型枚举改为新的 3 个模型：

```typescript
import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAuthenticatedUser } from "@/lib/auth";
import { toErrorResponse } from "@/lib/errors";
import { createGenerationTask } from "@/lib/mock-service";

const generateSchema = z.object({
  templateId: z.string(),
  variables: z.record(z.string()),
  model: z.enum(["nano-banana-2", "nano-banana-pro-4k", "nano-banana-pro-2k"]),
  imageCount: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
});

export async function POST(request: Request) {
  try {
    const user = await requireAuthenticatedUser();
    const json = await request.json();
    const parsed = generateSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "INVALID_REQUEST",
          message: "请求参数不合法",
        },
        { status: 400 },
      );
    }

    const result = await createGenerationTask(user, parsed.data);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return toErrorResponse(error, "发起任务失败");
  }
}
```

---

## Part 7：更新前端 UI 组件

### 7.1 修改 `src/components/creation/model-badge.tsx`

把整个文件替换为：

```typescript
"use client";

import { Images, Sparkles } from "lucide-react";

import { getModelConfig } from "@/lib/models";
import { useWorkspaceStore } from "@/stores/workspace-store";

export function ModelBadge({ onClick }: { onClick?: () => void }) {
  const selectedModel = useWorkspaceStore((state) => state.selectedModel);
  const imageCount = useWorkspaceStore((state) => state.imageCount);
  const config = getModelConfig(selectedModel);

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-11 items-center gap-2 whitespace-nowrap rounded-full border border-border/70 bg-bg-elevated/80 px-4 py-2 text-xs text-text-secondary transition hover:-translate-y-0.5 hover:border-border-hover hover:bg-bg-hover hover:text-text-primary"
    >
      <Sparkles className="size-3.5 text-brand" />
      <span>{config.label}</span>
      <Images className="size-3.5 text-text-tertiary" />
      <span className="text-text-tertiary">x{imageCount}</span>
    </button>
  );
}
```

### 7.2 修改 `src/components/creation/model-panel.tsx`

把模型选择下拉框的 `<option>` 和积分计算改为新模型。找到以下代码块并替换：

**找到旧的**（约第 107-114 行）：
```tsx
          <select
            value={selectedModel}
            onChange={(event) => setModel(event.target.value as GenerationModel)}
            className="w-full rounded-lg border border-border/70 bg-bg-elevated/80 px-3 py-2 text-sm text-text-primary focus:border-brand focus:outline-none"
          >
            <option value="flux-pro">🔥 Flux Pro</option>
            <option value="gpt-image">✨ GPT Image</option>
          </select>
```

**替换为**：
```tsx
          <select
            value={selectedModel}
            onChange={(event) => setModel(event.target.value as GenerationModel)}
            className="w-full rounded-lg border border-border/70 bg-bg-elevated/80 px-3 py-2 text-sm text-text-primary focus:border-brand focus:outline-none"
          >
            <option value="nano-banana-2">🍌 Nano Banana 2</option>
            <option value="nano-banana-pro-4k">🍌 Nano Banana Pro（4K）</option>
            <option value="nano-banana-pro-2k">🍌 Nano Banana Pro（2K）</option>
          </select>
```

### 7.3 修改 `src/components/creation/variable-editor.tsx`

找到引用旧模型名的那一行（约第 230 行）：
```tsx
{model === "flux-pro" ? "🔥 Flux Pro — 精度与可控性强" : "✨ GPT Image — 画面质感强"}
```

替换为：
```tsx
{(() => {
  const modelConfig = {
    "nano-banana-2": "🍌 Nano Banana 2 — 基础出图，速度快",
    "nano-banana-pro-4k": "🍌 Nano Banana Pro（4K）— 高清出图",
    "nano-banana-pro-2k": "🍌 Nano Banana Pro（2K）— 中等质量",
  } as const;
  return modelConfig[model as keyof typeof modelConfig] ?? model;
})()}
```

---

## Part 8：更新 Admin 组件

### 8.1 修改 `src/components/admin/template-admin.tsx`

找到旧的 `modelOptions`（约第 25-28 行）：
```typescript
const modelOptions: Array<{ value: GenerationModel; label: string }> = [
  { value: "flux-pro", label: "Flux Pro" },
  { value: "gpt-image", label: "GPT Image" },
];
```

替换为：
```typescript
const modelOptions: Array<{ value: GenerationModel; label: string }> = [
  { value: "nano-banana-2", label: "Nano Banana 2" },
  { value: "nano-banana-pro-4k", label: "Nano Banana Pro（4K）" },
  { value: "nano-banana-pro-2k", label: "Nano Banana Pro（2K）" },
];
```

找到 `createEmptyDraft` 函数中的旧模型默认值（约第 77-78 行）：
```typescript
    defaultModel: "flux-pro",
    compatibleModels: ["flux-pro"],
```

替换为：
```typescript
    defaultModel: "nano-banana-2",
    compatibleModels: ["nano-banana-2"],
```

### 8.2 修改 `src/components/admin/template-form.tsx`

找到默认模型值（约第 68 行）：
```typescript
  const [defaultModel, setDefaultModel] = useState<GenerationModel>(initialData?.default_model ?? "flux-pro");
```

替换为：
```typescript
  const [defaultModel, setDefaultModel] = useState<GenerationModel>(initialData?.default_model ?? "nano-banana-2");
```

找到兼容模型默认值（约第 69-71 行）：
```typescript
  const [compatibleModels, setCompatibleModels] = useState<GenerationModel[]>(
    initialData?.compatible_models ?? ["flux-pro"],
  );
```

替换为：
```typescript
  const [compatibleModels, setCompatibleModels] = useState<GenerationModel[]>(
    initialData?.compatible_models ?? ["nano-banana-2"],
  );
```

找到默认模型 `<select>` 的 `<option>` 列表（约第 614-617 行）：
```tsx
              <option value="flux-pro">Flux Pro</option>
              <option value="gpt-image">GPT Image</option>
```

替换为：
```tsx
              <option value="nano-banana-2">Nano Banana 2</option>
              <option value="nano-banana-pro-4k">Nano Banana Pro（4K）</option>
              <option value="nano-banana-pro-2k">Nano Banana Pro（2K）</option>
```

找到兼容模型 checkbox 列表（约第 622 行）：
```tsx
              {(["flux-pro", "gpt-image"] as GenerationModel[]).map((model) => (
```

替换为：
```tsx
              {(["nano-banana-2", "nano-banana-pro-4k", "nano-banana-pro-2k"] as GenerationModel[]).map((model) => (
```

---

## Part 9：更新 Mock Store

### 修改 `src/lib/mock-store.ts`

找到旧模型类型（约第 15 行）：
```typescript
  model: "flux-pro" | "gpt-image";
```

替换为：
```typescript
  model: "nano-banana-2" | "nano-banana-pro-4k" | "nano-banana-pro-2k";
```

---

## Part 10：更新所有静态模板数据

以下 15 个模板文件都需要把 `defaultModel` 和 `compatibleModels` 从旧值改为新值。

**统一规则**：
- 把所有 `defaultModel: "flux-pro"` 改为 `defaultModel: "nano-banana-2"`
- 把所有 `compatibleModels: ["flux-pro", "gpt-image"]` 改为 `compatibleModels: ["nano-banana-2", "nano-banana-pro-4k", "nano-banana-pro-2k"]`
- 如果某个模板只有 `compatibleModels: ["flux-pro"]`，改为 `compatibleModels: ["nano-banana-2"]`

文件列表：
```
src/data/templates/skincare-luxury.ts
src/data/templates/skincare-natural.ts
src/data/templates/skincare-beauty-headshot.ts
src/data/templates/fashion-editorial.ts
src/data/templates/fashion-street.ts
src/data/templates/fashion-bluehour-grid.ts
src/data/templates/fashion-goldenhour-grid.ts
src/data/templates/fashion-ricefield-spin.ts
src/data/templates/food-overhead.ts
src/data/templates/food-lifestyle.ts
src/data/templates/product-minimal.ts
src/data/templates/product-lifestyle.ts
src/data/templates/poster-event.ts
src/data/templates/poster-brand.ts
src/data/templates/poster-tennis-campaign.ts
```

以 `skincare-luxury.ts` 为例：

**找到**：
```typescript
  defaultModel: "flux-pro",
  compatibleModels: ["flux-pro", "gpt-image"],
```

**替换为**：
```typescript
  defaultModel: "nano-banana-2",
  compatibleModels: ["nano-banana-2", "nano-banana-pro-4k", "nano-banana-pro-2k"],
```

**对所有 15 个模板文件都做同样的替换。**

---

## Part 11：更新 workspace-store 默认值

### 修改 `src/stores/workspace-store.ts`

store 代码本身不直接硬编码模型名（它从模板数据读取 `default_model`），所以当模板数据更新后 store 会自动使用新的模型 ID。**不需要额外修改此文件。**

但要注意：用户浏览器里 `localStorage` 中可能缓存了旧的 `"flux-pro"` 值。Zustand persist middleware 会自动加载缓存。如果发现问题，用户清除 localStorage 的 `munch-workspace` 键即可。

---

## 验收标准

| # | 检查项 | 通过标准 |
|---|--------|---------|
| 1 | `pnpm build` | 零报错，不存在任何 `"flux-pro"` 或 `"gpt-image"` 引用 |
| 2 | `src/types/generation.ts` | `GenerationModel` 只含 3 个值 |
| 3 | `src/lib/models.ts` | 新文件存在，导出 `IMAGE_MODELS`、`getModelConfig`、`LLM_CONFIG` |
| 4 | `src/lib/ai/aigc-client.ts` | 新文件存在，`generateImages` 函数调用 `aigcapi.top/v1/images/generations` |
| 5 | `src/lib/ai/llm-client.ts` | 新文件存在，`compilePrompt` 函数调用 `aigcapi.top/v1/chat/completions` |
| 6 | `src/lib/ai/flux-client.ts` | 已删除 |
| 7 | `src/lib/ai/openai-image-client.ts` | 已删除 |
| 8 | 模型选择 UI | model-panel 显示 3 个模型选项，model-badge 显示对应标签 |
| 9 | Admin 模板表单 | 默认模型和兼容模型下拉/checkbox 都是 3 个新模型 |
| 10 | 15 个静态模板 | 全部使用新模型 ID |
| 11 | 全项目搜索 | `grep -r "flux-pro\|gpt-image" src/` 返回零结果 |

---

## 文件操作清单

### 新建文件：
```
src/lib/models.ts
src/lib/ai/aigc-client.ts
src/lib/ai/llm-client.ts
```

### 修改文件：
```
src/types/generation.ts
src/lib/constants.ts
src/lib/ai/model-router.ts
src/app/api/generate/route.ts
src/components/creation/model-badge.tsx
src/components/creation/model-panel.tsx
src/components/creation/variable-editor.tsx
src/components/admin/template-admin.tsx
src/components/admin/template-form.tsx
src/lib/mock-store.ts
src/data/templates/skincare-luxury.ts
src/data/templates/skincare-natural.ts
src/data/templates/skincare-beauty-headshot.ts
src/data/templates/fashion-editorial.ts
src/data/templates/fashion-street.ts
src/data/templates/fashion-bluehour-grid.ts
src/data/templates/fashion-goldenhour-grid.ts
src/data/templates/fashion-ricefield-spin.ts
src/data/templates/food-overhead.ts
src/data/templates/food-lifestyle.ts
src/data/templates/product-minimal.ts
src/data/templates/product-lifestyle.ts
src/data/templates/poster-event.ts
src/data/templates/poster-brand.ts
src/data/templates/poster-tennis-campaign.ts
```

### 删除文件：
```
src/lib/ai/flux-client.ts
src/lib/ai/openai-image-client.ts
```

---

**开始执行。执行完后用 `grep -r "flux-pro\|gpt-image" src/` 验证零残留。**
