# Codex 任务：Admin 后台 + 模板数据库化（一步到位生产版）

你在 `/Volumes/HX/Munch` 项目中工作。这是 Next.js 15 + React 19 + TypeScript + Tailwind CSS 4 + Supabase 项目。纯暗色主题（#0f0f10）。

## 总览

当前模板数据硬编码在 `src/data/templates/*.ts` 里。本次任务要：

1. 在数据库中建 `templates` 表，把模板存进去
2. 给 profiles 表加 `role` 字段区分管理员
3. 建 Admin 后台页面（/admin 路由组）
4. 把前端画廊改为从 API 读取数据库中的模板
5. Admin 可以：新建模板（上传图片+写提示词+定义变量）、编辑、上下架、管理用户、手动充积分

---

## Part 1：数据库迁移

创建文件 `supabase/migrations/002_templates_and_admin.sql`：

```sql
-- ============================================================
-- Migration 002: 模板数据库化 + Admin 角色
-- ============================================================

-- 1. profiles 表新增 role 字段
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user'
  CHECK (role IN ('user', 'admin'));

-- 2. 创建 templates 表
CREATE TABLE public.templates (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug            TEXT UNIQUE NOT NULL,                  -- URL 友好标识，如 "skincare-luxury"
  name            TEXT NOT NULL,                         -- 中文名称
  description     TEXT NOT NULL DEFAULT '',              -- 一句话描述
  category        TEXT NOT NULL                          -- 分类
                  CHECK (category IN ('skincare', 'fashion', 'food', 'product', 'poster')),
  tags            TEXT[] NOT NULL DEFAULT '{}',           -- 标签数组

  -- 图片
  thumbnail_url   TEXT,                                  -- 缩略图 URL（Supabase Storage 签名 URL 或公开 URL）
  thumbnail_path  TEXT,                                  -- Storage 内路径，如 "templates/skincare-luxury.jpg"

  -- 模型配置
  default_model   TEXT NOT NULL DEFAULT 'nano-banana-2'
                  CHECK (default_model IN ('nano-banana-2', 'nano-banana-pro-4k', 'nano-banana-pro-2k')),
  compatible_models TEXT[] NOT NULL DEFAULT '{nano-banana-2}',
  default_image_size JSONB NOT NULL DEFAULT '{"width":1024,"height":1024}',

  -- 变量定义（核心！整个 variables 数组存为 JSONB）
  variables       JSONB NOT NULL DEFAULT '[]',
  /*
    variables 结构示例：
    [
      {
        "id": "lighting",
        "name": "光线",
        "type": "select",
        "required": true,
        "priority": 1,
        "options": [
          {"value": "soft-diffused", "label": "柔光", "description": "均匀柔和"},
          {"value": "studio-cool", "label": "棚拍冷白"}
        ],
        "defaultValue": "soft-diffused"
      }
    ]
  */

  -- Prompt
  skill_prompt    TEXT NOT NULL DEFAULT '',
  base_prompt     TEXT NOT NULL DEFAULT '',                -- 含 {{variable}} 占位符
  negative_prompt TEXT,

  -- 管理字段
  credit_multiplier NUMERIC NOT NULL DEFAULT 1.0,
  is_published    BOOLEAN NOT NULL DEFAULT false,          -- 上架/下架
  sort_order      INTEGER NOT NULL DEFAULT 0,              -- 排序，越小越靠前
  tier_required   TEXT NOT NULL DEFAULT 'free'             -- 需要什么用户等级
                  CHECK (tier_required IN ('free', 'basic', 'pro')),

  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_templates_published ON public.templates(is_published, sort_order);
CREATE INDEX idx_templates_category ON public.templates(category) WHERE is_published = true;

-- 3. templates 表的 updated_at 自动更新
CREATE TRIGGER templates_set_updated_at
  BEFORE UPDATE ON public.templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 4. RLS：已发布模板所有人可读，只有 admin 可写
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

-- 所有人可以读已发布的模板
CREATE POLICY "Anyone can view published templates"
  ON public.templates FOR SELECT
  USING (is_published = true);

-- Admin 可以读所有模板（包括未发布）
CREATE POLICY "Admins can view all templates"
  ON public.templates FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Admin 可以增删改
CREATE POLICY "Admins can insert templates"
  ON public.templates FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update templates"
  ON public.templates FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can delete templates"
  ON public.templates FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 5. Admin 可以读所有 profiles（用户管理）
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Admin 可以更新任何 profile（充积分/改等级/封号）
CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Admin 可以读所有 generations（出图记录审核）
CREATE POLICY "Admins can view all generations"
  ON public.generations FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Admin 可以读所有 credit_transactions
CREATE POLICY "Admins can view all credit transactions"
  ON public.credit_transactions FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
```

**重要**：这个 SQL 文件写好后，Codex 不需要执行它。只需要创建文件。用户自己到 Supabase Dashboard 的 SQL Editor 中手动执行。

---

## Part 2：更新 TypeScript 类型

### 修改 `src/types/database.ts`

在 `Database.public.Tables` 中新增 `templates` 表类型，并给 `profiles` 新增 `role` 字段：

```typescript
import type { GenerationModel, GenerationStatus, UserTier } from "@/types/generation";

export interface TemplateVariable {
  id: string;
  name: string;
  type: "select" | "slider";
  required: boolean;
  priority: number;
  options?: { value: string; label: string; description?: string }[];
  defaultValue?: string;
  min?: number;
  max?: number;
  step?: number;
  defaultNumber?: number;
  unit?: string;
}

export interface DbTemplate {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: "skincare" | "fashion" | "food" | "product" | "poster";
  tags: string[];
  thumbnail_url: string | null;
  thumbnail_path: string | null;
  default_model: GenerationModel;
  compatible_models: GenerationModel[];
  default_image_size: { width: number; height: number };
  variables: TemplateVariable[];
  skill_prompt: string;
  base_prompt: string;
  negative_prompt: string | null;
  credit_multiplier: number;
  is_published: boolean;
  sort_order: number;
  tier_required: UserTier;
  created_at: string;
  updated_at: string;
}

export type UserRole = "user" | "admin";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          avatar_url: string | null;
          phone: string | null;
          credit_balance: number;
          tier: UserTier;
          role: UserRole;
          created_at: string;
          updated_at: string;
        };
      };
      templates: {
        Row: DbTemplate;
        Insert: Omit<DbTemplate, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<DbTemplate, "id" | "created_at" | "updated_at">>;
      };
      credit_transactions: {
        Row: {
          id: string;
          user_id: string;
          type: "grant" | "purchase" | "consume" | "refund";
          amount: number;
          balance_after: number;
          reference_type: string | null;
          reference_id: string | null;
          description: string | null;
          created_at: string;
        };
      };
      generations: {
        Row: {
          id: string;
          user_id: string;
          template_id: string;
          variables: Record<string, string>;
          model: GenerationModel;
          image_count: number;
          raw_prompt: string | null;
          compiled_prompt: string | null;
          negative_prompt: string | null;
          status: Exclude<GenerationStatus, "idle">;
          error_message: string | null;
          credits_cost: number;
          created_at: string;
          started_at: string | null;
          completed_at: string | null;
          updated_at: string;
        };
      };
      generated_images: {
        Row: {
          id: string;
          generation_id: string;
          user_id: string;
          image_index: number;
          storage_path: string;
          width: number | null;
          height: number | null;
          file_size: number | null;
          format: string | null;
          is_favorited: boolean;
          created_at: string;
        };
      };
    };
  };
}
```

---

## Part 3：创建 Admin 服务端工具

### 创建 `src/lib/supabase/admin.ts`

这是一个使用 Service Role Key 的 Supabase 客户端，只在服务端 API 路由中使用，绕过 RLS：

```typescript
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export function createSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient<Database>(url, key);
}
```

### 创建 `src/lib/admin-auth.ts`

Admin 鉴权辅助函数，在 Admin API 路由中使用：

```typescript
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) throw new Error("Supabase not configured");

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    throw new Error("Not authorized");
  }

  return { user, supabase };
}
```

---

## Part 4：Admin API 路由

### 4.1 创建 `src/app/api/admin/templates/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";

// GET /api/admin/templates — 获取所有模板（含未发布）
export async function GET() {
  try {
    const { supabase } = await requireAdmin();
    const { data, error } = await supabase
      .from("templates")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unauthorized";
    return NextResponse.json({ error: msg }, { status: 401 });
  }
}

// POST /api/admin/templates — 新建模板
export async function POST(req: NextRequest) {
  try {
    const { supabase } = await requireAdmin();
    const body = await req.json();
    const { data, error } = await supabase
      .from("templates")
      .insert(body)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unauthorized";
    return NextResponse.json({ error: msg }, { status: 401 });
  }
}
```

### 4.2 创建 `src/app/api/admin/templates/[id]/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";

// GET 单个模板
export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { supabase } = await requireAdmin();
    const { data, error } = await supabase.from("templates").select("*").eq("id", id).single();
    if (error) return NextResponse.json({ error: error.message }, { status: 404 });
    return NextResponse.json(data);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unauthorized";
    return NextResponse.json({ error: msg }, { status: 401 });
  }
}

// PATCH 更新模板
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { supabase } = await requireAdmin();
    const body = await req.json();
    const { data, error } = await supabase.from("templates").update(body).eq("id", id).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unauthorized";
    return NextResponse.json({ error: msg }, { status: 401 });
  }
}

// DELETE 删除模板
export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { supabase } = await requireAdmin();
    const { error } = await supabase.from("templates").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unauthorized";
    return NextResponse.json({ error: msg }, { status: 401 });
  }
}
```

### 4.3 创建 `src/app/api/admin/templates/[id]/upload/route.ts`

缩略图上传到 Supabase Storage：

```typescript
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await requireAdmin(); // 验证是 admin

    const admin = createSupabaseAdmin();
    if (!admin) return NextResponse.json({ error: "Server config error" }, { status: 500 });

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

    const ext = file.name.split(".").pop() || "jpg";
    const storagePath = `templates/${id}.${ext}`;

    // 上传到 Storage
    const { error: uploadError } = await admin.storage
      .from("template-images")
      .upload(storagePath, file, { upsert: true, contentType: file.type });
    if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

    // 获取公开 URL
    const { data: urlData } = admin.storage.from("template-images").getPublicUrl(storagePath);

    // 更新模板记录
    const { data, error } = await admin
      .from("templates")
      .update({ thumbnail_url: urlData.publicUrl, thumbnail_path: storagePath })
      .eq("id", id)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json(data);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unauthorized";
    return NextResponse.json({ error: msg }, { status: 401 });
  }
}
```

### 4.4 创建 `src/app/api/admin/users/route.ts`

```typescript
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET() {
  try {
    const { supabase } = await requireAdmin();
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unauthorized";
    return NextResponse.json({ error: msg }, { status: 401 });
  }
}
```

### 4.5 创建 `src/app/api/admin/users/[id]/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { supabase } = await requireAdmin();
    const body = await req.json();
    // 只允许更新这些字段
    const allowed: Record<string, unknown> = {};
    if ("credit_balance" in body) allowed.credit_balance = body.credit_balance;
    if ("tier" in body) allowed.tier = body.tier;
    if ("role" in body) allowed.role = body.role;

    const { data, error } = await supabase.from("profiles").update(allowed).eq("id", id).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unauthorized";
    return NextResponse.json({ error: msg }, { status: 401 });
  }
}
```

### 4.6 创建 `src/app/api/admin/stats/route.ts`

```typescript
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET() {
  try {
    const { supabase } = await requireAdmin();

    const [usersRes, templatesRes, generationsRes, creditsRes] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("templates").select("id", { count: "exact", head: true }).eq("is_published", true),
      supabase.from("generations").select("id", { count: "exact", head: true }),
      supabase.from("credit_transactions").select("amount").eq("type", "consume"),
    ]);

    const totalConsumed = (creditsRes.data ?? []).reduce((sum, t) => sum + Math.abs(t.amount), 0);

    return NextResponse.json({
      totalUsers: usersRes.count ?? 0,
      publishedTemplates: templatesRes.count ?? 0,
      totalGenerations: generationsRes.count ?? 0,
      totalCreditsConsumed: totalConsumed,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unauthorized";
    return NextResponse.json({ error: msg }, { status: 401 });
  }
}
```

---

## Part 5：修改公开的 Templates API（前端画廊用）

### 修改 `src/app/api/templates/route.ts`

改为从数据库读取已发布模板（代替旧的从静态数据导入）：

```typescript
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { templates as staticTemplates } from "@/data/templates";

export async function GET() {
  const supabase = await createSupabaseServerClient();

  // 如果 Supabase 未配置，降级到静态数据
  if (!supabase) {
    return NextResponse.json(staticTemplates);
  }

  const { data, error } = await supabase
    .from("templates")
    .select("*")
    .eq("is_published", true)
    .order("sort_order", { ascending: true });

  // 如果查询失败或没数据，降级到静态数据
  if (error || !data || data.length === 0) {
    return NextResponse.json(staticTemplates);
  }

  return NextResponse.json(data);
}
```

---

## Part 6：前端画廊改为从 API 拉取

### 修改 `src/components/gallery/masonry-gallery.tsx`

从直接导入静态 templates 改为从 API 获取：

```tsx
"use client";

import { useEffect, useState } from "react";
import { GalleryCard } from "./gallery-card";
import { useWorkspaceStore } from "@/stores/workspace-store";
import type { DbTemplate } from "@/types/database";
import { templates as staticTemplates } from "@/data/templates";

// 将静态模板转为 DbTemplate 兼容格式
function staticToDb(t: (typeof staticTemplates)[0]): DbTemplate {
  return {
    id: t.id,
    slug: t.id,
    name: t.name,
    description: t.description,
    category: t.category,
    tags: t.tags,
    thumbnail_url: t.thumbnailUrl,
    thumbnail_path: null,
    default_model: t.defaultModel,
    compatible_models: t.compatibleModels,
    default_image_size: t.defaultImageSize,
    variables: t.variables,
    skill_prompt: t.skillPrompt,
    base_prompt: t.basePrompt,
    negative_prompt: t.negativePrompt ?? null,
    credit_multiplier: t.creditMultiplier,
    is_published: true,
    sort_order: 0,
    tier_required: "free",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export function MasonryGallery() {
  const filter = useWorkspaceStore((s) => s.activeCategoryFilter);
  const [templates, setTemplates] = useState<DbTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/templates")
      .then((res) => res.json())
      .then((data: DbTemplate[]) => {
        // 如果返回的是旧格式（有 thumbnailUrl 而非 thumbnail_url），转换
        if (data.length > 0 && "thumbnailUrl" in data[0]) {
          setTemplates((data as unknown as (typeof staticTemplates)).map(staticToDb));
        } else {
          setTemplates(data);
        }
      })
      .catch(() => setTemplates(staticTemplates.map(staticToDb)))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter
    ? templates.filter((t) => t.category === filter)
    : templates;

  if (loading) {
    return (
      <div className="columns-2 md:columns-3 xl:columns-4 gap-1.5 px-1.5 pb-36">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="mb-1.5 break-inside-avoid rounded-[4px] bg-white/[0.03] aspect-square animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="columns-2 md:columns-3 xl:columns-4 gap-1.5 px-1.5 pb-36">
      {filtered.map((template) => (
        <GalleryCard key={template.id} template={template} />
      ))}
    </div>
  );
}
```

### 修改 `src/components/gallery/gallery-card.tsx`

改为接受 `DbTemplate` 类型，用 `thumbnail_url` 代替 `thumbnailUrl`：

```tsx
"use client";

import Image from "next/image";
import { useWorkspaceStore } from "@/stores/workspace-store";
import type { DbTemplate } from "@/types/database";

interface GalleryCardProps {
  template: DbTemplate;
}

export function GalleryCard({ template }: GalleryCardProps) {
  const openTemplateDetail = useWorkspaceStore((s) => s.openTemplateDetail);

  return (
    <button
      onClick={() => openTemplateDetail(template.id)}
      className="group relative mb-1.5 break-inside-avoid overflow-hidden rounded-[4px] cursor-pointer w-full text-left"
    >
      <div className="relative aspect-square bg-white/[0.03]">
        {template.thumbnail_url ? (
          <Image
            src={template.thumbnail_url}
            alt=""
            fill
            className="object-cover transition-transform duration-200 group-hover:scale-[1.02]"
            loading="lazy"
            sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-2xl text-white/20">
            {template.name.charAt(0)}
          </div>
        )}
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end p-3">
        <span className="text-white text-sm font-medium">{template.name}</span>
      </div>
    </button>
  );
}
```

### 修改 `src/components/creation/template-detail-modal.tsx`

修改为从 API 获取模板数据而不是从静态 templates 数组查找。把 `getTemplateById` 换成从 `templates` state 查找，或者直接用 `viewingTemplateId` 去 fetch `/api/admin/templates/{id}` 。

最简单的方案：在 workspace-store 里存一个 `templates: DbTemplate[]` 数组，masonry-gallery fetch 后写入 store，然后 modal 和 editor 直接从 store 读取。

在 `workspace-store.ts` 新增：

```ts
// 新增字段
templates: DbTemplate[];
setTemplates: (t: DbTemplate[]) => void;
```

默认值 `templates: []`。masonry-gallery fetch 成功后调用 `setTemplates(data)`。

template-detail-modal 和 variable-editor 中用：
```ts
const template = useWorkspaceStore((s) => s.templates.find((t) => t.id === s.viewingTemplateId));
```

---

## Part 7：Admin 页面

### 7.1 创建 `src/app/(admin)/layout.tsx`

Admin 布局，带鉴权守卫和独立导航：

```tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LayoutDashboard, Images, Users, CreditCard, Settings, ArrowLeft } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";

const navItems = [
  { href: "/admin", label: "概览", icon: LayoutDashboard },
  { href: "/admin/templates", label: "模板管理", icon: Images },
  { href: "/admin/users", label: "用户管理", icon: Users },
  { href: "/admin/credits", label: "积分管理", icon: CreditCard },
  { href: "/admin/settings", label: "系统设置", icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    // 简单的客户端鉴权检查（服务端 API 也会校验）
    async function check() {
      try {
        const res = await fetch("/api/admin/stats");
        if (res.ok) setAuthorized(true);
        else router.replace("/");
      } catch {
        router.replace("/");
      }
    }
    check();
  }, [router]);

  if (!authorized) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0f0f10]">
        <div className="text-[#636366]">验证权限中...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#0f0f10]">
      {/* 左侧边栏 */}
      <aside className="fixed left-0 top-0 bottom-0 w-56 border-r border-white/[0.06] bg-[#0f0f10] p-4 flex flex-col">
        <Link href="/" className="flex items-center gap-2 mb-8 text-[#a1a1a6] hover:text-white transition text-sm">
          <ArrowLeft className="w-4 h-4" /> 返回前台
        </Link>

        <div className="flex items-center gap-2 mb-8">
          <span className="bg-brand rounded-lg px-2 py-1 text-xs text-white font-bold">M</span>
          <span className="text-[#f5f5f7] font-semibold text-sm">Munch Admin</span>
        </div>

        <nav className="flex-1 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-[#a1a1a6] hover:text-white hover:bg-white/[0.06] transition"
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="text-xs text-[#636366]">
          {user?.displayName ?? "Admin"}
        </div>
      </aside>

      {/* 右侧主内容 */}
      <main className="ml-56 flex-1 p-8">
        {children}
      </main>
    </div>
  );
}
```

### 7.2 创建 `src/app/(admin)/admin/page.tsx` — 数据概览

```tsx
"use client";

import { useEffect, useState } from "react";
import { LayoutDashboard, Images, Users, Zap } from "lucide-react";

interface Stats {
  totalUsers: number;
  publishedTemplates: number;
  totalGenerations: number;
  totalCreditsConsumed: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/admin/stats").then((r) => r.json()).then(setStats).catch(() => {});
  }, []);

  const cards = [
    { label: "注册用户", value: stats?.totalUsers ?? "-", icon: Users, color: "text-blue-400" },
    { label: "已发布模板", value: stats?.publishedTemplates ?? "-", icon: Images, color: "text-green-400" },
    { label: "累计出图", value: stats?.totalGenerations ?? "-", icon: LayoutDashboard, color: "text-purple-400" },
    { label: "消耗积分", value: stats?.totalCreditsConsumed ?? "-", icon: Zap, color: "text-yellow-400" },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-[#f5f5f7]">数据概览</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-xl border border-white/[0.08] bg-[#1a1a1d] p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#a1a1a6]">{card.label}</span>
              <card.icon className={`w-5 h-5 ${card.color}`} />
            </div>
            <p className="mt-2 text-3xl font-bold text-[#f5f5f7]">{card.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 7.3 创建 `src/app/(admin)/admin/templates/page.tsx` — 模板列表

```tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Pencil, Eye, EyeOff, Trash2 } from "lucide-react";
import type { DbTemplate } from "@/types/database";

export default function AdminTemplatesPage() {
  const [templates, setTemplates] = useState<DbTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadTemplates() {
    const res = await fetch("/api/admin/templates");
    if (res.ok) setTemplates(await res.json());
    setLoading(false);
  }

  useEffect(() => { loadTemplates(); }, []);

  async function togglePublish(t: DbTemplate) {
    await fetch(`/api/admin/templates/${t.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_published: !t.is_published }),
    });
    loadTemplates();
  }

  async function deleteTemplate(t: DbTemplate) {
    if (!confirm(`确定删除「${t.name}」？`)) return;
    await fetch(`/api/admin/templates/${t.id}`, { method: "DELETE" });
    loadTemplates();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#f5f5f7]">模板管理</h1>
        <Link
          href="/admin/templates/new"
          className="flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover transition"
        >
          <Plus className="w-4 h-4" /> 新建模板
        </Link>
      </div>

      {loading ? (
        <div className="text-[#636366]">加载中...</div>
      ) : templates.length === 0 ? (
        <div className="rounded-xl border border-white/[0.08] bg-[#1a1a1d] p-12 text-center text-[#636366]">
          暂无模板，点击"新建模板"开始创建
        </div>
      ) : (
        <div className="space-y-2">
          {templates.map((t) => (
            <div key={t.id} className="flex items-center gap-4 rounded-xl border border-white/[0.08] bg-[#1a1a1d] p-4">
              {/* 缩略图 */}
              <div className="h-16 w-16 flex-none rounded-lg bg-white/[0.03] overflow-hidden">
                {t.thumbnail_url ? (
                  <img src={t.thumbnail_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xl text-white/20">
                    {t.name.charAt(0)}
                  </div>
                )}
              </div>

              {/* 信息 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-[#f5f5f7]">{t.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${t.is_published ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-[#636366]'}`}>
                    {t.is_published ? "已上架" : "未上架"}
                  </span>
                  <span className="text-xs text-[#636366]">{t.category}</span>
                </div>
                <p className="text-xs text-[#636366] mt-1 truncate">{t.description}</p>
                <p className="text-xs text-[#636366] mt-1">{t.variables.length} 个变量 · {t.default_model}</p>
              </div>

              {/* 操作 */}
              <div className="flex items-center gap-2">
                <Link href={`/admin/templates/${t.id}`} className="p-2 rounded-lg hover:bg-white/[0.06] text-[#a1a1a6] hover:text-white transition">
                  <Pencil className="w-4 h-4" />
                </Link>
                <button onClick={() => togglePublish(t)} className="p-2 rounded-lg hover:bg-white/[0.06] text-[#a1a1a6] hover:text-white transition">
                  {t.is_published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button onClick={() => deleteTemplate(t)} className="p-2 rounded-lg hover:bg-white/[0.06] text-red-400 hover:text-red-300 transition">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

### 7.4 创建 `src/app/(admin)/admin/templates/new/page.tsx` 和 `src/app/(admin)/admin/templates/[id]/page.tsx`

这两个页面共用一个表单组件。创建 `src/components/admin/template-form.tsx`：

这是**模板编辑器**的核心组件，它包含：
- 基本信息（名称、slug、描述、分类、标签）
- 缩略图上传
- 变量定义器（可增删变量，每个变量可增删选项）
- Prompt 编辑器（skill_prompt、base_prompt、negative_prompt）
- 模型配置
- 管理配置（排序、等级、积分倍率）

这个组件比较大（约 400-500 行），结构如下：

```tsx
"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, GripVertical, Upload, Save } from "lucide-react";
import type { DbTemplate, TemplateVariable } from "@/types/database";

interface TemplateFormProps {
  initialData?: DbTemplate;         // 编辑时传入，新建时为 undefined
}

export function TemplateForm({ initialData }: TemplateFormProps) {
  const router = useRouter();
  const isEditing = Boolean(initialData);

  // 基本信息 state
  const [slug, setSlug] = useState(initialData?.slug ?? "");
  const [name, setName] = useState(initialData?.name ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [category, setCategory] = useState(initialData?.category ?? "product");
  const [tags, setTags] = useState(initialData?.tags?.join(", ") ?? "");

  // 图片
  const [thumbnailPreview, setThumbnailPreview] = useState(initialData?.thumbnail_url ?? "");
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);

  // 变量
  const [variables, setVariables] = useState<TemplateVariable[]>(initialData?.variables ?? []);

  // Prompt
  const [skillPrompt, setSkillPrompt] = useState(initialData?.skill_prompt ?? "");
  const [basePrompt, setBasePrompt] = useState(initialData?.base_prompt ?? "");
  const [negativePrompt, setNegativePrompt] = useState(initialData?.negative_prompt ?? "");

  // 模型
  const [defaultModel, setDefaultModel] = useState(initialData?.default_model ?? "nano-banana-2");
  const [compatibleModels, setCompatibleModels] = useState<string[]>(initialData?.compatible_models ?? ["nano-banana-2"]);

  // 管理
  const [sortOrder, setSortOrder] = useState(initialData?.sort_order ?? 0);
  const [tierRequired, setTierRequired] = useState(initialData?.tier_required ?? "free");
  const [creditMultiplier, setCreditMultiplier] = useState(initialData?.credit_multiplier ?? 1);
  const [isPublished, setIsPublished] = useState(initialData?.is_published ?? false);

  const [saving, setSaving] = useState(false);

  // 添加变量
  function addVariable() {
    setVariables([...variables, {
      id: `var_${Date.now()}`,
      name: "",
      type: "select",
      required: true,
      priority: variables.length + 1,
      options: [{ value: "", label: "" }],
      defaultValue: "",
    }]);
  }

  // 更新变量
  function updateVariable(index: number, updates: Partial<TemplateVariable>) {
    setVariables(variables.map((v, i) => i === index ? { ...v, ...updates } : v));
  }

  // 删除变量
  function removeVariable(index: number) {
    setVariables(variables.filter((_, i) => i !== index));
  }

  // 添加选项
  function addOption(varIndex: number) {
    const v = variables[varIndex];
    updateVariable(varIndex, {
      options: [...(v.options ?? []), { value: "", label: "" }],
    });
  }

  // 更新选项
  function updateOption(varIndex: number, optIndex: number, updates: Partial<{ value: string; label: string; description: string }>) {
    const v = variables[varIndex];
    const newOptions = (v.options ?? []).map((o, i) => i === optIndex ? { ...o, ...updates } : o);
    updateVariable(varIndex, { options: newOptions });
  }

  // 删除选项
  function removeOption(varIndex: number, optIndex: number) {
    const v = variables[varIndex];
    updateVariable(varIndex, {
      options: (v.options ?? []).filter((_, i) => i !== optIndex),
    });
  }

  // 缩略图选择
  function handleThumbnailChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setThumbnailFile(file);
    setThumbnailPreview(URL.createObjectURL(file));
  }

  // 保存
  async function handleSave(publish = false) {
    setSaving(true);
    try {
      const payload = {
        slug,
        name,
        description,
        category,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        default_model: defaultModel,
        compatible_models: compatibleModels,
        default_image_size: { width: 1024, height: 1024 },
        variables,
        skill_prompt: skillPrompt,
        base_prompt: basePrompt,
        negative_prompt: negativePrompt || null,
        credit_multiplier: creditMultiplier,
        sort_order: sortOrder,
        tier_required: tierRequired,
        is_published: publish ? true : isPublished,
      };

      let templateId = initialData?.id;

      if (isEditing && templateId) {
        await fetch(`/api/admin/templates/${templateId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        const res = await fetch("/api/admin/templates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const created = await res.json();
        templateId = created.id;
      }

      // 上传缩略图
      if (thumbnailFile && templateId) {
        const formData = new FormData();
        formData.append("file", thumbnailFile);
        await fetch(`/api/admin/templates/${templateId}/upload`, {
          method: "POST",
          body: formData,
        });
      }

      router.push("/admin/templates");
      router.refresh();
    } catch (err) {
      alert("保存失败: " + (err instanceof Error ? err.message : "未知错误"));
    } finally {
      setSaving(false);
    }
  }

  // 渲染表单 UI
  // 这里需要渲染完整的表单，包括所有字段
  // 每个区域用 <section> 包裹，标题用 h2，样式参照暗色主题
  // 输入框样式：bg-white/[0.06] border border-white/[0.1] rounded-lg px-3 py-2 text-sm text-[#f5f5f7] focus:border-brand focus:outline-none w-full
  // 标签样式：text-sm font-medium text-[#f5f5f7] mb-1.5 block
  // 区域容器：rounded-xl border border-white/[0.08] bg-[#1a1a1d] p-6 space-y-4

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#f5f5f7]">
          {isEditing ? `编辑: ${name}` : "新建模板"}
        </h1>
        <div className="flex gap-2">
          <button
            onClick={() => handleSave(false)}
            disabled={saving}
            className="flex items-center gap-2 rounded-lg border border-white/[0.1] px-4 py-2 text-sm text-[#a1a1a6] hover:text-white transition disabled:opacity-50"
          >
            <Save className="w-4 h-4" /> {saving ? "保存中..." : "保存草稿"}
          </button>
          <button
            onClick={() => handleSave(true)}
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover transition disabled:opacity-50"
          >
            <Save className="w-4 h-4" /> {saving ? "保存中..." : "保存并上架"}
          </button>
        </div>
      </div>

      {/* 区域1: 基本信息 */}
      <section className="rounded-xl border border-white/[0.08] bg-[#1a1a1d] p-6 space-y-4">
        <h2 className="text-base font-semibold text-[#f5f5f7]">基本信息</h2>
        {/* slug, name, description, category(select), tags(input) */}
        {/* 每个字段一行，label + input */}
        {/* 请实现完整的表单字段渲染 */}
      </section>

      {/* 区域2: 缩略图 */}
      <section className="rounded-xl border border-white/[0.08] bg-[#1a1a1d] p-6 space-y-4">
        <h2 className="text-base font-semibold text-[#f5f5f7]">缩略图</h2>
        {/* 点击上传或拖拽，预览区 200x200，input type=file hidden, 用 label 触发 */}
      </section>

      {/* 区域3: 变量定义（核心！） */}
      <section className="rounded-xl border border-white/[0.08] bg-[#1a1a1d] p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-[#f5f5f7]">变量定义</h2>
          <button onClick={addVariable} className="flex items-center gap-1 text-sm text-brand hover:text-brand-hover transition">
            <Plus className="w-4 h-4" /> 添加变量
          </button>
        </div>
        {/* 每个变量一个卡片：id, name, type, required, priority */}
        {/* 每个变量下面列出它的 options，每个 option 有 value + label + description */}
        {/* 每个 option 右侧有删除按钮，底部有"添加选项"按钮 */}
        {/* 整个变量卡片右上角有删除按钮 */}
        {variables.map((variable, varIndex) => (
          <div key={variable.id} className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4 space-y-3">
            {/* 变量头部：name + id + type + required + 删除 */}
            {/* 选项列表 */}
            {/* 添加选项按钮 */}
          </div>
        ))}
      </section>

      {/* 区域4: Prompt */}
      <section className="rounded-xl border border-white/[0.08] bg-[#1a1a1d] p-6 space-y-4">
        <h2 className="text-base font-semibold text-[#f5f5f7]">Prompt 配置</h2>
        {/* skill_prompt: textarea, 行高 4 */}
        {/* base_prompt: textarea, 行高 6, 说明"使用 {{变量id}} 作占位符" */}
        {/* negative_prompt: textarea, 行高 3 */}
      </section>

      {/* 区域5: 模型配置 */}
      <section className="rounded-xl border border-white/[0.08] bg-[#1a1a1d] p-6 space-y-4">
        <h2 className="text-base font-semibold text-[#f5f5f7]">模型配置</h2>
        {/* default_model: select */}
        {/* compatible_models: checkbox group */}
      </section>

      {/* 区域6: 管理配置 */}
      <section className="rounded-xl border border-white/[0.08] bg-[#1a1a1d] p-6 space-y-4">
        <h2 className="text-base font-semibold text-[#f5f5f7]">管理配置</h2>
        {/* sort_order: number input */}
        {/* tier_required: select (free/basic/pro) */}
        {/* credit_multiplier: number input */}
      </section>
    </div>
  );
}
```

**注意**：上面的 template-form.tsx 有些区域用注释标出了"请实现完整的表单字段渲染"。你需要把这些注释替换为完整的 JSX 表单元素。每个输入字段使用统一的暗色主题样式：

```
输入框: className="w-full bg-white/[0.06] border border-white/[0.1] rounded-lg px-3 py-2 text-sm text-[#f5f5f7] placeholder:text-[#636366] focus:border-brand focus:outline-none"
标签: className="text-sm font-medium text-[#f5f5f7] mb-1.5 block"
select: 同输入框样式
textarea: 同输入框样式 + resize-none
```

### 新建页面 `src/app/(admin)/admin/templates/new/page.tsx`：

```tsx
import { TemplateForm } from "@/components/admin/template-form";

export default function NewTemplatePage() {
  return <TemplateForm />;
}
```

### 编辑页面 `src/app/(admin)/admin/templates/[id]/page.tsx`：

```tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { TemplateForm } from "@/components/admin/template-form";
import type { DbTemplate } from "@/types/database";

export default function EditTemplatePage() {
  const params = useParams<{ id: string }>();
  const [template, setTemplate] = useState<DbTemplate | null>(null);

  useEffect(() => {
    fetch(`/api/admin/templates/${params.id}`)
      .then((r) => r.json())
      .then(setTemplate);
  }, [params.id]);

  if (!template) return <div className="text-[#636366]">加载中...</div>;
  return <TemplateForm initialData={template} />;
}
```

### 7.5 创建 `src/app/(admin)/admin/users/page.tsx` — 用户管理

```tsx
"use client";

import { useEffect, useState } from "react";
import type { Database } from "@/types/database";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadUsers() {
    const res = await fetch("/api/admin/users");
    if (res.ok) setUsers(await res.json());
    setLoading(false);
  }

  useEffect(() => { loadUsers(); }, []);

  async function updateUser(id: string, updates: Partial<Profile>) {
    await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    loadUsers();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#f5f5f7]">用户管理</h1>

      {loading ? (
        <div className="text-[#636366]">加载中...</div>
      ) : (
        <div className="rounded-xl border border-white/[0.08] overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-white/[0.03]">
              <tr className="text-left text-[#636366]">
                <th className="px-4 py-3 font-medium">用户</th>
                <th className="px-4 py-3 font-medium">等级</th>
                <th className="px-4 py-3 font-medium">积分余额</th>
                <th className="px-4 py-3 font-medium">角色</th>
                <th className="px-4 py-3 font-medium">注册时间</th>
                <th className="px-4 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {users.map((user) => (
                <tr key={user.id} className="text-[#a1a1a6]">
                  <td className="px-4 py-3">
                    <span className="text-[#f5f5f7]">{user.display_name ?? "—"}</span>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={user.tier}
                      onChange={(e) => updateUser(user.id, { tier: e.target.value as Profile["tier"] })}
                      className="bg-white/[0.06] border border-white/[0.1] rounded px-2 py-1 text-xs text-[#f5f5f7] focus:outline-none"
                    >
                      <option value="free">Free</option>
                      <option value="basic">Basic</option>
                      <option value="pro">Pro</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      value={user.credit_balance}
                      onChange={(e) => updateUser(user.id, { credit_balance: Number(e.target.value) })}
                      className="w-24 bg-white/[0.06] border border-white/[0.1] rounded px-2 py-1 text-xs text-[#f5f5f7] focus:outline-none"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${user.role === "admin" ? "bg-brand/20 text-brand" : "bg-white/5 text-[#636366]"}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs">{new Date(user.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">—</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
```

### 7.6 创建占位页面

`src/app/(admin)/admin/credits/page.tsx`：
```tsx
export default function AdminCreditsPage() {
  return <div className="text-2xl font-bold text-[#f5f5f7]">积分管理（开发中）</div>;
}
```

`src/app/(admin)/admin/settings/page.tsx`：
```tsx
export default function AdminSettingsPage() {
  return <div className="text-2xl font-bold text-[#f5f5f7]">系统设置（开发中）</div>;
}
```

---

## Part 8：Supabase Storage Bucket

你不需要用代码创建 bucket。但在 `.env.example` 中添加注释提醒：

```
# ── 注意 ──
# 需要在 Supabase Dashboard 手动创建 Storage Bucket:
# Bucket 名称: template-images
# 公开访问: true（模板缩略图需要公开访问）
# 允许的 MIME: image/png, image/jpeg, image/webp
```

---

## Part 9：保留静态模板作为降级

不要删除 `src/data/templates/*.ts` 文件。它们作为 Supabase 未配置时的降级数据源。前面在 `masonry-gallery.tsx` 和 `api/templates/route.ts` 中已经实现了降级逻辑。

---

## 验收标准

| # | 检查项 | 通过标准 |
|---|--------|---------|
| 1 | `pnpm build` | 零报错 |
| 2 | SQL 文件 | `supabase/migrations/002_templates_and_admin.sql` 存在且语法正确 |
| 3 | `/admin` 页面 | 显示数据概览（4 个统计卡片） |
| 4 | `/admin/templates` | 显示模板列表，有新建/编辑/上下架/删除功能 |
| 5 | `/admin/templates/new` | 完整的模板编辑器：基本信息 + 缩略图上传 + 变量定义 + Prompt 编辑 + 模型配置 + 管理配置 |
| 6 | 变量定义器 | 可以添加变量→为变量添加选项→每个选项有 value/label/description→可删除 |
| 7 | `/admin/users` | 显示用户列表，可修改等级和积分 |
| 8 | 首页画廊 | 从 `/api/templates` 获取数据（Supabase 有数据就读 DB，否则降级到静态数据） |
| 9 | Admin 鉴权 | 非 admin 用户访问 `/admin` 被重定向到首页 |
| 10 | 模板表单 | 表单的每个区域都有完整的输入字段（不是注释占位符） |
| 11 | API 路由 | `/api/admin/templates`、`/api/admin/users`、`/api/admin/stats` 都能正常响应 |

---

## 文件操作清单

### 新建文件：
```
supabase/migrations/002_templates_and_admin.sql
src/lib/supabase/admin.ts
src/lib/admin-auth.ts
src/app/api/admin/templates/route.ts
src/app/api/admin/templates/[id]/route.ts
src/app/api/admin/templates/[id]/upload/route.ts
src/app/api/admin/users/route.ts
src/app/api/admin/users/[id]/route.ts
src/app/api/admin/stats/route.ts
src/app/(admin)/layout.tsx
src/app/(admin)/admin/page.tsx
src/app/(admin)/admin/templates/page.tsx
src/app/(admin)/admin/templates/new/page.tsx
src/app/(admin)/admin/templates/[id]/page.tsx
src/app/(admin)/admin/users/page.tsx
src/app/(admin)/admin/credits/page.tsx
src/app/(admin)/admin/settings/page.tsx
src/components/admin/template-form.tsx
```

### 修改文件：
```
src/types/database.ts          — 新增 templates 表类型、DbTemplate、UserRole、TemplateVariable
src/app/api/templates/route.ts — 从 DB 读取，降级到静态数据
src/components/gallery/masonry-gallery.tsx — 从 API 获取模板
src/components/gallery/gallery-card.tsx    — 接受 DbTemplate 类型
src/stores/workspace-store.ts  — 新增 templates 数组和 setTemplates
src/components/creation/template-detail-modal.tsx — 从 store.templates 查找
src/components/creation/variable-editor.tsx       — 从 store.templates 查找
.env.example                   — 添加 Storage bucket 提醒
```

### 不删除的文件：
```
src/data/templates/*.ts  — 保留作为降级数据源
```

---

**开始执行。`template-form.tsx` 中的注释占位符必须替换为完整的表单 JSX，不能留空。**
