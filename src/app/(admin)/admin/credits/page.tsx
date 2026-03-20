"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, CreditCard, Sparkles, Wallet } from "lucide-react";

import { LoadingDots } from "@/components/shared/loading-dots";
import type { Database } from "@/types/database";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface AdminCreditTransaction {
  id: string;
  user_id: string;
  user_name: string;
  type: "grant" | "purchase" | "consume" | "refund";
  amount: number;
  balance_after: number;
  description: string | null;
  created_at: string;
}

export default function AdminCreditsPage() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [transactions, setTransactions] = useState<AdminCreditTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [amount, setAmount] = useState("100");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function loadData() {
    setLoading(true);

    const [usersRes, transactionsRes] = await Promise.all([
      fetch("/api/admin/users", { cache: "no-store" }),
      fetch("/api/admin/credits", { cache: "no-store" }),
    ]);

    if (usersRes.ok) {
      const nextUsers = (await usersRes.json()) as Profile[];
      setUsers(nextUsers);
      setSelectedUserId((current) => current || nextUsers[0]?.id || "");
    }

    if (transactionsRes.ok) {
      setTransactions((await transactionsRes.json()) as AdminCreditTransaction[]);
    }

    setLoading(false);
  }

  useEffect(() => {
    void loadData();
  }, []);

  const selectedUser = useMemo(
    () => users.find((user) => user.id === selectedUserId) ?? null,
    [selectedUserId, users],
  );

  const totalBalance = useMemo(() => users.reduce((sum, user) => sum + user.credit_balance, 0), [users]);
  const positiveTransactions = useMemo(() => transactions.filter((item) => item.amount > 0).length, [transactions]);

  async function adjustCredits(direction: 1 | -1) {
    if (!selectedUser) {
      window.alert("请先选择用户。");
      return;
    }

    const delta = Number(amount);
    if (!Number.isFinite(delta) || delta <= 0) {
      window.alert("请输入大于 0 的积分数。");
      return;
    }

    const nextBalance = Math.max(0, selectedUser.credit_balance + direction * delta);
    if (nextBalance === selectedUser.credit_balance) {
      window.alert("当前调整不会产生变化。");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          credit_balance: nextBalance,
          credit_note: note.trim() || `${direction > 0 ? "Admin 手动增加" : "Admin 手动扣减"} ${delta} 积分`,
        }),
      });

      if (!response.ok) {
        throw new Error("积分调整失败");
      }

      await loadData();
      setNote("");
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "积分调整失败");
    } finally {
      setSubmitting(false);
    }
  }

  const summaryCards = [
    {
      label: "用户总数",
      value: users.length,
      note: "Profiles that currently hold a balance.",
      icon: CreditCard,
    },
    {
      label: "当前总积分",
      value: totalBalance,
      note: "All credits available across the workspace.",
      icon: Wallet,
    },
    {
      label: "正向流水",
      value: positiveTransactions,
      note: "Recent grants, refunds, and top-ups.",
      icon: Sparkles,
    },
  ];

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[34px] border border-border/60 bg-bg-elevated/82 shadow-[0_30px_90px_-54px_rgba(15,15,16,0.66)]">
        <div className="grid gap-0 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="border-b border-border/60 p-7 xl:border-b-0 xl:border-r xl:p-9">
            <p className="text-[11px] uppercase tracking-[0.34em] text-text-tertiary">Credit Ledger</p>
            <h1 className="mt-4 font-serif text-4xl leading-tight text-text-primary lg:text-5xl">
              Adjust balances without making the system feel fragile.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-text-secondary">
              This is the operational surface for manual credit movement. It should feel clear, premium, and safe
              enough to use before a launch.
            </p>
          </div>

          <div className="p-7 xl:p-8">
            <div className="rounded-[28px] border border-border/60 bg-bg-base/55 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,rgba(236,72,153,0.16),rgba(245,158,11,0.14))] text-brand">
                  <Sparkles className="size-4" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.26em] text-text-tertiary">Use Carefully</p>
                  <p className="mt-1 text-sm font-medium text-text-primary">
                    Every manual adjustment should read like an intentional business action.
                  </p>
                </div>
              </div>
              <p className="mt-5 text-sm leading-6 text-text-secondary">
                Add notes when you grant credits, and avoid using direct balance edits as a substitute for a real
                purchase flow.
              </p>
            </div>
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
                <p className="mt-2 text-sm text-text-secondary">{card.note}</p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-bg-base/55 p-3 text-brand">
                <card.icon className="size-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <section className="rounded-[30px] border border-border/60 bg-bg-elevated/82 p-6 shadow-[0_24px_48px_-40px_rgba(15,15,16,0.55)]">
          <p className="text-[11px] uppercase tracking-[0.3em] text-text-tertiary">Manual Adjustment</p>
          <h2 className="mt-3 font-serif text-3xl text-text-primary">Move credits with context.</h2>

          <div className="mt-6 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-text-primary">选择用户</label>
              <select
                value={selectedUserId}
                onChange={(event) => setSelectedUserId(event.target.value)}
                className="w-full rounded-2xl border border-border/70 bg-bg-base/60 px-4 py-3 text-sm text-text-primary focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15"
              >
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {(user.display_name ?? "未命名用户") + " · " + user.credit_balance + " 积分"}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-text-primary">调整数量</label>
              <input
                type="number"
                min="1"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                className="w-full rounded-2xl border border-border/70 bg-bg-base/60 px-4 py-3 text-sm text-text-primary focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-text-primary">备注</label>
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                rows={4}
                placeholder="例如：内测补贴 / 内容录入激励 / 退款补偿"
                className="w-full rounded-2xl border border-border/70 bg-bg-base/60 px-4 py-3 text-sm text-text-primary placeholder:text-text-tertiary focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15"
              />
            </div>

            <div className="rounded-[24px] border border-border/60 bg-bg-base/55 p-4 text-sm text-text-secondary">
              <p>
                当前用户：
                <span className="ml-2 font-medium text-text-primary">{selectedUser?.display_name ?? "未选择"}</span>
              </p>
              <p className="mt-2">
                当前余额：
                <span className="ml-2 font-medium text-text-primary">{selectedUser?.credit_balance ?? 0}</span>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={submitting || !selectedUser}
                onClick={() => void adjustCredits(1)}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,rgba(16,185,129,0.95),rgba(34,197,94,0.88))] px-4 py-3 text-sm font-medium text-white shadow-[0_20px_42px_-28px_rgba(34,197,94,0.7)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ArrowUpRight className="size-4" />
                增加积分
              </button>
              <button
                type="button"
                disabled={submitting || !selectedUser}
                onClick={() => void adjustCredits(-1)}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-border/70 bg-bg-base/60 px-4 py-3 text-sm font-medium text-text-primary transition hover:border-border-hover hover:bg-bg-hover/70 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ArrowDownLeft className="size-4" />
                扣减积分
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-[30px] border border-border/60 bg-bg-elevated/82 p-6 shadow-[0_24px_48px_-40px_rgba(15,15,16,0.55)]">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.3em] text-text-tertiary">Recent Activity</p>
              <h2 className="mt-3 font-serif text-3xl text-text-primary">Ledger timeline</h2>
            </div>
            <p className="text-sm text-text-secondary">Most recent credit movements across the workspace.</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-14">
              <LoadingDots label="积分流水加载中" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="py-14 text-center text-sm text-text-tertiary">暂无积分流水</div>
          ) : (
            <div className="mt-6 space-y-3">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex flex-col gap-4 rounded-[24px] border border-border/60 bg-bg-base/55 p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-border/60 bg-bg-elevated/70 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-text-tertiary">
                        {transaction.type}
                      </span>
                      <span className="text-sm font-medium text-text-primary">{transaction.user_name}</span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-text-secondary">{transaction.description ?? "无备注"}</p>
                    <p className="mt-2 text-xs text-text-tertiary">{new Date(transaction.created_at).toLocaleString()}</p>
                  </div>

                  <div className="rounded-[22px] border border-border/60 bg-bg-elevated/70 px-4 py-3 text-right">
                    <p
                      className={
                        transaction.amount >= 0
                          ? "text-lg font-medium text-emerald-400"
                          : "text-lg font-medium text-amber-400"
                      }
                    >
                      {transaction.amount >= 0 ? "+" : ""}
                      {transaction.amount}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-[0.22em] text-text-tertiary">
                      Balance {transaction.balance_after}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
