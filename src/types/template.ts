import type { GenerationModel } from "@/types/generation";

export interface VariableOption {
  value: string;
  label: string;
  description?: string;
}

export interface TemplateVariable {
  id: string;
  name: string;
  type: "select" | "slider" | "image";
  required: boolean;
  priority: number;
  options?: VariableOption[];
  defaultValue?: string;
  min?: number;
  max?: number;
  step?: number;
  defaultNumber?: number;
  unit?: string;
  accept?: string;
  maxSizeMB?: number;
  uploadHint?: string;
}

export type TemplateCategory =
  | "skincare"
  | "fashion"
  | "portrait"
  | "food"
  | "product"
  | "poster";

export interface Template {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  tags: string[];
  thumbnailUrl: string;
  defaultModel: GenerationModel;
  compatibleModels: GenerationModel[];
  defaultImageSize: {
    width: number;
    height: number;
  };
  variables: TemplateVariable[];
  skillPrompt: string;
  basePrompt: string;
  negativePrompt?: string;
  creditMultiplier: number;
}
