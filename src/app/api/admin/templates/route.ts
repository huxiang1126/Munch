import { NextRequest, NextResponse } from "next/server";

import { createFallbackTemplate, listFallbackTemplates } from "@/lib/admin-fallback";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET() {
  try {
    const { supabase } = await requireAdmin();

    if (!supabase) {
      return NextResponse.json(listFallbackTemplates());
    }

    const { data, error } = await supabase
      .from("templates")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { supabase } = await requireAdmin();
    const body = await request.json();

    if (!supabase) {
      return NextResponse.json(createFallbackTemplate(body), { status: 201 });
    }

    const { data, error } = await supabase.from("templates").insert(body).select().single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
