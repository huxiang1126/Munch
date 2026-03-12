import type { Template } from "@/types/template";

export const posterTennisCampaign: Template = {
  id: "poster-tennis-campaign",
  name: "网球杂志 Campaign",
  description: "从 PDF 中整理出的体育杂志式拼贴 prompt，先作为测试模板使用。",
  category: "poster",
  tags: ["Sports", "Tennis", "Campaign", "Test"],
  thumbnailUrl: "/images/logo.svg",
  defaultModel: "nano-banana-2",
  compatibleModels: ["nano-banana-2", "nano-banana-pro-4k", "nano-banana-pro-2k"],
  defaultImageSize: { width: 1280, height: 1600 },
  variables: [
    {
      id: "hero_motion",
      name: "主动作",
      type: "select",
      required: true,
      priority: 1,
      options: [
        { value: "serve-leap", label: "发球跃起" },
        { value: "baseline-sprint", label: "底线冲刺" },
        { value: "ready-stance", label: "赛点预备姿态" },
      ],
      defaultValue: "serve-leap",
    },
    {
      id: "detail_focus",
      name: "细节焦点",
      type: "select",
      required: true,
      priority: 2,
      options: [
        { value: "visor-and-racket", label: "帽檐与球拍" },
        { value: "clay-dust-and-sneakers", label: "红土与球鞋" },
        { value: "sweat-and-wristband", label: "汗感与腕带" },
      ],
      defaultValue: "visor-and-racket",
    },
    {
      id: "graphic_energy",
      name: "版面能量",
      type: "select",
      required: true,
      priority: 3,
      options: [
        { value: "premium-red-white", label: "红白运动海报" },
        { value: "bold-sans-overlays", label: "粗体排版叠层" },
        { value: "polished-magazine-spread", label: "高端杂志跨页" },
      ],
      defaultValue: "premium-red-white",
    },
  ],
  skillPrompt:
    "Generate premium sports-magazine campaign collages with clean action storytelling, bold graphics, and aspirational editorial polish.",
  basePrompt:
    "Create a sport magazine campaign collage featuring the uploaded woman's exact face identity on a clay tennis court. Dress her in a sleeveless athletic dress, visor cap, sneakers, and wristband. Use {{hero_motion}} as the hero frame, add close-up detail panels focused on {{detail_focus}}, and design the full spread with {{graphic_energy}}, bright directional lighting, dramatic shadows, cinematic highlights, and a polished fashion-sport editorial finish.",
  negativePrompt:
    "low resolution, flat lighting, messy collage, duplicated limbs, warped hands, generic stock-sports look, cluttered typography, watermark",
  creditMultiplier: 1.3,
};
