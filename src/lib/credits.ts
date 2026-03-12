import { getCreditCost } from "@/lib/constants";
import type { GenerationModel } from "@/types/generation";
import type { Template } from "@/types/template";

export function calculateCredits(
  model: GenerationModel,
  imageCount: 1 | 2 | 3 | 4,
  template: Pick<Template, "creditMultiplier">,
) {
  return Math.round(getCreditCost(model).perImage * imageCount * template.creditMultiplier);
}
