import type { Template } from "@/types/template";

export const fashionGoldenhourGrid: Template = {
  id: "fashion-goldenhour-grid",
  name: "金色时刻拼贴大片",
  description: "整理自 PDF 的 sunset editorial 拼贴 prompt，适合做多图杂志感成片测试。",
  category: "fashion",
  tags: ["Fashion", "Golden Hour", "Collage", "Test"],
  thumbnailUrl: "/images/logo.svg",
  defaultModel: "nano-banana-2",
  compatibleModels: ["nano-banana-2", "nano-banana-pro-4k", "nano-banana-pro-2k"],
  defaultImageSize: { width: 1280, height: 1600 },
  variables: [
    {
      id: "grid_layout",
      name: "拼贴结构",
      type: "select",
      required: true,
      priority: 1,
      options: [
        { value: "2-3-2-grid", label: "2-3-2 杂志拼贴" },
        { value: "1-3-2-grid", label: "1+3+2 叙事结构" },
        { value: "hero-plus-details", label: "主图加细节拼贴" },
      ],
      defaultValue: "1-3-2-grid",
    },
    {
      id: "scene_setting",
      name: "日落场景",
      type: "select",
      required: true,
      priority: 2,
      options: [
        { value: "glowing-skyline", label: "发光天际线" },
        { value: "railing-and-chair", label: "围栏与座椅" },
        { value: "warm-urban-street", label: "暖调城市街景" },
      ],
      defaultValue: "glowing-skyline",
    },
    {
      id: "sunlight_style",
      name: "光线戏剧性",
      type: "select",
      required: true,
      priority: 3,
      options: [
        { value: "rich-lens-flares", label: "丰富眩光" },
        { value: "strong-rim-light", label: "强轮廓光" },
        { value: "soft-sunset-haze", label: "柔和日落雾感" },
      ],
      defaultValue: "rich-lens-flares",
    },
  ],
  skillPrompt:
    "Generate premium sunset fashion collages with dramatic sunbeams, golden rim light, editorial shot variety, and believable warm skin tones.",
  basePrompt:
    "Create a {{grid_layout}} fashion collage shot outdoors at golden hour with a {{scene_setting}} background. Use the uploaded portrait photo to anchor face identity and the uploaded outfit as the full clothing reference. Build abundant warm light, glowing flares, and {{sunlight_style}}, mixing very close portraits, full-body frames, and candid accessory shots so the final image feels like a premium magazine spread.",
  negativePrompt:
    "text, watermark, muddy colors, harsh HDR, flat skin, duplicated body parts, weak backlight, incorrect face identity",
  creditMultiplier: 1.35,
};
