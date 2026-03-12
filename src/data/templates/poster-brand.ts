import type { Template } from "@/types/template";

export const posterBrand: Template = {
  id: "poster-brand",
  name: "品牌广告 KV",
  description: "更偏品牌大片感的视觉底图，适合 Campaign 首屏。",
  category: "poster",
  tags: ["品牌", "海报", "广告"],
  thumbnailUrl: "/images/logo.svg",
  defaultModel: "nano-banana-2",
  compatibleModels: ["nano-banana-2", "nano-banana-pro-4k", "nano-banana-pro-2k"],
  defaultImageSize: { width: 1440, height: 1024 },
  variables: [
    {
      id: "industry",
      name: "行业",
      type: "select",
      required: true,
      priority: 1,
      options: [
        { value: "beauty", label: "美妆" },
        { value: "tech", label: "科技" },
        { value: "food", label: "餐饮" },
      ],
      defaultValue: "beauty",
    },
    {
      id: "mood",
      name: "情绪",
      type: "select",
      required: true,
      priority: 2,
      options: [
        { value: "premium", label: "高定" },
        { value: "bold", label: "强势" },
        { value: "playful", label: "轻快" },
      ],
      defaultValue: "premium",
    },
    {
      id: "composition",
      name: "构图",
      type: "select",
      required: true,
      priority: 3,
      options: [
        { value: "centered-hero", label: "中心主角" },
        { value: "left-copy-space", label: "左侧留白" },
        { value: "split-layout", label: "分栏构图" },
      ],
      defaultValue: "left-copy-space",
    },
  ],
  skillPrompt: "Generate campaign key visuals with strong hierarchy and brand advertising polish.",
  basePrompt:
    "A brand campaign visual for {{industry}}, with a {{mood}} tone and a {{composition}} composition.",
  negativePrompt: "text, watermark, weak contrast, crowded image",
  creditMultiplier: 1.2,
};
