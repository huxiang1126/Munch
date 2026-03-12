"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Shield, Sparkles, Users, Wallet } from "lucide-react";

import type { Database } from "@/types/database";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [balanceDrafts, setBalanceDrafts] = useState<Record<string, string>>({});
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  async function loadUsers() {
    const response = await fetch("/api/admin/users", { cache: "no-store" });
    if (response.ok) {
      const nextUsers = (await response.json()) as Profile[];
      setUsers(nextUsers);
      setBalanceDrafts(Object.fromEntries(nextUsers.map((user) => [user.id, String(user.credit_balance)])));
    }
    setLoading(false);
  }

  useEffect(() => {
    void loadUsers();
  }, []);

  async function updateUser(id: string, updates: Partial<Profile> & { credit_note?: string }) {
    setUpdatingId(id);
    try {
      const response = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error("更新用户信息失败");
      }

      await loadUsers();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "更新用户信息失败");
    } finally {
      setUpdatingId(null);
    }
  }

  async function commitCreditBalance(user: Profile) {
    const draftValue = Number(balanceDrafts[user.id] ?? user.credit_balance);
    if (!Number.isFinite(draftValue) || draftValue < 0) {
      window.alert("积分余额必须是大于等于 0 的数字。");
      setBalanceDrafts((current) => ({
        ...current,
        [user.id]: String(user.credit_balance),
      }));
      return;
    }

    if (draftValue === user.credit_balance) {
      return;
    }

    await updateUser(user.id, {
      credit_balance: draftValue,
      credit_note: "Admin 在用户管理中直接修改余额",
    });
  }

  const adminCount = useMemo(() => users.filter((user) => user.role === "admin").length, [users]);
  const proCount = useMemo(() => users.filter((user) => user.tier === "pro").length, [users]);
  const totalCredits = useMemo(() => users.reduce((sum, user) => sum + user.credit_balance, 0), [users]);
  const summaryCards = [
    {
      label: "累计积分",
      value: totalCredits,
      icon: Wallet,
    },
    {
      label: "管理员席位",
      value: adminCount,
      icon: Shield,
    },
    {
      label: "活跃操作面",
      value: users.length,
      icon: Users,
    },
  ];

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[34px] border border-border/60 bg-bg-elevated/82 shadow-[0_30px_90px_-54px_rgba(15,15,16,0.66)]">
        <div className="grid gap-0 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="border-b border-border/60 p-7 xl:border-b-0 xl:border-r xl:p-9">
            <p className="text-[11px] uppercase tracking-[0.34em] text-text-tertiary">People Control</p>
            <h1 className="mt-4 font-serif text-4xl leading-tight text-text-primary lg:text-5xl">
              Keep access, roles, and balances clean before anything scales.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-text-secondary">
              This page should feel less like an ops spreadsheet and more like a polished control surface for the
              people inside your product.
            </p>
          </div>

          <div className="grid gap-4 p-7 xl:p-8">
            {[
              ["用户总数", String(users.length), "All profiles currently known to the system."],
              ["管理员", String(adminCount), "People with publish-level authority."],
              ["Pro 用户", String(proCount), "Highest access tier in the current workspace."],
            ].map(([label, value, note]) => (
              <div key={label} className="rounded-[26px] border border-border/60 bg-bg-base/55 p-5">
                <p className="text-[11px] uppercase tracking-[0.28em] text-text-tertiary">{label}</p>
                <p className="mt-3 text-2xl font-medium text-text-primary">{value}</p>
                <p className="mt-2 text-sm text-text-secondary">{note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        {summaryCards.map((card) => (
          <div key={card.label} className="rounded-[28px] border border-border/60 bg-bg-elevated/80 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.26em] text-text-tertiary">{card.label}</p>
                <p className="mt-3 text-3xl font-semibold text-text-primary">{card.value}</p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-bg-base/55 p-3 text-brand">
                <card.icon className="size-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="rounded-[32px] border border-border/60 bg-bg-elevated/80 px-5 py-14 text-center text-sm text-text-tertiary">
          用户加载中...
        </div>
      ) : users.length === 0 ? (
        <div className="rounded-[32px] border border-border/60 bg-bg-elevated/80 px-5 py-14 text-center text-sm text-text-tertiary">
          目前还没有用户资料。
        </div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          {users.map((user) => (
            <article
              key={user.id}
              className="rounded-[30px] border border-border/60 bg-bg-elevated/82 p-6 shadow-[0_24px_48px_-40px_rgba(15,15,16,0.55)]"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-border/60 bg-bg-base/55 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-text-tertiary">
                      {user.role}
                    </span>
                    <span className="rounded-full border border-border/60 bg-bg-base/55 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-text-tertiary">
                      {user.tier}
                    </span>
                  </div>
                  <h2 className="mt-4 font-serif text-3xl text-text-primary">{user.display_name ?? "未命名用户"}</h2>
                  <p className="mt-2 break-all text-sm text-text-secondary">{user.id}</p>
                </div>

                <div className="rounded-[24px] border border-border/60 bg-bg-base/55 px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-text-tertiary">Created</p>
                  <p className="mt-2 text-sm text-text-primary">{new Date(user.created_at).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-[24px] border border-border/60 bg-bg-base/55 p-4">
                  <label className="mb-2 block text-sm font-medium text-text-primary">等级</label>
                  <select
                    value={user.tier}
                    onChange={(event) => void updateUser(user.id, { tier: event.target.value as Profile["tier"] })}
                    disabled={updatingId === user.id}
                    className="w-full rounded-2xl border border-border/70 bg-bg-elevated/70 px-4 py-3 text-sm text-text-primary focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15"
                  >
                    <option value="free">Free</option>
                    <option value="basic">Basic</option>
                    <option value="pro">Pro</option>
                  </select>
                </div>

                <div className="rounded-[24px] border border-border/60 bg-bg-base/55 p-4">
                  <label className="mb-2 block text-sm font-medium text-text-primary">角色</label>
                  <select
                    value={user.role}
                    onChange={(event) => void updateUser(user.id, { role: event.target.value as Profile["role"] })}
                    disabled={updatingId === user.id}
                    className="w-full rounded-2xl border border-border/70 bg-bg-elevated/70 px-4 py-3 text-sm text-text-primary focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15"
                  >
                    <option value="user">user</option>
                    <option value="admin">admin</option>
                  </select>
                </div>
              </div>

              <div className="mt-4 rounded-[24px] border border-border/60 bg-bg-base/55 p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
                  <div className="flex-1">
                    <label className="mb-2 block text-sm font-medium text-text-primary">积分余额</label>
                    <input
                      type="number"
                      min="0"
                      value={balanceDrafts[user.id] ?? String(user.credit_balance)}
                      onChange={(event) =>
                        setBalanceDrafts((current) => ({
                          ...current,
                          [user.id]: event.target.value,
                        }))
                      }
                      className="w-full rounded-2xl border border-border/70 bg-bg-elevated/70 px-4 py-3 text-sm text-text-primary focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => void commitCreditBalance(user)}
                    disabled={updatingId === user.id}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,rgba(236,72,153,0.94),rgba(139,92,246,0.88))] px-5 py-3 text-sm font-medium text-white shadow-[0_24px_48px_-30px_rgba(139,92,246,0.7)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    应用余额
                    <ArrowRight className="size-4" />
                  </button>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.22em] text-text-tertiary">
                  <Sparkles className="size-3.5" />
                  Current balance {user.credit_balance}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
