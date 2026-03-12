import type { GenerationModel, UserTier } from "@/types/generation";
import { getModelConfig, IMAGE_MODELS } from "@/lib/models";

export const APP_NAME = "Munch";
export const APP_DOMAIN = "munch.love";
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://munch.love";

export const CREDIT_COSTS: Record<
  GenerationModel,
  { perImage: number; description: string }
> = Object.fromEntries(
  Object.values(IMAGE_MODELS).map((model) => [
    model.id,
    { perImage: model.creditPerImage, description: `${model.label} ${model.description}` },
  ]),
) as Record<GenerationModel, { perImage: number; description: string }>;

export function getCreditCost(model: GenerationModel | string | null | undefined) {
  const config = getModelConfig(model);
  return {
    perImage: config.creditPerImage,
    description: `${config.label} ${config.description}`,
  };
}

export const TIER_LIMITS: Record<
  UserTier,
  {
    maxConcurrentTasks: number;
    maxImagesPerTask: 2 | 4;
    availableModels: GenerationModel[];
  }
> = {
  free: {
    maxConcurrentTasks: 1,
    maxImagesPerTask: 2,
    availableModels: ["nano-banana-2-1k", "nano-banana-2-2k"],
  },
  basic: {
    maxConcurrentTasks: 2,
    maxImagesPerTask: 4,
    availableModels: [
      "nano-banana-2-1k",
      "nano-banana-2-2k",
      "nano-banana-2-4k",
      "nano-banana-pro-2k",
      "seedream-4.5",
    ],
  },
  pro: {
    maxConcurrentTasks: 3,
    maxImagesPerTask: 4,
    availableModels: [
      "nano-banana-2-1k",
      "nano-banana-2-2k",
      "nano-banana-2-4k",
      "nano-banana-pro-2k",
      "nano-banana-pro-4k",
      "seedream-4.5",
    ],
  },
};

export const STATUS_STEPS = [
  "选择模板",
  "调整变量",
  "开始出图",
] as const;
