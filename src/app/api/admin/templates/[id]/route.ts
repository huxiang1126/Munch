import { NextRequest, NextResponse } from "next/server";

import { deleteFallbackTemplate, getFallbackTemplateById, updateFallbackTemplate } from "@/lib/admin-fallback";
import { requireAdmin } from "@/lib/admin-auth";
import type { Database } from "@/types/database";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { supabase } = await requireAdmin();

    if (!supabase) {
      const template = getFallbackTemplateById(id, true);
      if (!template) {
        return NextResponse.json({ error: "Template not found" }, { status: 404 });
      }
      return NextResponse.json(template);
    }

    const { data, error } = await supabase.from("templates").select("*").eq("id", id).single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { supabase } = await requireAdmin();
    const body = (await request.json()) as Database["public"]["Tables"]["templates"]["Update"];

    if (!supabase) {
      const template = updateFallbackTemplate(id, body);
      if (!template) {
        return NextResponse.json({ error: "Template not found" }, { status: 404 });
      }
      return NextResponse.json(template);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from("templates") as any)
      .update(body)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { supabase } = await requireAdmin();

    if (!supabase) {
      const deleted = deleteFallbackTemplate(id);
      if (!deleted) {
        return NextResponse.json({ error: "Template not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true });
    }

    const { error } = await supabase.from("templates").delete().eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
