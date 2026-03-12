import { randomUUID } from "node:crypto";

import { compileFreePromptWithThinking } from "@/lib/ai/llm-client";
import { dbTemplateToRuntime } from "@/lib/template-adapters";
import { compilePrompt } from "@/lib/ai/prompt-compiler";
import { generateWithModel } from "@/lib/ai/model-router";
import { TIER_LIMITS, getCreditCost } from "@/lib/constants";
import { calculateCredits } from "@/lib/credits";
import { AppError } from "@/lib/errors";
import { addTransaction, now, pushEvent, state, type StoredGeneration, type TaskEvent, wait } from "@/lib/mock-store";
import { getPublishedTemplates, resolveRuntimeTemplateById } from "@/lib/template-source";
import { ensureUserState } from "@/lib/user-state";
import type { GenerateRequest, HistoryItem } from "@/types/api";
import type { AppUser } from "@/types/auth";
import type { GeneratedImage } from "@/types/generation";
import type { RuntimeTemplate } from "@/lib/template-adapters";

async function validateVariables(
  templateId: string,
  variables: Record<string, string>,
  referenceImages: Record<string, string> = {},
) {
  const template = await resolveRuntimeTemplateById(templateId, { includeUnpublished: true });
  if (!template) {
    throw new AppError(400, "INVALID_TEMPLATE", "模板不存在");
  }

  for (const variable of template.variables) {
    if (variable.type === "image") {
      const imageValue = referenceImages[variable.id];
      if (variable.required && !imageValue) {
        throw new AppError(400, "INVALID_VARIABLES", `${variable.name} 为必填项`);
      }
      continue;
    }

    const value = variables[variable.id];
    if (variable.required && !value) {
      throw new AppError(400, "INVALID_VARIABLES", `${variable.name} 为必填项`);
    }
    if (!value || variable.type !== "select") {
      continue;
    }
    if (!variable.options?.some((option) => option.value === value)) {
      throw new AppError(400, "INVALID_VARIABLES", `${variable.name} 的值不合法`);
    }
  }

  return template;
}

async function getThinkingTemplateReferences(prompt: string) {
  const normalizedPrompt = prompt.trim().toLowerCase();
  if (!normalizedPrompt) {
    return [];
  }

  const promptTokens = extractThinkingTokens(normalizedPrompt);
  const templateRecords = await getPublishedTemplates();

  return templateRecords
    .map((record) => {
      const runtime = dbTemplateToRuntime(record);
      const haystack = [
        runtime.name,
        runtime.description,
        runtime.category,
        runtime.tags.join(" "),
        runtime.skillPrompt,
        runtime.basePrompt,
      ]
        .join(" ")
        .toLowerCase();

      let score = 0;
      for (const token of promptTokens) {
        if (haystack.includes(token)) {
          score += token.length >= 4 ? 4 : token.length === 3 ? 3 : 2;
        }
      }

      if (normalizedPrompt.includes(runtime.category.toLowerCase())) {
        score += 4;
      }

      return {
        runtime,
        score,
      };
    })
    .filter(({ score }) => score >= 3)
    .sort((a, b) => b.score - a.score || a.runtime.sortOrder - b.runtime.sortOrder)
    .slice(0, 1)
    .map(({ runtime }) => ({
      name: runtime.name,
      category: runtime.category,
      description: runtime.description,
      tags: runtime.tags,
      skillPrompt: runtime.skillPrompt,
      basePrompt: runtime.basePrompt,
    }));
}

function extractThinkingTokens(prompt: string) {
  const latinTokens = prompt.match(/[a-z0-9-]{3,}/g) ?? [];
  const hanSegments = prompt.match(/[\p{Script=Han}]{2,}/gu) ?? [];
  const hanTokens = new Set<string>();

  for (const segment of hanSegments) {
    if (segment.length <= 2) {
      hanTokens.add(segment);
      continue;
    }

    for (let size = 2; size <= Math.min(4, segment.length); size += 1) {
      for (let start = 0; start <= segment.length - size; start += 1) {
        const token = segment.slice(start, start + size);
        if (token.length >= 2) {
          hanTokens.add(token);
        }
      }
    }
  }

  return Array.from(new Set([...latinTokens, ...hanTokens]));
}

export function getCreditsSnapshot(userId: string) {
  const user = state.users.get(userId);
  if (!user) {
    throw new AppError(404, "USER_NOT_FOUND", "用户不存在");
  }
  return { balance: user.credits, tier: user.tier };
}

export function getCreditTransactions(userId: string) {
  return state.transactions.get(userId) ?? [];
}

export function getHistory(userId: string, page = 1, pageSize = 20, status?: string) {
  const items: StoredGeneration[] = (state.generations.get(userId) ?? []).filter((item) =>
    status ? item.status === status : true,
  );
  const pageItems = items.slice((page - 1) * pageSize, page * pageSize);

  return {
    items: pageItems.map((item): HistoryItem => ({
      id: item.id,
      templateId: item.templateId,
      templateName: item.templateName,
      variables: item.variables,
      prompt: item.prompt,
      customPrompt: item.customPrompt,
      thinkingEnabled: item.thinkingEnabled,
      generationMode: item.generationMode,
      aspectRatio: item.aspectRatio,
      model: item.model,
      status: item.status,
      imageCount: item.imageCount,
      creditsCost: item.creditsCost,
      thumbnailUrl:
        state.images.get(item.id)?.[0]?.url ?? item.templateSnapshot.thumbnailUrl ?? "/images/logo.svg",
      createdAt: item.createdAt,
    })),
    total: items.length,
    page,
    pageSize,
  };
}

export function getHistoryItem(userId: string, taskId: string) {
  const generation = (state.generations.get(userId) ?? []).find((item) => item.id === taskId);
  if (!generation) {
    throw new AppError(404, "TASK_NOT_FOUND", "历史记录不存在");
  }
  return {
    ...generation,
    images: state.images.get(taskId) ?? [],
    isFavorited: (state.images.get(taskId) ?? []).some((image) => state.favorites.has(image.id)),
  };
}

export function deleteHistoryItem(userId: string, taskId: string) {
  const generations = state.generations.get(userId) ?? [];
  const index = generations.findIndex((item) => item.id === taskId);

  if (index === -1) {
    throw new AppError(404, "TASK_NOT_FOUND", "历史记录不存在");
  }

  const generation = generations[index];
  const images = state.images.get(taskId) ?? [];

  for (const image of images) {
    state.favorites.delete(image.id);
  }

  generations.splice(index, 1);
  state.generations.set(userId, generations);
  state.images.delete(taskId);
  state.streams.delete(taskId);
  state.runningTasks.delete(taskId);

  return {
    id: generation.id,
    deleted: true,
  };
}

export function getImageById(userId: string, imageId: string) {
  const ownedTaskIds = new Set((state.generations.get(userId) ?? []).map((item) => item.id));
  for (const [taskId, images] of state.images.entries()) {
    if (!ownedTaskIds.has(taskId)) {
      continue;
    }
    const image = images.find((item) => item.id === imageId);
    if (image) {
      return image;
    }
  }
  return null;
}

export function toggleImageFavorite(userId: string, imageId: string) {
  const image = getImageById(userId, imageId);
  if (!image) {
    throw new AppError(404, "IMAGE_NOT_FOUND", "图片不存在");
  }
  if (state.favorites.has(imageId)) {
    state.favorites.delete(imageId);
  } else {
    state.favorites.add(imageId);
  }
  return { id: imageId, isFavorited: state.favorites.has(imageId) };
}

export function getTaskEvents(userId: string, taskId: string, after = 0) {
  const generation = (state.generations.get(userId) ?? []).find((item) => item.id === taskId);
  if (!generation) {
    throw new AppError(404, "TASK_NOT_FOUND", "任务不存在");
  }
  return (state.streams.get(taskId) ?? []).filter((event: TaskEvent) => event.seq > after);
}

export async function createGenerationTask(user: AppUser, payload: GenerateRequest) {
  const stableUser = ensureUserState(user);
  const limits = TIER_LIMITS[stableUser.tier];
  const activeTasks = (state.generations.get(stableUser.id) ?? []).filter((item) =>
    ["pending", "compiling", "generating"].includes(item.status),
  );

  if (!limits.availableModels.includes(payload.model)) {
    throw new AppError(400, "INVALID_MODEL", "当前账户等级不可用该模型");
  }
  if (payload.imageCount > limits.maxImagesPerTask) {
    throw new AppError(400, "INVALID_IMAGE_COUNT", "当前账户等级暂不支持该出图张数");
  }
  if (activeTasks.length >= limits.maxConcurrentTasks) {
    throw new AppError(429, "RATE_LIMITED", "同时进行的任务数已达上限");
  }

  const isFreeGeneration = !payload.templateId && Boolean(payload.prompt?.trim());
  if (!isFreeGeneration && !payload.templateId) {
    throw new AppError(400, "INVALID_REQUEST", "请先选择模板或输入自由提示词");
  }

  let template: RuntimeTemplate;
  let creditsCharged: number;
  let templateName: string;
  let variables: Record<string, string>;

  if (isFreeGeneration) {
    template = createFreeformTemplate(payload.model, payload.aspectRatio);
    creditsCharged = Math.round(getCreditCost(payload.model).perImage * payload.imageCount);
    templateName = "自由创作";
    variables = {};
  } else {
    template = await validateVariables(
      payload.templateId!,
      payload.variables,
      payload.referenceImages,
    );

    if (!template.compatibleModels.includes(payload.model)) {
      throw new AppError(400, "INVALID_MODEL", "当前模板不支持所选模型");
    }

    creditsCharged = calculateCredits(payload.model, payload.imageCount, template);
    templateName = template.name;
    variables = payload.variables;
  }

  if (stableUser.credits < creditsCharged) {
    throw new AppError(402, "INSUFFICIENT_CREDITS", "积分余额不足");
  }

  stableUser.credits -= creditsCharged;
  const taskId = randomUUID();
  const generations: StoredGeneration[] = state.generations.get(stableUser.id) ?? [];
  generations.unshift({
    id: taskId,
    userId: stableUser.id,
    generationMode: isFreeGeneration ? "free" : "template",
    templateId: template.id,
    templateName,
    templateSnapshot: structuredCloneTemplate(template),
    prompt: payload.prompt?.trim() || undefined,
    thinkingEnabled: payload.thinkingEnabled ?? false,
    aspectRatio: payload.aspectRatio,
    variables,
    customPrompt: payload.customPrompt?.trim() || undefined,
    referenceImages: payload.referenceImages ? { ...payload.referenceImages } : undefined,
    model: payload.model,
    imageCount: payload.imageCount,
    status: "pending",
    creditsCost: creditsCharged,
    createdAt: now(),
    updatedAt: now(),
  });
  state.generations.set(stableUser.id, generations);
  addTransaction(stableUser.id, "consume", -creditsCharged, stableUser.credits, `发起出图 · ${templateName}`, taskId);
  pushEvent(taskId, "status", { status: "pending", message: "任务已创建，等待进入队列" });
  void runGenerationTask(stableUser.id, taskId);

  return { taskId, creditsCharged, estimatedSeconds: 16 };
}

async function runGenerationTask(userId: string, taskId: string) {
  if (state.runningTasks.has(taskId)) {
    return;
  }
  state.runningTasks.add(taskId);

  const generation = (state.generations.get(userId) ?? []).find((item) => item.id === taskId);
  const user = state.users.get(userId);
  if (!generation || !user) {
    state.runningTasks.delete(taskId);
    return;
  }

  try {
    const template = generation.templateSnapshot;
    generation.status = "compiling";
    generation.startedAt = now();
    generation.updatedAt = now();
    pushEvent(taskId, "status", {
      status: "compiling",
      message: generation.generationMode === "free" ? "正在理解你的提示词..." : "正在整理模板参数...",
    });
    await wait(400);

    if (generation.generationMode === "free") {
      generation.rawPrompt = generation.prompt ?? "";
      const thinkingReferences = generation.thinkingEnabled
        ? await getThinkingTemplateReferences(generation.prompt ?? "")
        : [];
      generation.compiledPrompt = generation.thinkingEnabled
        ? await compileFreePromptWithThinking({
          prompt: generation.prompt ?? "",
          targetModel: generation.model,
          referenceTemplates: thinkingReferences,
        })
        : generation.prompt ?? "";
      generation.negativePrompt = undefined;
    } else {
      const compiled = await compilePrompt(
        template,
        generation.variables,
        generation.model,
        generation.customPrompt,
      );
      generation.rawPrompt = compiled.rawPrompt;
      generation.compiledPrompt = compiled.compiledPrompt;
      generation.negativePrompt = compiled.negativePrompt;
    }
    generation.status = "generating";
    generation.updatedAt = now();
    pushEvent(taskId, "status", {
      status: "generating",
      message:
        generation.generationMode === "free" && generation.thinkingEnabled
          ? "意图已理解，正在生成图片..."
          : "参数已确认，正在生成图片...",
    });
    await wait(700);

    const images = (await generateWithModel(
      generation.model,
      generation.compiledPrompt ?? generation.rawPrompt ?? "",
      generation.imageCount,
      template.defaultImageSize,
      generation.negativePrompt,
      generation.referenceImages,
      (message) => {
        generation.updatedAt = now();
        pushEvent(taskId, "status", {
          status: "generating",
          message,
        });
      },
    )).map((image: GeneratedImage) => ({ ...image, id: randomUUID() }));

    state.images.set(taskId, images);
    generation.status = "completed";
    generation.completedAt = now();
    generation.updatedAt = now();
    pushEvent(taskId, "result", {
      status: "completed",
      message: `生成完成 · ${template.name}`,
      images,
      compiledPrompt: generation.compiledPrompt,
    });
  } catch (error) {
    user.credits += generation.creditsCost;
    generation.status = "failed";
    generation.errorMessage = error instanceof Error ? error.message : "生成失败";
    generation.updatedAt = now();
    addTransaction(user.id, "refund", generation.creditsCost, user.credits, `任务失败退款 · ${generation.templateName}`, generation.id);
    pushEvent(taskId, "error", { status: "failed", message: `${generation.errorMessage}，积分已退回` });
  } finally {
    state.runningTasks.delete(taskId);
  }
}

function createFreeformTemplate(model: GenerateRequest["model"], aspectRatio = "1:1"): RuntimeTemplate {
  const size = sizeFromAspectRatio(aspectRatio);

  return {
    id: "__freeform__",
    slug: "__freeform__",
    name: "自由创作",
    description: "无模板自由输入出图",
    category: "poster",
    tags: [],
    thumbnailUrl: "/images/logo.svg",
    thumbnailPath: null,
    defaultModel: model,
    compatibleModels: [model],
    defaultImageSize: size,
    variables: [],
    skillPrompt: "",
    basePrompt: "",
    negativePrompt: undefined,
    creditMultiplier: 1,
    isPublished: false,
    sortOrder: 0,
    tierRequired: "free",
  };
}

function sizeFromAspectRatio(aspectRatio: string) {
  const [wRaw, hRaw] = aspectRatio.split(":").map((value) => Number(value));
  const widthRatio = Number.isFinite(wRaw) && wRaw > 0 ? wRaw : 1;
  const heightRatio = Number.isFinite(hRaw) && hRaw > 0 ? hRaw : 1;

  if (widthRatio >= heightRatio) {
    return {
      width: Math.round((1024 * widthRatio) / heightRatio),
      height: 1024,
    };
  }

  return {
    width: 1024,
    height: Math.round((1024 * heightRatio) / widthRatio),
  };
}

function structuredCloneTemplate(template: RuntimeTemplate): RuntimeTemplate {
  return {
    ...template,
    tags: [...template.tags],
    compatibleModels: [...template.compatibleModels],
    defaultImageSize: {
      width: template.defaultImageSize.width,
      height: template.defaultImageSize.height,
    },
    variables: template.variables.map((variable) => ({
      ...variable,
      options: variable.options?.map((option) => ({ ...option })),
    })),
  };
}
