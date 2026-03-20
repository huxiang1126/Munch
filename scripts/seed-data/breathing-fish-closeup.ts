export const breathingFishCloseup = {
  slug: "breathing-fish-closeup",
  name: "会呼吸的鱼 · 特写",
  description:
    "上传人物参考图，生成黄金时段野花草地中的 surreal 竖构图头肩特写：低机位微仰拍、金鱼掠过镜头、发丝被风吹拂，整体呈现高定时装与梦境自然的混合气质。",
  category: "portrait" as const,
  tags: ["超现实", "特写", "金鱼", "黄金时段", "高定肖像"],
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
      uploadHint: "请上传清晰的人物参考图，用于固定脸部身份与发型",
    },
    {
      id: "fish_motion",
      name: "金鱼动态",
      type: "select" as const,
      required: false,
      priority: 1,
      options: [
        {
          value: "one or two orange-red goldfish sweeping close past the lens with directional motion blur",
          label: "单次掠过",
        },
        {
          value: "multiple red and gold goldfish layered around the face and foreground with dramatic scale",
          label: "多层环绕",
        },
        {
          value: "a denser swirl of luminous red-gold goldfish crossing the frame diagonally",
          label: "更强梦境感",
        },
      ],
      defaultValue: "multiple red and gold goldfish layered around the face and foreground with dramatic scale",
    },
    {
      id: "tone_finish",
      name: "色调气质",
      type: "select" as const,
      required: false,
      priority: 2,
      options: [
        {
          value: "a vivid blue-green and orange split tone with warm natural skin",
          label: "蓝橙分离色调",
        },
        {
          value: "a richer sunset palette with peach clouds, clean whites, and deep green foliage",
          label: "更暖日落感",
        },
        {
          value: "a cinematic saturated palette with natural skin detail and refined film grain",
          label: "高饱和电影感",
        },
      ],
      defaultValue: "a vivid blue-green and orange split tone with warm natural skin",
    },
  ],
  skill_prompt:
    "You are an expert surreal fashion portrait photographer. Use the uploaded model reference as the exact face and body identity reference, preserving identity and hairstyle. Create a vertical 9:16 head-and-shoulders close-up in an open wildflower field during golden hour. The image should feel dreamlike but physically plausible in open air, not underwater: red and gold goldfish float and sweep close to the lens and around the subject's face with exaggerated foreground scale, while the background remains an airy landscape with low horizon, flowers, leaves, and distant mountains. The camera is slightly low and tilted upward from very close range, focusing precisely on the near eye and iris with extremely shallow depth of field. Wind must push strands of hair across the face while keeping one eye clean and sharp. The overall feeling should be poetic, alive, luxurious, and surreal, with delicate film grain and cinematic intimacy.",
  base_prompt:
    "Create a surreal cinematic close-up portrait using the exact identity and hairstyle from the reference image. The subject is a young woman styled in Louis Vuitton haute couture, shown in a head-and-shoulders composition where the face occupies roughly 35 to 45 percent of the frame height. She looks calmly toward the right with a serene expression and a slight lifted gaze. Place her in an open wildflower meadow during golden hour, under a soft gradient sky shifting from cyan into peach-pink clouds. Use a slightly low upward-facing camera angle from close range, with the nearest eye in razor-sharp focus and everything behind it falling into gentle blur. Include {{fish_motion}}. Add a few white flowers and green leaves near the bottom edge as soft foreground accents. Use warm backlight and side-backlight to create clear edge light on the face and hair, subtle lens flare, and soft dynamic shadows from nearby goldfish across the cheek or collar. The final image should feel like {{tone_finish}}, with natural warm skin, high saturation that still preserves skin detail, refined film grain, and no digital harshness.",
  negative_prompt:
    "water, aquarium, underwater scene, city buildings, extra people, text, logo, watermark, bubbles, plastic skin, hard shadows, weak wind, frozen hair, frozen goldfish, cluttered background, deformed anatomy, altered face identity",
  credit_multiplier: 1.8,
  is_published: true,
  sort_order: 12,
  tier_required: "free" as const,
};
