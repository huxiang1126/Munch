import { compilePrompt as compileWithLlm } from "@/lib/ai/llm-client";
import { getModelConfig } from "@/lib/models";
import type { Template } from "@/types/template";
import type { GenerationModel } from "@/types/generation";

export interface CompiledPromptResult {
  rawPrompt: string;
  compiledPrompt: string;
  negativePrompt?: string;
}

function injectVariables(basePrompt: string, variables: Record<string, string>) {
  return Object.entries(variables).reduce((result, [key, value]) => {
    return result.replaceAll(`{{${key}}}`, value);
  }, basePrompt);
}

export async function compilePrompt(
  template: Template,
  variables: Record<string, string>,
  targetModel: GenerationModel,
  customPrompt?: string,
) {
  const rawPrompt = injectVariables(template.basePrompt, variables);
  const shouldUseLlmCompilation = process.env.ENABLE_TEMPLATE_LLM_COMPILATION === "true";
  const compiledPrompt = shouldUseLlmCompilation
    ? await compileWithLlm({
      skillPrompt: template.skillPrompt,
      basePrompt: template.basePrompt,
      variables,
      targetModel: getModelConfig(targetModel).providerModel,
      customPrompt,
    })
    : rawPrompt + (customPrompt?.trim() ? `\n\nAdditional user direction: ${customPrompt.trim()}` : "");

  return {
    rawPrompt,
    compiledPrompt,
    negativePrompt: template.negativePrompt,
  } satisfies CompiledPromptResult;
}
