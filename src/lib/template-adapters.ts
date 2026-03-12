import type { DbTemplate } from "@/types/database";
import type { UserTier } from "@/types/generation";
import { expandCompatibleModels, normalizeGenerationModel } from "@/lib/models";
import type { CanonicalImageModelId } from "@/lib/models";
import type { Template } from "@/types/template";

export interface RuntimeTemplate extends Template {
  slug: string;
  thumbnailPath: string | null;
  isPublished: boolean;
  sortOrder: number;
  tierRequired: UserTier;
}

function nowIso() {
  return new Date().toISOString();
}

export function staticTemplateToDb(template: Template): DbTemplate {
  const timestamp = nowIso();

  return {
    id: template.id,
    slug: template.id,
    name: template.name,
    description: template.description,
    category: template.category,
    tags: [...template.tags],
    thumbnail_url: template.thumbnailUrl,
    thumbnail_path: null,
    default_model: template.defaultModel,
    compatible_models: [...template.compatibleModels],
    default_image_size: {
      width: template.defaultImageSize.width,
      height: template.defaultImageSize.height,
    },
    variables: template.variables.map((variable) => ({
      ...variable,
      options: variable.options?.map((option) => ({ ...option })),
    })),
    skill_prompt: template.skillPrompt,
    base_prompt: template.basePrompt,
    negative_prompt: template.negativePrompt ?? null,
    credit_multiplier: template.creditMultiplier,
    is_published: true,
    sort_order: 0,
    tier_required: "free",
    created_at: timestamp,
    updated_at: timestamp,
  };
}

export function dbTemplateToRuntime(template: DbTemplate): RuntimeTemplate {
  const compatibleModels: CanonicalImageModelId[] = expandCompatibleModels(template.compatible_models, {
    hasImageInputs: template.variables.some((variable) => variable.type === "image"),
  });
  const defaultModel = normalizeGenerationModel(template.default_model, compatibleModels[0]);

  return {
    id: template.id,
    slug: template.slug,
    name: template.name,
    description: template.description,
    category: template.category,
    tags: [...template.tags],
    thumbnailUrl: template.thumbnail_url ?? "/images/logo.svg",
    thumbnailPath: template.thumbnail_path,
    defaultModel,
    compatibleModels,
    defaultImageSize: {
      width: template.default_image_size.width,
      height: template.default_image_size.height,
    },
    variables: template.variables.map((variable) => ({
      ...variable,
      options: variable.options?.map((option) => ({ ...option })),
    })),
    skillPrompt: template.skill_prompt,
    basePrompt: template.base_prompt,
    negativePrompt: template.negative_prompt ?? undefined,
    creditMultiplier: template.credit_multiplier,
    isPublished: template.is_published,
    sortOrder: template.sort_order,
    tierRequired: template.tier_required,
  };
}
