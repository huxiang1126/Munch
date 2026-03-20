"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, KeyRound, Shield, Sparkles, UserPlus, Users, Wallet } from "lucide-react";

import { LoadingDots } from "@/components/shared/loading-dots";
import type { Database } from "@/types/database";

type Profile = Database["public"]["Tables"]["profiles"]["Row"] & {
  email?: string | null;
  auth_source?: "local-super-admin" | "local-whitelist" | "runtime";
};

const emptyCreateForm = {
  email: "",
  displayName: "",
  password: "",
  tier: "pro" as Profile["tier"],
  creditBalance: "120",
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [balanceDrafts, setBalanceDrafts] = useState<Record<string, string>>({});
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState(emptyCreateForm);

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

  async function updateUser(
    id: string,
    updates: Partial<Profile> & { credit_note?: string; password?: string },
  ) {
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
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "更新用户信息失败");
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

  async function handleCreateUser() {
    const email = createForm.email.trim().toLowerCase();
    const credits = Number(createForm.creditBalance);

    if (!email) {
      window.alert("请输入邮箱。");
      return;
    }

    if (!Number.isFinite(credits) || credits < 0) {
      window.alert("请输入有效的初始积分。");
      return;
    }

    setCreating(true);
    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          display_name: createForm.displayName.trim() || undefined,
          password: createForm.password.trim() || undefined,
          tier: createForm.tier,
          credit_balance: credits,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { error?: string; generated_password?: string | null }
        | null;

      if (!response.ok) {
        throw new Error(payload?.error ?? "创建白名单用户失败");
      }

      await loadUsers();
      const generatedPassword = payload?.generated_password;
      setCreateForm(emptyCreateForm);

      if (generatedPassword) {
        window.alert(`账号已创建。\n\n邮箱：${email}\n系统生成密码：${generatedPassword}`);
      } else {
        window.alert("账号已创建。");
      }
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "创建白名单用户失败");
    } finally {
      setCreating(false);
    }
  }

  const totalCredits = useMemo(() => users.reduce((sum, user) => sum + user.credit_balance, 0), [users]);
  const whitelistCount = useMemo(
    () => users.filter((user) => user.auth_source === "local-whitelist").length,
    [users],
  );
  const proCount = useMemo(() => users.filter((user) => user.tier === "pro").length, [users]);
  const summaryCards = [
    {
      label: "累计积分",
      value: totalCredits,
      icon: Wallet,
    },
    {
      label: "白名单账号",
      value: whitelistCount,
      icon: Users,
    },
    {
      label: "Pro 客户",
      value: proCount,
      icon: Sparkles,
    },
  ];

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[34px] border border-border/60 bg-bg-elevated/82 shadow-[0_30px_90px_-54px_rgba(15,15,16,0.66)]">
        <div className="grid gap-0 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="border-b border-border/60 p-7 xl:border-b-0 xl:border-r xl:p-9">
            <p className="text-[11px] uppercase tracking-[0.34em] text-text-tertiary">Whitelist Access</p>
            <h1 className="mt-4 font-serif text-4xl leading-tight text-text-primary lg:text-5xl">
              Create customer accounts, decide their password, and grant credits in one place.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-text-secondary">
              Munch now uses a simple whitelist flow: only the accounts you create here can log in, and each one can
              have its own password, tier, and starting balance.
            </p>
          </div>

          <div className="grid gap-4 p-7 xl:p-8">
            {[
              ["用户总数", String(users.length), "Accounts currently visible to this workspace."],
              ["白名单", String(whitelistCount), "Manually created login accounts for customers."],
              ["默认后台权限", "仅你本人", "Only the super admin email can enter /admin."],
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

      <section className="rounded-[30px] border border-border/60 bg-bg-elevated/82 p-6 shadow-[0_24px_48px_-40px_rgba(15,15,16,0.55)]">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.3em] text-text-tertiary">Create Access</p>
            <h2 className="mt-3 font-serif text-3xl text-text-primary">Add a customer to the whitelist.</h2>
          </div>
          <div className="rounded-[22px] border border-border/60 bg-bg-base/55 px-4 py-3 text-xs leading-6 text-text-secondary">
            密码留空时，系统会自动生成一条初始密码给你。
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div className="xl:col-span-2">
            <label className="mb-2 block text-sm font-medium text-text-primary">邮箱</label>
            <input
              type="email"
              value={createForm.email}
              onChange={(event) => setCreateForm((current) => ({ ...current, email: event.target.value }))}
              placeholder="client@example.com"
              className="w-full rounded-2xl border border-border/70 bg-bg-base/60 px-4 py-3 text-sm text-text-primary focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-text-primary">显示名</label>
            <input
              type="text"
              value={createForm.displayName}
              onChange={(event) => setCreateForm((current) => ({ ...current, displayName: event.target.value }))}
              placeholder="可选，不填则取邮箱前缀"
              className="w-full rounded-2xl border border-border/70 bg-bg-base/60 px-4 py-3 text-sm text-text-primary focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-text-primary">密码</label>
            <input
              type="text"
              value={createForm.password}
              onChange={(event) => setCreateForm((current) => ({ ...current, password: event.target.value }))}
              placeholder="留空自动生成"
              className="w-full rounded-2xl border border-border/70 bg-bg-base/60 px-4 py-3 text-sm text-text-primary focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-text-primary">等级</label>
            <select
              value={createForm.tier}
              onChange={(event) =>
                setCreateForm((current) => ({ ...current, tier: event.target.value as Profile["tier"] }))
              }
              className="w-full rounded-2xl border border-border/70 bg-bg-base/60 px-4 py-3 text-sm text-text-primary focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15"
            >
              <option value="free">Free</option>
              <option value="basic">Basic</option>
              <option value="pro">Pro</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="w-full max-w-[220px]">
            <label className="mb-2 block text-sm font-medium text-text-primary">初始积分</label>
            <input
              type="number"
              min="0"
              value={createForm.creditBalance}
              onChange={(event) => setCreateForm((current) => ({ ...current, creditBalance: event.target.value }))}
              className="w-full rounded-2xl border border-border/70 bg-bg-base/60 px-4 py-3 text-sm text-text-primary focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15"
            />
          </div>

          <button
            type="button"
            onClick={() => void handleCreateUser()}
            disabled={creating}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,rgba(236,72,153,0.94),rgba(139,92,246,0.88))] px-6 text-sm font-medium text-white shadow-[0_24px_48px_-30px_rgba(139,92,246,0.7)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <UserPlus className="size-4" />
            {creating ? "创建中..." : "加入白名单"}
          </button>
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
        <div className="rounded-[32px] border border-border/60 bg-bg-elevated/80 px-5 py-14">
          <div className="flex items-center justify-center">
            <LoadingDots label="用户加载中" />
          </div>
        </div>
      ) : users.length === 0 ? (
        <div className="rounded-[32px] border border-border/60 bg-bg-elevated/80 px-5 py-14 text-center text-sm text-text-tertiary">
          目前还没有白名单用户。
        </div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          {users.map((user) => {
            const isSuperAdmin = user.id === "local-super-admin";

            return (
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
                      {user.auth_source === "local-whitelist" ? (
                        <span className="rounded-full border border-emerald-500/24 bg-emerald-500/10 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-emerald-300">
                          whitelist
                        </span>
                      ) : null}
                    </div>
                    <h2 className="mt-4 font-serif text-3xl text-text-primary">{user.display_name ?? "未命名用户"}</h2>
                    <p className="mt-2 break-all text-sm text-text-secondary">{user.email ?? user.id}</p>
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
                    <p className="mb-2 block text-sm font-medium text-text-primary">后台权限</p>
                    <div className="flex h-[50px] items-center rounded-2xl border border-border/70 bg-bg-elevated/70 px-4 text-sm text-text-secondary">
                      {isSuperAdmin ? (
                        <span className="inline-flex items-center gap-2 text-text-primary">
                          <Shield className="size-4 text-brand" />
                          仅超级管理员可访问后台
                        </span>
                      ) : (
                        "普通账号无后台权限"
                      )}
                    </div>
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
                  {!isSuperAdmin ? (
                    <div className="mt-4 flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-text-tertiary">
                      <KeyRound className="size-3.5" />
                      密码如需重置，可在下一版补一个“重置密码”动作
                    </div>
                  ) : (
                    <div className="mt-4 flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-text-tertiary">
                      <Shield className="size-3.5" />
                      Current balance {user.credit_balance}
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
