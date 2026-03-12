export const slitLightPortrait = {
  slug: "slit-light-portrait",
  name: "橙光缝隙剪影肖像",
  description:
    "上传人物五官参考图，生成奶油色极简背景中的电影感缝隙光艺术肖像，强调侧颜轮廓、暗红西装与超现实空灵氛围。",
  category: "portrait" as const,
  tags: ["肖像", "缝隙光", "剪影", "电影感", "艺术肖像"],
  thumbnail_url: null,
  thumbnail_path: null,
  default_model: "nano-banana-pro-4k" as const,
  compatible_models: ["nano-banana-pro-4k", "nano-banana-pro-2k", "nano-banana-2"] as const,
  default_image_size: { width: 1024, height: 1536 },
  variables: [
    {
      id: "face_ref",
      name: "人物五官参考图",
      type: "image" as const,
      required: true,
      priority: 0,
      accept: "image/jpeg,image/png,image/webp",
      maxSizeMB: 10,
      uploadHint: "请上传清晰的人物五官参考图，尽量保证面部轮廓和侧颜特征可识别",
    },
    {
      id: "suit_shape",
      name: "西装廓形",
      type: "select" as const,
      required: false,
      priority: 1,
      options: [
        { value: "a sharp tailored dark red blazer", label: "利落剪裁" },
        { value: "an oversized dark red blazer", label: "宽松慵懒" },
        { value: "a draped dark red blazer with soft structure", label: "柔和垂坠" },
      ],
      defaultValue: "a sharp tailored dark red blazer",
    },
    {
      id: "beam_intensity",
      name: "光束强度",
      type: "select" as const,
      required: false,
      priority: 2,
      options: [
        { value: "a very narrow slit of light with restrained spill", label: "极窄光缝" },
        { value: "a narrow slit of light with soft edge diffusion", label: "柔和光缝" },
        { value: "a slightly broader slit of light with cinematic contrast", label: "戏剧强化" },
      ],
      defaultValue: "a narrow slit of light with soft edge diffusion",
    },
    {
      id: "mood_tone",
      name: "情绪氛围",
      type: "select" as const,
      required: false,
      priority: 3,
      options: [
        { value: "an ethereal surreal stillness", label: "空灵超现实" },
        { value: "a dramatic cinematic tension", label: "戏剧张力" },
        { value: "a quiet luxurious editorial mood", label: "克制高级感" },
      ],
      defaultValue: "an ethereal surreal stillness",
    },
  ],
  skill_prompt:
    "You are an expert fine-art portrait director. Use the face reference image to preserve the woman's facial identity and side-profile structure. Create a front-facing body portrait where the face turns into profile, emphasizing silhouette, jawline, nose bridge, and facial contour with a single slit of soft orange light. The scene must feel minimal, airy, surreal, and cinematic, with strong interplay between light and shadow. Avoid clutter, avoid commercial fashion polish, and keep the composition elegant, restrained, and visually dramatic.",
  base_prompt:
    "Create an artistic portrait of a woman using the exact facial identity from the reference image. Her body faces the camera, but her face is turned into side profile. She is wearing only {{suit_shape}}, styled to emphasize a sensual elegant silhouette. The background is a clean creamy neutral backdrop. Use {{beam_intensity}} in soft orange light (#C07858) cast across her body and face, revealing the contour of her features through light and shadow. The composition should feel weightless, minimal, surreal, and cinematic, with refined dramatic contrast and {{mood_tone}}.",
  negative_prompt:
    "studio flash, busy background, multiple light sources, frontal face, smiling beauty shot, commercial catalog look, glossy fashion campaign, colorful props, harsh HDR, text, watermark, logo, deformed hands, distorted facial features, extra garments",
  credit_multiplier: 1.6,
  is_published: true,
  sort_order: 4,
  tier_required: "free" as const,
};
