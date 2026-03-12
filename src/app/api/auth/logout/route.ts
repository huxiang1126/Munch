import { NextResponse } from "next/server";

import { clearDemoSession } from "@/lib/auth";

export async function POST(request: Request) {
  const response = NextResponse.json({ ok: true });
  clearDemoSession(response, request);
  return response;
}
