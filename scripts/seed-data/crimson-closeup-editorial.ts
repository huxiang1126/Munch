export const crimsonCloseupEditorial = {
  slug: "crimson-closeup-editorial",
  name: "深红低机位面部特写",
  description:
    "上传女性人物参考图，生成深红背景下的超近距离高定 Editorial 面部特写，强调低机位、强烈光影反差、建筑感骨相与冷静疏离的现代女性气质。",
  category: "portrait" as const,
  tags: ["特写", "深红背景", "Editorial", "低机位", "高定肖像"],
  thumbnail_url: null,
  thumbnail_path: null,
  default_model: "nano-banana-pro-4k" as const,
  compatible_models: ["nano-banana-pro-4k", "nano-banana-pro-2k", "nano-banana-2"] as const,
  default_image_size: { width: 1024, height: 1536 },
  variables: [
    {
      id: "face_ref",
      name: "女性人物参考图",
      type: "image" as const,
      required: true,
      priority: 0,
      accept: "image/jpeg,image/png,image/webp",
      maxSizeMB: 10,
      uploadHint: "请上传清晰的女性人物近景参考图，仅用于固定五官与身份，不改变脸部特征",
    },
    {
      id: "light_profile",
      name: "光影强度",
      type: "select" as const,
      required: false,
      priority: 1,
      options: [
        {
          value: "stark directional light with one side glowing warm gold and the other in velvety shadow",
          label: "强烈对比",
        },
        {
          value: "tightly controlled cinematic light with precise golden highlights and deep sculptural shadow",
          label: "雕塑感光影",
        },
        {
          value: "refined editorial contrast with warm facial highlights and soft dense shadow",
          label: "克制高定感",
        },
      ],
      defaultValue: "stark directional light with one side glowing warm gold and the other in velvety shadow",
    },
    {
      id: "expression_tone",
      name: "神情气质",
      type: "select" as const,
      required: false,
      priority: 2,
      options: [
        {
          value: "an unreadable cool expression with half-lidded eyes and relaxed lips",
          label: "冷感疏离",
        },
        {
          value: "a quietly defiant expression with calm eyes and restrained lips",
          label: "静默反叛",
        },
        {
          value: "a serene but dominant editorial expression with detached confidence",
          label: "安静压迫感",
        },
      ],
      defaultValue: "an unreadable cool expression with half-lidded eyes and relaxed lips",
    },
  ],
  skill_prompt:
    "You are an expert high-fashion portrait photographer. Use the uploaded female model reference as the only face and identity reference, and keep the facial identity unchanged. Create a hyperrealistic vertical close-up portrait, almost entirely filling the frame with the face, shot from a slightly low upward-facing angle to dramatize the jawline and neck. The background must be a deep saturated crimson red. The image should feel sculptural, modern, isolated, and quietly dominant. Lighting must be tightly directional with strong cinematic contrast, precise catchlight, and architectural rendering of the bone structure. Minimal retouching should preserve natural pores and realistic skin texture. No props, no logos, no text, no watermark, and no clutter.",
  base_prompt:
    "Create a hyperrealistic vertical close-up portrait using the exact female identity from the reference image. The camera is very close, framing almost only the face, from a slightly low upward angle to emphasize the jawline and neck. The subject wears a black high-cut dress with a high collar and a gold necklace. Set the background to a deep saturated crimson red. Use {{light_profile}}. Keep the skin luminous and dewy, with realistic pores and slight natural imperfections, and render the facial bone structure with architectural precision. The expression should feel like {{expression_tone}}. The final image should have intense editorial tension through close cropping, tonal control, intimate camera proximity, and hyper-modern femininity, with no props or background distractions.",
  negative_prompt:
    "brand logos, text, watermark, cluttered background, extra props, smiling glamour pose, plastic skin, over-retouching, flat lighting, weak contrast, altered facial identity, messy accessories, deformed facial features, distorted anatomy",
  credit_multiplier: 1.6,
  is_published: true,
  sort_order: 11,
  tier_required: "free" as const,
};
