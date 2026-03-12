import type {
  GeneratedImage,
  GenerationModel,
  GenerationStatus,
  UserTier,
} from "@/types/generation";
import type { AppUser } from "@/types/auth";

export interface GenerateRequest {
  templateId?: string;
  prompt?: string;
  variables: Record<string, string>;
  model: GenerationModel;
  imageCount: 1 | 2 | 3 | 4;
  referenceImages?: Record<string, string>;
  customPrompt?: string;
  thinkingEnabled?: boolean;
  aspectRatio?: string;
}

export interface GenerateResponse {
  taskId: string;
  creditsCharged: number;
  estimatedSeconds: number;
}

export interface ErrorResponse {
  error: string;
  message: string;
}

export interface CreditsResponse {
  balance: number;
  tier: UserTier;
}

export interface CreditTransactionItem {
  id: string;
  type: "grant" | "purchase" | "consume" | "refund";
  amount: number;
  balanceAfter: number;
  description: string;
  referenceId: string | null;
  createdAt: string;
}

export interface HistoryItem {
  id: string;
  templateId: string;
  templateName: string;
  variables: Record<string, string>;
  prompt?: string;
  customPrompt?: string;
  thinkingEnabled?: boolean;
  generationMode?: "template" | "free";
  aspectRatio?: string;
  model: GenerationModel;
  status: GenerationStatus;
  imageCount: number;
  creditsCost: number;
  thumbnailUrl: string;
  createdAt: string;
}

export interface HistoryResponse {
  items: HistoryItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface UserAsset {
  id: string;
  name: string;
  kind: "reference" | "face" | "outfit" | "product" | "other";
  mimeType: string;
  fileSize: number;
  width: number | null;
  height: number | null;
  url: string;
  createdAt: string;
  updatedAt: string;
  lastUsedAt: string | null;
}

export interface UserAssetsResponse {
  items: UserAsset[];
}

export interface CreditHistoryResponse {
  items: CreditTransactionItem[];
  total: number;
}

export interface AuthMeResponse {
  user: AppUser | null;
}

export interface GenerationStatusEvent {
  status: GenerationStatus;
  message: string;
  progress?: number;
  images?: GeneratedImage[];
  compiledPrompt?: string;
}
