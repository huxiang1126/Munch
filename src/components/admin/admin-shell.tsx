"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, CreditCard, Images, LayoutDashboard, Settings, Sparkles, Users } from "lucide-react";

import { ThemeToggle } from "@/components/layout/theme-toggle";
import { BrandLockup } from "@/components/shared/brand-lockup";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin", label: "概览", note: "Studio pulse", icon: LayoutDashboard },
  { href: "/admin/templates", label: "模板管理", note: "Library", icon: Images },
  { href: "/admin/users", label: "用户管理", note: "People", icon: Users },
  { href: "/admin/credits", label: "积分管理", note: "Ledger", icon: CreditCard },
  { href: "/admin/settings", label: "系统设置", note: "Stack", icon: Settings },
];

interface AdminShellProps {
  children: React.ReactNode;
  user: {
    displayName: string;
    email: string;
  };
}

function isActivePath(pathname: string, href: string) {
  if (href === "/admin") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminShell({ children, user }: AdminShellProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-bg-base">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-20 top-16 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(236,72,153,0.16),transparent_68%)] blur-3xl" />
        <div className="absolute right-0 top-0 h-[26rem] w-[26rem] rounded-full bg-[radial-gradient(circle,rgba(245,158,11,0.14),transparent_70%)] blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.14),transparent_72%)] blur-3xl" />
      </div>

      <aside className="mx-4 mb-4 mt-4 flex flex-col overflow-hidden rounded-[32px] border border-border/60 bg-bg-elevated/80 shadow-[0_28px_90px_-48px_rgba(15,15,16,0.65)] backdrop-blur-xl lg:fixed lg:inset-y-5 lg:left-5 lg:mb-0 lg:mt-0 lg:w-[290px]">
        <div className="border-b border-border/60 px-5 py-5">
          <Link
            href="/"
            className="mb-5 inline-flex items-center gap-2 text-xs uppercase tracking-[0.26em] text-text-tertiary transition hover:text-text-primary"
          >
            <ArrowLeft className="size-3.5" />
            返回前台
          </Link>

          <div className="flex items-start justify-between gap-3">
            <div className="space-y-3">
              <BrandLockup size="sm" />
              <div>
                <p className="text-[11px] uppercase tracking-[0.34em] text-text-tertiary">Admin Atelier</p>
                <p className="mt-2 max-w-[180px] font-serif text-2xl leading-none text-text-primary">
                  Make The System Feel Publish-Ready.
                </p>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>

        <nav className="flex gap-2 overflow-x-auto px-4 py-4 lg:flex-1 lg:flex-col lg:overflow-visible">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group min-w-[154px] rounded-[24px] border px-4 py-3 transition duration-200 lg:min-w-0",
                isActivePath(pathname, item.href)
                  ? "border-transparent bg-[linear-gradient(135deg,rgba(236,72,153,0.94),rgba(139,92,246,0.88))] text-white shadow-[0_24px_48px_-30px_rgba(139,92,246,0.65)]"
                  : "border-border/60 bg-bg-base/55 text-text-secondary hover:border-border-hover hover:bg-bg-hover/60 hover:text-text-primary",
              )}
            >
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-2xl border transition",
                    isActivePath(pathname, item.href)
                      ? "border-white/20 bg-white/12"
                      : "border-border/50 bg-bg-elevated/70 group-hover:border-border-hover",
                  )}
                >
                  <item.icon className="size-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium">{item.label}</p>
                  <p
                    className={cn(
                      "text-[11px] uppercase tracking-[0.24em]",
                      isActivePath(pathname, item.href) ? "text-white/72" : "text-text-tertiary",
                    )}
                  >
                    {item.note}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </nav>

        <div className="border-t border-border/60 px-4 py-4">
          <div className="rounded-[26px] border border-border/60 bg-bg-base/55 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,rgba(236,72,153,0.16),rgba(139,92,246,0.16))] text-brand">
                <Sparkles className="size-4" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-text-primary">{user.displayName}</p>
                <p className="truncate text-xs text-text-tertiary">{user.email}</p>
              </div>
            </div>
            <div className="mt-4 rounded-2xl border border-border/50 bg-bg-elevated/70 px-3 py-3">
              <p className="text-[11px] uppercase tracking-[0.28em] text-text-tertiary">Workspace Mode</p>
              <p className="mt-1 text-sm text-text-secondary">Editorial dashboard for templates, users, and launches.</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="px-4 pb-8 lg:ml-[330px] lg:px-8 lg:pt-6">
        <div className="mx-auto max-w-[1360px]">
          <div className="mb-6 rounded-[30px] border border-border/60 bg-bg-elevated/68 px-5 py-4 shadow-[0_20px_54px_-40px_rgba(15,15,16,0.52)] backdrop-blur-xl lg:px-7">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.34em] text-text-tertiary">Munch Admin</p>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-text-secondary">
                  The control surface for templates, publishing, people, and credits. Everything here should feel
                  as composed as the product you ship.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-border/60 bg-bg-base/65 px-3 py-1.5 text-xs uppercase tracking-[0.24em] text-text-tertiary">
                  Deliverable UI
                </span>
                <span className="rounded-full border border-border/60 bg-bg-base/65 px-3 py-1.5 text-xs uppercase tracking-[0.24em] text-text-tertiary">
                  Local Studio
                </span>
              </div>
            </div>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
