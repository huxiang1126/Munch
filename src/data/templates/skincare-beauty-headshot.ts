import type { Template } from "@/types/template";

export const skincareBeautyHeadshot: Template = {
  id: "skincare-beauty-headshot",
  name: "高定美妆正面肖像",
  description: "基于导出 PDF 中可用 prompt 整理的测试模板，偏白底高端美妆广告。",
  category: "skincare",
  tags: ["美妆", "Beauty", "Headshot", "Test"],
  thumbnailUrl: "/images/logo.svg",
  defaultModel: "nano-banana-2",
  compatibleModels: ["nano-banana-2", "nano-banana-pro-4k", "nano-banana-pro-2k"],
  defaultImageSize: { width: 1024, height: 1280 },
  variables: [
    {
      id: "background_tone",
      name: "背景基调",
      type: "select",
      required: true,
      priority: 1,
      options: [
        { value: "pure-white", label: "纯白无缝" },
        { value: "pearl-gray", label: "珍珠灰" },
        { value: "champagne-beige", label: "香槟米白" },
      ],
      defaultValue: "pure-white",
    },
    {
      id: "skin_finish",
      name: "肌肤质感",
      type: "select",
      required: true,
      priority: 2,
      options: [
        { value: "dewy-glow", label: "水光通透" },
        { value: "satin-natural", label: "缎面自然" },
        { value: "glossy-luxury", label: "高光奢润" },
      ],
      defaultValue: "dewy-glow",
    },
    {
      id: "mood",
      name: "情绪气质",
      type: "select",
      required: true,
      priority: 3,
      options: [
        { value: "serene", label: "平静高级" },
        { value: "confident", label: "冷静自信" },
        { value: "minimal-luxury", label: "极简奢感" },
      ],
      defaultValue: "serene",
    },
  ],
  skillPrompt:
    "Generate luxury beauty campaign headshots while preserving exact face identity, natural skin texture, and premium studio lighting.",
  basePrompt:
    "Create a luminous high-fashion editorial headshot of the uploaded female model, facing the camera straight on with full neck and shoulders visible. Keep the expression {{mood}}, the skin finish {{skin_finish}}, and place her against a {{background_tone}} seamless background. Preserve subtle freckles, slicked-back hair, refined brows, neutral glossy lips, soft even studio lighting, symmetrical framing, and a Vogue-level beauty campaign finish.",
  negativePrompt:
    "hands in frame, harsh shadows, cluttered background, low resolution, over-retouched plastic skin, cartoon style, exaggerated makeup, text, watermark",
  creditMultiplier: 1.25,
};
