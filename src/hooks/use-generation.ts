"use client";

import { useState } from "react";

import type { ErrorResponse, GenerateRequest, GenerateResponse } from "@/types/api";

type StartGenerationPayload = Omit<GenerateRequest, "referenceImages"> & {
  imageFiles?: Record<string, File>;
};

async function serializeImageFiles(imageFiles: Record<string, File> = {}) {
  const entries = await Promise.all(
    Object.entries(imageFiles).map(async ([variableId, file]) => {
      const buffer = await file.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), ""),
      );

      return [variableId, `data:${file.type};base64,${base64}`] as const;
    }),
  );

  return Object.fromEntries(entries);
}

async function readResponsePayload<T>(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return (await response.json()) as T;
  }

  const text = await response.text();
  const looksLikeHtml = contentType.includes("text/html") || text.trim().startsWith("<");

  if (response.redirected || response.url.includes("/login") || looksLikeHtml) {
    throw new Error("登录状态已失效，请刷新页面后重试");
  }

  throw new Error("服务返回异常，请稍后重试");
}

export function useGeneration() {
  const [taskId, setTaskId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function startGeneration(payload: StartGenerationPayload) {
    setIsSubmitting(true);

    try {
      const referenceImages = await serializeImageFiles(payload.imageFiles);
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          templateId: payload.templateId,
          prompt: payload.prompt,
          variables: payload.variables,
          model: payload.model,
          imageCount: payload.imageCount,
          referenceImages,
          customPrompt: payload.customPrompt,
          thinkingEnabled: payload.thinkingEnabled,
          aspectRatio: payload.aspectRatio,
        } satisfies GenerateRequest),
      });

      if (!response.ok) {
        const error = await readResponsePayload<ErrorResponse>(response);
        throw new Error(error.message);
      }

      const data = await readResponsePayload<GenerateResponse>(response);
      setTaskId(data.taskId);
      return data;
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
    taskId,
    isSubmitting,
    startGeneration,
  };
}
