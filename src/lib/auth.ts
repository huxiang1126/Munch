import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { AppError } from "@/lib/errors";
import { createLocalSession } from "@/lib/local-admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ensureUserState } from "@/lib/user-state";
import type { AppUser, DemoSession } from "@/types/auth";

export const DEMO_SESSION_COOKIE = "munch_demo_session";

export function createDemoSession(displayName: string, email: string): DemoSession {
  return createLocalSession(displayName, email);
}

export function readDemoSession(cookieValue: string | undefined) {
  if (!cookieValue) {
    return null;
  }

  try {
    return JSON.parse(cookieValue) as DemoSession;
  } catch {
    return null;
  }
}

function shouldUseSecureDemoCookie(request?: Request) {
  if (process.env.NODE_ENV !== "production") {
    return false;
  }

  if (request) {
    try {
      const url = new URL(request.url);
      if (url.protocol !== "https:") {
        return false;
      }

      if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
        return false;
      }
    } catch {
      return false;
    }
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    return false;
  }

  try {
    const url = new URL(appUrl);
    return url.protocol === "https:" && url.hostname !== "localhost" && url.hostname !== "127.0.0.1";
  } catch {
    return false;
  }
}

export function setDemoSession(response: NextResponse, session: DemoSession, request?: Request) {
  response.cookies.set(DEMO_SESSION_COOKIE, JSON.stringify(session), {
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureDemoCookie(request),
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export function clearDemoSession(response: NextResponse, request?: Request) {
  response.cookies.set(DEMO_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureDemoCookie(request),
    path: "/",
    expires: new Date(0),
  });
}

export async function getAuthenticatedUser() {
  const supabase = await createSupabaseServerClient();

  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const displayName =
        typeof user.user_metadata === "object" &&
        user.user_metadata !== null &&
        "display_name" in user.user_metadata &&
        typeof user.user_metadata.display_name === "string"
          ? user.user_metadata.display_name
          : null;

      return ensureUserState({
        id: user.id,
        email: user.email ?? "unknown@munch.ai",
        displayName: displayName ?? user.email ?? "Munch User",
        tier: "free",
        credits: 50,
        isDemo: false,
      } satisfies AppUser);
    }
  }

  const cookieStore = await cookies();
  const session = readDemoSession(cookieStore.get(DEMO_SESSION_COOKIE)?.value);
  if (!session) {
    return null;
  }

  return ensureUserState({
    id: session.id,
    email: session.email,
    displayName: session.displayName,
    tier: session.tier,
    credits: session.credits,
    isDemo: true,
  });
}

export async function requireAuthenticatedUser() {
  const user = await getAuthenticatedUser();
  if (!user) {
    throw new AppError(401, "UNAUTHORIZED", "请先登录后再继续");
  }
  return user;
}
