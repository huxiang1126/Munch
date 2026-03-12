# Munch — AI 出图工作流平台
# 产品需求文档（PRD）v1.0
# 2026-03-07

---

## 0. 文档约定

| 符号 | 含义 |
|------|------|
| `[MVP]` | 最小可行版本必须实现 |
| `[V2]` | 第二版迭代 |
| `[V3]` | 远期规划 |
| `P0` | 致命/阻塞上线 |
| `P1` | 重要/影响核心体验 |
| `P2` | 改善/锦上添花 |

---

# 第一部分：产品概述与系统架构

## 1.1 产品定位

**一句话定义**：面向广告公司与中小商家的 AI 出图工作流平台——用户选模板、调变量、出商业级图片，底层多模型路由 + Prompt 智能重编译。

**核心价值主张**：
- 不卖模型，卖"审美结构化"——模板 + 变量 + Skills 约束 = 稳定可控的商业出图
- 多模型统一入口，用户不需要逐一注册各模型平台
- 国内直接可用，无需翻墙

**目标用户（MVP 阶段）**：
1. 广告公司设计团队——需要快速出海报/样机方案
2. 中小服装/电商店主——需要商品主图/详情页素材
3. 自由设计师——需要快速出概念稿给客户确认

## 1.2 MVP 功能边界（硬约束）

### 做的：
- 用户注册/登录（邮箱 + 手机号）
- 积分系统（充值 + 消耗 + 余额）
- 模板浏览与选择（首批 10 个模板）
- 变量控件（每模板 3-5 个下拉/滑块变量）
- Prompt 重编译（Claude API 中间层）
- 双模型接入（Flux Pro + GPT Image）
- 出图结果展示（2-4 张并排对比）
- 图片历史记录
- 图片下载（原图质量）
- 响应式 Web（桌面优先，手机可浏览）

### 不做的（明确排除）：
- ~~图生视频~~
- ~~微信小程序~~
- ~~Skills 包管理后台~~（硬编码在模板 JSON 中）
- ~~无模板自由模式~~
- ~~智能模型路由~~（用户手选）
- ~~团队协作/多人空间~~
- ~~在线编辑/标注/精修~~
- ~~支付系统~~（MVP 阶段手动充值积分，V2 接入支付）

## 1.3 系统架构总览

```
┌─────────────────────────────────────────────────────────────┐
│                        客户端（Browser）                      │
│  Next.js 15 App Router + React 19 + Tailwind CSS + shadcn/ui │
│  ├── 页面层（Pages）                                          │
│  ├── 组件层（Components）                                     │
│  ├── 状态管理（Zustand）                                      │
│  └── API 请求层（fetch + SWR）                                │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTPS
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    Next.js API Routes                         │
│  ├── /api/auth/*        认证相关                               │
│  ├── /api/templates/*   模板 CRUD                             │
│  ├── /api/generate      出图请求入口                           │
│  ├── /api/generate/status  SSE 进度推送                       │
│  ├── /api/credits/*     积分查询/消耗记录                      │
│  ├── /api/history/*     历史记录                               │
│  └── /api/images/*      图片访问/下载                          │
└───────┬──────────┬──────────┬───────────────────────────────┘
        │          │          │
        ▼          ▼          ▼
┌──────────┐ ┌──────────┐ ┌──────────────────────────────────┐
│ Supabase │ │ Claude   │ │       图像生成模型 APIs            │
│ ├─ Auth  │ │ API      │ │  ├── Flux Pro (BFL / Replicate)  │
│ ├─ PgSQL │ │ (Prompt  │ │  └── GPT Image (OpenAI)          │
│ ├─ Store │ │ 重编译)   │ │                                   │
│ └─ RLS   │ │          │ │  [V2] Seedance / Grok / 其他      │
└──────────┘ └──────────┘ └──────────────────────────────────┘
                                      │
                                      ▼
                              ┌──────────────┐
                              │ Inngest       │
                              │ (异步任务队列) │
                              │ 处理出图任务   │
                              └──────────────┘
```

## 1.4 技术栈清单

| 层级 | 技术选型 | 版本 | 选型理由 |
|------|---------|------|---------|
| 框架 | Next.js (App Router) | 15.x | 前后端一体，SSR/SSG，Vercel 原生支持 |
| UI 框架 | React | 19.x | Next.js 内置 |
| 样式 | Tailwind CSS | 4.x | 原子化 CSS，暗色主题快速实现 |
| 组件库 | shadcn/ui | latest | 高质量、可定制、无锁定 |
| 状态管理 | Zustand | 5.x | 轻量、无 boilerplate、支持持久化 |
| 数据请求 | SWR | 2.x | 缓存、重试、轮询、乐观更新 |
| 数据库 | Supabase (PostgreSQL) | - | Auth+DB+Storage 一站式，RLS 多租户 |
| ORM | Supabase JS Client | 2.x | 类型安全、自动 RLS |
| 认证 | Supabase Auth | - | 邮箱/手机号/OAuth，JWT 自动管理 |
| 文件存储 | Supabase Storage | - | 生成图片存储，CDN 分发 |
| 异步队列 | Inngest | latest | Serverless 事件驱动，免运维 |
| AI 中间层 | Anthropic Claude API | claude-sonnet-4-6 | Prompt 重编译，性价比最优 |
| 图像模型 A | Flux Pro API | - | 精度高、可控性强 |
| 图像模型 B | OpenAI GPT Image | gpt-image-1 | 画面质感好、商业感强 |
| 部署 | Vercel | - | Next.js 原生、全球 CDN、自动 CI/CD |
| 包管理 | pnpm | 9.x | 速度快、磁盘效率高 |
| 语言 | TypeScript | 5.x | 全栈类型安全 |
| 代码规范 | ESLint + Prettier | - | 统一风格 |

## 1.5 项目目录结构（Codex 必须遵守）

> **⚠️ UI 交互规范请以 `/Volumes/HX/Munch/UI-SPEC.md` 为准，本目录结构已同步更新。**

```
munch/
├── .env.local                    # 本地环境变量（不入库）
├── .env.example                  # 环境变量模板
├── next.config.ts                # Next.js 配置
├── tailwind.config.ts            # Tailwind 配置（暗色主题）
├── tsconfig.json
├── package.json
├── pnpm-lock.yaml
│
├── public/
│   ├── fonts/                    # 自定义字体（如有）
│   └── images/                   # 静态图片资源
│       ├── logo.svg
│       └── hero/                 # Hero 区展示图片
│
├── src/
│   ├── app/                      # Next.js App Router 页面
│   │   ├── layout.tsx            # 根布局（暗色主题、全局 Provider）
│   │   ├── page.tsx              # 首页 = Hero + 画廊 + 底部输入栏（即工作台）
│   │   ├── globals.css           # 全局样式 + Tailwind 指令 + CSS @property
│   │   │
│   │   ├── (auth)/               # 认证路由组
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   │
│   │   ├── (dashboard)/          # 已登录用户辅助页面
│   │   │   ├── layout.tsx        # Dashboard 布局（Top Bar + 内容区）
│   │   │   ├── history/          # 历史记录
│   │   │   │   └── page.tsx
│   │   │   └── credits/          # 积分管理
│   │   │       └── page.tsx
│   │   │
│   │   └── api/                  # API Routes
│   │       ├── auth/
│   │       │   └── callback/route.ts    # Supabase Auth 回调
│   │       ├── templates/
│   │       │   └── route.ts             # GET 模板列表
│   │       ├── generate/
│   │       │   ├── route.ts             # POST 发起出图任务
│   │       │   └── status/
│   │       │       └── route.ts         # GET SSE 进度推送
│   │       ├── credits/
│   │       │   ├── route.ts             # GET 积分余额
│   │       │   └── history/route.ts     # GET 消耗记录
│   │       ├── history/
│   │       │   └── route.ts             # GET 出图历史
│   │       └── images/
│   │           └── [id]/route.ts        # GET 图片下载
│   │
│   ├── components/               # 可复用 UI 组件
│   │   ├── ui/                   # shadcn/ui 基础组件（自动生成）
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── select.tsx
│   │   │   ├── slider.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── toast.tsx
│   │   │   └── ...
│   │   │
│   │   ├── layout/               # 布局组件
│   │   │   ├── top-bar.tsx       # 顶部状态栏（滚动隐藏/出现）
│   │   │   └── bottom-bar.tsx    # 底部输入栏（固定底部）
│   │   │
│   │   ├── hero/                 # Hero 展示区组件
│   │   │   └── hero-section.tsx  # 宽幅品牌展示区
│   │   │
│   │   ├── gallery/              # 画廊相关组件
│   │   │   ├── masonry-gallery.tsx     # 瀑布流画廊容器
│   │   │   ├── gallery-card.tsx        # 单个模板图片卡片（hover 显标题）
│   │   │   └── category-tabs.tsx       # 分类筛选标签栏（粘性定位）
│   │   │
│   │   ├── creation/             # 创作流程组件
│   │   │   ├── input-bar.tsx           # 底部输入框内部结构
│   │   │   ├── model-selector.tsx      # 模型选择器徽章
│   │   │   ├── model-panel.tsx         # 模型选择弹出面板
│   │   │   ├── video-frame-upload.tsx  # Video 模式首帧/尾帧上传
│   │   │   ├── template-detail-modal.tsx  # 模板详情弹窗（左图右文）
│   │   │   ├── variable-editor.tsx     # 变量编辑面板（居中大面板）
│   │   │   ├── variable-control.tsx    # 单个变量控件（Radio/Select）
│   │   │   ├── prompt-preview.tsx      # Prompt 实时预览
│   │   │   ├── generate-button.tsx     # 动态光效出图按钮
│   │   │   ├── progress-indicator.tsx  # 出图进度指示器
│   │   │   ├── result-display.tsx      # 结果展示（面板内）
│   │   │   └── image-lightbox.tsx      # 全屏图片预览
│   │   │
│   │   ├── shared/               # 全局共享组件
│   │   │   ├── glow-button.tsx         # 动态光效按钮（通用）
│   │   │   ├── credit-badge.tsx        # 积分余额徽章
│   │   │   └── glass-panel.tsx         # 毛玻璃面板（通用）
│   │   │
│   │   └── credits/              # 积分页面组件
│   │       └── credit-history.tsx      # 积分消耗列表
│   │
│   ├── lib/                      # 工具库与服务层
│   │   ├── supabase/
│   │   │   ├── client.ts         # 浏览器端 Supabase 客户端
│   │   │   ├── server.ts         # 服务端 Supabase 客户端
│   │   │   └── middleware.ts     # Auth 中间件
│   │   │
│   │   ├── ai/
│   │   │   ├── prompt-compiler.ts     # Prompt 重编译引擎
│   │   │   ├── model-router.ts        # 模型路由（MVP: 静态映射）
│   │   │   ├── flux-client.ts         # Flux API 封装
│   │   │   └── openai-image-client.ts # OpenAI Image API 封装
│   │   │
│   │   ├── credits.ts            # 积分计算与扣减逻辑
│   │   ├── constants.ts          # 全局常量
│   │   └── utils.ts              # 通用工具函数
│   │
│   ├── stores/                   # Zustand 状态管理
│   │   ├── auth-store.ts         # 认证状态
│   │   ├── workspace-store.ts    # 工作台状态（模板/变量/模型选择）
│   │   └── generation-store.ts   # 出图任务状态
│   │
│   ├── types/                    # TypeScript 类型定义
│   │   ├── database.ts           # 数据库表类型（Supabase 生成）
│   │   ├── template.ts           # 模板与变量类型
│   │   ├── generation.ts         # 出图任务类型
│   │   └── api.ts                # API 请求/响应类型
│   │
│   ├── data/                     # 静态数据（MVP 阶段）
│   │   └── templates/            # 模板 JSON 定义
│   │       ├── index.ts          # 模板注册表
│   │       ├── skincare-luxury.ts
│   │       ├── skincare-natural.ts
│   │       ├── fashion-editorial.ts
│   │       ├── fashion-street.ts
│   │       ├── food-overhead.ts
│   │       ├── food-lifestyle.ts
│   │       ├── product-minimal.ts
│   │       ├── product-lifestyle.ts
│   │       ├── poster-event.ts
│   │       └── poster-brand.ts
│   │
│   └── hooks/                    # 自定义 React Hooks
│       ├── use-generation.ts     # 出图流程 Hook
│       ├── use-credits.ts        # 积分相关 Hook
│       └── use-sse.ts            # SSE 连接 Hook
│
├── supabase/                     # Supabase 本地开发配置
│   ├── config.toml
│   └── migrations/               # 数据库迁移文件
│       └── 001_initial_schema.sql
│
└── inngest/                      # Inngest 函数定义
    ├── client.ts                 # Inngest 客户端
    └── functions/
        └── generate-image.ts     # 出图异步任务函数
```

## 1.6 环境变量清单

```env
# .env.example

# ── Supabase ──
NEXT_PUBLIC_SUPABASE_URL=         # Supabase 项目 URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=    # Supabase 匿名 Key（客户端用）
SUPABASE_SERVICE_ROLE_KEY=        # Supabase 服务端 Key（仅服务端）

# ── AI 模型 ──
ANTHROPIC_API_KEY=                # Claude API Key（Prompt 重编译）
OPENAI_API_KEY=                   # OpenAI API Key（GPT Image）
FLUX_API_KEY=                     # Flux Pro API Key
FLUX_API_BASE_URL=                # Flux API 端点

# ── Inngest ──
INNGEST_EVENT_KEY=                # Inngest 事件 Key
INNGEST_SIGNING_KEY=              # Inngest 签名 Key

# ── 应用配置 ──
NEXT_PUBLIC_APP_URL=https://munch.love  # 生产域名
CREDITS_EXCHANGE_RATE=100         # 1 元 = 100 积分
```

---

# 第二部分：数据库设计

## 2.1 ER 关系图

```
users (Supabase Auth 内置)
  │
  ├── 1:1 ── profiles
  │             │
  │             ├── 1:N ── credit_transactions
  │             │
  │             └── 1:N ── generations
  │                          │
  │                          └── 1:N ── generated_images
  │
  └── (模板数据为静态 JSON，不存数据库)
```

## 2.2 表结构定义（SQL Migration）

```sql
-- ============================================================
-- Migration: 001_initial_schema.sql
-- 说明：Munch MVP 全量数据库结构
-- ============================================================

-- ── 扩展 ──
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. profiles（用户画像，扩展 Supabase auth.users）
-- ============================================================
CREATE TABLE public.profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name    TEXT,
  avatar_url      TEXT,
  phone           TEXT,
  credit_balance  INTEGER NOT NULL DEFAULT 0,     -- 当前积分余额
  tier            TEXT NOT NULL DEFAULT 'free'     -- free / basic / pro
                  CHECK (tier IN ('free', 'basic', 'pro')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 新用户自动创建 profile（触发器）
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, credit_balance)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    50  -- 注册赠送 50 积分
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 2. credit_transactions（积分流水，不可变账本）
-- ============================================================
CREATE TABLE public.credit_transactions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type            TEXT NOT NULL
                  CHECK (type IN ('grant', 'purchase', 'consume', 'refund')),
  amount          INTEGER NOT NULL,               -- 正数=增加，负数=扣减
  balance_after   INTEGER NOT NULL,               -- 操作后余额（快照）
  reference_type  TEXT,                            -- 'generation' / 'admin' / 'system'
  reference_id    UUID,                            -- 关联的 generation id
  description     TEXT,                            -- 人类可读描述
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_credit_tx_user ON public.credit_transactions(user_id, created_at DESC);

-- ============================================================
-- 3. generations（出图任务）
-- ============================================================
CREATE TABLE public.generations (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- 输入参数
  template_id     TEXT NOT NULL,                   -- 模板标识符
  variables       JSONB NOT NULL DEFAULT '{}',     -- 用户选择的变量 KV
  model           TEXT NOT NULL                    -- 使用的模型标识
                  CHECK (model IN ('flux-pro', 'gpt-image')),
  image_count     INTEGER NOT NULL DEFAULT 2       -- 请求生成张数
                  CHECK (image_count BETWEEN 1 AND 4),

  -- Prompt 链路
  raw_prompt      TEXT,                            -- 模板基础 Prompt + 变量替换后
  compiled_prompt TEXT,                            -- LLM 重编译后的最终 Prompt
  negative_prompt TEXT,                            -- 负向提示词（如模型支持）

  -- 任务状态
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN (
                    'pending',      -- 已创建，等待处理
                    'compiling',    -- Prompt 重编译中
                    'generating',   -- 图像生成中
                    'completed',    -- 全部完成
                    'failed',       -- 失败
                    'cancelled'     -- 用户取消
                  )),
  error_message   TEXT,                            -- 失败时的错误信息
  credits_cost    INTEGER NOT NULL DEFAULT 0,      -- 实际消耗积分

  -- 时间戳
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at      TIMESTAMPTZ,                     -- 开始处理时间
  completed_at    TIMESTAMPTZ,                     -- 完成时间
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_gen_user_status ON public.generations(user_id, status, created_at DESC);

-- ============================================================
-- 4. generated_images（生成的图片）
-- ============================================================
CREATE TABLE public.generated_images (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  generation_id   UUID NOT NULL REFERENCES public.generations(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- 图片信息
  image_index     INTEGER NOT NULL,                -- 第几张（0-based）
  storage_path    TEXT NOT NULL,                    -- Supabase Storage 路径
  width           INTEGER,
  height          INTEGER,
  file_size       INTEGER,                         -- 字节数
  format          TEXT DEFAULT 'png',              -- png / webp / jpg

  -- 用户反馈
  is_favorited    BOOLEAN NOT NULL DEFAULT false,  -- 用户收藏

  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_genimg_generation ON public.generated_images(generation_id);
CREATE INDEX idx_genimg_user ON public.generated_images(user_id, created_at DESC);

-- ============================================================
-- 5. RLS 策略（多租户数据隔离）
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_images ENABLE ROW LEVEL SECURITY;

-- profiles: 用户只能读写自己的
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- credit_transactions: 用户只能读自己的，写入只能通过服务端
CREATE POLICY "Users can view own credit transactions"
  ON public.credit_transactions FOR SELECT
  USING (auth.uid() = user_id);

-- generations: 用户只能读写自己的
CREATE POLICY "Users can view own generations"
  ON public.generations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own generations"
  ON public.generations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- generated_images: 用户只能读自己的
CREATE POLICY "Users can view own images"
  ON public.generated_images FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own images"
  ON public.generated_images FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 6. updated_at 自动更新触发器
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.generations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- 7. Supabase Storage Bucket
-- ============================================================
-- 需要在 Supabase Dashboard 或通过 API 创建：
-- Bucket 名称: generated-images
-- 公开访问: false（通过签名 URL 访问）
-- 文件大小限制: 20MB
-- 允许的 MIME: image/png, image/jpeg, image/webp
```

## 2.3 关键数据约束与业务不变量

| # | 不变量 | 强制方式 |
|---|--------|---------|
| INV-1 | `credit_balance` 永远 >= 0 | 扣减前先检查余额，使用 `SELECT ... FOR UPDATE` 行锁 |
| INV-2 | `credit_transactions` 是追加式账本，不可删改 | RLS + 无 UPDATE/DELETE 策略 |
| INV-3 | `balance_after` = 上一条记录的 `balance_after` + 当前 `amount` | 服务端事务内计算 |
| INV-4 | `generations.status` 只能单向推进：pending→compiling→generating→completed/failed | 服务端状态机校验 |
| INV-5 | 每个 generation 的积分只扣一次 | 通过 `reference_id` 唯一约束 + 幂等检查 |
| INV-6 | 用户看不到其他用户的任何数据 | Supabase RLS |

---

# 第三部分：API 接口定义

## 3.1 接口总览

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/api/templates` | 获取模板列表 | 可选 |
| GET | `/api/templates/[id]` | 获取单个模板详情 | 可选 |
| POST | `/api/generate` | 发起出图任务 | 必须 |
| GET | `/api/generate/status?taskId=xxx` | SSE 进度推送 | 必须 |
| GET | `/api/credits` | 查询积分余额 | 必须 |
| GET | `/api/credits/history` | 积分消耗流水 | 必须 |
| GET | `/api/history` | 出图历史列表 | 必须 |
| GET | `/api/history/[id]` | 单次出图详情 | 必须 |
| GET | `/api/images/[id]` | 获取图片（签名 URL） | 必须 |
| PATCH | `/api/images/[id]/favorite` | 收藏/取消收藏 | 必须 |

## 3.2 核心接口详细定义

### 3.2.1 POST `/api/generate` — 发起出图任务

**请求体**：
```typescript
interface GenerateRequest {
  templateId: string;         // 模板 ID，如 "skincare-luxury"
  variables: Record<string, string>;  // 变量选择，如 { "lighting": "soft", "scene": "minimal-white" }
  model: "flux-pro" | "gpt-image";    // 用户选择的模型
  imageCount: 2 | 4;                   // 生成张数
}
```

**响应（成功 - 201）**：
```typescript
interface GenerateResponse {
  taskId: string;             // generation UUID，用于查询进度
  creditsCharged: number;     // 扣除的积分数
  estimatedSeconds: number;   // 预估等待秒数
}
```

**响应（失败）**：
```typescript
interface ErrorResponse {
  error: string;              // 错误码
  message: string;            // 人类可读消息
}
```

**错误码**：
| HTTP | error | 触发条件 |
|------|-------|---------|
| 400 | `INVALID_TEMPLATE` | templateId 不存在 |
| 400 | `INVALID_VARIABLES` | 变量值不在模板枚举范围内 |
| 400 | `INVALID_MODEL` | 模型标识不合法 |
| 402 | `INSUFFICIENT_CREDITS` | 积分余额不足 |
| 429 | `RATE_LIMITED` | 用户并发任务超限（最多 3 个） |
| 500 | `GENERATION_FAILED` | 服务端内部错误 |

**服务端处理流程**：
```
1. 校验请求参数（模板存在性、变量合法性、模型合法性）
2. 计算所需积分 = 模型单价 × 图片数量
3. 检查用户余额 >= 所需积分
4. 开启数据库事务：
   a. 扣减积分（SELECT FOR UPDATE + UPDATE）
   b. 写入 credit_transaction
   c. 创建 generation 记录（status = 'pending'）
   d. 提交事务
5. 发送 Inngest 事件触发异步出图
6. 返回 taskId
```

### 3.2.2 GET `/api/generate/status?taskId=xxx` — SSE 进度推送

**连接方式**：Server-Sent Events (SSE)

**事件流**：
```
event: status
data: {"status": "compiling", "message": "正在编译 Prompt..."}

event: status
data: {"status": "generating", "message": "正在生成图片...", "progress": 30}

event: status
data: {"status": "generating", "message": "正在生成图片...", "progress": 70}

event: result
data: {"status": "completed", "images": [
  {"id": "uuid", "url": "/api/images/uuid", "width": 1024, "height": 1024},
  {"id": "uuid", "url": "/api/images/uuid", "width": 1024, "height": 1024}
]}

// 或失败
event: error
data: {"status": "failed", "message": "模型服务暂时不可用，积分已退回"}
```

**超时机制**：
- SSE 连接最长保持 120 秒
- 超时后自动关闭，客户端可重连
- 重连时从数据库查询最新状态

### 3.2.3 GET `/api/credits` — 查询积分余额

**响应**：
```typescript
interface CreditsResponse {
  balance: number;            // 当前余额
  tier: "free" | "basic" | "pro";
}
```

### 3.2.4 GET `/api/history` — 出图历史

**查询参数**：
```
?page=1&pageSize=20&status=completed
```

**响应**：
```typescript
interface HistoryResponse {
  items: {
    id: string;
    templateId: string;
    templateName: string;     // 模板中文名
    model: string;
    status: string;
    imageCount: number;
    creditsCost: number;
    thumbnailUrl: string;     // 第一张图的缩略图
    createdAt: string;
  }[];
  total: number;
  page: number;
  pageSize: number;
}
```

## 3.3 积分定价表（常量配置）

```typescript
// src/lib/constants.ts

export const CREDIT_COSTS = {
  'flux-pro': {
    perImage: 5,              // 每张 5 积分
    description: 'Flux Pro 高精度生成',
  },
  'gpt-image': {
    perImage: 8,              // 每张 8 积分
    description: 'GPT Image 高质感生成',
  },
} as const;

export const TIER_LIMITS = {
  free: {
    maxConcurrentTasks: 1,    // 同时进行的任务数
    maxImagesPerTask: 2,      // 每次最多出 2 张
    availableModels: ['flux-pro'] as const,
  },
  basic: {
    maxConcurrentTasks: 2,
    maxImagesPerTask: 4,
    availableModels: ['flux-pro', 'gpt-image'] as const,
  },
  pro: {
    maxConcurrentTasks: 3,
    maxImagesPerTask: 4,
    availableModels: ['flux-pro', 'gpt-image'] as const,
  },
} as const;
```

---

# 第四部分：核心业务流程与状态机

## 4.1 出图任务状态机

```
                    用户发起请求
                        │
                        ▼
                   ┌─────────┐
                   │ pending  │
                   └────┬────┘
                        │ Inngest 拾取任务
                        ▼
                   ┌──────────┐
                   │ compiling │──────────────────┐
                   └────┬─────┘                   │
                        │ Prompt 编译成功          │ 编译失败
                        ▼                         │
                  ┌────────────┐                  │
                  │ generating │──────────┐       │
                  └─────┬──────┘          │       │
                        │ 全部图片生成成功  │ 生成失败│
                        ▼                 ▼       ▼
                  ┌───────────┐     ┌──────────┐
                  │ completed │     │  failed  │
                  └───────────┘     └──────────┘
                                         │
                                         │ 自动退回积分
                                         ▼
                                   credit_transaction
                                   (type='refund')
```

**状态转移规则（硬约束）**：
- `pending` → 只能到 `compiling` 或 `failed`
- `compiling` → 只能到 `generating` 或 `failed`
- `generating` → 只能到 `completed` 或 `failed`
- `completed` 和 `failed` 是终态，不可再变
- `cancelled` 只能从 `pending` 状态转入

## 4.2 Prompt 重编译流程（prompt-compiler.ts 核心逻辑）

```
输入：
├── template.skillPrompt      // 模板内置的 Skills 约束文本
├── template.basePrompt       // 模板基础 Prompt 模板
├── variables                 // 用户选择的变量 KV
├── targetModel               // 目标模型（影响编译风格）
└── template.negativePrompt   // 负向提示词模板（如有）

处理：
1. 变量替换：将 basePrompt 中的 {{variable_name}} 替换为用户选择值
2. 拼装上下文：skillPrompt + 替换后的 basePrompt
3. 调用 Claude API：
   - System Prompt:
     """
     你是专业的商业摄影 Prompt 工程师。
     你的任务是将用户的出图需求编译为目标 AI 图像模型的最优 Prompt。

     规则：
     1. 输出必须是英文
     2. 针对 {targetModel} 模型的 Prompt 风格优化
     3. Flux 模型：使用详细的描述性语言，强调技术参数（镜头、光线、材质）
     4. GPT Image 模型：使用更自然的描述语言，强调氛围和情感
     5. 保留用户意图的所有关键信息，不要添加用户未指定的元素
     6. 控制 Prompt 长度在 100-300 词之间
     """
   - User Prompt: 拼装好的上下文
4. 解析 Claude 响应，提取编译后的 Prompt

输出：
├── compiledPrompt            // 编译后的英文 Prompt
└── negativePrompt            // 处理后的负向提示词
```

## 4.3 积分扣减流程（事务安全）

```
                     用户请求出图
                          │
                          ▼
              ┌───────────────────────┐
              │ 计算所需积分            │
              │ cost = perImage × count│
              └───────────┬───────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │ BEGIN TRANSACTION      │
              │                       │
              │ SELECT credit_balance  │
              │ FROM profiles          │
              │ WHERE id = user_id     │
              │ FOR UPDATE             │ ◄── 行锁，防并发扣减
              │                       │
              │ IF balance < cost:     │
              │   ROLLBACK             │──→ 返回 402 余额不足
              │                       │
              │ UPDATE profiles        │
              │ SET credit_balance     │
              │   = balance - cost     │
              │                       │
              │ INSERT credit_tx       │
              │ (type='consume',       │
              │  amount=-cost,         │
              │  balance_after=新余额)  │
              │                       │
              │ INSERT generation      │
              │ (status='pending')     │
              │                       │
              │ COMMIT                 │
              └───────────────────────┘
                          │
                          ▼
                   发送 Inngest 事件
```

**失败退款流程**（在 Inngest 函数中）：
```
如果出图失败（compiling 或 generating 阶段）：
1. 更新 generation.status = 'failed'
2. BEGIN TRANSACTION
   a. SELECT credit_balance FROM profiles FOR UPDATE
   b. UPDATE profiles SET credit_balance = balance + cost
   c. INSERT credit_tx (type='refund', reference_id=generation.id)
   d. COMMIT
3. 通过 SSE 通知客户端
```

## 4.4 Inngest 异步任务定义

```typescript
// inngest/functions/generate-image.ts

// 事件定义
interface GenerateImageEvent {
  name: "app/image.generate";
  data: {
    generationId: string;
    userId: string;
    templateId: string;
    variables: Record<string, string>;
    model: "flux-pro" | "gpt-image";
    imageCount: number;
  };
}

// 函数逻辑（伪代码结构）
export const generateImage = inngest.createFunction(
  {
    id: "generate-image",
    retries: 1,                // 最多重试 1 次
    concurrency: {
      limit: 10,               // 全局并发上限
    },
  },
  { event: "app/image.generate" },
  async ({ event, step }) => {
    const { generationId, userId, templateId, variables, model, imageCount } = event.data;

    // Step 1: 编译 Prompt
    const compiled = await step.run("compile-prompt", async () => {
      // 更新状态为 compiling
      // 调用 prompt-compiler
      // 返回编译结果
    });

    // Step 2: 调用图像模型
    const images = await step.run("generate-images", async () => {
      // 更新状态为 generating
      // 根据 model 调用对应的 API
      // 返回图片数据
    });

    // Step 3: 存储图片
    await step.run("store-images", async () => {
      // 上传到 Supabase Storage
      // 写入 generated_images 表
      // 更新 generation 状态为 completed
    });
  }
);
```

---

# 第五部分：模板数据结构定义

## 5.1 模板类型定义

```typescript
// src/types/template.ts

/** 单个变量的枚举选项 */
interface VariableOption {
  value: string;              // 内部值（英文，用于 Prompt 替换）
  label: string;              // 显示名称（中文）
  description?: string;       // 选项说明（可选）
}

/** 变量定义 */
interface TemplateVariable {
  id: string;                 // 变量标识符，如 "lighting"
  name: string;               // 变量中文名，如 "光线"
  type: "select" | "slider";  // 控件类型
  required: boolean;          // 是否必选
  priority: number;           // 显示优先级（1=最高，优先展示）

  // select 类型
  options?: VariableOption[];  // 枚举选项列表
  defaultValue?: string;      // 默认选中值

  // slider 类型（V2 用到）
  min?: number;
  max?: number;
  step?: number;
  defaultNumber?: number;
  unit?: string;              // 显示单位，如 "%"
}

/** 模板定义 */
interface Template {
  id: string;                 // 唯一标识，如 "skincare-luxury"
  name: string;               // 模板名称（中文）
  description: string;        // 一句话描述
  category: TemplateCategory; // 所属分类
  tags: string[];             // 标签（搜索/过滤用）
  thumbnailUrl: string;       // 缩略图（示例效果图）

  // 出图配置
  defaultModel: "flux-pro" | "gpt-image";   // 默认推荐模型
  compatibleModels: ("flux-pro" | "gpt-image")[];  // 兼容模型列表
  defaultImageSize: { width: number; height: number };  // 默认尺寸

  // 变量定义
  variables: TemplateVariable[];

  // Prompt 相关
  skillPrompt: string;        // Skills 约束（底层，用户不可见）
  basePrompt: string;         // 基础 Prompt 模板（含 {{variable}} 占位符）
  negativePrompt?: string;    // 负向提示词（如模型支持）

  // 积分倍率（默认 1.0，高级模板可设更高）
  creditMultiplier: number;
}

type TemplateCategory =
  | "skincare"    // 护肤美妆
  | "fashion"     // 服装穿搭
  | "food"        // 食品饮品
  | "product"     // 通用产品
  | "poster";     // 海报广告
```

## 5.2 模板示例（供 Codex 参照格式）

```typescript
// src/data/templates/skincare-luxury.ts

import type { Template } from "@/types/template";

export const skincareLuxury: Template = {
  id: "skincare-luxury",
  name: "高端护肤大片",
  description: "适合高端护肤品牌的产品广告图，强调质感与光影",
  category: "skincare",
  tags: ["护肤", "高端", "产品", "广告"],
  thumbnailUrl: "/images/templates/skincare-luxury-thumb.jpg",

  defaultModel: "flux-pro",
  compatibleModels: ["flux-pro", "gpt-image"],
  defaultImageSize: { width: 1024, height: 1024 },

  variables: [
    {
      id: "lighting",
      name: "光线",
      type: "select",
      required: true,
      priority: 1,
      options: [
        { value: "soft-diffused", label: "柔光", description: "均匀柔和的漫射光" },
        { value: "morning-warm", label: "晨光暖调", description: "金色晨光氛围" },
        { value: "studio-cool", label: "专业棚拍冷白", description: "干净专业的商业灯光" },
      ],
      defaultValue: "soft-diffused",
    },
    {
      id: "scene",
      name: "场景",
      type: "select",
      required: true,
      priority: 2,
      options: [
        { value: "minimal-white", label: "极简白背景", description: "纯白或浅灰背景" },
        { value: "natural-botanical", label: "自然植物场景", description: "绿植花卉点缀" },
        { value: "luxury-bathroom", label: "高级酒店浴室", description: "大理石台面场景" },
      ],
      defaultValue: "minimal-white",
    },
    {
      id: "camera",
      name: "镜头",
      type: "select",
      required: true,
      priority: 3,
      options: [
        { value: "close-up", label: "特写", description: "产品细节放大" },
        { value: "eye-level", label: "平拍", description: "与产品平视" },
        { value: "slight-overhead", label: "微俯拍", description: "约 30° 俯角" },
      ],
      defaultValue: "eye-level",
    },
    {
      id: "mood",
      name: "氛围",
      type: "select",
      required: false,
      priority: 4,
      options: [
        { value: "cool-luxury", label: "清冷高级" },
        { value: "warm-nourishing", label: "温暖滋润" },
        { value: "pure-transparent", label: "纯净透明" },
      ],
      defaultValue: "cool-luxury",
    },
  ],

  skillPrompt: `You are generating a high-end skincare product advertisement image.
Core aesthetic principles:
- Premium, editorial-quality photography look
- Clean composition with intentional negative space
- Product must be the clear hero/focal point
- Textures should feel tactile: glass, liquid, cream surfaces
- Color palette should feel cohesive and intentional
- No text, no logos, no watermarks in the generated image
- Photorealistic rendering, not illustrated or cartoon style`,

  basePrompt: `A premium skincare product bottle photographed in a {{scene}} setting,
with {{lighting}} lighting, shot from a {{camera}} angle.
The overall mood is {{mood}}.
High-end commercial product photography, 8K resolution,
professional advertising quality, magazine editorial style.`,

  negativePrompt: "text, logo, watermark, blurry, low quality, cartoon, illustration, deformed, ugly, duplicate, error",

  creditMultiplier: 1.0,
};
```

---

# 第六部分：UI/UX 规范

## 6.1 设计系统（Design Tokens）

### 颜色系统

```typescript
// tailwind.config.ts 中的自定义颜色

const colors = {
  // ── 背景层级（从深到浅）──
  bg: {
    base: "#0f0f10",          // 最底层背景
    elevated: "#1a1a1d",      // 卡片/面板背景
    overlay: "#252528",       // 弹窗/浮层背景
    hover: "#2a2a2e",         // 悬停态背景
  },

  // ── 文字层级 ──
  text: {
    primary: "#f5f5f7",       // 主要文字（白偏暖）
    secondary: "#a1a1a6",     // 次要文字/说明
    tertiary: "#636366",      // 最弱文字/占位符
    inverse: "#0f0f10",       // 深色文字（用在亮色按钮上）
  },

  // ── 品牌色 ──
  brand: {
    DEFAULT: "#C1272D",       // 玻璃红（主强调色）
    hover: "#D43B41",         // 悬停态
    muted: "rgba(193,39,45,0.15)", // 低透明度背景用
  },

  // ── 功能色 ──
  status: {
    success: "#34C759",
    warning: "#FF9F0A",
    error: "#FF453A",
    info: "#5AC8FA",
  },

  // ── 边框与分割线 ──
  border: {
    DEFAULT: "rgba(255,255,255,0.08)",
    hover: "rgba(255,255,255,0.15)",
    active: "rgba(255,255,255,0.25)",
  },

  // ── 毛玻璃 ──
  glass: {
    bg: "rgba(255,255,255,0.05)",
    border: "rgba(255,255,255,0.1)",
  },
};
```

### 字体系统

```css
/* 全局字体栈 */
--font-sans: "Inter", "SF Pro Display", -apple-system, "PingFang SC",
             "Microsoft YaHei", sans-serif;
--font-mono: "JetBrains Mono", "SF Mono", monospace;

/* 字号层级 */
--text-xs: 0.75rem;     /* 12px - 辅助说明 */
--text-sm: 0.875rem;    /* 14px - 次要信息 */
--text-base: 1rem;      /* 16px - 正文 */
--text-lg: 1.125rem;    /* 18px - 小标题 */
--text-xl: 1.25rem;     /* 20px - 页面标题 */
--text-2xl: 1.5rem;     /* 24px - 大标题 */
--text-3xl: 2rem;       /* 32px - 首页 Hero */
```

### 间距系统

```
使用 Tailwind 默认的 4px 基准网格：
- p-1 = 4px
- p-2 = 8px（最小间距）
- p-3 = 12px
- p-4 = 16px（组件内间距）
- p-6 = 24px（区块间距）
- p-8 = 32px（模块间距）
```

### 圆角

```
- rounded-md  = 6px（按钮、输入框）
- rounded-lg  = 8px（卡片）
- rounded-xl  = 12px（弹窗、大面板）
- rounded-2xl = 16px（图片容器）
```

### 毛玻璃效果（Glassmorphism）

```css
.glass-panel {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
```

## 6.2 页面布局规范

### 桌面端布局（≥ 1024px）

```
┌──────────────────────────────────────────────────────┐
│  Header（56px 高）                                    │
│  ┌─────┬──────────────────────────────────────────┐  │
│  │Logo │  导航标签  │  ● 积分余额  │  用户头像      │  │
│  └─────┴──────────────────────────────────────────┘  │
├────────┬─────────────────────────────────────────────┤
│        │                                             │
│ 侧边栏 │              主内容区                        │
│ 200px  │                                             │
│        │                                             │
│ ├ 工作台│                                             │
│ ├ 历史  │                                             │
│ ├ 积分  │                                             │
│        │                                             │
│        │                                             │
├────────┴─────────────────────────────────────────────┤
│  底部状态条（40px 高，固定底部）                        │
│  "当前步骤: 选择模板 → 下一步: 调整变量"                │
└──────────────────────────────────────────────────────┘
```

### 移动端布局（< 768px）

```
┌──────────────────────┐
│  Header（48px）       │
│  Logo     ● 积分  ☰  │
├──────────────────────┤
│                      │
│     主内容区          │
│  （纵向堆叠布局）     │
│                      │
│                      │
│                      │
│                      │
├──────────────────────┤
│  底部导航栏（56px）   │
│  🏠 工作台  📋 历史  💰 积分│
└──────────────────────┘
```

## 6.3 工作台页面（核心页面）详细布局

### 桌面端工作台

```
┌──────────────────────────────────────────────────────────┐
│  Header                                                  │
├─────────┬────────────────────────────────────────────────┤
│ 侧边栏   │                                               │
│         │  ┌─── 左面板（40%）───┐ ┌─── 右面板（60%）───┐  │
│         │  │                   │ │                     │  │
│         │  │  [模板选择区]       │ │  [出图结果展示区]    │  │
│         │  │  网格展示           │ │                     │  │
│         │  │  2-3 列卡片         │ │  空状态:             │  │
│         │  │                   │ │  "选择模板并调整      │  │
│         │  │  ────分割线────    │ │   变量后点击出图"     │  │
│         │  │                   │ │                     │  │
│         │  │  [变量控件区]       │ │  有结果时:           │  │
│         │  │  光线: [下拉选择]   │ │  2×2 网格展示        │  │
│         │  │  场景: [下拉选择]   │ │  每张图可放大/下载   │  │
│         │  │  镜头: [下拉选择]   │ │                     │  │
│         │  │  > 更多选项(折叠)  │ │                     │  │
│         │  │                   │ │                     │  │
│         │  │  ────分割线────    │ │                     │  │
│         │  │                   │ │                     │  │
│         │  │  [模型选择]        │ │                     │  │
│         │  │  ◉ Flux Pro       │ │                     │  │
│         │  │  ○ GPT Image      │ │                     │  │
│         │  │                   │ │                     │  │
│         │  │  [出图张数] 2 | 4  │ │                     │  │
│         │  │                   │ │                     │  │
│         │  │  ┌──────────────┐ │ │                     │  │
│         │  │  │ ✨ 开始出图    │ │ │                     │  │
│         │  │  │   消耗 10 积分 │ │ │                     │  │
│         │  │  └──────────────┘ │ │                     │  │
│         │  │                   │ │                     │  │
│         │  └───────────────────┘ └─────────────────────┘  │
├─────────┴────────────────────────────────────────────────┤
│  状态条: 步骤 2/3 · 调整变量 → 点击出图                     │
└──────────────────────────────────────────────────────────┘
```

### 出图进行中状态

```
右面板变为：
┌─────────────────────────────┐
│                             │
│     ┌─────────────────┐     │
│     │                 │     │
│     │   ▓▓▓▓▓░░░░░    │     │
│     │   正在生成中...   │     │
│     │   预计还需 15 秒  │     │
│     │                 │     │
│     └─────────────────┘     │
│                             │
│   当前步骤：Prompt 编译完成   │
│   → 正在调用 Flux Pro 生成   │
│                             │
└─────────────────────────────┘
```

### 出图完成状态

```
右面板变为：
┌─────────────────────────────┐
│  本次生成 · Flux Pro · 10积分 │
│                             │
│  ┌──────────┐ ┌──────────┐  │
│  │          │ │          │  │
│  │  图片 1   │ │  图片 2   │  │
│  │          │ │          │  │
│  │  ⬇ ❤    │ │  ⬇ ❤    │  │
│  └──────────┘ └──────────┘  │
│                             │
│  ┌────────────────────────┐ │
│  │ > 查看编译后的 Prompt    │ │  ◄── 可展开
│  └────────────────────────┘ │
│                             │
│  [🔄 换模型重出] [⟲ 调参重出]│
│                             │
└─────────────────────────────┘
```

## 6.4 动效规范

| 场景 | 动效 | 参数 |
|------|------|------|
| 页面切换 | 淡入 | `duration: 200ms, ease: ease-out` |
| 卡片悬停 | 上移 + 阴影 | `translateY(-2px), duration: 150ms` |
| 按钮点击 | 缩放 | `scale(0.98), duration: 100ms` |
| 弹窗打开 | 缩放 + 淡入 | `scale(0.95→1) + opacity(0→1), duration: 200ms` |
| 进度条 | 线性填充 | `width 动画, ease: linear` |
| 骨架屏 | 闪烁 | `opacity 0.5↔1, duration: 1.5s, infinite` |
| 图片加载完成 | 淡入 | `opacity(0→1), duration: 300ms` |

**硬约束**：不做工作流连线动效（V2 考虑），MVP 阶段保持交互简洁。

---

# 第七部分：错误处理与边界条件

## 7.1 前端错误处理策略

| 场景 | 处理方式 | 用户可见反馈 |
|------|---------|------------|
| 网络断开 | SWR 自动重试（3 次） | Toast: "网络连接异常，正在重试..." |
| API 返回 401 | 清除本地 token，跳转登录页 | Toast: "登录已过期，请重新登录" |
| API 返回 402 | 显示积分不足弹窗 | Dialog: "积分不足，需要 X 积分，当前余额 Y" |
| API 返回 429 | 禁用出图按钮，倒计时 | Button 禁用: "请等待当前任务完成" |
| API 返回 500 | 显示通用错误 | Toast: "服务暂时不可用，请稍后重试" |
| SSE 断开 | 自动重连（最多 3 次） | 进度条变为 "连接中断，正在重连..." |
| SSE 超时（120s） | 轮询 API 查询最终状态 | 进度条变为 "生成时间较长，请耐心等待" |
| 出图失败 | 显示失败原因 + 积分已退回 | Toast: "生成失败，X 积分已退回" |
| 图片加载失败 | 显示占位符 + 重试按钮 | 图片位置显示 "加载失败，点击重试" |
| 重复点击出图 | 按钮 debounce + 禁用 | 按钮变灰，显示 loading 状态 |

## 7.2 后端错误处理策略

| 场景 | 处理方式 |
|------|---------|
| Claude API 超时 | 重试 1 次，仍失败则标记 generation 为 failed + 退款 |
| 图像模型 API 超时 | 重试 1 次，仍失败则退款 |
| 图像模型返回空结果 | 标记失败 + 退款 + 记录日志 |
| Supabase Storage 上传失败 | 重试 2 次，仍失败则退款 |
| 积分扣减并发冲突 | SELECT FOR UPDATE 行锁防止 |
| 重复的 Inngest 事件 | 通过 generation.status 幂等判断，非 pending 状态直接跳过 |

## 7.3 安全约束

| 约束 | 实施方式 |
|------|---------|
| API 认证 | 所有非公开接口校验 Supabase JWT |
| 数据隔离 | RLS 策略 + 服务端二次校验 user_id |
| 请求限流 | 按用户 ID 限制：10 次/分钟（生成接口） |
| 输入校验 | 变量值必须在模板枚举范围内，拒绝任意输入 |
| Prompt 注入防护 | 变量值经过清洗，剔除 Prompt 注入尝试 |
| 文件类型校验 | Storage 只接受 image/png、image/jpeg、image/webp |
| 环境变量 | 所有 API Key 仅在服务端使用，不暴露给客户端 |

---

# 第八部分：部署与上线

## 8.1 部署架构

```
GitHub Repository
       │
       │ push to main
       ▼
┌──────────────┐     ┌──────────────┐
│   Vercel      │────▶│  Supabase    │
│  (Next.js)    │     │  (DB/Auth/   │
│               │     │   Storage)   │
│  自动 CI/CD   │     │              │
│  全球 CDN     │     │  托管 PostgreSQL│
│  Edge Runtime │     │  文件存储     │
└──────────────┘     └──────────────┘
       │
       │ Inngest webhook
       ▼
┌──────────────┐
│   Inngest     │
│  (异步任务)    │
│  Serverless   │
└──────────────┘
```

## 8.2 监控与可观测性（MVP 最小集）

| 监控项 | 工具 | 说明 |
|--------|------|------|
| 应用错误 | Vercel Analytics（免费） | 前端错误、API 错误 |
| API 响应时间 | Vercel 内置 | 各接口 P50/P95/P99 |
| 数据库查询 | Supabase Dashboard | 慢查询、连接数 |
| 异步任务 | Inngest Dashboard | 任务成功率、执行时间 |
| 日志 | `console.error` + Vercel Logs | MVP 阶段够用 |

## 8.3 上线检查清单

```
Pre-launch:
□ 所有环境变量已在 Vercel 配置
□ Supabase RLS 策略已开启且测试通过
□ 数据库 migration 已在生产环境执行
□ Supabase Storage bucket 已创建且权限正确
□ Inngest 已连接且函数已部署
□ 域名已绑定且 SSL 生效
□ 注册流程端到端测试通过
□ 出图流程端到端测试通过（Flux + GPT Image 各一次）
□ 积分扣减与退款逻辑测试通过
□ 移动端基本可用（能浏览、能看结果）
□ 错误处理路径手动验证（断网/超时/余额不足）

Post-launch 24h:
□ 监控 Vercel 错误率
□ 检查 Inngest 任务成功率
□ 检查 Supabase 连接数和查询延迟
□ 确认无异常积分消耗
```

---

# 第九部分：Codex 协作指令与任务拆分

## 9.1 Codex 工作规范

```
【给 Codex 的规则】

1. 严格按照 PRD 的目录结构创建文件，不得自行新增目录层级
2. 使用 TypeScript 严格模式，不使用 any 类型
3. 所有组件使用函数式组件 + Hooks
4. 样式只用 Tailwind CSS 类名，不写自定义 CSS（globals.css 中的设计 token 除外）
5. shadcn/ui 组件通过 CLI 安装，不手动复制
6. 所有 API 路由必须校验认证状态
7. 数据库操作使用 Supabase JS Client，不写裸 SQL（migration 除外）
8. 异步操作必须有 loading/error/success 三态处理
9. 不做过度抽象，保持代码直白
10. 每个文件不超过 300 行，超过则拆分
```

## 9.2 开发任务拆分（按执行顺序）

### Sprint 1：基础框架（Day 1-2）

| # | 任务 | 输出文件 | 验收标准 |
|---|------|---------|---------|
| 1.1 | 初始化 Next.js 15 项目 + TypeScript + pnpm | `package.json`, `next.config.ts`, `tsconfig.json` | `pnpm dev` 能跑起来 |
| 1.2 | 配置 Tailwind CSS 4 + 暗色主题 token | `tailwind.config.ts`, `globals.css` | 页面背景为 #0f0f10 |
| 1.3 | 安装 shadcn/ui + 配置基础组件 | `components/ui/*` | Button/Card/Select/Dialog/Toast 可用 |
| 1.4 | 配置 Supabase 客户端 | `lib/supabase/client.ts`, `server.ts`, `middleware.ts` | 能连接 Supabase |
| 1.5 | 根布局 + 全局 Provider | `app/layout.tsx` | 暗色主题生效，字体加载 |
| 1.6 | 环境变量模板 | `.env.example` | 所有必要变量已列出 |

### Sprint 2：认证与布局（Day 3-4）

| # | 任务 | 输出文件 | 验收标准 |
|---|------|---------|---------|
| 2.1 | 登录页面 | `app/(auth)/login/page.tsx` | 邮箱登录可用 |
| 2.2 | 注册页面 | `app/(auth)/register/page.tsx` | 注册后自动跳转工作台 |
| 2.3 | Auth 回调处理 | `app/api/auth/callback/route.ts` | OAuth 回调正常 |
| 2.4 | Auth 中间件（保护路由） | `middleware.ts` | 未登录访问 dashboard 被重定向 |
| 2.5 | Dashboard 布局（Header + Sidebar） | `app/(dashboard)/layout.tsx`, `components/layout/*` | 侧边栏导航、积分徽章显示 |
| 2.6 | Auth Store | `stores/auth-store.ts` | 登录状态全局可用 |

### Sprint 3：模板系统（Day 5-7）

| # | 任务 | 输出文件 | 验收标准 |
|---|------|---------|---------|
| 3.1 | 模板类型定义 | `types/template.ts` | 类型完整，无 any |
| 3.2 | 编写 10 个模板数据文件 | `data/templates/*.ts` | 每个模板有完整的变量枚举和 Prompt |
| 3.3 | 模板 API | `app/api/templates/route.ts` | 返回模板列表，支持分类过滤 |
| 3.4 | 模板网格组件 | `components/template/template-grid.tsx` | 响应式网格，卡片悬停效果 |
| 3.5 | 模板卡片组件 | `components/template/template-card.tsx` | 缩略图 + 名称 + 描述 + 标签 |
| 3.6 | 模板预览弹窗 | `components/template/template-preview.tsx` | 示例图 + 变量列表 + 选择按钮 |

### Sprint 4：工作台核心（Day 8-12）

| # | 任务 | 输出文件 | 验收标准 |
|---|------|---------|---------|
| 4.1 | 工作台页面框架 | `app/(dashboard)/workspace/page.tsx` | 左右分栏布局 |
| 4.2 | Workspace Store | `stores/workspace-store.ts` | 管理模板/变量/模型选择状态 |
| 4.3 | 变量控件面板 | `components/workspace/variable-panel.tsx` | 根据模板动态渲染变量控件 |
| 4.4 | 单个变量控件 | `components/workspace/variable-control.tsx` | Select/Slider 两种类型 |
| 4.5 | 模型选择器 | `components/workspace/model-selector.tsx` | Radio 选择，显示积分消耗 |
| 4.6 | 出图按钮 | `components/workspace/generate-button.tsx` | 显示消耗积分，余额不足时禁用 |

### Sprint 5：出图引擎（Day 13-17）

| # | 任务 | 输出文件 | 验收标准 |
|---|------|---------|---------|
| 5.1 | Prompt 重编译引擎 | `lib/ai/prompt-compiler.ts` | 输入模板+变量→输出编译后 Prompt |
| 5.2 | Flux API 客户端 | `lib/ai/flux-client.ts` | 能调用 Flux Pro 生成图片 |
| 5.3 | OpenAI Image 客户端 | `lib/ai/openai-image-client.ts` | 能调用 GPT Image 生成图片 |
| 5.4 | 模型路由 | `lib/ai/model-router.ts` | 根据 model 参数分发到对应客户端 |
| 5.5 | 积分扣减逻辑 | `lib/credits.ts` | 事务安全、幂等、退款 |
| 5.6 | 出图 API 入口 | `app/api/generate/route.ts` | 参数校验→积分扣减→触发 Inngest |
| 5.7 | Inngest 异步任务 | `inngest/functions/generate-image.ts` | 编译→生成→存储→更新状态 |
| 5.8 | SSE 进度推送 | `app/api/generate/status/route.ts` | 实时推送任务进度 |
| 5.9 | 数据库 Migration | `supabase/migrations/001_initial_schema.sql` | 全部表和 RLS 就绪 |

### Sprint 6：结果展示与历史（Day 18-21）

| # | 任务 | 输出文件 | 验收标准 |
|---|------|---------|---------|
| 6.1 | Generation Store | `stores/generation-store.ts` | 管理出图任务状态 |
| 6.2 | SSE Hook | `hooks/use-sse.ts` | 自动连接/重连/解析事件 |
| 6.3 | 出图进度指示器 | `components/workspace/progress-indicator.tsx` | 进度条 + 步骤文字 |
| 6.4 | 结果画廊 | `components/workspace/result-gallery.tsx` | 2×2 网格 + 放大查看 |
| 6.5 | 结果操作（下载/收藏/重出） | `components/workspace/result-actions.tsx` | 下载原图、收藏、换模型 |
| 6.6 | Prompt 预览（可折叠） | `components/workspace/prompt-preview.tsx` | 展示编译后的 Prompt |
| 6.7 | 历史记录页面 | `app/(dashboard)/history/page.tsx` | 分页列表 + 缩略图 |
| 6.8 | 历史记录 API | `app/api/history/route.ts` | 分页查询 + 状态过滤 |

### Sprint 7：积分与收尾（Day 22-25）

| # | 任务 | 输出文件 | 验收标准 |
|---|------|---------|---------|
| 7.1 | 积分余额 API | `app/api/credits/route.ts` | 返回余额和等级 |
| 7.2 | 积分流水 API | `app/api/credits/history/route.ts` | 分页返回流水 |
| 7.3 | 积分管理页面 | `app/(dashboard)/credits/page.tsx` | 余额 + 流水列表 |
| 7.4 | 图片下载 API | `app/api/images/[id]/route.ts` | 返回签名 URL |
| 7.5 | 首页（Landing） | `app/page.tsx` | 产品介绍 + 模板预览 + CTA |
| 7.6 | 移动端适配 | 各组件 responsive 类名 | 手机端布局正常 |
| 7.7 | 错误处理统一 | 全局 Error Boundary + Toast | 所有异常有用户反馈 |
| 7.8 | 部署到 Vercel | - | 生产环境可访问 |

### Sprint 8：测试与修复（Day 26-28）

| # | 任务 | 验收标准 |
|---|------|---------|
| 8.1 | 端到端测试：注册→选模板→出图→下载 | 完整链路无报错 |
| 8.2 | 积分边界测试：余额为 0 时出图 | 正确拦截 + 提示 |
| 8.3 | 并发测试：同时发起 3 个出图任务 | 积分不会多扣 |
| 8.4 | 失败测试：模拟 API 超时 | 正确退款 + 显示失败 |
| 8.5 | 移动端测试 | 基本可用 |
| 8.6 | Bug 修复与优化 | - |

---

# 第十部分：首批 10 个模板清单

| # | ID | 名称 | 分类 | 默认模型 | 变量数 |
|---|---|------|------|---------|-------|
| 1 | `skincare-luxury` | 高端护肤大片 | skincare | flux-pro | 4 |
| 2 | `skincare-natural` | 天然有机护肤 | skincare | gpt-image | 4 |
| 3 | `fashion-editorial` | 时尚杂志大片 | fashion | flux-pro | 4 |
| 4 | `fashion-street` | 街头潮流穿搭 | fashion | gpt-image | 3 |
| 5 | `food-overhead` | 美食俯拍 | food | flux-pro | 4 |
| 6 | `food-lifestyle` | 美食生活方式 | food | gpt-image | 3 |
| 7 | `product-minimal` | 极简产品照 | product | flux-pro | 3 |
| 8 | `product-lifestyle` | 产品场景图 | product | gpt-image | 4 |
| 9 | `poster-event` | 活动海报 | poster | gpt-image | 4 |
| 10 | `poster-brand` | 品牌形象海报 | poster | flux-pro | 4 |

每个模板必须包含：
- 至少 3 个变量（光线/场景/镜头是标配）
- 完整的 skillPrompt（英文，100-200 词）
- 完整的 basePrompt（英文，含 {{变量}} 占位符）
- negativePrompt（通用负向提示词）
- 1 张示例缩略图（可先用 AI 生成占位）

---

# 附录 A：术语表

| 术语 | 定义 |
|------|------|
| Skills 包 | 内置在模板中的审美约束文本，控制出图风格边界 |
| Prompt 重编译 | 用 LLM 将模板 Prompt + 用户变量合成为目标模型的最优 Prompt |
| 模型路由 | 根据用户选择或系统推荐，将生成请求分发到对应的图像模型 API |
| 变量枚举 | 每个模板预定义的变量可选值范围，限制用户选择在风格边界内 |
| 积分 | 平台统一计量单位，不同模型消耗不同积分 |
| Generation | 一次出图任务，包含多张生成图片 |

# 附录 B：风险登记表

| # | 风险 | 概率 | 影响 | 缓解措施 |
|---|------|------|------|---------|
| R1 | Flux API 不稳定/下线 | 中 | 高 | 模型路由层抽象，可快速切换 |
| R2 | OpenAI API 价格上涨 | 中 | 中 | 积分定价留出利润空间，可动态调整 |
| R3 | 出图质量不满足商业要求 | 高 | 高 | 模板 Prompt 持续优化，收集用户反馈 |
| R4 | 模板冷启动无吸引力 | 高 | 高 | 优先做 2-3 个高质量模板，用真实效果展示 |
| R5 | Prompt 注入攻击 | 低 | 中 | 变量值白名单校验 + 清洗 |
| R6 | 积分系统并发 bug | 低 | 高 | 数据库行锁 + 事务 + 幂等校验 |

---

**文档版本**: v1.0
**最后更新**: 2026-03-07
**作者**: Munch 架构组
**状态**: 待评审
