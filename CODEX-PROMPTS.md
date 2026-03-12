# Codex 任务 Prompt 集
# 每次只喂一个任务给 Codex，完成后 build 通过再喂下一个
# 2026-03-07

---

## 任务 1/5：创建 GlowButton + GlassPanel 共享组件

你在 `/Volumes/HX/Munch` 项目中工作。这是一个 Next.js 15 + React 19 + TypeScript + Tailwind CSS 4 + shadcn/ui 项目，纯暗色主题（背景 #0f0f10）。

### 任务

创建两个全局共享组件。

### 文件 1：`src/components/shared/glow-button.tsx`

这是一个有旋转光晕边框的按钮组件。效果：按钮边框有一道红色+白色的光线缓慢旋转流动。

技术实现：
- 外层容器是 `relative` + `p-[1px]`（1px padding 作为边框宽度）+ `rounded-xl` + `overflow-hidden`
- 外层背景用 `conic-gradient(from var(--glow-angle), transparent 0%, rgba(193,39,45,0.8) 10%, rgba(255,255,255,0.3) 20%, transparent 30%)` 旋转
- `globals.css` 中已经定义了 `@property --glow-angle` 和 `@keyframes rotate-gradient`，直接用 `animate-[rotate-gradient_3s_linear_infinite]` 类名（需要在 Tailwind 中能用）或者用内联 style `animation: rotate-gradient 3s linear infinite`
- 内层是真正的按钮：`bg-brand rounded-[11px]` 完全覆盖中心，文字白色
- Props 接口：

```tsx
interface GlowButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: "lg" | "md" | "sm" | "icon";
  loading?: boolean;
  children: React.ReactNode;
}
```

尺寸：
- lg: h-12 px-6 text-base rounded-xl（外层 rounded-xl）
- md: h-10 px-5 text-sm rounded-lg
- sm: h-8 px-4 text-xs rounded-lg
- icon: h-9 w-9 rounded-full（圆形）

状态：
- hover：光晕亮度增强（可以加 `hover:brightness-125`），内层背景变为 `#D43B41`
- disabled：动画暂停 `animation-play-state: paused`，整体 `opacity-50 cursor-not-allowed`
- loading：按钮文字替换为一个旋转的 Loader2 图标（从 lucide-react 导入）+ "处理中..."文字，动画变为脉冲

组件必须是 `"use client"` 组件。

### 文件 2：`src/components/shared/glass-panel.tsx`

一个通用的毛玻璃面板容器：

```tsx
interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  blur?: number;      // 默认 20
  children: React.ReactNode;
}
```

实现：
- `background: rgba(255,255,255,0.05)`
- `backdrop-filter: blur({blur}px)`
- `-webkit-backdrop-filter: blur({blur}px)`
- `border: 1px solid rgba(255,255,255,0.1)`
- 合并外部传入的 className

### 验收
- `pnpm build` 零报错
- 两个组件能被其他文件正常 import

---

## 任务 2/5：创建 TopBar（滚动隐藏/出现）+ 改造 Dashboard Layout

你在 `/Volumes/HX/Munch` 项目中工作。

### 任务 A：创建 `src/components/layout/top-bar.tsx`

这是替代旧 `header.tsx` 的新顶部导航栏。`"use client"` 组件。

视觉规范：
- `position: fixed; top: 0; left: 0; right: 0; z-index: 50`
- 高度 56px（`h-14`）
- 背景：`bg-[rgba(15,15,16,0.8)] backdrop-blur-xl`
- 底部边框：`border-b border-white/[0.06]`

内容布局（flex, items-center, justify-between, px-4 lg:px-6, max-w-full）：
- 左侧：
  - Logo：一个红色方块里白色字母 M（`bg-brand rounded-lg px-2 py-1 text-sm text-white font-bold`）+ "Munch" 文字（`font-semibold tracking-wider`），整体用 `<Link href="/">`
  - 导航链接（`hidden md:flex gap-1`）：`<Link href="/history">` "历史"、`<Link href="/credits">` "积分"。样式：`px-3 py-1.5 rounded-full text-sm text-[#a1a1a6] hover:text-[#f5f5f7] hover:bg-white/[0.06] transition`
- 右侧：
  - 积分徽章：从 `@/components/credits/credit-badge` 导入 `<CreditBadge />`
  - 用户头像占位：一个 32x32 的灰色圆形（`w-8 h-8 rounded-full bg-white/10`），里面放一个 `UserCircle2` 图标（lucide-react）

**核心交互：滚动隐藏/出现**

```tsx
const [visible, setVisible] = useState(true);
const prevScrollY = useRef(0);

useEffect(() => {
  const handleScroll = () => {
    const currentY = window.scrollY;
    if (currentY <= 0) {
      setVisible(true);
    } else if (currentY > prevScrollY.current && currentY > 30) {
      setVisible(false);  // 向下滚动超过30px → 隐藏
    } else if (currentY < prevScrollY.current) {
      setVisible(true);   // 向上滚动 → 显示
    }
    prevScrollY.current = currentY;
  };

  window.addEventListener("scroll", handleScroll, { passive: true });
  return () => window.removeEventListener("scroll", handleScroll);
}, []);
```

根据 `visible` 控制 `transform: translateY(visible ? '0' : '-100%')` + `transition: transform 300ms ease`。

### 任务 B：修改 `src/app/(dashboard)/layout.tsx`

当前代码引入了 `Header`, `Sidebar`, `StatusBar`, `MobileNav`。改为只使用新的 `TopBar`：

```tsx
import { TopBar } from "@/components/layout/top-bar";

export default function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen pt-14">
      <TopBar />
      <main className="mx-auto max-w-5xl px-4 py-8 lg:px-6">{children}</main>
    </div>
  );
}
```

### 任务 C：删除旧布局文件

删除以下文件（不要删 `auth-bootstrap.tsx`）：
- `src/components/layout/sidebar.tsx`
- `src/components/layout/mobile-nav.tsx`
- `src/components/layout/status-bar.tsx`
- `src/components/layout/theme-provider.tsx`（如果还在的话）
- `src/components/layout/theme-toggle.tsx`（如果还在的话）

旧的 `src/components/layout/header.tsx` 暂时保留（首页还在引用），后续任务会处理。

### 验收
- `pnpm build` 零报错
- 访问 `/history` 和 `/credits` 页面能看到 TopBar
- TopBar 向下滚动隐藏，向上滚动出现

---

## 任务 3/5：重写首页 = Hero + 瀑布流画廊 + 底部输入栏

你在 `/Volumes/HX/Munch` 项目中工作。

这是最大的一个任务。首页不再是 Landing Page，而是**工作台本身**：顶部 Hero 品牌区 + 模板瀑布流 + 底部固定输入栏。

### 预备：修改 workspace-store，新增状态

在 `src/stores/workspace-store.ts` 的 `WorkspaceState` 接口中**新增**以下字段和 actions（保留已有的所有字段不动）：

```ts
// 新增字段
creationMode: "image" | "video";
orientation: "landscape" | "portrait";
aspectRatio: string;
activeModal: null | "template-detail" | "variable-editor";
viewingTemplateId: string | null;
activeCategoryFilter: string | null;

// 新增 actions
setCreationMode: (mode: "image" | "video") => void;
setOrientation: (o: "landscape" | "portrait") => void;
setAspectRatio: (r: string) => void;
openTemplateDetail: (templateId: string) => void;
openVariableEditor: () => void;
closeModal: () => void;
setCategoryFilter: (category: string | null) => void;
```

默认值：`creationMode: "image"`, `orientation: "landscape"`, `aspectRatio: "1:1"`, `activeModal: null`, `viewingTemplateId: null`, `activeCategoryFilter: null`。

`openTemplateDetail` 设置 `viewingTemplateId` 和 `activeModal: "template-detail"`。
`openVariableEditor` 先调用 `selectTemplate(viewingTemplateId!)` 然后设置 `activeModal: "variable-editor"`。
`closeModal` 设置 `activeModal: null, viewingTemplateId: null`。

### 文件 1：`src/components/hero/hero-section.tsx`

```
全宽区域，高度 h-[400px] lg:h-[400px] md:h-[320px] sm:h-[280px]
position: relative, overflow: hidden

背景层：一个纯色渐变（MVP 阶段不需要真实大图，用 CSS 渐变模拟即可）：
  background: radial-gradient(ellipse at 30% 20%, rgba(193,39,45,0.15), transparent 50%),
              radial-gradient(ellipse at 70% 80%, rgba(100,100,255,0.06), transparent 50%),
              #0f0f10

文字层（absolute inset-0, flex flex-col items-center justify-center, text-center, px-4）：
  - "MUNCH" — text-5xl lg:text-6xl font-bold tracking-[0.3em] text-white
  - "AI-Powered Visual Workflow" — text-lg text-[#a1a1a6] mt-3
  - "模板驱动 · 多模型路由 · 一键出图商业级素材" — text-sm text-[#636366] mt-2
  - 按钮（mt-8）：使用 GlowButton size="lg"，文字 "开始创作"
  - 按钮点击：window.scrollTo({ top: heroHeight, behavior: 'smooth' })，其中 heroHeight 是 hero 容器的 offsetHeight

底部渐变过渡（absolute bottom-0 left-0 right-0, h-24）：
  background: linear-gradient(to bottom, transparent, #0f0f10)
```

### 文件 2：`src/components/gallery/category-tabs.tsx`

分类筛选标签，粘性定位在画廊顶部。`"use client"` 组件。

```
位置：sticky top-0 z-40
背景：bg-[rgba(15,15,16,0.92)] backdrop-blur-2xl
内边距：px-4 py-3
内容：flex gap-2 overflow-x-auto（移动端可横滑）

标签列表（固定写死）：
  const categories = [
    { value: null, label: "全部" },
    { value: "skincare", label: "护肤美妆" },
    { value: "fashion", label: "服装穿搭" },
    { value: "food", label: "食品饮品" },
    { value: "product", label: "通用产品" },
    { value: "poster", label: "海报广告" },
  ];

每个标签：
  - button 元素
  - 未选中：text-[#636366] bg-transparent px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition
  - 选中：text-[#f5f5f7] border-b-2 border-brand
  - hover：text-[#a1a1a6]

从 useWorkspaceStore 读取 activeCategoryFilter，点击调用 setCategoryFilter。
```

### 文件 3：`src/components/gallery/gallery-card.tsx`

单个模板图片卡片。`"use client"` 组件。

Props：`{ template: Template }`

```
结构：
<button
  onClick={() => openTemplateDetail(template.id)}
  className="group relative mb-1.5 break-inside-avoid overflow-hidden rounded-[4px] cursor-pointer"
>
  {/* 图片 */}
  <img
    src={template.thumbnailUrl}
    alt=""
    className="w-full h-auto block transition-transform duration-200 group-hover:scale-[1.02]"
    loading="lazy"
  />

  {/* Hover 遮罩 + 标题（默认隐藏） */}
  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end p-3">
    <span className="text-white text-sm font-medium">{template.name}</span>
  </div>
</button>
```

注意：目前 template.thumbnailUrl 都是 `/images/logo.svg`，所以图片会是正方形。这没关系，后续替换真实图片后比例会自动适配。MVP 阶段可以给每个模板设置不同的 aspect-ratio 来模拟不同比例：

在 gallery-card 里根据 template.id 给图片容器加一个模拟的 aspect ratio：
```ts
const aspectRatios: Record<string, string> = {
  "skincare-luxury": "aspect-[1/1]",
  "skincare-natural": "aspect-[3/4]",
  "fashion-editorial": "aspect-[2/3]",
  "fashion-street": "aspect-[4/5]",
  "food-overhead": "aspect-[1/1]",
  "food-lifestyle": "aspect-[4/3]",
  "product-minimal": "aspect-[1/1]",
  "product-lifestyle": "aspect-[3/4]",
  "poster-event": "aspect-[9/16]",
  "poster-brand": "aspect-[16/9]",
};
```
用一个带该 aspect-ratio 的 div 包裹 img，div 设 `bg-white/[0.03]`（骨架色）。

### 文件 4：`src/components/gallery/masonry-gallery.tsx`

瀑布流画廊容器。`"use client"` 组件。

```tsx
import { templates } from "@/data/templates";
import { GalleryCard } from "./gallery-card";
import { useWorkspaceStore } from "@/stores/workspace-store";

export function MasonryGallery() {
  const filter = useWorkspaceStore((s) => s.activeCategoryFilter);
  const filtered = filter
    ? templates.filter((t) => t.category === filter)
    : templates;

  return (
    <div className="columns-2 md:columns-3 xl:columns-4 gap-1.5 px-1.5 pb-32">
      {filtered.map((template) => (
        <GalleryCard key={template.id} template={template} />
      ))}
    </div>
  );
}
```

`pb-32` 是给底部输入栏留空间。

### 文件 5：`src/components/creation/input-bar.tsx`

底部输入栏的内部结构。`"use client"` 组件。

```
结构：
<div className="flex items-end gap-2 rounded-2xl bg-[rgba(30,30,33,0.95)] backdrop-blur-xl border border-white/10 p-2 pl-3">
  {/* 左侧 + 按钮 */}
  <button className="flex-none w-8 h-8 flex items-center justify-center rounded-full text-[#636366] hover:text-[#a1a1a6] hover:bg-white/[0.06] transition" disabled>
    <Plus className="w-5 h-5" />
  </button>

  {/* 文本输入 */}
  <textarea
    placeholder="您希望创作什么内容？"
    rows={1}
    className="flex-1 resize-none bg-transparent text-sm text-[#f5f5f7] placeholder:text-[#636366] focus:outline-none py-2 max-h-20 min-h-[36px]"
  />

  {/* 模型选择徽章 */}
  <ModelBadge />

  {/* 发送按钮 */}
  <GlowButton size="icon" className="flex-none">
    <ArrowRight className="w-4 h-4" />
  </GlowButton>
</div>
```

其中 `ModelBadge` 是一个简单的按钮，显示当前选择的模型名字和张数。点击后打开 `ModelPanel`。

创建 `src/components/creation/model-badge.tsx`：
```
<button onClick={togglePanel} className="flex items-center gap-1.5 rounded-full bg-white/[0.06] px-3 py-1.5 text-xs text-[#a1a1a6] hover:bg-white/10 transition whitespace-nowrap">
  <span>🔥</span>
  <span>{modelName}</span>
  <span className="text-[#636366]">🖼</span>
  <span className="text-[#636366]">x{imageCount}</span>
</button>
```

从 useWorkspaceStore 读取 selectedModel 和 imageCount。模型名字映射：`"flux-pro" → "Flux Pro"`, `"gpt-image" → "GPT Image"`。

### 文件 6：`src/components/layout/bottom-bar.tsx`

底部输入栏的外层容器。

```tsx
import { InputBar } from "@/components/creation/input-bar";

export function BottomBar() {
  return (
    <>
      {/* 上方渐变遮罩，让画廊内容淡出 */}
      <div className="pointer-events-none fixed bottom-0 left-0 right-0 z-40 h-32 bg-gradient-to-t from-[#0f0f10] to-transparent" />

      {/* 输入栏 */}
      <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4">
        <div className="mx-auto max-w-[720px]">
          <InputBar />
        </div>
      </div>
    </>
  );
}
```

### 文件 7：重写 `src/app/page.tsx`

```tsx
import { TopBar } from "@/components/layout/top-bar";
import { BottomBar } from "@/components/layout/bottom-bar";
import { HeroSection } from "@/components/hero/hero-section";
import { CategoryTabs } from "@/components/gallery/category-tabs";
import { MasonryGallery } from "@/components/gallery/masonry-gallery";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <TopBar />
      <HeroSection />
      <CategoryTabs />
      <MasonryGallery />
      <BottomBar />
    </div>
  );
}
```

### 清理

删除以下旧文件（如果新组件已替代）：
- `src/components/template/template-grid.tsx`
- `src/components/template/template-card.tsx`
- `src/components/template/template-preview.tsx`
- `src/components/layout/header.tsx`
- `src/app/(dashboard)/workspace/page.tsx`

以及删除旧的 workspace 组件（后续任务会创建新版）：
- `src/components/workspace/model-selector.tsx`
- `src/components/workspace/image-count-selector.tsx`
- `src/components/workspace/generate-button.tsx`
- `src/components/workspace/result-gallery.tsx`
- `src/components/workspace/result-card.tsx`
- `src/components/workspace/result-actions.tsx`

保留以下文件（后续还要用）：
- `src/components/workspace/variable-panel.tsx`
- `src/components/workspace/variable-control.tsx`
- `src/components/workspace/prompt-preview.tsx`
- `src/components/workspace/progress-indicator.tsx`

确保 `pnpm build` 通过。如果保留的 workspace 文件中引用了被删除的文件导致编译报错，把那些 import 注释掉或删掉即可。

### 验收
- `pnpm build` 零报错
- 访问 `/` 看到：TopBar + Hero 区（MUNCH 大字 + 开始创作按钮）+ 分类标签 + 瀑布流画廊 + 底部输入栏
- 向下滚动 TopBar 隐藏，向上滚动出现
- 画廊卡片 hover 时显示模板标题
- 分类标签点击能过滤画廊内容
- 底部输入栏固定在视口底部

---

## 任务 4/5：模板详情弹窗 + 模型选择面板

你在 `/Volumes/HX/Munch` 项目中工作。

### 文件 1：`src/components/creation/template-detail-modal.tsx`

当用户在画廊中点击一个模板，显示此弹窗。`"use client"` 组件。

从 useWorkspaceStore 读取 `activeModal` 和 `viewingTemplateId`。只在 `activeModal === "template-detail"` 时渲染。

结构：
```
{/* 遮罩 */}
<div onClick={closeModal} className="fixed inset-0 z-60 bg-black/70 backdrop-blur-sm" />

{/* 弹窗 */}
<div className="fixed inset-0 z-60 flex items-center justify-center p-4">
  <div className="relative w-full max-w-[900px] max-h-[80vh] overflow-hidden rounded-2xl bg-[#1a1a1d] border border-white/[0.08] flex">
    {/* 左侧：图片 45% */}
    <div className="w-[45%] flex-none bg-white/[0.03] flex items-center justify-center p-6">
      <img src={template.thumbnailUrl} alt="" className="max-w-full max-h-full rounded-xl object-contain" />
    </div>

    {/* 右侧：信息 55% */}
    <div className="flex-1 overflow-y-auto p-6 space-y-5">
      {/* 关闭按钮 */}
      <button onClick={closeModal} className="absolute top-4 right-4 text-[#636366] hover:text-white transition">
        <X className="w-5 h-5" />
      </button>

      <h2 className="text-2xl font-bold text-[#f5f5f7]">{template.name}</h2>
      <p className="text-sm text-[#a1a1a6]">{template.description}</p>

      {/* 提示词预览 */}
      <div>
        <span className="text-xs text-[#636366] uppercase tracking-wider">提示词</span>
        <div className="mt-2 rounded-lg bg-white/[0.03] p-3 text-sm text-[#a1a1a6] font-mono max-h-32 overflow-y-auto">
          {template.basePrompt}
        </div>
      </div>

      {/* 可调变量标签 */}
      <div>
        <span className="text-xs text-[#636366] uppercase tracking-wider">可调变量</span>
        <div className="mt-2 flex flex-wrap gap-2">
          {template.variables.map(v => (
            <span key={v.id} className="rounded-full bg-white/[0.06] px-3 py-1 text-sm text-[#a1a1a6]">
              {v.name}
            </span>
          ))}
        </div>
      </div>

      {/* CTA */}
      <GlowButton size="lg" className="w-full mt-4" onClick={openVariableEditor}>
        ✨ 使用此模板创作
      </GlowButton>
    </div>
  </div>
</div>
```

弹窗动画：进入时 `scale(0.95) opacity-0 → scale(1) opacity-100`，用 Tailwind `animate-in fade-in zoom-in-95 duration-200`（如果项目装了 tailwindcss-animate）。否则直接不加动画也行。

### 文件 2：`src/components/creation/model-panel.tsx`

从底部输入栏向上弹出的模型选择面板。`"use client"` 组件。

Props：`{ open: boolean; onClose: () => void }`

当 `open` 为 true 时渲染。点击外部区域调用 onClose。

结构（从底部向上弹出，贴在底部输入栏上方）：
```
<div className="fixed inset-0 z-[70]" onClick={onClose} />
<div className="fixed bottom-[72px] left-1/2 -translate-x-1/2 z-[70] w-full max-w-[400px] px-4">
  <div className="rounded-2xl bg-[rgba(40,40,44,0.98)] backdrop-blur-2xl border border-white/[0.12] p-4 space-y-4">

    {/* 第1行：Image / Video */}
    <ToggleRow
      options={[
        { value: "image", label: "Image", icon: "🖼" },
        { value: "video", label: "Video", icon: "🎬" },
      ]}
      selected={creationMode}
      onChange={setCreationMode}
    />

    {/* 第2行：横向 / 纵向 */}
    <ToggleRow
      options={[
        { value: "landscape", label: "横向" },
        { value: "portrait", label: "纵向" },
      ]}
      selected={orientation}
      onChange={setOrientation}
    />

    {/* 第3行：比例（根据方向变化） */}
    <ToggleRow
      options={
        orientation === "landscape"
          ? ["1:1", "4:3", "3:2", "16:9"]
          : ["1:1", "3:4", "2:3", "9:16"]
      }
      selected={aspectRatio}
      onChange={setAspectRatio}
    />

    {/* 第4行：张数 */}
    <ToggleRow
      options={["1", "2", "3", "4"].map(n => ({ value: n, label: `x${n}` }))}
      selected={String(imageCount)}
      onChange={(v) => setImageCount(Number(v) as 2 | 4)}
    />

    {/* 第5行：模型下拉 */}
    <select
      value={selectedModel}
      onChange={(e) => setModel(e.target.value as GenerationModel)}
      className="w-full rounded-lg bg-white/[0.06] border border-white/[0.1] px-3 py-2 text-sm text-[#f5f5f7] focus:outline-none focus:border-brand"
    >
      <option value="flux-pro">🔥 Flux Pro</option>
      <option value="gpt-image">✨ GPT Image</option>
    </select>

    {/* 第6行：积分 */}
    <p className="text-center text-xs text-[#a1a1a6]">
      生成将消耗 <span className="text-[#f5f5f7] font-medium">{cost}</span> 积分
    </p>
  </div>
</div>
```

`ToggleRow` 是一个内部辅助组件（不需要导出），渲染一行 toggle 按钮：
- flex, gap-1, 每个按钮 flex-1
- 选中：`bg-white text-[#0f0f10] font-medium`
- 未选中：`bg-transparent text-[#636366] hover:text-[#a1a1a6]`
- 共同：`rounded-full px-3 py-1.5 text-sm transition text-center`

积分计算：`cost = CREDIT_COSTS[selectedModel].perImage * imageCount`（从 `@/lib/constants` 导入 `CREDIT_COSTS`）。

### 更新 `src/components/creation/input-bar.tsx`

在 input-bar 里加入 ModelPanel 的状态管理：
```tsx
const [panelOpen, setPanelOpen] = useState(false);
```
ModelBadge 的 onClick 改为 `() => setPanelOpen(!panelOpen)`。
在 InputBar 组件内渲染 `{panelOpen && <ModelPanel open={panelOpen} onClose={() => setPanelOpen(false)} />}`。

### 更新首页 `src/app/page.tsx`

在首页加入 TemplateDetailModal：
```tsx
import { TemplateDetailModal } from "@/components/creation/template-detail-modal";

// 在 return 的最后、BottomBar 后面加上：
<TemplateDetailModal />
```

### 验收
- `pnpm build` 零报错
- 点击画廊中的模板→弹出居中弹窗（左图右文）
- 弹窗中能看到模板名称、描述、提示词预览、可调变量
- 点击遮罩或 X 关闭弹窗
- 底部输入栏点击模型徽章→向上弹出模型选择面板
- 面板中 Image/Video、横向/纵向、比例、张数、模型都可切换
- 积分实时计算显示

---

## 任务 5/5：变量编辑面板（从弹窗进入的创作流程）

你在 `/Volumes/HX/Munch` 项目中工作。

### 文件：`src/components/creation/variable-editor.tsx`

当用户在模板详情弹窗中点击"使用此模板创作"后显示的面板。`"use client"` 组件。

从 useWorkspaceStore 读取 `activeModal`、`selectedTemplateId`。只在 `activeModal === "variable-editor"` 时渲染。

结构：
```
{/* 遮罩 */}
<div onClick={closeModal} className="fixed inset-0 z-60 bg-black/70 backdrop-blur-sm" />

{/* 面板（居中，非满幅） */}
<div className="fixed inset-0 z-60 flex items-center justify-center p-4 lg:p-8">
  <div className="relative w-full max-w-[1000px] max-h-[85vh] overflow-hidden rounded-2xl bg-[#1a1a1d] border border-white/[0.08]">

    {/* 顶部栏 */}
    <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
      <button onClick={closeModal} className="text-sm text-[#a1a1a6] hover:text-white transition flex items-center gap-1">
        <ArrowLeft className="w-4 h-4" /> 返回画廊
      </button>
      <h3 className="text-base font-medium text-[#f5f5f7]">{template.name}</h3>
      <div className="w-20" /> {/* 占位对齐 */}
    </div>

    {/* 内容区 */}
    <div className="flex h-[calc(85vh-64px)] overflow-hidden">

      {/* 左侧：变量编辑 55% */}
      <div className="w-[55%] overflow-y-auto p-6 space-y-6 border-r border-white/[0.06]">
        {/* 必选变量 */}
        {requiredVars.map(variable => (
          <div key={variable.id} className="space-y-2">
            <label className="text-sm font-medium text-[#f5f5f7]">{variable.name}</label>
            {/* 选项 <= 3 个用 Radio，> 3 个用 Select */}
            {variable.options && variable.options.length <= 3 ? (
              <RadioGroup>
                {/* 每个 option 渲染为 radio */}
              </RadioGroup>
            ) : (
              <Select>
                {/* 下拉 */}
              </Select>
            )}
          </div>
        ))}

        {/* 可选变量（折叠） */}
        {optionalVars.length > 0 && (
          <details className="group">
            <summary className="cursor-pointer text-sm text-[#636366] hover:text-[#a1a1a6] transition">
              更多选项 ({optionalVars.length})
            </summary>
            <div className="mt-4 space-y-6">
              {/* 同上渲染 */}
            </div>
          </details>
        )}
      </div>

      {/* 右侧：预览 + 操作 45% */}
      <div className="w-[45%] overflow-y-auto p-6 space-y-6">
        {/* Prompt 预览 */}
        <div>
          <span className="text-xs text-[#636366] uppercase tracking-wider">编译后 Prompt</span>
          <div className="mt-2 rounded-lg bg-white/[0.03] p-3 text-sm text-[#a1a1a6] font-mono max-h-40 overflow-y-auto">
            {/* 简单的前端变量替换预览（不调 API） */}
            {compiledPreview}
          </div>
        </div>

        {/* 模型选择 */}
        <div className="space-y-2">
          <span className="text-xs text-[#636366] uppercase tracking-wider">模型</span>
          {template.compatibleModels.map(model => (
            <button
              key={model}
              onClick={() => setModel(model)}
              className={cn(
                "w-full rounded-lg border px-3 py-2.5 text-left text-sm transition",
                selectedModel === model
                  ? "border-brand/60 bg-brand/10 text-white"
                  : "border-white/[0.08] text-[#a1a1a6] hover:border-white/[0.15]"
              )}
            >
              {model === "flux-pro" ? "🔥 Flux Pro — 精度与可控性强" : "✨ GPT Image — 画面质感强"}
            </button>
          ))}
        </div>

        {/* 张数 */}
        <div className="space-y-2">
          <span className="text-xs text-[#636366] uppercase tracking-wider">张数</span>
          <div className="flex gap-2">
            {([2, 4] as const).map(n => (
              <button
                key={n}
                onClick={() => setImageCount(n)}
                className={cn(
                  "flex-1 rounded-lg py-2 text-sm transition",
                  imageCount === n
                    ? "bg-white text-[#0f0f10] font-medium"
                    : "bg-white/[0.06] text-[#636366] hover:text-[#a1a1a6]"
                )}
              >
                {n} 张
              </button>
            ))}
          </div>
        </div>

        {/* 积分 */}
        <p className="text-sm text-[#a1a1a6]">
          消耗：<span className="text-[#f5f5f7] font-medium">{cost} 积分</span>
        </p>

        {/* 生成按钮 */}
        <GlowButton size="lg" className="w-full" onClick={handleGenerate} loading={isGenerating}>
          ✨ 开始生成
        </GlowButton>
      </div>
    </div>
  </div>
</div>
```

`compiledPreview` 的计算：
```ts
const compiledPreview = useMemo(() => {
  let prompt = template.basePrompt;
  for (const [key, value] of Object.entries(variables)) {
    prompt = prompt.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
  }
  return prompt;
}, [template.basePrompt, variables]);
```

`handleGenerate` 暂时只做一个 console.log + alert 即可，完整的生成逻辑已经在 hooks/use-generation.ts 中了，后续集成。

requiredVars = `template.variables.filter(v => v.required).sort((a,b) => a.priority - b.priority)`
optionalVars = `template.variables.filter(v => !v.required)`

使用已有的 `variable-control.tsx` 或者直接内联 radio/select 渲染（看哪个方便，不要硬塞旧组件如果不合适）。

从 `useWorkspaceStore` 读取 `variables`, `setVariable`, `selectedModel`, `setModel`, `imageCount`, `setImageCount`, `closeModal`。

### 更新首页 `src/app/page.tsx`

加入 VariableEditor：
```tsx
import { VariableEditor } from "@/components/creation/variable-editor";

// 在 TemplateDetailModal 后面加上：
<VariableEditor />
```

### 验收
- `pnpm build` 零报错
- 完整流程：点模板→详情弹窗→点"使用此模板"→进入变量编辑面板
- 变量编辑面板左侧显示所有变量控件
- 右侧实时预览 Prompt（变量替换）
- 可以切换模型、张数
- 积分实时计算
- 点"开始生成"触发 console.log（暂不接真实 API）
- 点"返回画廊"关闭面板

---

## 使用说明

**每次只给 Codex 一个任务。** 复制 `## 任务 N/5` 下面的全部内容作为 prompt 发送。

执行顺序：
1. 任务 1（共享组件） → build 通过
2. 任务 2（TopBar + Dashboard Layout）→ build 通过
3. 任务 3（首页重构）→ build 通过 ← **最关键**
4. 任务 4（弹窗 + 模型面板）→ build 通过
5. 任务 5（变量编辑面板）→ build 通过

每个任务 Codex 完成后把代码给我审。
