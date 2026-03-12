import type { Template } from "@/types/template";

export const fashionEditorial: Template = {
  id: "fashion-editorial",
  name: "时装大片",
  description: "偏杂志封面感的服装视觉，强调姿态和叙事。",
  category: "fashion",
  tags: ["时装", "Editorial", "大片"],
  thumbnailUrl: "/images/logo.svg",
  defaultModel: "nano-banana-2",
  compatibleModels: ["nano-banana-2", "nano-banana-pro-4k", "nano-banana-pro-2k"],
  defaultImageSize: { width: 1024, height: 1536 },
  variables: [
    {
      id: "location",
      name: "场景",
      type: "select",
      required: true,
      priority: 1,
      options: [
        { value: "urban-rooftop", label: "城市天台" },
        { value: "concrete-studio", label: "水泥棚景" },
        { value: "hotel-corridor", label: "酒店走廊" },
      ],
      defaultValue: "concrete-studio",
    },
    {
      id: "styling",
      name: "服装风格",
      type: "select",
      required: true,
      priority: 2,
      options: [
        { value: "sharp-tailoring", label: "利落剪裁" },
        { value: "flowing-fabric", label: "飘逸面料" },
        { value: "dark-minimal", label: "深色极简" },
      ],
      defaultValue: "sharp-tailoring",
    },
    {
      id: "camera",
      name: "镜头表达",
      type: "select",
      required: true,
      priority: 3,
      options: [
        { value: "full-body", label: "全身" },
        { value: "mid-shot", label: "半身" },
        { value: "dynamic-angle", label: "动态角度" },
      ],
      defaultValue: "full-body",
    },
  ],
  skillPrompt: "Generate editorial fashion photography with strong composition and premium styling.",
  basePrompt:
    "A fashion editorial shot in {{location}}, featuring {{styling}} styling, framed as a {{camera}} composition.",
  negativePrompt: "text, logo, watermark, low detail",
  creditMultiplier: 1.2,
};
