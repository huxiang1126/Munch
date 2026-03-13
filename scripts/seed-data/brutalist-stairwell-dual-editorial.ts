export const brutalistStairwellDualEditorial = {
  slug: "brutalist-stairwell-dual-editorial",
  name: "双主体野兽派楼梯间闪光大片",
  description:
    "上传两位主体的人物参考图，生成野兽派混凝土楼梯间中的双主体高定社论大片；可选上传各自服装参考图以锁定穿搭细节。",
  category: "fashion" as const,
  tags: ["双主体", "Editorial", "楼梯间", "闪光灯", "野兽派", "高定时尚", "人像"],
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
      id: "subject_a_face_ref",
      name: "主体甲人物参考图",
      type: "image" as const,
      required: true,
      priority: 0,
      accept: "image/jpeg,image/png,image/webp",
      maxSizeMB: 10,
      uploadHint: "请上传主体甲的清晰面部参考图，用于严格锁定五官与身份一致性。",
    },
    {
      id: "subject_b_face_ref",
      name: "主体乙人物参考图",
      type: "image" as const,
      required: true,
      priority: 1,
      accept: "image/jpeg,image/png,image/webp",
      maxSizeMB: 10,
      uploadHint: "请上传主体乙的清晰面部参考图，用于严格锁定五官与身份一致性。",
    },
    {
      id: "subject_a_outfit_ref",
      name: "主体甲服装参考图",
      type: "image" as const,
      required: false,
      priority: 2,
      accept: "image/jpeg,image/png,image/webp",
      maxSizeMB: 10,
      uploadHint: "可选上传主体甲的完整服装参考图；若上传，则优先按参考图还原整套穿搭。",
    },
    {
      id: "subject_b_outfit_ref",
      name: "主体乙服装参考图",
      type: "image" as const,
      required: false,
      priority: 3,
      accept: "image/jpeg,image/png,image/webp",
      maxSizeMB: 10,
      uploadHint: "可选上传主体乙的完整服装参考图；若上传，则优先按参考图还原整套穿搭。",
    },
    {
      id: "flash_tension",
      name: "闪光张力",
      type: "select" as const,
      required: false,
      priority: 4,
      options: [
        {
          value: "raw direct on-camera flash with sharp chiaroscuro and fierce editorial bite",
          label: "原始硬闪",
        },
        {
          value: "clean high-fashion flash with strong contrast but controlled specular highlights",
          label: "高定控制感",
        },
        {
          value: "brutal direct flash with aggressive shadow geometry and a rebellious editorial edge",
          label: "叛逆戏剧感",
        },
      ],
      defaultValue: "raw direct on-camera flash with sharp chiaroscuro and fierce editorial bite",
    },
    {
      id: "stairwell_mood",
      name: "空间气质",
      type: "select" as const,
      required: false,
      priority: 5,
      options: [
        {
          value: "a minimal brutalist stairwell mood with sculptural geometry and severe white walls",
          label: "极简野兽派",
        },
        {
          value: "a more luxurious editorial mood with sculptural staircase drama and polished tension",
          label: "高定空间感",
        },
        {
          value: "a colder architectural mood with hard concrete lines and raw fashion energy",
          label: "冷峻建筑感",
        },
      ],
      defaultValue: "a minimal brutalist stairwell mood with sculptural geometry and severe white walls",
    },
  ],
  skill_prompt:
    "You are a world-class high-fashion editorial photographer directing a brutalist staircase flash campaign with two distinct female subjects. Preserve the exact identity of each uploaded face reference with absolute priority over styling, lighting, makeup, mood, or fashion tropes. Never collapse both subjects into generic beauty faces, celebrity-like faces, or AI-fashion faces. Subject A must remain a sculptural, athletic mesomorphic figure with short dark hair, black onyx nails, and a tailored school-uniform-meets-editorial wardrobe. Subject B must remain a toned hourglass figure with her own exact face identity, realistic skin texture, and either her true uploaded hairstyle or an elegant long ombre editorial hair treatment if no hairstyle reference is provided. If outfit references are uploaded for either subject, match those garments exactly; otherwise use the wardrobes specified in the prompt. The scene is a minimalist brutalist concrete stairwell with white plaster walls, gray concrete steps, terracotta stair edges, an industrial black handrail, and hard geometric shadows. The image must feel like raw flash editorial photography with direct on-camera flash, severe chiaroscuro, strong facial fidelity, sharp hands and feet, and fashion-magazine polish without CGI smoothness.",
  base_prompt:
    "Create a 9:16 high-fashion editorial image featuring two female subjects inside {{stairwell_mood}}. Subject A must match the first uploaded face reference exactly in facial structure, eye shape, brow structure, nose, lips, jawline, forehead proportion, skin tone, and overall recognition. Subject B must match the second uploaded face reference exactly with the same level of forensic facial fidelity. If outfit references are uploaded for either subject, match them exactly; otherwise dress Subject A in a white structured cotton poplin button-up shirt, a fitted single-breasted grey Prince of Wales plaid blazer, a deep dark-crimson satin tie, and a matching grey plaid pleated micro mini skirt, barefoot on concrete. Dress Subject B in an oversized black structured wool blazer worn open over bare skin with high-waisted black tailored short bottoms, also barefoot. Build an asymmetrical editorial group pose: Subject A leans back against a white plaster wall with one leg bent and foot placed on a step; Subject B stands one step higher, leaning slightly forward with one hand resting on Subject A's shoulder; together their bodies and the stair geometry form a diagonal X composition. Both subjects stare directly into camera with cold, self-possessed editorial intensity and slightly parted lips. Shoot as a full-body to medium-long shot using a 50mm prime lens, f/2.8, ISO 200, 8K detail, with direct high-intensity on-camera flash, razor-sharp facial detail, sharp feet and hands, and {{flash_tension}}. Preserve realistic pores, skin texture, fabric seams, drape, plaid texture, hair physics, black onyx manicure details, and brutalist architectural tension.",
  negative_prompt:
    "generic ai beauty face, celebrity face, face drift, swapped identity, different person, beauty filter, over-smoothed skin, CGI plastic texture, extra limbs, extra fingers, merged toes, broken anatomy, distorted hands, distorted feet, shoes, socks, stockings, glasses, logo, watermark, text, low detail, low resolution, weak flash, soft catalog lighting, glam studio portrait, excessive retouching, makeup hiding identity, altered bone structure",
  credit_multiplier: 2.2,
  is_published: true,
  sort_order: 9,
  tier_required: "free" as const,
};
