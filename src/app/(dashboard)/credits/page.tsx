"use client";

import useSWR from "swr";

import { CreditHistory } from "@/components/credits/credit-history";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CreditHistoryResponse, CreditsResponse } from "@/types/api";

async function fetcher<T>(url: string) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("请求失败");
  }
  return (await response.json()) as T;
}

export default function CreditsPage() {
  const { data: credits } = useSWR<CreditsResponse>("/api/credits", fetcher);
  const { data: history } = useSWR<CreditHistoryResponse>("/api/credits/history", fetcher);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 lg:px-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold">积分管理</h1>
          <p className="mt-2 text-sm text-text-secondary">
            当前版本已接通真实积分扣减、退款和流水记录。
          </p>
        </div>
        <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <Card className="surface-panel">
            <CardHeader>
              <CardTitle>当前余额</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-5xl font-semibold">{credits?.balance ?? 0}</p>
              <p className="text-sm text-text-secondary">
                {credits?.tier ?? "free"} 账户
              </p>
            </CardContent>
          </Card>
          <CreditHistory items={history?.items ?? []} />
        </div>
      </div>
    </div>
  );
}
