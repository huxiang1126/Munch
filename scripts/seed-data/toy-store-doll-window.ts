export const toyStoreDollWindow = {
  slug: "toy-store-doll-window",
  name: "橱窗分身玩偶",
  description:
    "上传人物参考图，生成高端街拍感的玩具店橱窗场景：真人从橱窗外匆匆走过看手机，橱窗内摆放与她高度一致的卡通玩偶版本，强调玻璃反射与现实/玩偶之间的身份呼应。",
  category: "fashion" as const,
  tags: ["橱窗", "玩偶", "街拍", "高端时尚", "分身"],
  thumbnail_url: null,
  thumbnail_path: null,
  default_model: "nano-banana-pro-4k" as const,
  compatible_models: ["nano-banana-pro-4k", "nano-banana-pro-2k", "nano-banana-2"] as const,
  default_image_size: { width: 1024, height: 1820 },
  variables: [
    {
      id: "face_ref",
      name: "人物参考图",
      type: "image" as const,
      required: true,
      priority: 0,
      accept: "image/jpeg,image/png,image/webp",
      maxSizeMB: 10,
      uploadHint: "请上传清晰的人物参考图，用于固定真人与玩偶版本的脸部、发型、体型与穿搭一致性",
    },
    {
      id: "window_mood",
      name: "橱窗氛围",
      type: "select" as const,
      required: false,
      priority: 1,
      options: [
        {
          value: "a polished luxury toy store window with crisp reflections and clean display lighting",
          label: "高端精品感",
        },
        {
          value: "a bright premium storefront window with layered reflections and elegant merchandising",
          label: "明亮时装感",
        },
        {
          value: "a glossy upscale display window with refined reflections and strong visual depth",
          label: "镜面层次感",
        },
      ],
      defaultValue: "a polished luxury toy store window with crisp reflections and clean display lighting",
    },
    {
      id: "doll_style",
      name: "玩偶风格",
      type: "select" as const,
      required: false,
      priority: 2,
      options: [
        {
          value: "a cute full-height animated doll with big eyes and softened stylized proportions",
          label: "可爱大眼玩偶",
        },
        {
          value: "a premium fashion-doll interpretation with cute oversized eyes and elegant cartoon stylization",
          label: "高定时装玩偶",
        },
        {
          value: "a refined collectible doll version with big expressive eyes and polished animated charm",
          label: "收藏级玩偶感",
        },
      ],
      defaultValue: "a cute full-height animated doll with big eyes and softened stylized proportions",
    },
  ],
  skill_prompt:
    "You are an expert street-fashion and retail-window photographer. Use the uploaded female reference image as the only identity source. The real woman outside the window must preserve the exact face, facial proportions, skin texture, pores, hairstyle, body shape, and outfit from the reference image. Inside the toy-store window, create a full-height cartoon-style doll version of the same woman that also preserves the exact recognizable identity, hairstyle, and outfit, but translated into a cute big-eyed animated aesthetic. The scene must feel premium, bright, and hyper-realistic, with convincing reflections on the glass, elegant visual separation between exterior and display interior, and a strong conceptual relationship between the real woman and her stylized doll counterpart.",
  base_prompt:
    "Create a bright high-end street-fashion photograph in a vertical 9:16 composition using the exact woman from the reference image. She is outside a luxury toy-store window, walking briskly while looking at her phone with one hand. Her face, hair, body shape, skin texture, and outfit must match the reference image precisely. The storefront should feel like {{window_mood}}. Inside the display window, place a full-height doll version of her styled as {{doll_style}}. The doll must still clearly match the same woman's facial identity, hairstyle, body styling, and outfit, even though it is transformed into a cute animated collectible. Emphasize realistic glass reflections, premium daylight, clean retail lighting, and the visual relationship between the real woman outside and the stylized doll inside. Keep the image photorealistic, polished, and fashion-forward.",
  negative_prompt:
    "wrong face identity, mismatched outfit, wrong hairstyle, generic doll, extra people, cluttered storefront, low-end toy shop, flat lighting, unrealistic glass, distorted reflections, text, watermark, logo, deformed anatomy, broken doll proportions, cartoon background",
  credit_multiplier: 1.9,
  is_published: true,
  sort_order: 14,
  tier_required: "free" as const,
};
