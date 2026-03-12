import { NextResponse } from "next/server";

import { getFallbackStats } from "@/lib/admin-fallback";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET() {
  try {
    const { supabase } = await requireAdmin();

    if (!supabase) {
      return NextResponse.json(getFallbackStats());
    }

    const [usersRes, templatesRes, generationsRes, creditsRes] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("templates").select("id", { count: "exact", head: true }).eq("is_published", true),
      supabase.from("generations").select("id", { count: "exact", head: true }),
      supabase.from("credit_transactions").select("amount").eq("type", "consume"),
    ]);

    const creditRows = (creditsRes.data ?? []) as Array<{ amount: number }>;
    const totalConsumed = creditRows.reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0);

    return NextResponse.json({
      totalUsers: usersRes.count ?? 0,
      publishedTemplates: templatesRes.count ?? 0,
      totalGenerations: generationsRes.count ?? 0,
      totalCreditsConsumed: totalConsumed,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
