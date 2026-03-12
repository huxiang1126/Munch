import type { UserTier } from "@/types/generation";

export interface AppUser {
  id: string;
  email: string;
  displayName: string;
  tier: UserTier;
  credits: number;
  isDemo: boolean;
}

export interface DemoSession {
  id: string;
  email: string;
  displayName: string;
  tier: UserTier;
  credits: number;
}
