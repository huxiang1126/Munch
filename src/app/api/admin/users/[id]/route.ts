import { NextRequest, NextResponse } from "next/server";

import { listFallbackProfiles, recordFallbackCreditAdjustment, updateFallbackProfile } from "@/lib/admin-fallback";
import { requireAdmin } from "@/lib/admin-auth";
import { getLocalManagedUserById, updateLocalManagedUser } from "@/lib/local-admin";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import type { Database } from "@/types/database";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { supabase } = await requireAdmin();
    const body = await request.json();
    const allowed: Database["public"]["Tables"]["profiles"]["Update"] = {};
    const creditNote =
      typeof body.credit_note === "string" && body.credit_note.trim()
        ? body.credit_note.trim()
        : "Admin 手动调整积分";

    if ("credit_balance" in body) {
      allowed.credit_balance = Number(body.credit_balance);
    }
    if ("tier" in body) {
      allowed.tier = body.tier;
    }
    if (!supabase) {
      const currentProfile = listFallbackProfiles().find((profile) => profile.id === id);
      const previousBalance = currentProfile?.credit_balance ?? 0;
      const updatedProfile = updateFallbackProfile(id, allowed);

      if (!updatedProfile) {
        return NextResponse.json({ error: "用户不存在" }, { status: 404 });
      }

      if (typeof body.password === "string" && body.password.trim() && getLocalManagedUserById(id)) {
        updateLocalManagedUser(id, { password: body.password.trim() });
      }

      if (typeof allowed.credit_balance === "number") {
        recordFallbackCreditAdjustment(id, allowed.credit_balance - previousBalance, creditNote);
      }

      return NextResponse.json(updatedProfile);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const currentProfile = await (supabase.from("profiles") as any)
      .select("credit_balance")
      .eq("id", id)
      .single();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from("profiles") as any)
      .update(allowed)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (typeof allowed.credit_balance === "number") {
      const previousBalance = Number(currentProfile.data?.credit_balance ?? 0);
      const delta = allowed.credit_balance - previousBalance;

      if (delta !== 0) {
        const admin = createSupabaseAdmin();
        if (admin) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (admin.from("credit_transactions") as any).insert({
            user_id: id,
            type: delta > 0 ? "grant" : "consume",
            amount: delta,
            balance_after: allowed.credit_balance,
            reference_type: "admin_adjustment",
            reference_id: null,
            description: creditNote,
          });
        }
      }
    }

    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
