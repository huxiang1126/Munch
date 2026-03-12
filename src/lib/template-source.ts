import { createSupabaseServerClient } from "@/lib/supabase/server";
import { dbTemplateToRuntime } from "@/lib/template-adapters";
import { getFallbackTemplateById, listFallbackTemplates } from "@/lib/admin-fallback";
import type { DbTemplate } from "@/types/database";

export async function getPublishedTemplates(category?: DbTemplate["category"] | null) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return listFallbackTemplates({ publishedOnly: true, category: category ?? null });
  }

  let query = supabase
    .from("templates")
    .select("*")
    .eq("is_published", true)
    .order("sort_order", { ascending: true });

  if (category) {
    query = query.eq("category", category);
  }

  const { data, error } = await query;

  if (error || !data || data.length === 0) {
    return listFallbackTemplates({ publishedOnly: true, category: category ?? null });
  }

  return data;
}

export async function getAdminTemplates() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return listFallbackTemplates();
  }

  const { data, error } = await supabase
    .from("templates")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error || !data) {
    return listFallbackTemplates();
  }

  return data;
}

export async function getTemplateRecordById(id: string, options?: { includeUnpublished?: boolean }) {
  const includeUnpublished = options?.includeUnpublished ?? false;
  const supabase = await createSupabaseServerClient();

  if (supabase) {
    let byIdQuery = supabase.from("templates").select("*").eq("id", id);
    if (!includeUnpublished) {
      byIdQuery = byIdQuery.eq("is_published", true);
    }

    const byId = await byIdQuery.maybeSingle();
    if (byId.data) {
      return byId.data;
    }

    let bySlugQuery = supabase.from("templates").select("*").eq("slug", id);
    if (!includeUnpublished) {
      bySlugQuery = bySlugQuery.eq("is_published", true);
    }

    const bySlug = await bySlugQuery.maybeSingle();
    if (bySlug.data) {
      return bySlug.data;
    }
  }

  return getFallbackTemplateById(id, includeUnpublished);
}

export async function resolveRuntimeTemplateById(id: string, options?: { includeUnpublished?: boolean }) {
  const template = await getTemplateRecordById(id, options);
  return template ? dbTemplateToRuntime(template) : null;
}
