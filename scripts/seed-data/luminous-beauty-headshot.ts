export const luminousBeautyHeadshot = {
  slug: "luminous-beauty-headshot",
  name: "白底高级感美妆头肩像",
  description:
    "上传人物参考图，生成纯白背景下的高端美妆 Editorial 头肩像，强调自然光泽肌、细微雀斑、对称构图与奢华极简气质。",
  category: "portrait" as const,
  tags: ["美妆", "头肩像", "白底", "Editorial", "高级感"],
  thumbnail_url: null,
  thumbnail_path: null,
  default_model: "nano-banana-pro-4k" as const,
  compatible_models: ["nano-banana-pro-4k", "nano-banana-pro-2k", "nano-banana-2"] as const,
  default_image_size: { width: 1024, height: 1536 },
  variables: [
    {
      id: "face_ref",
      name: "人物参考图",
      type: "image" as const,
      required: true,
      priority: 0,
      accept: "image/jpeg,image/png,image/webp",
      maxSizeMB: 10,
      uploadHint: "请上传清晰的人物正脸参考图，用于固定五官、眉眼和脸部结构",
    },
    {
      id: "skin_finish",
      name: "肌肤质感",
      type: "select" as const,
      required: false,
      priority: 1,
      options: [
        {
          value: "smooth luminous dewy skin with subtle freckles across the cheeks and nose",
          label: "自然光泽肌",
        },
        {
          value: "soft radiant skin with delicate freckles and a refined hydrated glow",
          label: "柔润保湿感",
        },
        {
          value: "clean editorial skin with natural glow, preserved pores, and gentle freckles",
          label: "编辑部真实肌",
        },
      ],
      defaultValue: "smooth luminous dewy skin with subtle freckles across the cheeks and nose",
    },
    {
      id: "luxury_mood",
      name: "品牌气质",
      type: "select" as const,
      required: false,
      priority: 2,
      options: [
        {
          value: "a serene confident Vogue Beauty mood",
          label: "Vogue Beauty 感",
        },
        {
          value: "a refined luxurious Dior beauty campaign mood",
          label: "Dior 高奢感",
        },
        {
          value: "an elegant minimal Estee Lauder-style beauty mood",
          label: "雅诗兰黛式极简感",
        },
      ],
      defaultValue: "a refined luxurious Dior beauty campaign mood",
    },
  ],
  skill_prompt:
    "You are an expert luxury beauty editorial photographer and retoucher. Use the uploaded face reference image to preserve the exact facial features, bone structure, brows, eyes, lips, and overall identity. Create a luminous high-fashion editorial headshot portrait of a female model facing the camera straight on, with the full neck and shoulders visible and absolutely no hands inside the frame. Her hair must be slicked back tightly to emphasize facial symmetry and bone structure. The mood should feel serene, confident, minimalist, and luxurious, like a modern beauty campaign for Vogue Beauty, Dior, or Estee Lauder. Use soft, even, high-end studio lighting against a pure white background. Avoid harsh shadows, distracting props, clutter, exaggerated makeup, or plastic over-retouching.",
  base_prompt:
    "Create a hyperrealistic high-fashion editorial head-and-shoulders portrait using the exact facial identity from the reference image. The female model faces the camera straight on in a symmetrical composition, with her full neck and shoulders visible and no hands in frame. Her hair is slicked back tightly, drawing full attention to her face. She has {{skin_finish}}, strong defined brows, and neutral glossy lips, creating a minimalist luxury beauty look. Use soft even studio lighting on a pure white background to emphasize natural skin tones, contours, highlights, and refined warm color grading. Preserve natural skin texture while enhancing the glow, and keep cinematic sharpness in the eyes and brows. The final image should feel like {{luxury_mood}}, with a serene, confident, and luxurious editorial finish.",
  negative_prompt:
    "low resolution, flat lighting, harsh shadows, busy background, distracting props, hands in frame, over-retouched plastic skin, cartoon style, exaggerated makeup, messy hair, asymmetrical framing, text, watermark, logo, distorted facial features",
  credit_multiplier: 1.5,
  is_published: true,
  sort_order: 9,
  tier_required: "free" as const,
};
