"use client";

import { create } from "zustand";

import type { GeneratedImage, GenerationStatus } from "@/types/generation";

interface GenerationState {
  status: GenerationStatus;
  progress: number;
  message: string;
  images: GeneratedImage[];
  compiledPrompt: string;
  setStatus: (status: GenerationStatus, message: string, progress?: number) => void;
  setResult: (message: string, images: GeneratedImage[], compiledPrompt: string) => void;
  reset: () => void;
}

export const useGenerationStore = create<GenerationState>((set) => ({
  status: "idle",
  progress: 0,
  message: "选择模板并开始出图",
  images: [],
  compiledPrompt: "",
  setStatus: (status, message, progress = 0) => set({ status, message, progress }),
  setResult: (message, images, compiledPrompt) =>
    set({
      status: "completed",
      progress: 100,
      message,
      images,
      compiledPrompt,
    }),
  reset: () =>
    set({
      status: "idle",
      progress: 0,
      message: "选择模板并开始出图",
      images: [],
      compiledPrompt: "",
    }),
}));
