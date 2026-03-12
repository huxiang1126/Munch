# CODEX-SEED: 模板种子脚本 + 批量导入系统

> 目标：创建 CLI 种子脚本，一行命令就能把预定义的模板数据写入数据库。以后新增模板只需往种子数据文件里加一条记录，跑一次脚本就入库。

---

## Part 1：种子脚本基础设施

### 1.1 创建文件：`scripts/seed-templates.ts`

这是主入口脚本。用 `npx tsx scripts/seed-templates.ts` 运行。

```typescript
/**
 * 模板种子脚本 — 将预定义模板数据批量写入数据库
 *
 * 用法：npx tsx scripts/seed-templates.ts
 *
 * 逻辑：
 *  1. 读取 scripts/seed-data/ 下所有模板定义
 *  2. 对每个模板按 slug 做 upsert（存在则更新，不存在则插入）
 *  3. 支持两种模式：
 *     - Supabase 模式（有 SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY）
 *     - Fallback 模式（写入 .munch/admin-templates.json）
 */

import { createClient } from "@supabase/supabase-js";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// ── 导入种子数据 ──
import { seedTemplates } from "./seed-data";

// ── 类型 ──
interface SeedTemplate {
  slug: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  thumbnail_url: string | null;
  thumbnail_path: string | null;
  default_model: string;
  compatible_models: string[];
  default_image_size: { width: number; height: number };
  variables: unknown[];
  skill_prompt: string;
  base_prompt: string;
  negative_prompt: string | null;
  credit_multiplier: number;
  is_published: boolean;
  sort_order: number;
  tier_required: string;
}

// ── Supabase 模式 ──
async function seedWithSupabase(templates: SeedTemplate[]) {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    return false; // 无 Supabase 配置，退回 fallback
  }

  const supabase = createClient(url, key);
  console.log(`\n🔗 连接 Supabase: ${url}\n`);

  for (const template of templates) {
    // 先查是否已存在
    const { data: existing } = await supabase
      .from("templates")
      .select("id")
      .eq("slug", template.slug)
      .maybeSingle();

    if (existing) {
      // 更新
      const { error } = await supabase
        .from("templates")
        .update(template)
        .eq("id", existing.id);

      if (error) {
        console.log(`  ✗ 更新失败 [${template.slug}]: ${error.message}`);
      } else {
        console.log(`  ✓ 已更新 [${template.slug}] ${template.name}`);
      }
    } else {
      // 插入
      const { error } = await supabase
        .from("templates")
        .insert(template);

      if (error) {
        console.log(`  ✗ 插入失败 [${template.slug}]: ${error.message}`);
      } else {
        console.log(`  ✓ 已插入 [${template.slug}] ${template.name}`);
      }
    }
  }

  return true;
}

// ── Fallback 模式（本地 JSON 文件）──
function seedWithFallback(templates: SeedTemplate[]) {
  const filePath = join(process.cwd(), ".munch", "admin-templates.json");
  const dir = join(process.cwd(), ".munch");

  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  // 读取现有数据
  let existing: (SeedTemplate & { id: string; created_at: string; updated_at: string })[] = [];
  if (existsSync(filePath)) {
    try {
      existing = JSON.parse(readFileSync(filePath, "utf8"));
    } catch {
      existing = [];
    }
  }

  const now = new Date().toISOString();

  for (const template of templates) {
    const index = existing.findIndex((t) => t.slug === template.slug);

    if (index >= 0) {
      // 更新
      existing[index] = {
        ...existing[index],
        ...template,
        updated_at: now,
      };
      console.log(`  ✓ 已更新 [${template.slug}] ${template.name}`);
    } else {
      // 插入
      existing.unshift({
        ...template,
        id: crypto.randomUUID(),
        created_at: now,
        updated_at: now,
      } as typeof existing[number]);
      console.log(`  ✓ 已插入 [${template.slug}] ${template.name}`);
    }
  }

  writeFileSync(filePath, JSON.stringify(existing, null, 2), "utf8");
  console.log(`\n📁 已写入 ${filePath}`);
}

// ── 主流程 ──
async function main() {
  console.log(`🌱 Munch 模板种子脚本`);
  console.log(`📦 共 ${seedTemplates.length} 个模板待导入\n`);

  const usedSupabase = await seedWithSupabase(seedTemplates);

  if (!usedSupabase) {
    console.log("⚠️  未检测到 Supabase 配置，使用本地 fallback 模式\n");
    seedWithFallback(seedTemplates);
  }

  console.log("\n✅ 种子脚本执行完成");
}

main().catch((error) => {
  console.error("种子脚本执行失败:", error);
  process.exit(1);
});
```

### 1.2 创建文件：`scripts/seed-data/index.ts`

统一导出所有种子模板：

```typescript
import { fashionPortrait } from "./fashion-portrait";
// 以后新增模板只需在这里 import 并加入数组
// import { skincareNatural } from "./skincare-natural";

export const seedTemplates = [
  fashionPortrait,
  // skincareNatural,
];
```

---

## Part 2：第一个种子模板 — 时尚人像

### 创建文件：`scripts/seed-data/fashion-portrait.ts`

这是一个需要上传人脸照片的时尚人像模板，包含 6 个变量（1 个 image 类型 + 5 个 select 类型），共 ~3000 种组合。

```typescript
export const fashionPortrait = {
  slug: "fashion-portrait",
  name: "时尚人像",
  description: "专业时尚人像写真，支持上传人脸参考图，可调光线、背景、姿态、妆容和服装风格。",
  category: "fashion" as const,
  tags: ["时尚", "人像", "写真", "换脸"],
  thumbnail_url: null,
  thumbnail_path: null,
  default_model: "nano-banana-2" as const,
  compatible_models: ["nano-banana-2", "nano-banana-pro-4k", "nano-banana-pro-2k"] as const,
  default_image_size: { width: 1024, height: 1536 },
  variables: [
    // ── 图片变量：人脸参考 ──
    {
      id: "face_ref",
      name: "人物五官照片",
      type: "image" as const,
      required: true,
      priority: 0,
      accept: "image/jpeg,image/png,image/webp",
      maxSizeMB: 10,
      uploadHint: "请上传一张清晰的正面人脸照片，确保五官清晰可见、光线均匀",
    },
    // ── 选择变量 ──
    {
      id: "lighting",
      name: "光线",
      type: "select" as const,
      required: true,
      priority: 1,
      options: [
        { value: "soft-natural", label: "柔和自然光", description: "窗光/阴天漫射光，皮肤质感细腻" },
        { value: "golden-hour", label: "黄金时段", description: "日落侧光，暖调高级感" },
        { value: "studio-rim", label: "棚拍轮廓光", description: "硬光勾边，时尚杂志感" },
        { value: "neon-color", label: "霓虹彩光", description: "粉蓝紫混合光，赛博朋克氛围" },
      ],
      defaultValue: "soft-natural",
    },
    {
      id: "background",
      name: "背景",
      type: "select" as const,
      required: true,
      priority: 2,
      options: [
        { value: "clean-studio", label: "纯色棚景", description: "白/灰/黑纯色背景" },
        { value: "urban-street", label: "城市街头", description: "街道、涂鸦墙、霓虹招牌" },
        { value: "nature-outdoor", label: "自然户外", description: "花田、森林、海边" },
        { value: "luxury-interior", label: "奢华室内", description: "酒店大堂、艺术馆、高级餐厅" },
      ],
      defaultValue: "clean-studio",
    },
    {
      id: "pose",
      name: "姿态",
      type: "select" as const,
      required: true,
      priority: 3,
      options: [
        { value: "standing-confident", label: "站立自信", description: "正面/微侧站姿，目视镜头" },
        { value: "sitting-relaxed", label: "坐姿随性", description: "椅子/台阶/地面坐姿" },
        { value: "walking-dynamic", label: "行走动态", description: "迈步/回眸/风吹效果" },
        { value: "closeup-portrait", label: "半身特写", description: "胸部以上近景，强调五官" },
      ],
      defaultValue: "standing-confident",
    },
    {
      id: "makeup",
      name: "妆容",
      type: "select" as const,
      required: false,
      priority: 4,
      options: [
        { value: "natural-fresh", label: "清透裸妆" },
        { value: "editorial-bold", label: "浓郁杂志妆" },
        { value: "smoky-evening", label: "烟熏晚宴妆" },
      ],
      defaultValue: "natural-fresh",
    },
    {
      id: "outfit",
      name: "服装风格",
      type: "select" as const,
      required: false,
      priority: 5,
      options: [
        { value: "casual-streetwear", label: "休闲街头" },
        { value: "formal-tailoring", label: "正式剪裁" },
        { value: "haute-couture", label: "高定礼服" },
        { value: "athleisure", label: "运动休闲" },
      ],
      defaultValue: "casual-streetwear",
    },
  ],
  skill_prompt:
    "You are a world-class fashion photographer. Generate a professional fashion portrait with magazine-quality composition, precise skin texture rendering, and cinematic color grading. Maintain the subject's exact facial features from the reference image. Ensure editorial-level styling, natural body proportions, and high-end retouching aesthetic.",
  base_prompt:
    "A professional fashion portrait with {{lighting}} lighting, set against a {{background}} scene. The subject is in a {{pose}} pose, with {{makeup}} makeup style, wearing {{outfit}} attire. Ultra-high detail, 8K quality, fashion magazine editorial look.",
  negative_prompt:
    "deformed face, distorted features, extra limbs, bad anatomy, blurry, low quality, text, watermark, logo, oversaturated, plastic skin, uncanny valley",
  credit_multiplier: 1.5,
  is_published: true,
  sort_order: 1,
  tier_required: "free" as const,
};
```

---

## Part 3：package.json 脚本

在 `package.json` 的 `scripts` 中添加：

```json
{
  "scripts": {
    "seed": "tsx scripts/seed-templates.ts"
  }
}
```

然后用 `npm run seed` 或 `npx tsx scripts/seed-templates.ts` 执行。

如果项目中尚未安装 `tsx`，需要先安装：

```bash
npm install -D tsx
```

---

## Part 4：第二个种子模板示例 — 服装换装（需要五官+服装双图上传）

### 创建文件：`scripts/seed-data/outfit-tryon.ts`

展示需要上传两张图片的模板：

```typescript
export const outfitTryon = {
  slug: "outfit-tryon",
  name: "AI 换装",
  description: "上传人物照片和服装图片，AI 自动换装生成效果图。",
  category: "fashion" as const,
  tags: ["换装", "试衣", "电商"],
  thumbnail_url: null,
  thumbnail_path: null,
  default_model: "nano-banana-pro-4k" as const,
  compatible_models: ["nano-banana-pro-4k", "nano-banana-pro-2k"] as const,
  default_image_size: { width: 1024, height: 1536 },
  variables: [
    // ── 两个必填图片变量 ──
    {
      id: "face_ref",
      name: "人物五官照片",
      type: "image" as const,
      required: true,
      priority: 0,
      accept: "image/jpeg,image/png,image/webp",
      maxSizeMB: 10,
      uploadHint: "请上传一张清晰正面人脸照片",
    },
    {
      id: "outfit_ref",
      name: "服装参考图",
      type: "image" as const,
      required: true,
      priority: 1,
      accept: "image/jpeg,image/png,image/webp",
      maxSizeMB: 10,
      uploadHint: "请上传想要试穿的服装图片（平铺或模特图均可）",
    },
    // ── 选择变量 ──
    {
      id: "scene",
      name: "场景",
      type: "select" as const,
      required: true,
      priority: 2,
      options: [
        { value: "studio-white", label: "白色棚景" },
        { value: "outdoor-casual", label: "户外街拍" },
        { value: "indoor-luxury", label: "室内精致" },
      ],
      defaultValue: "studio-white",
    },
    {
      id: "body_pose",
      name: "姿态",
      type: "select" as const,
      required: false,
      priority: 3,
      options: [
        { value: "front-standing", label: "正面站立" },
        { value: "slight-turn", label: "微侧转身" },
        { value: "walking", label: "行走动态" },
      ],
      defaultValue: "front-standing",
    },
  ],
  skill_prompt:
    "You are an expert virtual try-on AI. Perfectly transfer the clothing from the outfit reference image onto the person from the face reference image. Maintain exact facial features, natural body proportions, and realistic fabric draping. The result should look like a genuine photograph, not a composite.",
  base_prompt:
    "A photorealistic full-body shot in a {{scene}} environment, with the subject in a {{body_pose}} pose, wearing the exact outfit from the reference image. Professional e-commerce photography quality, natural lighting, crisp details.",
  negative_prompt:
    "deformed, distorted clothing, wrong proportions, blurry, low quality, text, watermark, floating garments, mismatched style",
  credit_multiplier: 2.0,
  is_published: true,
  sort_order: 2,
  tier_required: "free" as const,
};
```

### 更新 `scripts/seed-data/index.ts`

```typescript
import { fashionPortrait } from "./fashion-portrait";
import { outfitTryon } from "./outfit-tryon";

export const seedTemplates = [
  fashionPortrait,
  outfitTryon,
];
```

---

## 验收标准

1. `npx tsx scripts/seed-templates.ts` 可以正常执行
2. 无 Supabase 配置时，种子数据写入 `.munch/admin-templates.json`
3. 有 Supabase 配置时，种子数据通过 service role key 写入 templates 表
4. 按 slug 做 upsert —— 重复运行不会产生重复数据
5. 种子脚本运行后，在后台模板管理页面能看到导入的模板
6. 种子模板包含 image 类型变量（依赖 CODEX-IMAGE-VARS 先完成）
7. `npm run seed` 快捷命令可用

## 执行顺序

> **先执行 CODEX-IMAGE-VARS.md**（添加 image 变量类型支持），再执行本文档。
> 否则 image 类型变量的前端渲染和校验逻辑不存在，种子模板虽然能入库但前端无法正确显示上传区域。
