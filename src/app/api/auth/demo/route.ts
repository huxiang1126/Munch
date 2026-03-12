import { NextResponse } from "next/server";
import { z } from "zod";

import { createDemoSession, setDemoSession } from "@/lib/auth";
import { ensureUserState } from "@/lib/user-state";

const schema = z.object({
  displayName: z.string().min(1).default("Munch Beta User"),
  email: z.string().email().default("demo@munch.ai"),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  const session = createDemoSession(
    parsed.success ? parsed.data.displayName : "Munch Beta User",
    parsed.success ? parsed.data.email : "demo@munch.ai",
  );

  const user = ensureUserState({
    id: session.id,
    email: session.email,
    displayName: session.displayName,
    tier: session.tier,
    credits: session.credits,
    isDemo: true,
  });

  const response = NextResponse.json({ user });
  setDemoSession(response, session, request);
  return response;
}
