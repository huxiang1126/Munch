export const sunsetEditorial132Grid = {
  slug: "sunset-editorial-132-grid",
  name: "落日 Editorial 1+3+2 拼贴",
  description:
    "上传人物肖像图和穿搭参考图，生成户外日落 golden hour 的 1+3+2 Editorial 拼贴，强调暖金色夕阳、城市电影感和丰富光影层次。",
  category: "fashion" as const,
  tags: ["Editorial", "Golden Hour", "拼贴", "街头时尚", "日落"],
  thumbnail_url: null,
  thumbnail_path: null,
  default_model: "nano-banana-pro-4k" as const,
  compatible_models: ["nano-banana-pro-4k", "nano-banana-pro-2k", "nano-banana-2"] as const,
  default_image_size: { width: 1536, height: 1792 },
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
      uploadHint: "请上传完整穿搭参考图，用于替换服装与配饰造型",
    },
    {
      id: "scene_bias",
      name: "场景倾向",
      type: "select" as const,
      required: false,
      priority: 2,
      options: [
        {
          value: "a glowing urban rooftop or terrace with rich skyline flare",
          label: "屋顶天际线",
        },
        {
          value: "a sun-drenched city edge with railings, chairs, and reflective highlights",
          label: "城市边界",
        },
        {
          value: "a cinematic outdoor street-fashion setting with abundant golden reflections",
          label: "街头电影感",
        },
      ],
      defaultValue: "a glowing urban rooftop or terrace with rich skyline flare",
    },
    {
      id: "mood_tone",
      name: "情绪气质",
      type: "select" as const,
      required: false,
      priority: 3,
      options: [
        {
          value: "a cinematic modern editorial mood with warm introspection",
          label: "暖调沉思感",
        },
        {
          value: "a radiant fashion-story mood with dramatic golden light play",
          label: "戏剧光影感",
        },
        {
          value: "a clean street-fashion mood with rich sunset atmosphere",
          label: "干净街头感",
        },
      ],
      defaultValue: "a cinematic modern editorial mood with warm introspection",
    },
  ],
  skill_prompt:
    "You are an expert editorial fashion photographer and layout director. Use the uploaded portrait image to anchor the model's face, identity, and Korean/Asian appearance consistently across all frames. Use the uploaded outfit image as the exact wardrobe reference, preserving the full clothing look, styling, and accessories. Create an outdoor editorial collage with a 1+3+2 layout: one full-width horizontal image on the first row, three vertical images side-by-side on the second row, and two horizontal images side-by-side on the third row. The scene must happen during sunset golden hour with rich warm oranges, deep ambers, dramatic sunbeams, glowing rim light, soft warm strobe from the left-front, subtle fill on the right, strong light play, lens flares, and reflective highlights on skin and accessories. The overall result should feel cinematic, fashion-forward, sun-soaked, and visually rich.",
  base_prompt:
    "Create an outdoor editorial collage in a 1+3+2 grid layout during sunset golden hour in {{scene_bias}}. The same Korean female model from the portrait reference wears the exact outfit and accessories from the outfit reference. The collage must contain six distinct shots matched to the layout: one full-width horizontal hero image on the first row; three vertical editorial moments on the second row; and two horizontal images on the third row. Select and adapt six shots from this set: a very close warm portrait with a hand reaching toward the camera and eyes in focus; a full-body standing shot near a railing or chair with wide negative space and glowing skyline; a medium close seated pose with the head tilted back and radiant sunset sky; a mid-shot adjusting a bag strap or cap brim in golden rim light; a tight crop of eyes peeking under a cap brim with intense warm gaze; and a three-quarter body frame with the head down and a hand scratching the neck under strong sunset backlight. Emphasize cinematic sunset warmth, jewelry glints, bag-chain details, shallow depth of field, golden highlights, flares, and {{mood_tone}}. Keep the collage cohesive in color while varying framing and distance across the six images.",
  negative_prompt:
    "studio catalog, flat daylight, cool blue-hour palette, DSLR commercial polish, beauty campaign, flash, over-retouched skin, oversharpening, HDR halos, weak sunlight, repeated framing, repeated pose, inconsistent face identity, wrong outfit, text, watermark, logo, deformed hands, distorted limbs",
  credit_multiplier: 2.3,
  is_published: true,
  sort_order: 6,
  tier_required: "free" as const,
};
