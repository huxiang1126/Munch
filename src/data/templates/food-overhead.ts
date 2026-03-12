import type { Template } from "@/types/template";

export const foodOverhead: Template = {
  id: "food-overhead",
  name: "美食俯拍菜单图",
  description: "适合外卖菜单、电商详情页和餐饮社媒封面。",
  category: "food",
  tags: ["美食", "俯拍", "菜单"],
  thumbnailUrl: "/images/logo.svg",
  defaultModel: "nano-banana-2",
  compatibleModels: ["nano-banana-2", "nano-banana-pro-4k", "nano-banana-pro-2k"],
  defaultImageSize: { width: 1024, height: 1024 },
  variables: [
    {
      id: "dish",
      name: "菜品类型",
      type: "select",
      required: true,
      priority: 1,
      options: [
        { value: "brunch-set", label: "早午餐" },
        { value: "dessert-platter", label: "甜品拼盘" },
        { value: "asian-feast", label: "亚洲风味" },
      ],
      defaultValue: "brunch-set",
    },
    {
      id: "table",
      name: "桌面材质",
      type: "select",
      required: true,
      priority: 2,
      options: [
        { value: "light-oak", label: "浅橡木" },
        { value: "dark-stone", label: "深色石材" },
        { value: "linen-cloth", label: "布面桌布" },
      ],
      defaultValue: "light-oak",
    },
    {
      id: "style",
      name: "风格",
      type: "select",
      required: true,
      priority: 3,
      options: [
        { value: "clean-editorial", label: "干净编辑感" },
        { value: "abundant-feast", label: "丰盛感" },
        { value: "colorful-fresh", label: "清爽鲜艳" },
      ],
      defaultValue: "clean-editorial",
    },
  ],
  skillPrompt: "Generate overhead food photography with appetizing texture and color separation.",
  basePrompt:
    "An overhead commercial food shot of {{dish}} on {{table}} with a {{style}} presentation.",
  negativePrompt: "text, watermark, burnt food, blurry",
  creditMultiplier: 1,
};
