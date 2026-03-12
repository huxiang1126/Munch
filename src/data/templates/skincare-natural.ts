import type { Template } from "@/types/template";

export const skincareNatural: Template = {
  id: "skincare-natural",
  name: "自然护肤生活感",
  description: "更轻松的天然护肤表达，适合社媒和详情页。",
  category: "skincare",
  tags: ["护肤", "自然", "生活方式"],
  thumbnailUrl: "/images/logo.svg",
  defaultModel: "nano-banana-2",
  compatibleModels: ["nano-banana-2", "nano-banana-pro-4k", "nano-banana-pro-2k"],
  defaultImageSize: { width: 1024, height: 1280 },
  variables: [
    {
      id: "ingredient",
      name: "成分氛围",
      type: "select",
      required: true,
      priority: 1,
      options: [
        { value: "aloe-vera", label: "芦荟清润" },
        { value: "citrus-fresh", label: "柑橘清新" },
        { value: "oat-soft", label: "燕麦柔润" },
      ],
      defaultValue: "aloe-vera",
    },
    {
      id: "surface",
      name: "摆台",
      type: "select",
      required: true,
      priority: 2,
      options: [
        { value: "linen-fabric", label: "亚麻布面" },
        { value: "wood-table", label: "木质桌面" },
        { value: "stone-sink", label: "石材台面" },
      ],
      defaultValue: "linen-fabric",
    },
    {
      id: "mood",
      name: "氛围",
      type: "select",
      required: true,
      priority: 3,
      options: [
        { value: "sunny-soft", label: "温暖日光" },
        { value: "fresh-minimal", label: "清爽极简" },
        { value: "home-spa", label: "居家 SPA" },
      ],
      defaultValue: "sunny-soft",
    },
  ],
  skillPrompt: "Generate natural skincare lifestyle photography with clean commercial styling.",
  basePrompt:
    "A skincare routine scene featuring {{ingredient}} cues, styled on {{surface}}, in a {{mood}} mood.",
  negativePrompt: "text, logo, watermark, plastic look",
  creditMultiplier: 1,
};
