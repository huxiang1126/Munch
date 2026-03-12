export const monochromeIntimatePortrait = {
  slug: "monochrome-intimate-portrait",
  name: "黑白室内情绪肖像",
  description:
    "上传人物参考图，生成室内黑白 Fine-art 情绪肖像，强调内省姿态、柔和自然漫射光、贴身高领与蕾丝短裤的细腻材质，以及电影感的真实脆弱气质。",
  category: "portrait" as const,
  tags: ["黑白", "情绪肖像", "室内", "Fine Art", "Editorial"],
  thumbnail_url: null,
  thumbnail_path: null,
  default_model: "nano-banana-pro-4k" as const,
  compatible_models: ["nano-banana-pro-4k", "nano-banana-pro-2k", "nano-banana-2"] as const,
  default_image_size: { width: 1024, height: 1536 },
  variables: [
    {
      id: "face_ref",
      name: "人物参考图",
      type: "image" as const,
      required: true,
      priority: 0,
      accept: "image/jpeg,image/png,image/webp",
      maxSizeMB: 10,
      uploadHint: "请上传清晰的人物参考图，用于固定五官、发型与身份一致性",
    },
    {
      id: "gaze_tone",
      name: "眼神气质",
      type: "select" as const,
      required: false,
      priority: 1,
      options: [
        {
          value: "a deep unwavering gaze with subtle vulnerability",
          label: "脆弱感凝视",
        },
        {
          value: "a calm introspective gaze with quiet emotional tension",
          label: "安静内省感",
        },
        {
          value: "a detached but intimate gaze with restrained allure",
          label: "疏离亲密感",
        },
      ],
      defaultValue: "a deep unwavering gaze with subtle vulnerability",
    },
    {
      id: "fabric_emphasis",
      name: "材质侧重",
      type: "select" as const,
      required: false,
      priority: 2,
      options: [
        {
          value: "matte elastic black turtleneck texture with faintly revealed lace shorts detail",
          label: "高领与蕾丝并重",
        },
        {
          value: "smooth matte turtleneck sheen with only a delicate hint of lace texture below",
          label: "高领极简感",
        },
        {
          value: "soft lace texture contrast beneath a clean architectural turtleneck silhouette",
          label: "蕾丝对比感",
        },
      ],
      defaultValue: "matte elastic black turtleneck texture with faintly revealed lace shorts detail",
    },
  ],
  skill_prompt:
    "You are an expert fine-art monochrome portrait photographer. Use the uploaded female model reference as the exact face and identity reference, preserving facial features and hairstyle. Create a cinematic black-and-white indoor portrait of a slim woman seated against a soft neutral background. Her posture should feel relaxed but introspective: one arm resting on a raised knee, the other hand lightly touching her hair. Her head tilts downward while her eyes look upward with emotional intensity. Her lips are slightly parted, suggesting vulnerability and restrained allure. A soft indoor breeze moves a few strands of hair naturally across the face. The image should feel candid, intimate, and emotionally precise, with film-like softness, delicate grain, and the poetic realism of Peter Lindbergh and Sarah Moon.",
  base_prompt:
    "Create a fine-art monochrome indoor portrait using the exact identity from the reference image. The woman is seated against a soft neutral background in a medium-close framing from head to mid-thigh, with a slightly tilted composition for asymmetry and candid realism. Her body language is relaxed yet introspective: one arm rests on a raised knee and the other hand lightly touches her hair. Her head is gently tilted downward while her eyes look up with {{gaze_tone}}. Her lips are slightly parted. She wears a form-fitting black turtleneck made of matte elastic fabric, with the collar extending high to frame the jawline, and black lace-textured short triangle shorts. Emphasize {{fabric_emphasis}}. Use natural diffused light from the left front side, creating clean highlights, subtle midtones, and smooth shadow transitions with no hard edges. Preserve natural pores and realism, add fine film grain, soft monochrome tonality, and cinematic emotional texture without color distractions.",
  negative_prompt:
    "hard shadows, glamour studio lighting, plastic skin, busy background, smiling commercial beauty pose, colorful image, strong contrast clipping, over-sharpening, extra props, text, watermark, logo, distorted anatomy, altered identity",
  credit_multiplier: 1.7,
  is_published: true,
  sort_order: 13,
  tier_required: "free" as const,
};
