import type { NextRequest } from "next/server";

import { middleware as authMiddleware } from "@/lib/supabase/middleware";

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\..*).*)",
  ],
};

export function middleware(request: NextRequest) {
  return authMiddleware(request);
}
