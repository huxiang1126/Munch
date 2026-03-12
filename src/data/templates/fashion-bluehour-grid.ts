import type { Template } from "@/types/template";

export const fashionBluehourGrid: Template = {
  id: "fashion-bluehour-grid",
  name: "蓝调时刻九宫格",
  description: "整理自 PDF 的蓝调时刻街头 editorial prompt，适合服装多视角拼贴测试。",
  category: "fashion",
  tags: ["Fashion", "Blue Hour", "Grid", "Test"],
  thumbnailUrl: "/images/logo.svg",
  defaultModel: "nano-banana-2",
  compatibleModels: ["nano-banana-2", "nano-banana-pro-4k", "nano-banana-pro-2k"],
  defaultImageSize: { width: 1536, height: 1536 },
  variables: [
    {
      id: "scene_setting",
      name: "背景环境",
      type: "select",
      required: true,
      priority: 1,
      options: [
        { value: "urban-waterfront", label: "临水城市天际线" },
        { value: "twilight-railing", label: "蓝调围栏街景" },
        { value: "city-rooftop", label: "城市屋顶" },
      ],
      defaultValue: "urban-waterfront",
    },
    {
      id: "layout_style",
      name: "画面编排",
      type: "select",
      required: true,
      priority: 2,
      options: [
        { value: "3x3-editorial-grid", label: "3x3 杂志九宫格" },
        { value: "contact-sheet", label: "联络表式拼贴" },
        { value: "mixed-collage", label: "近景远景混合拼贴" },
      ],
      defaultValue: "3x3-editorial-grid",
    },
    {
      id: "shot_emphasis",
      name: "镜头重点",
      type: "select",
      required: true,
      priority: 3,
      options: [
        { value: "eyes-and-hands", label: "眼神与手部特写" },
        { value: "full-body-balance", label: "全身与半身平衡" },
        { value: "bag-and-cap-details", label: "包链和帽檐细节" },
      ],
      defaultValue: "full-body-balance",
    },
  ],
  skillPrompt:
    "Generate cinematic blue-hour fashion collages with strong shot variety, deep blues, warm skin tones, and preserved outfit consistency.",
  basePrompt:
    "Create a {{layout_style}} editorial photo grid shot outdoors during blue hour with a subtly blurred {{scene_setting}} background. Use the uploaded portrait photo to anchor face identity and the uploaded outfit photo as clothing reference. Keep accessories consistent, build a cinematic soft key from left-front with soft fill on the right and faint rim light, emphasize atmospheric deep blues, warm skin tones, reflective highlights, and mix shots around {{shot_emphasis}} while keeping a clean modern street-fashion mood.",
  negativePrompt:
    "text, watermark, duplicated limbs, weak composition, overexposed highlights, flat lighting, incorrect face identity, cluttered background",
  creditMultiplier: 1.3,
};
