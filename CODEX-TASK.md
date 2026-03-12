# Codex 执行指令：UI 全面重构
# 2026-03-07

---

## 你是谁

你是 Munch 项目的执行开发者。你的任务是根据两份权威文档重构当前 UI：

- **`PRD.md`** — 业务逻辑、数据库、API、模板、状态机（不变）
- **`UI-SPEC.md`** — UI 交互规范 v2.0（**新的，本次重构的核心依据**）

两份文档冲突时，**UI-SPEC.md 优先**。

---

## 当前代码状态

项目已有 92 个文件，基于旧版 PRD 搭建。以下是旧版 vs 新版的核心差异：

| 维度 | 旧版（当前代码） | 新版（UI-SPEC.md） |
|------|-----------------|-------------------|
| 主题 | 亮色 + 暗色双主题切换 | **纯暗色主题**，背景 #0f0f10，无亮色模式 |
| 首页 | Landing 页 + 跳转到 /workspace | **首页即工作台**：Hero + 瀑布流画廊 + 底部输入栏 |
| 导航 | 侧边栏 sidebar + 固定 header | **无侧边栏**，Top Bar 滚动隐藏/出现 |
| 模板展示 | Grid 网格，3列，带文字 | **Masonry 瀑布流**，自然比例，无文字（hover 才显示标题） |
| 出图入口 | /workspace 独立页面，左右分栏 | **底部固定输入栏** + 弹出式模型选择面板 |
| 模板交互 | 点击选择，变量在左面板 | 点击→**居中弹窗**（左图右文）→**变量编辑浮层面板** |
| 按钮样式 | 普通 shadcn Button | **动态光效按钮**（conic-gradient 旋转边框光晕） |
| 视频模式 | 无 | **底部输入栏**切换 Video 模式，显示首帧/尾帧上传 |

---

## 执行计划（按顺序）

### Phase 1: 主题系统重置

**目标**：砍掉亮色主题，全部改为纯暗色。

1. **修改** `src/app/globals.css`：
   - 删除 `:root[data-theme="light"]` 的全部变量
   - 将 `:root` 默认变量改为暗色值（参考 UI-SPEC.md §9）：
     ```
     --bg-base: #0f0f10
     --bg-elevated: #1a1a1d
     --bg-overlay: #252528
     --bg-hover: #2a2a2e
     --text-primary: #f5f5f7
     --text-secondary: #a1a1a6
     --text-tertiary: #636366
     --brand: #C1272D
     --brand-hover: #D43B41
     --brand-muted: rgba(193,39,45,0.15)
     --border-default: rgba(255,255,255,0.08)
     --border-hover: rgba(255,255,255,0.15)
     --glass-bg: rgba(255,255,255,0.05)
     --glass-border: rgba(255,255,255,0.1)
     ```
   - 删除 `hero-grid` 网格线背景
   - 修改 `body` 背景为纯色 `#0f0f10`
   - 新增 CSS `@property --glow-angle` 用于光效按钮（见 UI-SPEC.md §8）
   - 新增 `.glass-panel` 更新为 `rgba(255,255,255,0.05)` + `backdrop-filter: blur(20px)`
   - 新增渐变 token（hero 渐变、底部栏渐变、卡片 hover 渐变）

2. **修改** `src/app/layout.tsx`：
   - `<html>` 的 `className` 改为 `"dark"`，删除 `data-theme="light"`
   - 删除 `suppressHydrationWarning`（不再需要主题切换）

3. **删除** `src/components/layout/theme-provider.tsx`（不再需要）
4. **删除** `src/components/layout/theme-toggle.tsx`（不再需要）
5. 在 `layout.tsx` 中删除 `<ThemeProvider>` 包裹，直接渲染 children

### Phase 2: 布局组件重构

**目标**：删除旧布局，创建新布局组件。

1. **删除以下文件**（旧版布局，不再需要）：
   - `src/components/layout/sidebar.tsx`
   - `src/components/layout/mobile-nav.tsx`
   - `src/components/layout/status-bar.tsx`
   - `src/components/layout/header.tsx`（将被 top-bar.tsx 替代）

2. **创建** `src/components/layout/top-bar.tsx`：
   - 参照 UI-SPEC.md §2 完整规范
   - 固定顶部，高度 56px
   - 背景：`rgba(15,15,16,0.8)` + `backdrop-filter: blur(20px)`
   - 内含：Logo（左）、导航标签"历史/积分"（左）、积分徽章（右）、用户头像（右）
   - **滚动隐藏/出现**：监听 scroll 方向
     - 向下滚动 > 30px → `translateY(-100%)` 隐藏
     - 向上滚动 → `translateY(0)` 出现
     - 页面顶部 → 始终可见
     - 动画：`transition: transform 0.3s ease`
   - 使用 `useEffect` + `useRef(prevScrollY)` + throttle 16ms

3. **创建** `src/components/layout/bottom-bar.tsx`：
   - 参照 UI-SPEC.md §5 完整规范
   - `position: fixed; bottom: 0; z-index: 50`
   - 内容容器居中 `max-width: 720px`
   - 背景：`rgba(30,30,33,0.95)` + `backdrop-filter: blur(20px)`
   - 上方有向上渐变阴影（让画廊内容淡出）
   - 组合以下子组件：`input-bar.tsx` + `model-selector.tsx`

### Phase 3: 首页重构（核心）

**目标**：首页 = Hero + 画廊 + 底部输入栏。

1. **重写** `src/app/page.tsx`：
   ```
   结构：
   <TopBar />
   <main>
     <HeroSection />
     <CategoryTabs />      <!-- 粘性分类标签 -->
     <MasonryGallery />    <!-- 瀑布流画廊 -->
   </main>
   <BottomBar />
   <TemplateDetailModal /> <!-- 模板详情弹窗（条件渲染） -->
   <VariableEditor />      <!-- 变量编辑面板（条件渲染） -->
   ```

2. **创建** `src/components/hero/hero-section.tsx`：
   - 参照 UI-SPEC.md §3
   - 全宽，高度 400px 桌面 / 280px 手机
   - 背景：大图 + 渐变遮罩（底部过渡到 #0f0f10）
   - 文字居中：产品名 "MUNCH"（48px, 字间距 0.3em）、副标题、三个能力标签
   - CTA 按钮"开始创作"（使用 GlowButton）：点击平滑滚动到画廊

3. **创建** `src/components/gallery/masonry-gallery.tsx`：
   - 参照 UI-SPEC.md §4.1
   - **使用 CSS Columns 实现**（不用 Grid）：
     - `columns: 4`（桌面）→ `columns: 3`（平板）→ `columns: 2`（手机）
     - `gap: 6px`
   - 遍历 templates 数组，渲染 `<GalleryCard />`
   - 首屏 eager loading，其余 `loading="lazy"`

4. **创建** `src/components/gallery/gallery-card.tsx`：
   - 参照 UI-SPEC.md §4.2 - §4.3
   - 图片保持原始比例：`width: 100%; height: auto`
   - `break-inside: avoid; margin-bottom: 6px`
   - `border-radius: 4px; overflow: hidden`
   - **默认**：只显示图片，无文字
   - **Hover**（200ms 过渡）：
     - 图片 `scale(1.02)`
     - 底部渐变遮罩出现（`from-black/70 via-transparent to-transparent`）
     - 遮罩内左下角显示模板名称（白色，14px）
   - **点击**：`scale(0.98)` 100ms → 打开 TemplateDetailModal

5. **创建** `src/components/gallery/category-tabs.tsx`：
   - 参照 UI-SPEC.md §4.4
   - 粘性定位：`position: sticky; top: 0`（Top Bar 隐藏时）
   - 标签列表：全部 / 护肤美妆 / 服装穿搭 / 食品饮品 / 通用产品 / 海报广告
   - 选中态：白色文字 + brand 色下划线
   - 点击过滤画廊（前端过滤）

### Phase 4: 底部输入栏 + 模型选择面板

**目标**：核心操作区。

1. **创建** `src/components/creation/input-bar.tsx`：
   - 参照 UI-SPEC.md §5.2
   - 内含：`+` 按钮（左）、文本输入框（中，flex-grow）、模型选择徽章（右）、发送按钮（最右）
   - Placeholder 文案随状态变化（参照 UI-SPEC.md §10 文案表）
   - 发送按钮：圆形 36px，brand 色，光效按钮

2. **创建** `src/components/creation/model-selector.tsx`（重写旧版）：
   - 参照 UI-SPEC.md §5.2 的模型选择器徽章
   - 显示：模型图标 + 名称 + 出图类型 + 张数
   - 点击弹出 `<ModelPanel />`

3. **创建** `src/components/creation/model-panel.tsx`：
   - 参照 UI-SPEC.md §5.3 - §5.4 完整规范
   - 从底部输入栏**向上弹出**（`translateY(100%) → translateY(0)`，250ms）
   - 6 行内容：
     - 第 1 行：Image | Video toggle
     - 第 2 行：横向 | 纵向 toggle
     - 第 3 行：比例选择（根据方向动态变化）
     - 第 4 行：x1 | x2 | x3 | x4 张数
     - 第 5 行：模型下拉（Flux Pro / GPT Image）
     - 第 6 行：积分消耗实时计算
   - 点击面板外区域关闭

4. **创建** `src/components/creation/video-frame-upload.tsx`：
   - 参照 UI-SPEC.md §5.5
   - Video 模式时输入栏内出现：首帧上传区 + ⇄ 图标 + 尾帧上传区
   - 上传区：56×56px，虚线边框，+ 图标
   - 首帧必填，尾帧可选

### Phase 5: 模板详情弹窗 + 变量编辑面板

**目标**：点击模板后的创作流程。

1. **创建** `src/components/creation/template-detail-modal.tsx`：
   - 参照 UI-SPEC.md §6 完整规范
   - 遮罩：`rgba(0,0,0,0.7)` + `backdrop-filter: blur(8px)`
   - 弹窗居中：`max-width: 900px; max-height: 80vh`
   - 左右分栏：左 45% 模板示例图 / 右 55% 信息
   - 右侧包含：模板名称、描述、提示词预览（中文意译）、可调变量标签、CTA 按钮
   - CTA "使用此模板创作"（GlowButton）→ 打开 VariableEditor
   - 移动端：底部 sheet 模式（上图下文）

2. **创建** `src/components/creation/variable-editor.tsx`（重写旧版 variable-panel）：
   - 参照 UI-SPEC.md §7 完整规范
   - 非满幅居中面板：`max-width: 1000px`，背后仍可见模糊画廊
   - 左侧 55%：变量编辑（Radio Group / Select）+ 参考图上传
   - 右侧 45%：Prompt 实时预览 + 模型选择 + 张数 + 积分 + 生成按钮
   - 生成完成后：右侧变为结果展示（图片 + 下载/收藏/重出）
   - 必选变量直接展示，可选变量折叠

3. **保留并适配**的旧组件：
   - `variable-control.tsx` → 调整样式适配暗色主题
   - `prompt-preview.tsx` → 移入 variable-editor 右侧
   - `progress-indicator.tsx` → 移入 variable-editor 右侧
   - `result-gallery.tsx` → 重构为 `result-display.tsx`，在面板内展示

### Phase 6: 全局光效按钮

**目标**：品牌差异化按钮效果。

1. **创建** `src/components/shared/glow-button.tsx`：
   - 参照 UI-SPEC.md §8 完整规范
   - 使用 CSS `@property --glow-angle` + `conic-gradient` + `animation: rotate-gradient 3s linear infinite`
   - 外层 padding 1px（边框宽度），conic-gradient 做背景
   - 内层实色 brand 背景，覆盖中心
   - 4 种状态：Normal / Hover（光晕增强）/ Active（scale 0.98 + 加速旋转）/ Disabled（停转+半透明）/ Loading（脉冲）
   - 4 种尺寸：Large (48px) / Medium (40px) / Small (32px) / Icon (36px 圆形)
   - **所有 CTA 按钮都使用此组件**

2. **创建** `src/components/shared/glass-panel.tsx`：
   - 通用毛玻璃面板容器
   - Props: `blur`, `opacity`, `border`, `className`

### Phase 7: Store 更新

1. **修改** `src/stores/workspace-store.ts`：
   - 新增状态：
     ```ts
     // 创作模式
     creationMode: 'image' | 'video'
     // 方向
     orientation: 'landscape' | 'portrait'
     // 比例
     aspectRatio: string  // '1:1', '4:3', '16:9', etc.
     // 当前展示的弹窗
     activeModal: null | 'template-detail' | 'variable-editor'
     // 当前查看的模板 ID
     viewingTemplateId: string | null
     // 分类筛选
     activeCategoryFilter: string | null  // null = 全部
     // Video 模式的帧
     startFrame: File | null
     endFrame: File | null
     ```
   - 新增 actions：`setCreationMode`, `setOrientation`, `setAspectRatio`, `openTemplateDetail`, `openVariableEditor`, `closeModal`, `setStartFrame`, `setEndFrame`, `setCategoryFilter`

### Phase 8: 路由清理

1. **删除** `src/app/(dashboard)/workspace/page.tsx`（工作台已合并到首页）
2. **修改** `src/app/(dashboard)/layout.tsx`：删除侧边栏引用，只保留 TopBar + 内容区（用于 /history 和 /credits）
3. 确保 `/history` 和 `/credits` 页面正常渲染

### Phase 9: 收尾

1. 删除所有不再使用的旧组件文件
2. 确保 `pnpm build` 无报错
3. 确保 `pnpm lint` 无报错
4. 确保所有页面响应式正常（桌面/平板/手机三个断点检查）

---

## 硬约束（必须遵守）

1. **纯暗色主题**，背景 `#0f0f10`，没有亮色模式切换，没有 `data-theme` 切换
2. **不改 API 路由**（`/api/*` 全部保持不变）
3. **不改数据库 schema**
4. **不改 lib 层**（`lib/ai/*`, `lib/credits.ts`, `lib/supabase/*` 等保持不变）
5. **不改 stores 的已有逻辑**，只新增字段和 actions
6. **不改模板数据文件**（`data/templates/*.ts` 保持不变）
7. 所有组件使用 TypeScript 严格模式，不使用 `any`
8. 样式只用 Tailwind CSS 类名 + globals.css 中的 CSS 变量
9. 每个文件不超过 300 行
10. 先保证 build 通过，再做视觉细节优化

---

## 验收标准

| # | 检查项 | 通过标准 |
|---|--------|---------|
| 1 | `pnpm build` | 零报错 |
| 2 | 首页加载 | 显示 Hero + 瀑布流画廊 + 底部输入栏 |
| 3 | Top Bar 滚动 | 向下滚隐藏，向上滚出现 |
| 4 | 画廊 Masonry | 4列(桌面)/3列(平板)/2列(手机)，图片原始比例 |
| 5 | 画廊 Hover | 只有 hover 时显示标题 + 渐变遮罩 |
| 6 | 模板点击 | 居中弹窗，左图右文 |
| 7 | "使用此模板" | 打开变量编辑面板 |
| 8 | 底部输入栏 | 固定底部，模型徽章可点击 |
| 9 | 模型面板 | 从底部弹出，6 行完整 |
| 10 | Video 模式 | 切换后输入栏显示首帧/尾帧上传 |
| 11 | 光效按钮 | 所有 CTA 按钮有旋转光晕 |
| 12 | 暗色主题 | 全局 #0f0f10 背景，无亮色残留 |
| 13 | /history 页 | 正常访问渲染 |
| 14 | /credits 页 | 正常访问渲染 |
| 15 | 移动端 | 基本可用，无溢出 |

---

## 文件操作速查

### 要删除的文件：
```
src/components/layout/theme-provider.tsx
src/components/layout/theme-toggle.tsx
src/components/layout/sidebar.tsx
src/components/layout/mobile-nav.tsx
src/components/layout/status-bar.tsx
src/components/layout/header.tsx
src/app/(dashboard)/workspace/page.tsx
src/components/workspace/image-count-selector.tsx  （功能移入 model-panel）
src/components/template/template-grid.tsx          （被 masonry-gallery 替代）
src/components/template/template-card.tsx          （被 gallery-card 替代）
src/components/template/template-preview.tsx       （被 template-detail-modal 替代）
src/components/workspace/result-card.tsx           （合并到 result-display）
src/components/workspace/result-actions.tsx        （合并到 result-display）
src/components/workspace/result-gallery.tsx        （合并到 result-display）
src/components/workspace/model-selector.tsx        （被 creation/model-selector 替代）
src/components/workspace/generate-button.tsx       （被 glow-button 替代）
```

### 要创建的文件：
```
src/components/layout/top-bar.tsx
src/components/layout/bottom-bar.tsx
src/components/hero/hero-section.tsx
src/components/gallery/masonry-gallery.tsx
src/components/gallery/gallery-card.tsx
src/components/gallery/category-tabs.tsx
src/components/creation/input-bar.tsx
src/components/creation/model-selector.tsx
src/components/creation/model-panel.tsx
src/components/creation/video-frame-upload.tsx
src/components/creation/template-detail-modal.tsx
src/components/creation/variable-editor.tsx
src/components/creation/result-display.tsx
src/components/creation/image-lightbox.tsx
src/components/shared/glow-button.tsx
src/components/shared/glass-panel.tsx
```

### 要修改的文件：
```
src/app/globals.css             （主题重置）
src/app/layout.tsx              （删除 ThemeProvider，暗色固定）
src/app/page.tsx                （完全重写）
src/app/(dashboard)/layout.tsx  （删除侧边栏，用 TopBar）
src/stores/workspace-store.ts   （新增状态字段）
src/components/workspace/variable-panel.tsx    → 移入 variable-editor
src/components/workspace/variable-control.tsx  → 暗色适配
src/components/workspace/prompt-preview.tsx    → 移入 variable-editor
src/components/workspace/progress-indicator.tsx → 暗色适配
src/components/credits/credit-badge.tsx        → 暗色适配
```

---

**开始执行。按 Phase 1 → 9 的顺序推进。每完成一个 Phase 确保 `pnpm build` 通过后再进入下一个。**
