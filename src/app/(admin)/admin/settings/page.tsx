import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { Database, FolderKanban, HardDriveUpload, ShieldCheck } from "lucide-react";

function getLocalTemplateCount() {
  const filePath = join(process.cwd(), ".munch", "admin-templates.json");
  if (!existsSync(filePath)) {
    return 0;
  }

  try {
    const raw = JSON.parse(readFileSync(filePath, "utf8")) as unknown;
    return Array.isArray(raw) ? raw.length : 0;
  } catch {
    return 0;
  }
}

export default function AdminSettingsPage() {
  const hasSupabaseUrl = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const hasAnonKey = Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const hasServiceRole = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
  const localTemplateCount = getLocalTemplateCount();
  const dataMode = hasSupabaseUrl && hasAnonKey ? "Supabase + fallback" : "Local fallback only";
  const readinessScore = [hasSupabaseUrl, hasAnonKey, hasServiceRole].filter(Boolean).length;

  const items = [
    {
      label: "数据模式",
      value: dataMode,
      note: "Chooses between local persistence only, or remote-first with fallback behavior.",
    },
    {
      label: "Supabase URL",
      value: hasSupabaseUrl ? "已配置" : "未配置",
      note: "Required for remote data reads and writes.",
    },
    {
      label: "Supabase Anon Key",
      value: hasAnonKey ? "已配置" : "未配置",
      note: "Required for browser-authenticated product traffic.",
    },
    {
      label: "Service Role Key",
      value: hasServiceRole ? "已配置" : "未配置",
      note: "Needed for privileged admin writes and server-side uploads.",
    },
    {
      label: "模板图片 Bucket",
      value: "template-images",
      note: "Expected public storage bucket for cover assets.",
    },
    {
      label: "本地模板数量",
      value: String(localTemplateCount),
      note: "Current templates stored in the local studio file.",
    },
  ];

  const statusCards = [
    {
      label: "Infra",
      value: `${readinessScore}/3`,
      note: readinessScore === 3 ? "Production-ready config present." : "Local-first configuration still active.",
      icon: Database,
    },
    {
      label: "Assets",
      value: "template-images",
      note: "Expected bucket for uploaded template covers.",
      icon: HardDriveUpload,
    },
    {
      label: "Library File",
      value: ".munch/admin-templates.json",
      note: "Current local persistence file for studio templates.",
      icon: FolderKanban,
    },
    {
      label: "Privileges",
      value: hasServiceRole ? "Elevated" : "Limited",
      note: hasServiceRole ? "Admin upload paths can use privileged writes." : "Privileged admin actions are still constrained.",
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[34px] border border-border/60 bg-bg-elevated/82 shadow-[0_30px_90px_-54px_rgba(15,15,16,0.66)]">
        <div className="grid gap-0 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="border-b border-border/60 p-7 xl:border-b-0 xl:border-r xl:p-9">
            <p className="text-[11px] uppercase tracking-[0.34em] text-text-tertiary">System Readiness</p>
            <h1 className="mt-4 font-serif text-4xl leading-tight text-text-primary lg:text-5xl">
              Make the backend feel ready before the domain goes public.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-text-secondary">
              This page is the final check for data mode, persistence, upload paths, and environment readiness. It
              should read like a launch surface, not a developer dump.
            </p>
          </div>

          <div className="p-7 xl:p-8">
            <div className="rounded-[28px] border border-border/60 bg-bg-base/55 p-5">
              <p className="text-xs uppercase tracking-[0.26em] text-text-tertiary">Current State</p>
              <p className="mt-3 font-serif text-3xl text-text-primary">
                {readinessScore === 3 ? "Remote-ready" : "Local studio"}
              </p>
              <p className="mt-3 text-sm leading-6 text-text-secondary">
                {readinessScore === 3
                  ? "The project has the minimum remote environment keys needed to behave like a production admin."
                  : "The product is still optimized for local editing and curation before final deployment."}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statusCards.map((card) => (
          <div key={card.label} className="rounded-[28px] border border-border/60 bg-bg-elevated/80 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.26em] text-text-tertiary">{card.label}</p>
                <p className="mt-3 break-all text-xl font-medium text-text-primary">{card.value}</p>
                <p className="mt-2 text-sm text-text-secondary">{card.note}</p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-bg-base/55 p-3 text-brand">
                <card.icon className="size-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[30px] border border-border/60 bg-bg-elevated/82 p-6 shadow-[0_24px_48px_-40px_rgba(15,15,16,0.55)]">
          <p className="text-[11px] uppercase tracking-[0.3em] text-text-tertiary">Configuration Matrix</p>
          <h2 className="mt-3 font-serif text-3xl text-text-primary">Operational status</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {items.map((item) => (
              <div key={item.label} className="rounded-[24px] border border-border/60 bg-bg-base/55 p-5">
                <p className="text-[11px] uppercase tracking-[0.24em] text-text-tertiary">{item.label}</p>
                <p className="mt-3 break-all text-lg font-medium text-text-primary">{item.value}</p>
                <p className="mt-2 text-sm leading-6 text-text-secondary">{item.note}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[30px] border border-border/60 bg-bg-elevated/82 p-6 shadow-[0_24px_48px_-40px_rgba(15,15,16,0.55)]">
          <p className="text-[11px] uppercase tracking-[0.3em] text-text-tertiary">Notes</p>
          <h2 className="mt-3 font-serif text-3xl text-text-primary">What this means</h2>
          <div className="mt-6 space-y-3">
            {[
              "如果只配置了本地 fallback，模板、用户和积分调整都会走本地模拟层，适合录入和预演，不适合正式公网。",
              "如果要在 Supabase 中启用图片上传和后台积分流水，最好同时配置 Service Role Key。",
              "当前本地模板库保存在项目根目录下的 `.munch/admin-templates.json`，重启后不会丢，但它不是最终线上数据源。",
            ].map((note) => (
              <div key={note} className="rounded-[24px] border border-border/60 bg-bg-base/55 px-4 py-4 text-sm leading-6 text-text-secondary">
                {note}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
