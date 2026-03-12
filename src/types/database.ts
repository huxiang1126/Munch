import type { GenerationModel, GenerationStatus, UserTier } from "@/types/generation";
import type { TemplateCategory } from "@/types/template";

export interface TemplateVariableOption {
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
  // select 专属
  options?: TemplateVariableOption[];
  defaultValue?: string;
  // slider 专属
  min?: number;
  max?: number;
  step?: number;
  defaultNumber?: number;
  unit?: string;
  // image 专属
  accept?: string;
  maxSizeMB?: number;
  uploadHint?: string;
}

export interface DbTemplate {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: TemplateCategory;
  tags: string[];
  thumbnail_url: string | null;
  thumbnail_path: string | null;
  default_model: GenerationModel;
  compatible_models: GenerationModel[];
  default_image_size: {
    width: number;
    height: number;
  };
  variables: TemplateVariable[];
  skill_prompt: string;
  base_prompt: string;
  negative_prompt: string | null;
  credit_multiplier: number;
  is_published: boolean;
  sort_order: number;
  tier_required: UserTier;
  created_at: string;
  updated_at: string;
}

export type UserRole = "user" | "admin";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          avatar_url: string | null;
          phone: string | null;
          credit_balance: number;
          tier: UserTier;
          role: UserRole;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          avatar_url?: string | null;
          phone?: string | null;
          credit_balance?: number;
          tier?: UserTier;
          role?: UserRole;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          phone?: string | null;
          credit_balance?: number;
          tier?: UserTier;
          role?: UserRole;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      templates: {
        Row: DbTemplate;
        Insert: Omit<DbTemplate, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<DbTemplate, "id" | "created_at" | "updated_at">>;
        Relationships: [];
      };
      credit_transactions: {
        Row: {
          id: string;
          user_id: string;
          type: "grant" | "purchase" | "consume" | "refund";
          amount: number;
          balance_after: number;
          reference_type: string | null;
          reference_id: string | null;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: "grant" | "purchase" | "consume" | "refund";
          amount: number;
          balance_after: number;
          reference_type?: string | null;
          reference_id?: string | null;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: "grant" | "purchase" | "consume" | "refund";
          amount?: number;
          balance_after?: number;
          reference_type?: string | null;
          reference_id?: string | null;
          description?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      generations: {
        Row: {
          id: string;
          user_id: string;
          template_id: string;
          variables: Record<string, string>;
          model: GenerationModel;
          image_count: number;
          raw_prompt: string | null;
          compiled_prompt: string | null;
          negative_prompt: string | null;
          status: Exclude<GenerationStatus, "idle">;
          error_message: string | null;
          credits_cost: number;
          created_at: string;
          started_at: string | null;
          completed_at: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          template_id: string;
          variables: Record<string, string>;
          model: GenerationModel;
          image_count: number;
          raw_prompt?: string | null;
          compiled_prompt?: string | null;
          negative_prompt?: string | null;
          status: Exclude<GenerationStatus, "idle">;
          error_message?: string | null;
          credits_cost: number;
          created_at?: string;
          started_at?: string | null;
          completed_at?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          template_id?: string;
          variables?: Record<string, string>;
          model?: GenerationModel;
          image_count?: number;
          raw_prompt?: string | null;
          compiled_prompt?: string | null;
          negative_prompt?: string | null;
          status?: Exclude<GenerationStatus, "idle">;
          error_message?: string | null;
          credits_cost?: number;
          created_at?: string;
          started_at?: string | null;
          completed_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      generated_images: {
        Row: {
          id: string;
          generation_id: string;
          user_id: string;
          image_index: number;
          storage_path: string;
          width: number | null;
          height: number | null;
          file_size: number | null;
          format: string | null;
          is_favorited: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          generation_id: string;
          user_id: string;
          image_index: number;
          storage_path: string;
          width?: number | null;
          height?: number | null;
          file_size?: number | null;
          format?: string | null;
          is_favorited?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          generation_id?: string;
          user_id?: string;
          image_index?: number;
          storage_path?: string;
          width?: number | null;
          height?: number | null;
          file_size?: number | null;
          format?: string | null;
          is_favorited?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      user_assets: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          kind: "reference" | "face" | "outfit" | "product" | "other";
          mime_type: string;
          file_size: number;
          width: number | null;
          height: number | null;
          storage_path: string;
          created_at: string;
          updated_at: string;
          last_used_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          kind?: "reference" | "face" | "outfit" | "product" | "other";
          mime_type: string;
          file_size: number;
          width?: number | null;
          height?: number | null;
          storage_path: string;
          created_at?: string;
          updated_at?: string;
          last_used_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          kind?: "reference" | "face" | "outfit" | "product" | "other";
          mime_type?: string;
          file_size?: number;
          width?: number | null;
          height?: number | null;
          storage_path?: string;
          created_at?: string;
          updated_at?: string;
          last_used_at?: string | null;
        };
        Relationships: [];
      };
    };
  };
}
