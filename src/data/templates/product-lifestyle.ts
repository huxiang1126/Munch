import type { Template } from "@/types/template";

export const productLifestyle: Template = {
  id: "product-lifestyle",
  name: "产品场景种草图",
  description: "把商品放进真实生活场景，更适合转化和种草。",
  category: "product",
  tags: ["产品", "场景", "转化"],
  thumbnailUrl: "/images/logo.svg",
  defaultModel: "nano-banana-2",
  compatibleModels: ["nano-banana-2", "nano-banana-pro-4k", "nano-banana-pro-2k"],
  defaultImageSize: { width: 1280, height: 1024 },
  variables: [
    {
      id: "room",
      name: "空间",
      type: "select",
      required: true,
      priority: 1,
      options: [
        { value: "living-room", label: "客厅" },
        { value: "bedroom", label: "卧室" },
        { value: "work-desk", label: "办公桌" },
      ],
      defaultValue: "living-room",
    },
    {
      id: "tone",
      name: "色调",
      type: "select",
      required: true,
      priority: 2,
      options: [
        { value: "warm-neutral", label: "暖中性" },
        { value: "modern-cool", label: "现代冷调" },
        { value: "bright-clean", label: "明亮洁净" },
      ],
      defaultValue: "warm-neutral",
    },
    {
      id: "story",
      name: "使用场景",
      type: "select",
      required: true,
      priority: 3,
      options: [
        { value: "morning-routine", label: "晨间使用" },
        { value: "hosting-guests", label: "待客时刻" },
        { value: "focused-work", label: "专注工作" },
      ],
      defaultValue: "morning-routine",
    },
  ],
  skillPrompt: "Generate product lifestyle imagery that feels believable and conversion-driven.",
  basePrompt:
    "A product lifestyle shot in a {{room}} with a {{tone}} palette, showing a {{story}} scenario.",
  negativePrompt: "text, watermark, clutter, low realism",
  creditMultiplier: 1.1,
};
