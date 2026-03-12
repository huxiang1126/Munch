"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, CreditCard, History, LogOut } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { ThemeToggle } from "@/components/layout/theme-toggle";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";

function getInitials(value: string) {
  const compact = value.trim();
  if (!compact) {
    return "M";
  }

  const parts = compact.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 1).toUpperCase();
  }

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function UserMenu() {
  const router = useRouter();
  const status = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const initials = useMemo(() => getInitials(user?.displayName ?? user?.email ?? "Munch"), [user?.displayName, user?.email]);

  async function handleLogout() {
    setOpen(false);
    await logout();
    router.push("/login");
    router.refresh();
  }

  if (status === "loading") {
    return (
      <div className="h-10 w-[116px] rounded-full border border-border/70 bg-bg-elevated/78 shadow-[0_14px_28px_-22px_rgba(15,15,16,0.28)]" />
    );
  }

  if (status !== "authenticated" || !user) {
    return (
      <Link
        href="/login"
        className="inline-flex h-10 items-center gap-2 rounded-full border border-border/70 bg-bg-elevated/78 px-4 text-sm font-medium text-text-primary shadow-[0_14px_28px_-22px_rgba(15,15,16,0.28)] transition duration-300 hover:-translate-y-0.5 hover:border-border-hover hover:bg-bg-hover"
      >
        Login
      </Link>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className={cn(
          "inline-flex h-10 items-center gap-2 rounded-full border border-border/70 bg-bg-elevated/78 pl-1.5 pr-3 text-text-primary shadow-[0_14px_28px_-22px_rgba(15,15,16,0.28)] transition duration-300 hover:-translate-y-0.5 hover:border-border-hover hover:bg-bg-hover",
          open && "border-border-hover bg-bg-hover",
        )}
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[linear-gradient(135deg,rgba(236,72,153,0.92),rgba(139,92,246,0.88))] text-[11px] font-semibold uppercase tracking-[0.16em] text-white">
          {initials}
        </span>
        <span className="hidden max-w-[120px] truncate text-sm font-medium text-text-primary sm:block">
          {user.displayName}
        </span>
        <ChevronDown
          className={cn(
            "size-4 text-text-tertiary transition duration-200",
            open && "rotate-180 text-text-primary",
          )}
        />
      </button>

      {open ? (
        <div className="absolute right-0 top-[calc(100%+0.65rem)] z-50 w-[280px] rounded-[26px] border border-border/70 bg-bg-elevated/92 p-3 shadow-[0_28px_80px_-34px_rgba(15,15,16,0.62)] backdrop-blur-xl">
          <div className="rounded-[20px] border border-border/60 bg-bg-base/55 px-4 py-3">
            <p className="text-sm font-semibold text-text-primary">{user.displayName}</p>
            <p className="mt-1 truncate text-xs text-text-tertiary">{user.email}</p>
          </div>

          <div className="mt-3 grid gap-2">
            <Link
              href="/studio"
              onClick={() => setOpen(false)}
              className="flex items-center justify-between rounded-[18px] border border-border/60 bg-bg-base/55 px-4 py-3 text-sm text-text-primary transition hover:border-border-hover hover:bg-bg-hover"
            >
              <span className="inline-flex items-center gap-2">
                <History className="size-4 text-text-secondary" />
                创作工作台
              </span>
            </Link>
            <Link
              href="/credits"
              onClick={() => setOpen(false)}
              className="flex items-center justify-between rounded-[18px] border border-border/60 bg-bg-base/55 px-4 py-3 text-sm text-text-primary transition hover:border-border-hover hover:bg-bg-hover"
            >
              <span className="inline-flex items-center gap-2">
                <CreditCard className="size-4 text-text-secondary" />
                积分中心
              </span>
            </Link>
          </div>

          <div className="mt-3 flex items-center justify-between rounded-[18px] border border-border/60 bg-bg-base/55 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-text-primary">Theme</p>
              <p className="mt-1 text-xs text-text-tertiary">Light / Dark</p>
            </div>
            <ThemeToggle className="h-9 w-9" />
          </div>

          <button
            type="button"
            onClick={() => void handleLogout()}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-[18px] border border-border/60 bg-bg-base/55 px-4 py-3 text-sm font-medium text-text-primary transition hover:border-border-hover hover:bg-bg-hover"
          >
            <LogOut className="size-4 text-text-secondary" />
            退出登录
          </button>
        </div>
      ) : null}
    </div>
  );
}
