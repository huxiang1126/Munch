import { NextResponse } from "next/server";

import { listFallbackProfiles } from "@/lib/admin-fallback";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET() {
  try {
    const { supabase } = await requireAdmin();

    if (!supabase) {
      return NextResponse.json(listFallbackProfiles());
    }

    const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
