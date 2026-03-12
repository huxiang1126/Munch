import type { Template } from "@/types/template";

export const fashionStreet: Template = {
  id: "fashion-street",
  name: "街头穿搭 Lookbook",
  description: "适合品牌日常穿搭、短视频封面和社媒卡片。",
  category: "fashion",
  tags: ["穿搭", "街头", "Lookbook"],
  thumbnailUrl: "/images/logo.svg",
  defaultModel: "nano-banana-2",
  compatibleModels: ["nano-banana-2", "nano-banana-pro-4k", "nano-banana-pro-2k"],
  defaultImageSize: { width: 1024, height: 1365 },
  variables: [
    {
      id: "time",
      name: "时间",
      type: "select",
      required: true,
      priority: 1,
      options: [
        { value: "golden-hour", label: "黄昏" },
        { value: "overcast-day", label: "阴天" },
        { value: "night-neon", label: "夜景霓虹" },
      ],
      defaultValue: "golden-hour",
    },
    {
      id: "street",
      name: "街景",
      type: "select",
      required: true,
      priority: 2,
      options: [
        { value: "cafe-street", label: "咖啡街区" },
        { value: "crosswalk", label: "斑马线" },
        { value: "subway-exit", label: "地铁口" },
      ],
      defaultValue: "cafe-street",
    },
    {
      id: "energy",
      name: "氛围",
      type: "select",
      required: true,
      priority: 3,
      options: [
        { value: "cool-effortless", label: "松弛感" },
        { value: "young-playful", label: "年轻活力" },
        { value: "sharp-urban", label: "都市利落" },
      ],
      defaultValue: "cool-effortless",
    },
  ],
  skillPrompt: "Generate stylish streetwear photography with social-friendly framing.",
  basePrompt:
    "A street fashion lookbook shot at {{time}} in a {{street}} scene with a {{energy}} attitude.",
  negativePrompt: "text, watermark, extra limbs",
  creditMultiplier: 1,
};
