import { getCreditCost } from "@/lib/constants";
import type { GenerationModel } from "@/types/generation";

export function calculateCredits(
  model: GenerationModel,
  imageCount: 1 | 2 | 3 | 4,
) {
  return Math.round(getCreditCost(model).perImage * imageCount);
}
