"use client";

import useSWR from "swr";

import type { CreditsResponse } from "@/types/api";
import { useAuthStore } from "@/stores/auth-store";

async function fetcher(url: string) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("读取积分失败");
  }
  return (await response.json()) as CreditsResponse;
}

export function useCredits() {
  const status = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);

  return useSWR(status === "authenticated" ? "/api/credits" : null, fetcher, {
    fallbackData: {
      balance: user?.credits ?? 0,
      tier: user?.tier ?? "free",
    },
    revalidateOnFocus: true,
  });
}
