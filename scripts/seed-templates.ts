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
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { getImageDimensions } from "../src/lib/image-dimensions";

import { seedTemplates } from "./seed-data";

interface SeedTemplate {
  slug: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  thumbnail_url: string | null;
  thumbnail_path: string | null;
  default_model: string;
  compatible_models: readonly string[];
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

async function seedWithSupabase(templates: SeedTemplate[]) {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    return false;
  }

  const supabase = createClient(url, key);
  console.log(`\n🔗 连接 Supabase: ${url}\n`);

  for (const template of templates) {
    const { data: existing } = await supabase
      .from("templates")
      .select("id")
      .eq("slug", template.slug)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase.from("templates").update(template).eq("id", existing.id);

      if (error) {
        console.log(`  ✗ 更新失败 [${template.slug}]: ${error.message}`);
      } else {
        console.log(`  ✓ 已更新 [${template.slug}] ${template.name}`);
      }
    } else {
      const { error } = await supabase.from("templates").insert(template);

      if (error) {
        console.log(`  ✗ 插入失败 [${template.slug}]: ${error.message}`);
      } else {
        console.log(`  ✓ 已插入 [${template.slug}] ${template.name}`);
      }
    }
  }

  return true;
}

function seedWithFallback(templates: SeedTemplate[]) {
  const filePath = join(process.cwd(), ".munch", "admin-templates.json");
  const dir = join(process.cwd(), ".munch");
  const uploadsDir = join(process.cwd(), "public", "admin-uploads");

  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  let existing: (SeedTemplate & { id: string; created_at: string; updated_at: string })[] = [];
  if (existsSync(filePath)) {
    try {
      existing = JSON.parse(readFileSync(filePath, "utf8"));
    } catch {
      existing = [];
    }
  }

  const now = new Date().toISOString();

  function recoverPreview(
    current: (typeof existing)[number],
    next: SeedTemplate,
  ): Pick<(typeof existing)[number], "thumbnail_url" | "thumbnail_path" | "default_image_size"> {
    const nextHasExplicitPreview = Boolean(next.thumbnail_url || next.thumbnail_path);

    if (nextHasExplicitPreview) {
      return {
        thumbnail_url: next.thumbnail_url,
        thumbnail_path: next.thumbnail_path,
        default_image_size: next.default_image_size,
      };
    }

    const existingStoragePath = current.thumbnail_path?.startsWith("admin-uploads/")
      ? current.thumbnail_path
      : null;

    if (existingStoragePath) {
      const absolutePath = join(process.cwd(), "public", existingStoragePath);
      if (existsSync(absolutePath)) {
        const dimensions = getImageDimensions(readFileSync(absolutePath));
        return {
          thumbnail_url: current.thumbnail_url,
          thumbnail_path: current.thumbnail_path,
          default_image_size: dimensions ?? current.default_image_size,
        };
      }
    }

    if (existsSync(uploadsDir)) {
      const matched = readdirSync(uploadsDir).find((fileName) => fileName.startsWith(`${current.id}.`));
      if (matched) {
        const storagePath = `admin-uploads/${matched}`;
        const absolutePath = join(process.cwd(), "public", storagePath);
        const dimensions = getImageDimensions(readFileSync(absolutePath));
        return {
          thumbnail_url: `/${storagePath}`,
          thumbnail_path: storagePath,
          default_image_size: dimensions ?? current.default_image_size,
        };
      }
    }

    return {
      thumbnail_url: current.thumbnail_url,
      thumbnail_path: current.thumbnail_path,
      default_image_size: current.default_image_size,
    };
  }

  for (const template of templates) {
    const index = existing.findIndex((item) => item.slug === template.slug);

    if (index >= 0) {
      const current = existing[index];
      existing[index] = {
        ...current,
        ...template,
        ...recoverPreview(current, template),
        updated_at: now,
      };
      console.log(`  ✓ 已更新 [${template.slug}] ${template.name}`);
    } else {
      existing.unshift({
        ...template,
        id: crypto.randomUUID(),
        created_at: now,
        updated_at: now,
      } as (typeof existing)[number]);
      console.log(`  ✓ 已插入 [${template.slug}] ${template.name}`);
    }
  }

  writeFileSync(filePath, JSON.stringify(existing, null, 2), "utf8");
  console.log(`\n📁 已写入 ${filePath}`);
}

async function main() {
  console.log("🌱 Munch 模板种子脚本");
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
