"use client";

import { create } from "zustand";

import type { AuthMeResponse } from "@/types/api";
import type { AppUser } from "@/types/auth";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthState {
  status: AuthStatus;
  user: AppUser | null;
  hydrate: () => Promise<void>;
  loginDemo: (payload?: { displayName?: string; email?: string; password?: string }) => Promise<void>;
  logout: () => Promise<void>;
}

async function fetchJson<T>(input: RequestInfo, init?: RequestInit) {
  const response = await fetch(input, init);
  if (!response.ok) {
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const payload = (await response.json().catch(() => null)) as { message?: string } | null;
      throw new Error(payload?.message ?? "请求失败");
    }

    throw new Error("请求失败");
  }
  return (await response.json()) as T;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  status: "loading",
  user: null,
  hydrate: async () => {
    const status = get().status;
    if (status === "authenticated") {
      return;
    }

    try {
      const data = await fetchJson<AuthMeResponse>("/api/auth/me", {
        cache: "no-store",
      });
      set({
        status: data.user ? "authenticated" : "unauthenticated",
        user: data.user,
      });
    } catch {
      set({
        status: "unauthenticated",
        user: null,
      });
    }
  },
  loginDemo: async (payload) => {
    const data = await fetchJson<AuthMeResponse>("/api/auth/demo", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        displayName: payload?.displayName ?? "Munch Beta User",
        email: payload?.email ?? "demo@munch.ai",
        password: payload?.password,
      }),
    });

    set({
      status: "authenticated",
      user: data.user,
    });
  },
  logout: async () => {
    await fetch("/api/auth/logout", {
      method: "POST",
    });

    set({
      status: "unauthenticated",
      user: null,
    });
  },
}));
