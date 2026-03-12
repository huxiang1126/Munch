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

  if (!apiKey || !rawPrompt) {
    return rawPrompt;
  }

  const response = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      messages: [
        {
          role: "system",
          content: [
            {
              type: "text",
              text: `You are an image prompt strategist. Interpret the user's intent and rewrite it into one strong production-ready image prompt for the target model "${input.targetModel}". Preserve the user's core subject, mood, composition, and constraints. Make it clearer, more visual, and more generation-ready, but do not add random concepts that were not implied. Output only the final prompt text.`,
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: rawPrompt,
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
    return rawPrompt;
  }

  const content = result.choices[0]?.message?.content;
  if (typeof content === "string") {
    return content.trim() || rawPrompt;
  }

  if (Array.isArray(content)) {
    const merged = content
      .map((part) => (part.type === "text" ? part.text?.trim() : ""))
      .filter(Boolean)
      .join("\n")
      .trim();

    return merged || rawPrompt;
  }

  return rawPrompt;
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
