import { getKieLlmBaseUrl } from "@/lib/ai/base-url";
import { LLM_CONFIG } from "@/lib/models";

const BASE_URL = getKieLlmBaseUrl();

export interface PromptCompilationInput {
  skillPrompt: string;
  basePrompt: string;
  variables: Record<string, string>;
  targetModel: string;
  customPrompt?: string;
}

export interface FreePromptThinkingInput {
  prompt: string;
  targetModel: string;
  referenceTemplates?: Array<{
    name: string;
    category: string;
    description: string;
    tags: string[];
    skillPrompt: string;
    basePrompt: string;
  }>;
}

export async function compilePrompt(
  input: PromptCompilationInput,
): Promise<string> {
  const apiKey = process.env[LLM_CONFIG.apiKeyEnv] || process.env[LLM_CONFIG.fallbackApiKeyEnv];

  if (!apiKey) {
    return manualCompile(input.basePrompt, input.variables);
  }

  const filledPrompt = manualCompile(input.basePrompt, input.variables);
  const supplementalIntent = input.customPrompt?.trim() ?? "";
  const manualFallback = appendCustomPrompt(filledPrompt, supplementalIntent);

  const response = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: LLM_CONFIG.apiModel,
      messages: [
        {
          role: "system",
          content: [
            {
              type: "text",
              text: `You are a prompt engineering assistant. Your job is to take a base image generation prompt and optimize it for the target model "${input.targetModel}". Apply the following style constraints:\n\n${input.skillPrompt}\n\nIf the user provides extra creative intent, integrate it into the final prompt while preserving the template's structure, required constraints, and safety. Output ONLY the optimized prompt text. No explanations. No markdown.`,
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: supplementalIntent
                ? `Base prompt:\n${filledPrompt}\n\nUser supplemental intent:\n${supplementalIntent}\n\nReturn one merged final image-generation prompt.`
                : filledPrompt,
            },
          ],
        },
      ],
      reasoning_effort: "low",
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    console.error("LLM compilation failed, falling back to manual compile", response.status, body);
    return manualFallback;
  }

  const result = (await response.json()) as {
    error?: {
      message?: string;
    };
    choices?: Array<{
      message?: {
        content?:
          | string
          | Array<{
            type?: string;
            text?: string;
          }>;
      };
    }>;
  };

  if (result.error || !Array.isArray(result.choices)) {
    console.error("LLM compilation returned error payload, falling back to manual compile");
    return manualFallback;
  }

  const content = result.choices[0]?.message?.content;
  if (typeof content === "string") {
    return content.trim() || manualFallback;
  }

  if (Array.isArray(content)) {
    const merged = content
      .map((part) => (part.type === "text" ? part.text?.trim() : ""))
      .filter(Boolean)
      .join("\n")
      .trim();

    return merged || manualFallback;
  }

  return manualFallback;
}

export async function compileFreePromptWithThinking(
  input: FreePromptThinkingInput,
): Promise<string> {
  const apiKey = process.env[LLM_CONFIG.apiKeyEnv] || process.env[LLM_CONFIG.fallbackApiKeyEnv];
  const rawPrompt = input.prompt.trim();

  if (!rawPrompt) {
    return rawPrompt;
  }

  if (!apiKey) {
    return buildFreePromptThinkingFallback(input);
  }

  const response = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: LLM_CONFIG.apiModel,
      messages: [
        {
          role: "system",
          content: [
            {
              type: "text",
              text: `You are an image prompt strategist. Rewrite the user's request into one clean final image-generation prompt for the target model "${input.targetModel}". Preserve the user's core subject, mood, composition, and hard constraints. Make it clearer, more visual, more specific, and more generation-ready, but do not add random concepts that were not implied. Use any provided template references only as loose stylistic scaffolding. Write the final prompt in the same language as the user's request. Do not mention template names, reference prompts, user intent, style cues, or any meta-instructions. Output only the final prompt text.`,
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: buildFreePromptThinkingRequest(input),
            },
          ],
        },
      ],
      reasoning_effort: "low",
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    console.error("Free prompt thinking failed, falling back to structured prompt rewrite", response.status, body);
    return buildFreePromptThinkingFallback(input);
  }

  const result = (await response.json()) as {
    error?: {
      message?: string;
    };
    choices?: Array<{
      message?: {
        content?:
          | string
          | Array<{
            type?: string;
            text?: string;
          }>;
      };
    }>;
  };

  if (result.error || !Array.isArray(result.choices)) {
    console.error("Free prompt thinking returned error payload, falling back to structured prompt rewrite");
    return buildFreePromptThinkingFallback(input);
  }

  const content = result.choices[0]?.message?.content;
  if (typeof content === "string") {
    const compiled = content.trim();
    if (!compiled) {
      return buildFreePromptThinkingFallback(input);
    }
    if (normalizePrompt(compiled) === normalizePrompt(rawPrompt)) {
      return buildFreePromptThinkingFallback(input);
    }
    return compiled;
  }

  if (Array.isArray(content)) {
    const merged = content
      .map((part) => (part.type === "text" ? part.text?.trim() : ""))
      .filter(Boolean)
      .join("\n")
      .trim();

    if (!merged) {
      return buildFreePromptThinkingFallback(input);
    }
    if (normalizePrompt(merged) === normalizePrompt(rawPrompt)) {
      return buildFreePromptThinkingFallback(input);
    }
    return merged;
  }

  return buildFreePromptThinkingFallback(input);
}

function manualCompile(
  template: string,
  variables: Record<string, string>,
): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replaceAll(`{{${key}}}`, value);
  }
  return result;
}

function appendCustomPrompt(basePrompt: string, customPrompt: string) {
  const trimmed = customPrompt.trim();
  if (!trimmed) {
    return basePrompt;
  }

  return `${basePrompt}\n\nAdditional user direction: ${trimmed}`;
}

function buildFreePromptThinkingRequest(input: FreePromptThinkingInput) {
  const references = input.referenceTemplates?.length
    ? input.referenceTemplates
      .map(
        (template, index) =>
          `Reference ${index + 1}\nCategory: ${template.category}\nTags: ${template.tags.join(", ")}\nDescription: ${template.description}\nStyle direction: ${template.skillPrompt}\nPrompt blueprint: ${template.basePrompt}`,
      )
      .join("\n\n")
    : "No template references available.";

  return `User prompt:\n${input.prompt.trim()}\n\nReference prompt blueprints:\n${references}\n\nRewrite the user's idea into one final image-generation prompt in the same language as the user. Keep the user's subject, styling, and hard constraints intact. You may borrow only relevant visual language from the references. Do not mention template names, style cues, user intent, references, or any meta instructions. Output only one clean final prompt.`;
}

function buildFreePromptThinkingFallback(input: FreePromptThinkingInput) {
  const prompt = input.prompt.trim();
  if (!prompt) {
    return prompt;
  }

  const primaryReference = input.referenceTemplates?.[0];
  const isChinesePrompt = /[\p{Script=Han}]/u.test(prompt);

  if (!primaryReference) {
    return isChinesePrompt
      ? `${prompt}。高写实表达，主体明确，构图完整，光线层次清晰，材质与细节真实可感，整体氛围高级、克制、可直接生成。`
      : `${prompt}. High realism, strong subject separation, refined composition, layered lighting, realistic material detail, and a polished production-ready finish.`;
  }

  const styleDirection = summarizeReferenceDirection(primaryReference, isChinesePrompt);

  return isChinesePrompt
    ? `${prompt}。整体画面参考${styleDirection}，保持用户原始主体与约束不变，强化构图、镜头语言、光线层次、材质细节与成片质感，输出高完成度的图像结果。`
    : `${prompt}. Shape the image with ${styleDirection}, while preserving the user's original subject and constraints. Strengthen composition, camera language, lighting depth, material detail, and overall finish for a polished final image.`;
}

function normalizePrompt(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function summarizeReferenceDirection(
  template: NonNullable<FreePromptThinkingInput["referenceTemplates"]>[number],
  isChinesePrompt: boolean,
) {
  const tagSummary = template.tags.slice(0, 3).join(isChinesePrompt ? "、" : ", ");
  const styleSource = template.skillPrompt.trim() || template.description.trim() || template.basePrompt.trim();
  const compactStyle = styleSource.replace(/\s+/g, " ").slice(0, isChinesePrompt ? 60 : 120);

  if (isChinesePrompt) {
    return `${compactStyle}${tagSummary ? `，并融入${tagSummary}` : ""}`;
  }

  return `${compactStyle}${tagSummary ? `, with cues such as ${tagSummary}` : ""}`;
}
