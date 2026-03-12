export type GenerationModel =
  | "nano-banana-2"
  | "nano-banana-2-1k"
  | "nano-banana-2-2k"
  | "nano-banana-2-4k"
  | "nano-banana-pro-1k"
  | "nano-banana-pro-2k"
  | "nano-banana-pro-4k"
  | "seedream-4.5";

export type GenerationStatus =
  | "idle"
  | "pending"
  | "compiling"
  | "generating"
  | "completed"
  | "failed"
  | "cancelled";

export type UserTier = "free" | "basic" | "pro";

export interface GeneratedImage {
  id: string;
  url: string;
  width: number;
  height: number;
}

export interface GenerationTask {
  id: string;
  templateId: string;
  model: GenerationModel;
  imageCount: 1 | 2 | 3 | 4;
  status: GenerationStatus;
  creditsCost: number;
  compiledPrompt?: string;
  createdAt: string;
  images: GeneratedImage[];
  errorMessage?: string;
}
