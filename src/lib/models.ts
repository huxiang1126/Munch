import type { GenerationModel } from "@/types/generation";

export type KieResolution = "1K" | "2K" | "4K";
export type KieQuality = "basic" | "high";

export interface ModelConfig {
  id: GenerationModel;
  label: string;
  providerModel: string;
  provider: "kie-image";
  apiKeyEnv: string;
  icon: string;
  description: string;
  usdPricePerImage: number;
  creditPerImage: number;
  resolution?: KieResolution;
  quality?: KieQuality;
  supportsReferenceImages: boolean;
}

const CREDITS_PER_USD = 400;

function toCredits(usdPricePerImage: number) {
  return Math.ceil(usdPricePerImage * CREDITS_PER_USD);
}

const LEGACY_MODEL_ALIASES = {
  "nano-banana-2": "nano-banana-2-2k",
  "nano-banana-pro-1k": "nano-banana-pro-2k",
} as const satisfies Partial<Record<GenerationModel, GenerationModel>>;

export const IMAGE_MODELS = {
  "nano-banana-2-1k": {
    id: "nano-banana-2-1k",
    label: "Nano Banana 2 · 1K",
    providerModel: "nano-banana-2",
    provider: "kie-image",
    apiKeyEnv: "KIE_API_KEY",
    icon: "🍌",
    description: "轻量出图，速度更快",
    usdPricePerImage: 0.039,
    creditPerImage: toCredits(0.039),
    resolution: "1K",
    supportsReferenceImages: true,
  },
  "nano-banana-2-2k": {
    id: "nano-banana-2-2k",
    label: "Nano Banana 2 · 2K",
    providerModel: "nano-banana-2",
    provider: "kie-image",
    apiKeyEnv: "KIE_API_KEY",
    icon: "🍌",
    description: "通用质量，适合大多数模板",
    usdPricePerImage: 0.078,
    creditPerImage: toCredits(0.078),
    resolution: "2K",
    supportsReferenceImages: true,
  },
  "nano-banana-2-4k": {
    id: "nano-banana-2-4k",
    label: "Nano Banana 2 · 4K",
    providerModel: "nano-banana-2",
    provider: "kie-image",
    apiKeyEnv: "KIE_API_KEY",
    icon: "🍌",
    description: "更高分辨率，适合精修输出",
    usdPricePerImage: 0.156,
    creditPerImage: toCredits(0.156),
    resolution: "4K",
    supportsReferenceImages: true,
  },
  "nano-banana-pro-2k": {
    id: "nano-banana-pro-2k",
    label: "Nano Banana Pro · 2K",
    providerModel: "nano-banana-pro",
    provider: "kie-image",
    apiKeyEnv: "KIE_API_KEY",
    icon: "🍌",
    description: "高质量参考图生成",
    usdPricePerImage: 0.09,
    creditPerImage: toCredits(0.09),
    resolution: "2K",
    supportsReferenceImages: true,
  },
  "nano-banana-pro-4k": {
    id: "nano-banana-pro-4k",
    label: "Nano Banana Pro · 4K",
    providerModel: "nano-banana-pro",
    provider: "kie-image",
    apiKeyEnv: "KIE_API_KEY",
    icon: "🍌",
    description: "最高精度，适合高质输出",
    usdPricePerImage: 0.12,
    creditPerImage: toCredits(0.12),
    resolution: "4K",
    supportsReferenceImages: true,
  },
  "seedream-4.5": {
    id: "seedream-4.5",
    label: "Seedream 4.5",
    providerModel: "seedream/4.5-text-to-image",
    provider: "kie-image",
    apiKeyEnv: "KIE_API_KEY",
    icon: "🌱",
    description: "高表现力文生图",
    usdPricePerImage: 0.0325,
    creditPerImage: toCredits(0.0325),
    quality: "high",
    supportsReferenceImages: false,
  },
} as const satisfies Record<string, ModelConfig>;

export type CanonicalImageModelId = keyof typeof IMAGE_MODELS;

export const ALL_IMAGE_MODEL_IDS = Object.keys(IMAGE_MODELS) as CanonicalImageModelId[];

export const REFERENCE_CAPABLE_MODEL_IDS = ALL_IMAGE_MODEL_IDS.filter(
  (model) => IMAGE_MODELS[model].supportsReferenceImages,
) as GenerationModel[];

export function isGenerationModel(value: string | null | undefined): value is GenerationModel {
  if (!value) {
    return false;
  }

  return value in IMAGE_MODELS || value in LEGACY_MODEL_ALIASES;
}

export function normalizeGenerationModel(
  value: string | null | undefined,
  fallback: CanonicalImageModelId = "nano-banana-2-2k",
): CanonicalImageModelId {
  if (!value) {
    return fallback;
  }

  if (value in LEGACY_MODEL_ALIASES) {
    return LEGACY_MODEL_ALIASES[value as keyof typeof LEGACY_MODEL_ALIASES];
  }

  return value in IMAGE_MODELS ? (value as CanonicalImageModelId) : fallback;
}

export function getModelConfig(modelId: GenerationModel | string | null | undefined): ModelConfig {
  return IMAGE_MODELS[normalizeGenerationModel(modelId)];
}

export function getModelLabel(modelId: GenerationModel | string | null | undefined) {
  return getModelConfig(modelId).label;
}

export function getModelDisplayText(modelId: GenerationModel | string | null | undefined) {
  const config = getModelConfig(modelId);
  return `${config.icon} ${config.label} — ${config.description}`;
}

export function expandCompatibleModels(
  models: readonly (GenerationModel | string)[] | null | undefined,
  options?: { hasImageInputs?: boolean },
): CanonicalImageModelId[] {
  const requested = (models ?? []).map((model) => normalizeGenerationModel(model));
  const next = new Set<CanonicalImageModelId>(requested);
  const hasImageInputs = options?.hasImageInputs ?? false;

  if (models?.includes("nano-banana-2") || requested.some((model) => model.startsWith("nano-banana-2"))) {
    next.add("nano-banana-2-1k");
    next.add("nano-banana-2-2k");
    next.add("nano-banana-2-4k");
  }

  if (requested.some((model) => model.startsWith("nano-banana-pro-"))) {
    next.add("nano-banana-pro-2k");
    next.add("nano-banana-pro-4k");
  }

  if (!hasImageInputs) {
    next.add("seedream-4.5");
  }

  if (next.size === 0) {
    next.add("nano-banana-2-1k");
    next.add("nano-banana-2-2k");
  }

  return Array.from(next);
}

export const LLM_CONFIG = {
  apiModel: "gpt-5.2",
  apiKeyEnv: "KIE_LLM_API_KEY",
  fallbackApiKeyEnv: "KIE_API_KEY",
} as const;
