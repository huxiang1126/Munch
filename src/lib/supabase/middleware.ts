import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import type { Database } from "@/types/database";

const DEMO_SESSION_COOKIE = "munch_demo_session";

function hasSupabaseEnv() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

const publicPaths = [
  "/login",
  "/register",
  "/api/auth",
  "/_next",
  "/favicon.ico",
  "/images",
  "/brand",
];

function isPublicPath(pathname: string) {
  return publicPaths.some((prefix) => pathname.startsWith(prefix));
}

function createPassthroughResponse(request: NextRequest) {
  return NextResponse.next({
    request: {
      headers: request.headers,
    },
  });
}

function redirectWithCookies(url: URL, source: NextResponse) {
  const response = NextResponse.redirect(url);
  source.cookies.getAll().forEach((cookie) => {
    response.cookies.set(cookie);
  });
  return response;
}

async function authenticateRequest(request: NextRequest) {
  const response = createPassthroughResponse(request);
  const hasDemoSession = Boolean(
    request.cookies.get(DEMO_SESSION_COOKIE)?.value,
  );

  if (!hasSupabaseEnv()) {
    return {
      authenticated: hasDemoSession,
      response,
    };
  }

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    return {
      authenticated: Boolean(user) || hasDemoSession,
      response,
    };
  } catch {
    return {
      authenticated: hasDemoSession,
      response,
    };
  }
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (isPublicPath(pathname)) {
    if (pathname.startsWith("/login")) {
      const auth = await authenticateRequest(request);
      return auth.response;
    }

    return createPassthroughResponse(request);
  }

  const auth = await authenticateRequest(request);
  if (!auth.authenticated) {
    const loginUrl = new URL("/login", request.url);
    const redirectTarget = `${pathname}${request.nextUrl.search}`;

    if (redirectTarget !== "/" && redirectTarget !== "") {
      loginUrl.searchParams.set("redirect", redirectTarget);
    }

    return redirectWithCookies(loginUrl, auth.response);
  }

  return auth.response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\..*).*)",
  ],
};
