export const lowAngleNewspaperEditorial = {
  slug: "low-angle-newspaper-editorial",
  name: "极低机位欧陆街头 Editorial",
  description:
    "上传人物参考图，生成极低机位拍摄的欧陆街头时装 Editorial 画面，强调宽腿灯芯绒长裤、运动鞋前景、报纸道具与新哥特建筑的向上张力。",
  category: "fashion" as const,
  tags: ["Editorial", "街头时尚", "低机位", "欧陆建筑", "报纸道具"],
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
      uploadHint: "请上传清晰的人物参考图，用于固定五官和人物身份一致性",
    },
    {
      id: "building_mood",
      name: "建筑氛围",
      type: "select" as const,
      required: false,
      priority: 1,
      options: [
        {
          value: "a majestic neo-gothic European facade with ornate spires and arched windows",
          label: "新哥特正统感",
        },
        {
          value: "a dramatic historic European facade with ornate vertical lines and cathedral-like windows",
          label: "历史戏剧感",
        },
        {
          value: "a refined European architectural backdrop with sculptural spires and elegant arches",
          label: "精致雕塑感",
        },
      ],
      defaultValue: "a majestic neo-gothic European facade with ornate spires and arched windows",
    },
    {
      id: "editorial_tone",
      name: "时装气质",
      type: "select" as const,
      required: false,
      priority: 2,
      options: [
        {
          value: "a hyper-realistic editorial street-fashion mood with cinematic scale",
          label: "超写实大片感",
        },
        {
          value: "a clean high-contrast street-fashion mood with modern confidence",
          label: "清晰利落感",
        },
        {
          value: "a bold supermodel street-editorial mood with architectural drama",
          label: "超模建筑感",
        },
      ],
      defaultValue: "a hyper-realistic editorial street-fashion mood with cinematic scale",
    },
  ],
  skill_prompt:
    "You are an expert editorial street-fashion photographer. Use the uploaded model reference image to preserve the exact face identity and do not alter facial features. Create a hyper-realistic street-fashion portrait of a female supermodel holding an oversized newspaper in front of her while leaning casually against a black lamp post. The camera is placed at an extreme ground-level low angle and looks upward with a wide-angle lens. The composition must be vertical, cinematic, and architecturally powerful. Foreground sneakers and wide beige corduroy pants should dominate in razor-sharp detail, while the face stays crisp above. The setting is a stone-paved sidewalk in front of a majestic neo-gothic European building with ornate spires and arched windows. Use natural daylight with sharp shadows and crisp contrast. The overall image should feel cinematic, fashion-forward, detailed, and editorial rather than commercial catalog photography.",
  base_prompt:
    "Create a hyper-realistic editorial street-fashion photograph using the exact facial identity from the reference image. The female model is styled as a supermodel in fashion-forward layered casual streetwear, wearing wide beige corduroy pants and sneakers, holding an oversized newspaper in front of her while leaning casually against a black lamp post. She stands on a stone-paved sidewalk in front of {{building_mood}}. Shoot from an extreme low-angle ground-level perspective with a wide-angle lens in a vertical 9:16 composition. Let the sneakers and wide beige corduroy pants dominate the foreground in razor-sharp detail, while the face remains crisply in focus above. Use natural daylight, sharp shadows, crisp contrast, and upward compositional lines to emphasize scale. The final image should feel like {{editorial_tone}}, with crisp textures, architectural drama, and strong cinematic presence.",
  negative_prompt:
    "beauty filter, studio flash, flat e-commerce photo, catalog styling, telephoto compression, weak foreground, soft blurry shoes, altered facial features, commercial product shot, busy crowd, modern generic building, text, watermark, logo, deformed limbs, distorted anatomy",
  credit_multiplier: 1.7,
  is_published: true,
  sort_order: 8,
  tier_required: "free" as const,
};
