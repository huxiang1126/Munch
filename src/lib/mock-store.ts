import { randomUUID } from "node:crypto";

import type { CreditTransactionItem, GenerationStatusEvent } from "@/types/api";
import type { AppUser } from "@/types/auth";
import type { GeneratedImage, GenerationModel, GenerationStatus } from "@/types/generation";
import type { RuntimeTemplate } from "@/lib/template-adapters";

export type StoredGeneration = {
  id: string;
  userId: string;
  generationMode?: "template" | "free";
  templateId: string;
  templateName: string;
  templateSnapshot: RuntimeTemplate;
  prompt?: string;
  thinkingEnabled?: boolean;
  aspectRatio?: string;
  variables: Record<string, string>;
  customPrompt?: string;
  referenceImages?: Record<string, string>;
  model: GenerationModel;
  imageCount: 1 | 2 | 3 | 4;
  status: Exclude<GenerationStatus, "idle">;
  creditsCost: number;
  rawPrompt?: string;
  compiledPrompt?: string;
  negativePrompt?: string;
  errorMessage?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  updatedAt: string;
};

export type TaskEvent = GenerationStatusEvent & {
  seq: number;
  kind: "status" | "result" | "error";
};

type State = {
  users: Map<string, AppUser>;
  generations: Map<string, StoredGeneration[]>;
  images: Map<string, GeneratedImage[]>;
  transactions: Map<string, CreditTransactionItem[]>;
  streams: Map<string, TaskEvent[]>;
  runningTasks: Set<string>;
  favorites: Set<string>;
};

const globalForMunch = globalThis as typeof globalThis & {
  __munchMockState?: State;
};

export const state: State =
  globalForMunch.__munchMockState ??
  (globalForMunch.__munchMockState = {
    users: new Map(),
    generations: new Map(),
    images: new Map(),
    transactions: new Map(),
    streams: new Map(),
    runningTasks: new Set(),
    favorites: new Set(),
  });

export function now() {
  return new Date().toISOString();
}

export function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function addTransaction(
  userId: string,
  type: CreditTransactionItem["type"],
  amount: number,
  balanceAfter: number,
  description: string,
  referenceId?: string,
) {
  const items = state.transactions.get(userId) ?? [];
  items.unshift({
    id: randomUUID(),
    type,
    amount,
    balanceAfter,
    description,
    referenceId: referenceId ?? null,
    createdAt: now(),
  });
  state.transactions.set(userId, items);
}

export function pushEvent(taskId: string, kind: TaskEvent["kind"], event: GenerationStatusEvent) {
  const items = state.streams.get(taskId) ?? [];
  items.push({
    ...event,
    seq: items.length + 1,
    kind,
  });
  state.streams.set(taskId, items);
}
