import { NextResponse } from "next/server";
import { z } from "zod";

import { createDemoSession, setDemoSession } from "@/lib/auth";
import {
  getLocalManagedUserByEmail,
  isLocalSuperAdminEmail,
  isValidLocalManagedUserPassword,
  isValidLocalSuperAdminPassword,
} from "@/lib/local-admin";
import { ensureUserState } from "@/lib/user-state";

const schema = z.object({
  displayName: z.string().min(1).default("Munch Beta User"),
  email: z.string().email().default("demo@munch.ai"),
  password: z.string().optional(),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  const email = parsed.success ? parsed.data.email : "demo@munch.ai";
  const password = parsed.success ? parsed.data.password : undefined;
  const normalizedEmail = email.trim().toLowerCase();

  if (isLocalSuperAdminEmail(normalizedEmail)) {
    if (!isValidLocalSuperAdminPassword(password)) {
      return NextResponse.json(
        {
          error: "INVALID_CREDENTIALS",
          message: "邮箱或密码错误",
        },
        { status: 401 },
      );
    }
  } else {
    const managedUser = getLocalManagedUserByEmail(normalizedEmail);
    if (!managedUser) {
      return NextResponse.json(
        {
          error: "USER_NOT_WHITELISTED",
          message: "该账号暂未开通，请先联系管理员加入白名单。",
        },
        { status: 401 },
      );
    }

    if (!isValidLocalManagedUserPassword(normalizedEmail, password)) {
      return NextResponse.json(
        {
          error: "INVALID_CREDENTIALS",
          message: "邮箱或密码错误",
        },
        { status: 401 },
      );
    }
  }

  const session = createDemoSession(
    parsed.success ? parsed.data.displayName : "Munch Beta User",
    normalizedEmail,
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
