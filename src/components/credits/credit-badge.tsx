"use client";

import { Coins } from "lucide-react";

import { useCredits } from "@/hooks/use-credits";
import { useAuthStore } from "@/stores/auth-store";

export function CreditBadge() {
  const status = useAuthStore((state) => state.status);
  const { data } = useCredits();

  return (
    <div className="flex items-center gap-2 rounded-full border border-brand/20 bg-brand-muted px-3 py-1.5 text-sm text-text-primary">
      <Coins className="size-4 text-brand" />
      <span>{status === "authenticated" ? `${data?.balance ?? 0} 积分` : "访客"}</span>
    </div>
  );
}
