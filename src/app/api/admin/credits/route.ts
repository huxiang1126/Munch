import { NextResponse } from "next/server";

import { listFallbackCreditTransactions } from "@/lib/admin-fallback";
import { requireAdmin } from "@/lib/admin-auth";
import type { Database } from "@/types/database";

export async function GET() {
  try {
    const { supabase } = await requireAdmin();

    if (!supabase) {
      return NextResponse.json(listFallbackCreditTransactions());
    }

    const [transactionsRes, profilesRes] = await Promise.all([
      supabase.from("credit_transactions").select("*").order("created_at", { ascending: false }).limit(100),
      supabase.from("profiles").select("id, display_name"),
    ]);

    if (transactionsRes.error) {
      return NextResponse.json({ error: transactionsRes.error.message }, { status: 500 });
    }

    if (profilesRes.error) {
      return NextResponse.json({ error: profilesRes.error.message }, { status: 500 });
    }

    const profiles = (profilesRes.data ?? []) as Array<{ id: string; display_name: string | null }>;
    const transactions = (transactionsRes.data ?? []) as Array<
      Database["public"]["Tables"]["credit_transactions"]["Row"]
    >;
    const profileMap = new Map(profiles.map((profile) => [profile.id, profile.display_name ?? "未命名用户"]));

    return NextResponse.json(
      transactions.map((transaction) => ({
        ...transaction,
        user_name: profileMap.get(transaction.user_id) ?? transaction.user_id,
      })),
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
