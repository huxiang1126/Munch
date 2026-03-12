import type { Template } from "@/types/template";

export const fashionRicefieldSpin: Template = {
  id: "fashion-ricefield-spin",
  name: "稻田低机位旋身照",
  description: "基于 PDF 中结构完整的稻田 prompt 整理，适合测试自然风场景和人物一致性。",
  category: "fashion",
  tags: ["Ricefield", "Portrait", "Outdoor", "Test"],
  thumbnailUrl: "/images/logo.svg",
  defaultModel: "nano-banana-2",
  compatibleModels: ["nano-banana-2", "nano-banana-pro-4k", "nano-banana-pro-2k"],
  defaultImageSize: { width: 1024, height: 1280 },
  variables: [
    {
      id: "movement",
      name: "动作状态",
      type: "select",
      required: true,
      priority: 1,
      options: [
        { value: "gentle-spin", label: "轻微旋身" },
        { value: "arms-open-joy", label: "张臂轻快" },
        { value: "turning-glance", label: "回身看镜头" },
      ],
      defaultValue: "gentle-spin",
    },
    {
      id: "camera_expression",
      name: "镜头表达",
      type: "select",
      required: true,
      priority: 2,
      options: [
        { value: "low-angle-through-rice", label: "穿过稻穗的低机位" },
        { value: "full-body-centered", label: "全身居中" },
        { value: "foreground-bokeh", label: "前景强虚化" },
      ],
      defaultValue: "low-angle-through-rice",
    },
    {
      id: "light_mood",
      name: "光线氛围",
      type: "select",
      required: true,
      priority: 3,
      options: [
        { value: "golden-hour-warmth", label: "金色暖光" },
        { value: "backlit-harvest-glow", label: "逆光麦浪光晕" },
        { value: "soft-side-sun", label: "柔和侧光" },
      ],
      defaultValue: "golden-hour-warmth",
    },
  ],
  skillPrompt:
    "Generate poetic outdoor fashion portraits with low perspective, strong foreground bokeh, preserved identity, and subtle motion realism.",
  basePrompt:
    "Create a full-body fashion portrait of the uploaded woman in a vast golden rice field. Capture a {{movement}} motion with {{camera_expression}}, keep the face and torso tack-sharp, allow only slight blur on hands or hem, use {{light_mood}}, add out-of-focus rice panicles framing the image, a clean horizon, wind-blown hair, and a cinematic minimal mood with fine film grain.",
  negativePrompt:
    "heavy motion blur, face out of focus, harsh digital contrast, neon color cast, crowds, buildings, logos, clutter, tilted horizon",
  creditMultiplier: 1.2,
};
