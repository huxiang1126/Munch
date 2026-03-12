export const creamBacklightLingeriePortrait = {
  slug: "cream-backlight-lingerie-portrait",
  name: "奶油逆光内衣艺术肖像",
  description:
    "上传内衣参考图，生成奶油色极简背景中的电影感女性艺术肖像，强调单腿跪姿、深邃眼神、轻柔逆光与超现实空灵氛围。",
  category: "portrait" as const,
  tags: ["内衣", "艺术肖像", "逆光", "奶油色", "电影感"],
  thumbnail_url: null,
  thumbnail_path: null,
  default_model: "nano-banana-pro-4k" as const,
  compatible_models: ["nano-banana-pro-4k", "nano-banana-pro-2k", "nano-banana-2"] as const,
  default_image_size: { width: 1024, height: 1536 },
  variables: [
    {
      id: "lingerie_ref",
      name: "内衣参考图",
      type: "image" as const,
      required: true,
      priority: 0,
      accept: "image/jpeg,image/png,image/webp",
      maxSizeMB: 10,
      uploadHint: "请上传清晰的内衣参考图，用于固定款式、颜色、材质与细节",
    },
    {
      id: "hair_motion",
      name: "发丝状态",
      type: "select" as const,
      required: false,
      priority: 1,
      options: [
        { value: "soft wind lifting a few strands across the face", label: "轻柔拂面" },
        { value: "slightly stronger airflow with floating short hair strands", label: "更明显飘动" },
        { value: "subtle movement with only a few stray strands catching light", label: "克制微风感" },
      ],
      defaultValue: "soft wind lifting a few strands across the face",
    },
    {
      id: "light_profile",
      name: "光影强度",
      type: "select" as const,
      required: false,
      priority: 2,
      options: [
        { value: "a soft top backlight with a two-meter diffused source and a faint floor glow", label: "柔和逆光" },
        { value: "a stronger cinematic backlight beam with gentle floor bounce", label: "戏剧增强" },
        { value: "a restrained ethereal backlight with minimal spill and soft contour shaping", label: "空灵克制" },
      ],
      defaultValue: "a soft top backlight with a two-meter diffused source and a faint floor glow",
    },
    {
      id: "mood_tone",
      name: "整体氛围",
      type: "select" as const,
      required: false,
      priority: 3,
      options: [
        { value: "an ethereal surreal stillness", label: "空灵超现实" },
        { value: "a dramatic cinematic tension", label: "戏剧张力" },
        { value: "a minimal sensual editorial mood", label: "极简性感" },
      ],
      defaultValue: "an ethereal surreal stillness",
    },
  ],
  skill_prompt:
    "You are an expert fine-art portrait photographer. Create a cinematic artistic portrait of a short-haired Asian woman with a sensual but elegant body line. The model should be kneeling on one leg, looking directly into the camera with deep, focused eyes. Use the uploaded lingerie reference image as the exact wardrobe reference, preserving the lingerie's style, color, material, and key details. The set must feel lightweight, minimal, and surreal, with a creamy background and strong interplay of light and shadow. Emphasize the woman's facial contour, healthy skin retouching, glossy natural hair, and subtle strands of hair moving across the face in the wind. The mood should be atmospheric, refined, and visually dramatic rather than commercial.",
  base_prompt:
    "Create an artistic portrait of a short-haired Asian woman wearing the exact lingerie from the reference image. She has a sensual figure and is kneeling on one leg on the floor, facing the camera with a direct deep gaze. Use {{hair_motion}}. Set the scene against a clean creamy background with {{light_profile}}. Let the light reveal the contour of her facial features and body line, creating an airy surreal atmosphere with rich cinematic shadow interplay. The overall image should feel like {{mood_tone}}, with natural skin retouching, healthy hair sheen, and elegant editorial restraint.",
  negative_prompt:
    "busy background, commercial lingerie catalog, harsh flash, beauty filter, glossy glamour look, excessive makeup, plastic skin, messy pose, standing pose, wrong outfit, frontal flat lighting, text, watermark, logo, deformed hands, distorted anatomy, extra limbs",
  credit_multiplier: 1.9,
  is_published: true,
  sort_order: 7,
  tier_required: "free" as const,
};
