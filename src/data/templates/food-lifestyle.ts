import type { Template } from "@/types/template";

export const foodLifestyle: Template = {
  id: "food-lifestyle",
  name: "餐饮生活方式",
  description: "更有人物和环境感的餐饮品牌宣传图。",
  category: "food",
  tags: ["餐饮", "生活方式", "品牌"],
  thumbnailUrl: "/images/logo.svg",
  defaultModel: "nano-banana-2",
  compatibleModels: ["nano-banana-2", "nano-banana-pro-4k", "nano-banana-pro-2k"],
  defaultImageSize: { width: 1280, height: 1024 },
  variables: [
    {
      id: "venue",
      name: "门店氛围",
      type: "select",
      required: true,
      priority: 1,
      options: [
        { value: "sunlit-cafe", label: "明亮咖啡馆" },
        { value: "cozy-bistro", label: "温暖小酒馆" },
        { value: "modern-teahouse", label: "现代茶饮店" },
      ],
      defaultValue: "sunlit-cafe",
    },
    {
      id: "hero",
      name: "主角",
      type: "select",
      required: true,
      priority: 2,
      options: [
        { value: "coffee-and-pastry", label: "咖啡与可颂" },
        { value: "burger-and-fries", label: "汉堡套餐" },
        { value: "tea-and-dessert", label: "茶饮甜点" },
      ],
      defaultValue: "coffee-and-pastry",
    },
    {
      id: "narrative",
      name: "故事感",
      type: "select",
      required: true,
      priority: 3,
      options: [
        { value: "casual-meetup", label: "朋友相聚" },
        { value: "quiet-morning", label: "安静早晨" },
        { value: "busy-lunch", label: "午间热闹" },
      ],
      defaultValue: "quiet-morning",
    },
  ],
  skillPrompt: "Generate warm food lifestyle photography with cinematic human presence.",
  basePrompt:
    "A restaurant lifestyle scene in {{venue}}, featuring {{hero}}, telling a {{narrative}} story.",
  negativePrompt: "text, logo, watermark, awkward anatomy",
  creditMultiplier: 1.1,
};
