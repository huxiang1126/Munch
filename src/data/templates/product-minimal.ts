import type { Template } from "@/types/template";

export const productMinimal: Template = {
  id: "product-minimal",
  name: "极简产品主图",
  description: "通用爆款主图模板，适合多品类商品。",
  category: "product",
  tags: ["产品", "极简", "主图"],
  thumbnailUrl: "/images/logo.svg",
  defaultModel: "nano-banana-2",
  compatibleModels: ["nano-banana-2", "nano-banana-pro-4k", "nano-banana-pro-2k"],
  defaultImageSize: { width: 1024, height: 1024 },
  variables: [
    {
      id: "background",
      name: "背景",
      type: "select",
      required: true,
      priority: 1,
      options: [
        { value: "solid-white", label: "纯白" },
        { value: "soft-gray", label: "浅灰" },
        { value: "brand-color", label: "品牌色" },
      ],
      defaultValue: "solid-white",
    },
    {
      id: "shadow",
      name: "光影",
      type: "select",
      required: true,
      priority: 2,
      options: [
        { value: "soft-shadow", label: "柔和阴影" },
        { value: "floating-light", label: "悬浮光" },
        { value: "hard-contrast", label: "硬朗对比" },
      ],
      defaultValue: "soft-shadow",
    },
    {
      id: "angle",
      name: "角度",
      type: "select",
      required: true,
      priority: 3,
      options: [
        { value: "front-view", label: "正视图" },
        { value: "three-quarter", label: "3/4 视角" },
        { value: "top-angle", label: "轻俯视" },
      ],
      defaultValue: "three-quarter",
    },
  ],
  skillPrompt: "Generate clean hero product photography for ecommerce cover images.",
  basePrompt:
    "A commercial product hero shot on a {{background}} background with {{shadow}} lighting from a {{angle}} angle.",
  negativePrompt: "text, watermark, messy layout",
  creditMultiplier: 1,
};
