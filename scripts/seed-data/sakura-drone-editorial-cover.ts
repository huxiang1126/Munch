export const sakuraDroneEditorialCover = {
  slug: "sakura-drone-editorial-cover",
  name: "樱花航拍日杂封面",
  description:
    "上传人物面部参考图和全身服装参考图，生成日杂《FUDGE / CLUEL》风格的樱花花园航拍时尚封面大片。",
  category: "fashion" as const,
  tags: ["樱花", "日杂", "封面", "航拍", "时尚人像", "FUDGE", "CLUEL"],
  thumbnail_url: null,
  thumbnail_path: null,
  default_model: "nano-banana-pro-4k" as const,
  compatible_models: [
    "nano-banana-pro-4k",
    "nano-banana-pro-2k",
    "nano-banana-2-4k",
    "nano-banana-2-2k",
  ] as const,
  default_image_size: { width: 1080, height: 1920 },
  variables: [
    {
      id: "face_ref",
      name: "面部参考图",
      type: "image" as const,
      required: true,
      priority: 0,
      accept: "image/jpeg,image/png,image/webp",
      maxSizeMB: 10,
      uploadHint: "请上传一张清晰的人物面部参考图，用于锁定五官与身份一致性",
    },
    {
      id: "outfit_ref",
      name: "全身服装参考图",
      type: "image" as const,
      required: true,
      priority: 1,
      accept: "image/jpeg,image/png,image/webp",
      maxSizeMB: 10,
      uploadHint: "请上传完整全身穿搭参考图，用于还原服装、廓形和细节",
    },
    {
      id: "cover_mood",
      name: "封面气质",
      type: "select" as const,
      required: false,
      priority: 2,
      options: [
        {
          value: "a light, airy, clean Japanese fashion-cover mood with relaxed confidence",
          label: "轻盈清新",
        },
        {
          value: "a youthful spring editorial mood with soft poetry and effortless confidence",
          label: "春日诗意",
        },
        {
          value: "a refined casual magazine-cover mood inspired by FUDGE and CLUEL",
          label: "日杂封面感",
        },
      ],
      defaultValue: "a refined casual magazine-cover mood inspired by FUDGE and CLUEL",
    },
    {
      id: "foreground_blossom",
      name: "前景樱花层次",
      type: "select" as const,
      required: false,
      priority: 3,
      options: [
        {
          value: "a subtle translucent layer of blurred sakura partially veiling the lens",
          label: "淡淡樱雾",
        },
        {
          value: "a denser dreamy foreground veil of blurred cherry blossoms near the lens edges",
          label: "梦幻花雾",
        },
        {
          value: "a lighter and cleaner foreground with only a few blurred sakura accents",
          label: "轻透前景",
        },
      ],
      defaultValue: "a subtle translucent layer of blurred sakura partially veiling the lens",
    },
  ],
  skill_prompt:
    "You are a world-class Japanese magazine fashion photographer and cover director. Use the uploaded face reference to preserve the subject's exact facial identity, proportions, and hairstyle, and use the uploaded full-body outfit reference to restore the clothing with high fidelity. Create a highly realistic outdoor fashion portrait in a Japanese editorial cover style inspired by FUDGE and CLUEL. The image must feel clean, natural, bright, youthful, poetic, and wearable rather than glamorous or over-stylized. The scene is a spacious cherry blossom garden in clear spring weather, with layered pink blossoms, fresh air, natural depth, and authentic seasonal detail. The subject is tall, slender, and long-legged, walking through the sakura grove with effortless confidence. The overall mood must feel like a real magazine cover shot captured on a clear day in spring.",
  base_prompt:
    "Create a 9:16 full-body Japanese editorial fashion cover portrait set in a cherry blossom garden in full bloom. The face must match the uploaded face reference exactly, and the full outfit must match the uploaded clothing reference with precise fabric texture, seams, drape, and silhouette. The subject is a tall, proportionate woman with long legs and a short bob haircut, walking naturally through the sakura grove. A gentle breeze lifts several strands of hair across part of her face. Use a dramatic drone overhead perspective looking down through dense blooming cherry trees, with the subject positioned on a blossom-lined path or open clearing between the trees, looking slightly upward with a natural smile. Include {{foreground_blossom}}. Keep the composition airy and layered, with foreground blossoms extending to the frame edges as a soft translucent pink veil. Lighting is bright clear spring daylight with soft sunshine, clean highlights, low contrast, and natural glow on skin, hair, and clothing, avoiding harsh noon shadows. Shot on Canon R5, 50mm lens, f/1.8, shallow depth of field, with strong foreground blur, soft background blur, realistic optical falloff, and refined magazine-grade retouching. The final image should embody {{cover_mood}}, with gentle sakura pink tones, soft skin rendering, realistic fabric detail, natural wind movement, and a spacious spring atmosphere.",
  negative_prompt:
    "glamorous luxury gown, excessive cinematic color grading, oversaturated pink, strong contrast, noon harsh shadows, plastic skin, fake hair strands, distorted face, wrong outfit, deformed limbs, awkward walking pose, cluttered background, text, watermark, logo, low detail, flat e-commerce look, artificial CGI look",
  credit_multiplier: 2.1,
  is_published: true,
  sort_order: 6,
  tier_required: "free" as const,
};
