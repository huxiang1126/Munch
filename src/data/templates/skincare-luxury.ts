import type { Template } from "@/types/template";

export const skincareLuxury: Template = {
  id: "skincare-luxury",
  name: "高端护肤大片",
  description: "高反差玻璃质感，适合护肤品牌主视觉。",
  category: "skincare",
  tags: ["护肤", "高端", "商业"],
  thumbnailUrl: "/images/logo.svg",
  defaultModel: "nano-banana-2",
  compatibleModels: ["nano-banana-2", "nano-banana-pro-4k", "nano-banana-pro-2k"],
  defaultImageSize: { width: 1024, height: 1024 },
  variables: [
    {
      id: "lighting",
      name: "光线",
      type: "select",
      required: true,
      priority: 1,
      options: [
        { value: "soft-diffused", label: "柔光" },
        { value: "studio-cool", label: "棚拍冷白" },
        { value: "morning-warm", label: "晨光暖调" },
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
        { value: "minimal-white", label: "极简白背景" },
        { value: "botanical", label: "自然植物" },
        { value: "marble-bathroom", label: "大理石浴室" },
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
        { value: "close-up", label: "特写" },
        { value: "eye-level", label: "平拍" },
        { value: "slight-overhead", label: "微俯拍" },
      ],
      defaultValue: "eye-level",
    },
  ],
  skillPrompt: "Generate premium skincare ad imagery with tactile lighting and clean composition.",
  basePrompt:
    "A premium skincare bottle in a {{scene}} setting, with {{lighting}} lighting, shot from a {{camera}} angle.",
  negativePrompt: "text, logo, watermark, blurry, deformed",
  creditMultiplier: 1,
};
