export const iphoneOutfitCollage = {
  slug: "iphone-outfit-collage",
  name: "韩系 iPhone 穿搭四宫格",
  description:
    "上传服装参考图，生成同一位高挑韩系女生穿着同款服装的 4 张无缝四宫格日常抓拍照，整体保持自然手机摄影质感与高度差异化的生活场景。",
  category: "fashion" as const,
  tags: ["韩系", "iPhone", "四宫格", "穿搭", "日常"],
  thumbnail_url: null,
  thumbnail_path: null,
  default_model: "nano-banana-pro-4k" as const,
  compatible_models: ["nano-banana-pro-4k", "nano-banana-pro-2k", "nano-banana-2"] as const,
  default_image_size: { width: 1536, height: 1536 },
  variables: [
    {
      id: "outfit_ref",
      name: "服装参考图",
      type: "image" as const,
      required: true,
      priority: 0,
      accept: "image/jpeg,image/png,image/webp",
      maxSizeMB: 10,
      uploadHint: "请上传清晰的服装参考图，尽量完整展示颜色、版型、层次和配饰",
    },
    {
      id: "scene_bias",
      name: "场景倾向",
      type: "select" as const,
      required: true,
      priority: 1,
      options: [
        {
          value:
            "favor quiet streets, boutique storefronts, café windows, and Seoul-style lifestyle corners",
          label: "街头咖啡馆",
        },
        {
          value:
            "favor home mirror moments, styled minimal interiors, bookstores, and museum-like spaces",
          label: "室内生活感",
        },
        {
          value:
            "favor rooftops, parking decks, guardrails, skyline lines, and open-air urban edges",
          label: "城市边界感",
        },
      ],
      defaultValue: "favor quiet streets, boutique storefronts, café windows, and Seoul-style lifestyle corners",
    },
    {
      id: "time_profile",
      name: "时间氛围",
      type: "select" as const,
      required: false,
      priority: 2,
      options: [
        {
          value: "mostly daytime natural light with one possible blue-hour or warm indoor frame",
          label: "以白天为主",
        },
        {
          value: "all daytime phone snapshots with soft daylight continuity",
          label: "纯白天抓拍",
        },
        {
          value: "a day-to-night lifestyle mix with restrained blue-hour or neon ambience",
          label: "昼夜混合",
        },
      ],
      defaultValue: "mostly daytime natural light with one possible blue-hour or warm indoor frame",
    },
    {
      id: "pov_mix",
      name: "镜头变化",
      type: "select" as const,
      required: false,
      priority: 3,
      options: [
        {
          value:
            "include one low-angle frame, one tilted off-center frame, one mirror or reflection frame, and one friend-style candid frame",
          label: "低机位 + 倾斜 + 镜像 + 抓拍",
        },
        {
          value:
            "favor low-angle leg-lengthening shots, handheld asymmetry, and slight edge distortion from a phone wide lens",
          label: "广角低机位感",
        },
        {
          value:
            "favor mirror, over-shoulder, and partial-occlusion candid phone perspectives with casual crops",
          label: "镜像遮挡抓拍感",
        },
      ],
      defaultValue:
        "include one low-angle frame, one tilted off-center frame, one mirror or reflection frame, and one friend-style candid frame",
    },
    {
      id: "vibe",
      name: "整体气质",
      type: "select" as const,
      required: false,
      priority: 4,
      options: [
        {
          value: "a clean warm effortless INS-style everyday vibe with natural skin tones",
          label: "温暖 INS 日常感",
        },
        {
          value: "a cooler minimalist fashion-lifestyle vibe with understated polish",
          label: "清冷极简感",
        },
        {
          value: "a playful spontaneous weekend snapshot vibe with light motion energy",
          label: "周末松弛抓拍感",
        },
      ],
      defaultValue: "a clean warm effortless INS-style everyday vibe with natural skin tones",
    },
  ],
  skill_prompt:
    "You are an expert mobile-fashion collage director. Use the outfit reference image as the exact clothing reference. Generate a seamless 2x2 collage with zero gutters, equal tiles, and unified white balance. All four frames must feature the same tall, long-legged Korean female model with a consistent Asian identity across the set. The outfit must match the reference image exactly in color, silhouette, layering, and accessories. The result must feel like iPhone photography only: natural daylight or warm indoor light, slight grain, natural exposure with mild highlight roll-off, subtle handheld imperfection, slight lens distortion, and no DSLR, studio, commercial, flash, beauty-filter, or heavy-retouching look. Disable portrait-mode aesthetics, keep most of the subject in focus, allow only natural shallow depth from distance, and avoid telephoto compression. At most one frame may feel ultra-wide; the rest should feel like an iPhone main or wide camera. Treat the collage as a batch with global memory: every frame must differ in scene, pose, POV, expression, light, prop, framing, motion, city cue, weather, and time of day. Randomly sample a different scene bucket and a different POV archetype for each frame, resampling on collisions or near-duplicates. Do not repeat the same stance, facing direction, backdrop logic, crop, or walking phase. Randomize tile placement after the four frames are composed. If supported, use a different seed per frame, low-to-medium guidance strength, and subtle focal distance variation to avoid mode collapse. Weather, light, scene, and time of day must remain physically coherent.",
  base_prompt:
    "Create a seamless 2x2 four-photo collage with zero gutters and unified color balance. The collage shows the same tall, long-legged Korean female model wearing the exact outfit from the reference image. Each tile must be a unique candid iPhone snapshot rather than a professional fashion photo. {{scene_bias}}. {{time_profile}}. {{pov_mix}}. Keep the four frames globally diverse in scene, pose, point of view, expression, light, prop, framing, motion, city backdrop, weather, and time of day. Ensure at least one low-angle frame, one tilted off-center frame, and one mirror, reflection, or over-shoulder frame. Keep one frame wide enough to read the full outfit, one mid-frame, one detail-friendly composition, and one playful or reflection-based viewpoint. Use natural daylight or warm indoor ambient light, subtle phone-camera noise, mild ISO texture in shadows, occasional micro motion blur in only one or two frames, natural exposure, slight handheld imperfection, and gentle lens distortion from an iPhone-like wide camera. Avoid HDR halos, oversharpening, flash, dramatic bokeh, and any polished commercial or DSLR fashion-shoot aesthetic. The final result should feel like {{vibe}}.",
  negative_prompt:
    "studio lighting, DSLR look, commercial campaign, runway pose, identical pose repetition, identical framing, repeated backdrop, dramatic bokeh, beauty filter, flash, over-retouched skin, HDR halos, oversharpening, heavy cinematic grading, telephoto compression, visible collage gutters, text, watermark, logo, deformed limbs, distorted clothing",
  credit_multiplier: 2.2,
  is_published: true,
  sort_order: 3,
  tier_required: "free" as const,
};
