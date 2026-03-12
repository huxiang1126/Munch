import { generateImages } from "@/lib/ai/aigc-client";
import type { GenerationModel } from "@/types/generation";

export async function generateWithModel(
  model: GenerationModel,
  prompt: string,
  imageCount: number,
  size: { width: number; height: number },
  negativePrompt?: string,
  referenceImages?: Record<string, string>,
  onStatus?: (message: string) => void,
) {
  return generateImages({
    model,
    prompt,
    negativePrompt,
    imageCount,
    size,
    referenceImages,
    onStatus,
  });
}
