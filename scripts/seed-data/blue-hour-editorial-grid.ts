export const blueHourEditorialGrid = {
  slug: "blue-hour-editorial-grid",
  name: "蓝调时刻 Editorial 九宫格",
  description:
    "上传人物肖像图和穿搭参考图，生成 3x3 户外蓝调时刻街头 Editorial 九宫格，包含黑白近景、全身远景、侧颜特写与城市氛围镜头。",
  category: "fashion" as const,
  tags: ["Editorial", "九宫格", "蓝调时刻", "街头时尚", "人像穿搭"],
  thumbnail_url: null,
  thumbnail_path: null,
  default_model: "nano-banana-pro-4k" as const,
  compatible_models: ["nano-banana-pro-4k", "nano-banana-pro-2k", "nano-banana-2"] as const,
  default_image_size: { width: 1536, height: 1536 },
  variables: [
    {
      id: "face_ref",
      name: "人物肖像参考图",
      type: "image" as const,
      required: true,
      priority: 0,
      accept: "image/jpeg,image/png,image/webp",
      maxSizeMB: 10,
      uploadHint: "请上传清晰的人物肖像图，用于固定人物五官和身份一致性",
    },
    {
      id: "outfit_ref",
      name: "穿搭参考图",
      type: "image" as const,
      required: true,
      priority: 1,
      accept: "image/jpeg,image/png,image/webp",
      maxSizeMB: 10,
      uploadHint: "请上传完整穿搭参考图，用于替换服装、配饰和整体造型",
    },
    {
      id: "location_bias",
      name: "场景倾向",
      type: "select" as const,
      required: false,
      priority: 2,
      options: [
        {
          value: "an urban waterfront or skyline-edge location with moody depth",
          label: "临水天际线",
        },
        {
          value: "a city rooftop or elevated terrace with railings and open twilight sky",
          label: "屋顶平台",
        },
        {
          value: "a modern street-fashion location with subtle city lights and layered urban silhouettes",
          label: "都市街头",
        },
      ],
      defaultValue: "an urban waterfront or skyline-edge location with moody depth",
    },
    {
      id: "grid_tone",
      name: "整体情绪",
      type: "select" as const,
      required: false,
      priority: 3,
      options: [
        {
          value: "an introspective clean editorial mood with modern street-fashion flair",
          label: "冷静沉思",
        },
        {
          value: "a more dramatic cinematic mood with stronger contrast and depth",
          label: "戏剧电影感",
        },
        {
          value: "a polished fashion-story mood with subtle attitude and restraint",
          label: "克制时装感",
        },
      ],
      defaultValue: "an introspective clean editorial mood with modern street-fashion flair",
    },
  ],
  skill_prompt:
    "You are an expert editorial fashion photographer and contact-sheet director. Use the uploaded portrait image to anchor the model's face, identity, and Korean/Asian appearance consistently across all nine frames. Use the uploaded outfit image as the exact wardrobe reference, replacing any default clothing with the uploaded outfit while preserving accessories and styling details. Create a seamless 3x3 outdoor photo grid captured during blue hour, with cinematic urban atmosphere and subtle background blur for mood. Lighting should feel like a cinematic editorial setup: a key softbox or strobe from the left-front, soft fill on the right, and a faint rim light shaping the cap, hair, shoulders, and accessories. Preserve deep atmospheric blues, warm skin tones, and reflective highlights on jewelry and bag-chain details. The final sheet should feel clean, introspective, modern, and fashion-forward, with RAW-like tonal latitude and controlled shallow depth of field.",
  base_prompt:
    "Create a seamless 3x3 editorial contact-sheet outdoors during blue hour in {{location_bias}}. The same tall Korean female model from the portrait reference wears the exact outfit and accessories from the outfit reference. Keep the overall grid unified in blue-hour color balance and mood, with {{grid_tone}}. Include these nine distinct shots within the grid: (1) a very close black-and-white portrait with a hand reaching toward the camera, foreground blur, and eyes in focus; (2) a full-body standing frame near a railing or chair with wide negative space and city silhouettes or water behind; (3) a medium close seated pose with the head tilted back and a moody sky; (4) a mid-shot adjusting the bag strap or cap brim with candid energy; (5) a tight crop of eyes peeking under the cap brim with intense gaze; (6) a three-quarter body frame with the head down and a hand scratching the neck under soft rim light; (7) a black-and-white side-profile close-up with faint highlight on the hair; (8) a distant full-body shot with the subject small in frame against an expansive twilight sky; and (9) a close frontal portrait with expressive eyes and hands in the foreground lit by soft strobe. Keep most camera angles near eye level, but include subtle low-angle and high-angle variations for mood. Emphasize blue-hour cinematic tones, street-fashion textures, jewelry glints, bag-chain details, and shallow depth of field without turning the set into a commercial DSLR shoot.",
  negative_prompt:
    "studio catalog, beauty campaign, flat e-commerce lighting, flash, over-retouched skin, excessive bokeh, beauty filter, oversharpening, HDR halos, duplicated pose, repeated crop, repeated camera angle, inconsistent face identity, wrong outfit, text, watermark, logo, deformed hands, distorted limbs",
  credit_multiplier: 2.4,
  is_published: true,
  sort_order: 5,
  tier_required: "free" as const,
};
