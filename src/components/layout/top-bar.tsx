"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, Coins } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { UserMenu } from "@/components/layout/user-menu";
import { BrandLockup } from "@/components/shared/brand-lockup";
import { useCredits } from "@/hooks/use-credits";
import { useAuthStore } from "@/stores/auth-store";

export function TopBar() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(true);
  const prevScrollY = useRef(0);
  const ticking = useRef(false);
  const status = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);
  const { data: creditData } = useCredits();

  const credits = creditData?.balance ?? user?.credits ?? 0;
  const tier = creditData?.tier ?? user?.tier ?? "free";
  const isStudioPage = pathname === "/studio";

  useEffect(() => {
    const handleScroll = () => {
      if (ticking.current) {
        return;
      }

      ticking.current = true;
      requestAnimationFrame(() => {
        const currentY = window.scrollY;

        if (currentY <= 0) {
          setVisible(true);
        } else if (currentY > prevScrollY.current && currentY > 30) {
          setVisible(false);
        } else if (currentY < prevScrollY.current) {
          setVisible(true);
        }

        prevScrollY.current = currentY;
        ticking.current = false;
      });
    };

    prevScrollY.current = window.scrollY;
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className="fixed inset-x-0 top-0 z-50 border-b border-border/60 bg-bg-base/80 backdrop-blur-xl transition-transform duration-300 ease-out"
      style={{ transform: visible ? "translateY(0)" : "translateY(-100%)" }}
    >
      <div className="flex h-14 items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-3">
          {isStudioPage ? (
            <Link
              href="/"
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border/70 bg-bg-elevated/78 px-3 text-sm text-text-secondary shadow-[0_14px_28px_-22px_rgba(15,15,16,0.28)] transition duration-300 hover:-translate-y-0.5 hover:border-border-hover hover:bg-bg-hover hover:text-text-primary"
            >
              <ArrowLeft className="size-4" />
              选模板
            </Link>
          ) : null}
          <Link href="/" className="flex items-center gap-2">
            <BrandLockup size="md" />
          </Link>
        </div>
        <div className="flex items-center gap-2">
          {status === "authenticated" ? (
            <div className="flex items-center gap-1.5 rounded-full border border-border/60 bg-bg-elevated/70 px-3 py-1.5 text-sm">
              <Coins className="size-3.5 text-brand" />
              <span className="font-medium text-text-primary">{credits}</span>
            </div>
          ) : null}

          {status === "authenticated" ? (
            <div className="rounded-full bg-gradient-to-r from-brand/80 to-brand px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-white">
              {tier}
            </div>
          ) : null}

          <UserMenu />
        </div>
      </div>
    </header>
  );
}
