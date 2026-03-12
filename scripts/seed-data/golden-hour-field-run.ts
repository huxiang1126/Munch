export const goldenHourFieldRun = {
  slug: "golden-hour-field-run",
  name: "日落花田奔跑电影感",
  description:
    "生成日落金色时分的电影级运动场景：年轻女性穿着浅粉轻薄连衣裙在野花与麦穗间奔跑，强逆光、飞散花瓣、体积光与胶片质感共同塑造自由而充满生命力的画面。",
  category: "fashion" as const,
  tags: ["日落", "花田", "奔跑", "电影感", "胶片"],
  thumbnail_url: null,
  thumbnail_path: null,
  default_model: "nano-banana-pro-4k" as const,
  compatible_models: ["nano-banana-pro-4k", "nano-banana-pro-2k", "nano-banana-2"] as const,
  default_image_size: { width: 1536, height: 864 },
  variables: [
    {
      id: "motion_profile",
      name: "动态强度",
      type: "select" as const,
      required: false,
      priority: 1,
      options: [
        { value: "natural energetic running with subtle motion drag", label: "自然奔跑" },
        { value: "stronger wind and more pronounced motion streaks in hair, dress, and petals", label: "风更大动感更强" },
        { value: "a softer graceful run with restrained but visible movement", label: "轻盈柔和" },
      ],
      defaultValue: "natural energetic running with subtle motion drag",
    },
    {
      id: "flare_profile",
      name: "光束效果",
      type: "select" as const,
      required: false,
      priority: 2,
      options: [
        { value: "rich diagonal lens flare and visible volumetric sunbeams", label: "强烈耀斑光束" },
        { value: "soft golden flare with elegant atmospheric rays", label: "柔和电影感光束" },
        { value: "controlled warm flare with subtle bloom and edge glow", label: "克制暖调卤晕" },
      ],
      defaultValue: "rich diagonal lens flare and visible volumetric sunbeams",
    },
    {
      id: "film_finish",
      name: "胶片质感",
      type: "select" as const,
      required: false,
      priority: 3,
      options: [
        { value: "Kodak Vision3 and 2383 print style with fine grain and slight halation", label: "Vision3 / 2383" },
        { value: "a delicate cinematic print look with low saturation and honey-gold highlights", label: "低饱和电影拷贝感" },
        { value: "a refined warm film look with soft highlights and gentle vignette", label: "柔和暖调胶片感" },
      ],
      defaultValue: "Kodak Vision3 and 2383 print style with fine grain and slight halation",
    },
  ],
  skill_prompt:
    "You are an expert cinematic fashion and movement photographer. Create a golden-hour action scene with strong backlight, natural wind, and emotional freedom. The image should feel like a high-end motion still from a poetic fashion film rather than a static editorial photo. The overall atmosphere must be alive with drifting petals, sun flare, and volumetric light beams cutting through the frame. Preserve a natural human body line, realistic running mechanics, and organic motion in hair, fabric, and foreground elements. The result should feel free, warm, wind-swept, and full of life.",
  base_prompt:
    "Create a cinematic action scene at golden sunset hour in a field of wildflowers and wheat. A young woman in a light pale-pink flowing dress is running through the field, captured from a side-following angle that is slightly ahead of her, as if shot handheld or on a stabilizer with subtle breathing motion. She is placed on the right third of the frame and runs toward the right, leaving large open space on the left to reveal the field, sunlight beams, and atmosphere. Her side silhouette is clear, with hair and dress dramatically blown by the wind. The image is filled with floating petals in the foreground, midground, and background, with the nearest petals slightly out of focus and showing subtle motion blur. Use strong backlight with the sun just outside the left edge of the frame, creating {{flare_profile}}. Keep a low horizon line, foreground flowers and petals acting as guiding lines, and a 35mm-equivalent cinematic perspective in a 16:9 frame. The running should feel {{motion_profile}}, with relaxed focused expression and natural arm swing. Color and finishing should feel like {{film_finish}}, with warm golden highlights, pink-apricot skin tones, honey-gold grass, moderate contrast, slightly muted saturation, soft highlights, no digital oversharpening, and a refined cinematic finish.",
  negative_prompt:
    "other people, buildings, text, watermark, logo, HDR oversaturation, plastic skin, hard shadows, frozen hair, frozen dress, weak wind, static petals, digital oversharpening, flat midday light, cluttered background, deformed limbs, awkward running pose",
  credit_multiplier: 1.8,
  is_published: true,
  sort_order: 10,
  tier_required: "free" as const,
};
