"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Images, LayoutDashboard, Sparkles, Users, Zap } from "lucide-react";

interface Stats {
  totalUsers: number;
  publishedTemplates: number;
  totalGenerations: number;
  totalCreditsConsumed: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    let active = true;

    async function loadStats() {
      try {
        const response = await fetch("/api/admin/stats", { cache: "no-store" });
        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as Stats;
        if (active) {
          setStats(data);
        }
      } catch {}
    }

    void loadStats();

    return () => {
      active = false;
    };
  }, []);

  const cards = [
    {
      label: "注册用户",
      value: stats?.totalUsers ?? "-",
      icon: Users,
      color: "text-sky-400",
      note: "People inside the workspace",
    },
    {
      label: "已发布模板",
      value: stats?.publishedTemplates ?? "-",
      icon: Images,
      color: "text-emerald-400",
      note: "Templates visible to production",
    },
    {
      label: "累计出图",
      value: stats?.totalGenerations ?? "-",
      icon: LayoutDashboard,
      color: "text-violet-400",
      note: "All generations recorded",
    },
    {
      label: "消耗积分",
      value: stats?.totalCreditsConsumed ?? "-",
      icon: Zap,
      color: "text-amber-400",
      note: "Credits consumed so far",
    },
  ];

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[34px] border border-border/60 bg-bg-elevated/82 shadow-[0_30px_90px_-54px_rgba(15,15,16,0.66)]">
        <div className="grid gap-0 lg:grid-cols-[1.4fr_0.9fr]">
          <div className="border-b border-border/60 p-7 lg:border-b-0 lg:border-r lg:p-9">
            <p className="text-[11px] uppercase tracking-[0.34em] text-text-tertiary">Studio Pulse</p>
            <h1 className="mt-4 max-w-3xl font-serif text-4xl leading-tight text-text-primary lg:text-5xl">
              A control room for publishing, polish, and production rhythm.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-text-secondary">
              Keep the library sharp, move templates out of draft faster, and make sure users, credits, and launch
              assets stay aligned before anything reaches the public product.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/admin/templates/new"
                className="inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,rgba(236,72,153,0.94),rgba(139,92,246,0.88))] px-5 py-3 text-sm font-medium text-white shadow-[0_24px_48px_-30px_rgba(139,92,246,0.7)] transition hover:-translate-y-0.5"
              >
                新建模板
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/admin/templates"
                className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-bg-base/60 px-5 py-3 text-sm font-medium text-text-primary transition hover:border-border-hover hover:bg-bg-hover/70"
              >
                打开模板库
              </Link>
            </div>
          </div>

          <div className="p-7 lg:p-8">
            <div className="rounded-[28px] border border-border/60 bg-bg-base/55 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,rgba(236,72,153,0.16),rgba(245,158,11,0.14))] text-brand">
                  <Sparkles className="size-4" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.26em] text-text-tertiary">Priority Now</p>
                  <p className="mt-1 text-sm font-medium text-text-primary">Push templates from local studio to a publish-ready library.</p>
                </div>
              </div>
              <div className="mt-5 space-y-3 text-sm text-text-secondary">
                <div className="rounded-2xl border border-border/50 bg-bg-elevated/80 px-4 py-3">
                  Tighten descriptions, upload stronger thumbnails, and keep variable names clean.
                </div>
                <div className="rounded-2xl border border-border/50 bg-bg-elevated/80 px-4 py-3">
                  Use seed templates for repeatable imports, then curate final ordering from here.
                </div>
                <div className="rounded-2xl border border-border/50 bg-bg-elevated/80 px-4 py-3">
                  Review credits and user access before switching the public system to remote persistence.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-[28px] border border-border/60 bg-bg-elevated/80 p-5 shadow-[0_24px_48px_-40px_rgba(15,15,16,0.55)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[11px] uppercase tracking-[0.26em] text-text-tertiary">{card.label}</span>
                <p className="mt-2 text-3xl font-semibold text-text-primary">{card.value}</p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-bg-base/55 p-3">
                <card.icon className={`size-5 ${card.color}`} />
              </div>
            </div>
            <p className="mt-4 text-sm text-text-secondary">{card.note}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-[30px] border border-border/60 bg-bg-elevated/80 p-6">
          <p className="text-[11px] uppercase tracking-[0.3em] text-text-tertiary">Workflow</p>
          <h2 className="mt-3 font-serif text-3xl text-text-primary">The fastest path from prompt to library.</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              ["Seed", "Turn strong prompts into reusable seed templates and keep the library structurally clean."],
              ["Curate", "Polish covers, tags, variables, and ordering inside the admin instead of touching raw JSON."],
              ["Ship", "Move the strongest pieces into published state only when the surface feels coherent."],
            ].map(([title, body]) => (
              <div key={title} className="rounded-[26px] border border-border/60 bg-bg-base/55 p-4">
                <p className="text-sm font-medium text-text-primary">{title}</p>
                <p className="mt-2 text-sm leading-6 text-text-secondary">{body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[30px] border border-border/60 bg-bg-elevated/80 p-6">
          <p className="text-[11px] uppercase tracking-[0.3em] text-text-tertiary">Shortcuts</p>
          <div className="mt-5 space-y-3">
            {[
              ["/admin/templates", "模板管理", "Review publish state, thumbnails, and metadata."],
              ["/admin/users", "用户管理", "Check access, tiers, and operational readiness."],
              ["/admin/credits", "积分管理", "Adjust balances and watch recent movement."],
            ].map(([href, label, body]) => (
              <Link
                key={href}
                href={href}
                className="flex items-center justify-between rounded-[24px] border border-border/60 bg-bg-base/55 px-4 py-4 text-left transition hover:border-border-hover hover:bg-bg-hover/60"
              >
                <div>
                  <p className="text-sm font-medium text-text-primary">{label}</p>
                  <p className="mt-1 text-sm text-text-secondary">{body}</p>
                </div>
                <ArrowRight className="size-4 text-text-tertiary" />
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
