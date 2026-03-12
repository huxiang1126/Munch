import type { Template } from "@/types/template";

export const posterEvent: Template = {
  id: "poster-event",
  name: "活动海报视觉底图",
  description: "适合活动 KV、预热海报和 Banner 背景图。",
  category: "poster",
  tags: ["海报", "活动", "KV"],
  thumbnailUrl: "/images/logo.svg",
  defaultModel: "nano-banana-2",
  compatibleModels: ["nano-banana-2", "nano-banana-pro-4k", "nano-banana-pro-2k"],
  defaultImageSize: { width: 1024, height: 1536 },
  variables: [
    {
      id: "theme",
      name: "主题",
      type: "select",
      required: true,
      priority: 1,
      options: [
        { value: "music-festival", label: "音乐节" },
        { value: "brand-launch", label: "新品发布" },
        { value: "art-exhibition", label: "艺术展" },
      ],
      defaultValue: "brand-launch",
    },
    {
      id: "palette",
      name: "配色",
      type: "select",
      required: true,
      priority: 2,
      options: [
        { value: "crimson-black", label: "红黑强对比" },
        { value: "silver-blue", label: "银蓝科技" },
        { value: "warm-gold", label: "暖金高定" },
      ],
      defaultValue: "crimson-black",
    },
    {
      id: "texture",
      name: "材质感",
      type: "select",
      required: true,
      priority: 3,
      options: [
        { value: "glass-light", label: "玻璃光" },
        { value: "grain-paper", label: "纸张颗粒" },
        { value: "mist-fog", label: "雾感" },
      ],
      defaultValue: "glass-light",
    },
  ],
  skillPrompt: "Generate text-safe poster backgrounds with strong focal structure and premium mood.",
  basePrompt:
    "A vertical event poster background for {{theme}}, using {{palette}} colors and {{texture}} texture.",
  negativePrompt: "text, logo, watermark, cluttered composition",
  creditMultiplier: 1.15,
};
