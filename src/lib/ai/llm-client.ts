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
              text: `You are an image prompt strategist. Interpret the user's intent and rewrite it into one strong production-ready image prompt for the target model "${input.targetModel}". Preserve the user's core subject, mood, composition, and constraints. Make it clearer, more visual, more specific, and more generation-ready, but do not add random concepts that were not implied. Use any provided template references only as stylistic scaffolding, not as a hard copy target. Output only the final prompt text.`,
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
    console.error("Free prompt thinking failed, falling back to raw prompt", response.status, body);
    return rawPrompt;
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
    console.error("Free prompt thinking returned error payload, falling back to raw prompt");
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
          `Reference ${index + 1}\nName: ${template.name}\nCategory: ${template.category}\nTags: ${template.tags.join(", ")}\nDescription: ${template.description}\nStyle intent: ${template.skillPrompt}\nPrompt skeleton: ${template.basePrompt}`,
      )
      .join("\n\n")
    : "No template references available.";

  return `User prompt:\n${input.prompt.trim()}\n\nReference prompt blueprints:\n${references}\n\nReturn one upgraded image-generation prompt that preserves the user's intent while making the result clearer, richer, and more production-ready.`;
}

function buildFreePromptThinkingFallback(input: FreePromptThinkingInput) {
  const references = input.referenceTemplates?.slice(0, 2) ?? [];
  const referenceHints = references
    .map(
      (template) =>
        `${template.name}: ${template.description}. Style cues: ${template.tags.slice(0, 4).join(", ")}.`,
    )
    .join(" ");

  const prompt = input.prompt.trim();
  if (!prompt) {
    return prompt;
  }

  if (!referenceHints) {
    return `Create a polished, production-ready image with the following intent: ${prompt}. Make the composition, lighting, material detail, and atmosphere vivid, coherent, and visually specific.`;
  }

  return `Create a polished, production-ready image based on this user intent: ${prompt}. Keep the user's subject and constraints intact, but enrich the composition, lighting, materials, atmosphere, and camera language. Use these style cues as inspiration without copying them directly: ${referenceHints}`;
}

function normalizePrompt(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}
