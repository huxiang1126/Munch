import { NextResponse } from "next/server";

import { getPublishedTemplates } from "@/lib/template-source";
import type { DbTemplate } from "@/types/database";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") as DbTemplate["category"] | null;
  const items = await getPublishedTemplates(category);

  return NextResponse.json(items);
}
