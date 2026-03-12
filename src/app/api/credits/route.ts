import { NextResponse } from "next/server";

import { requireAuthenticatedUser } from "@/lib/auth";
import { toErrorResponse } from "@/lib/errors";
import { getCreditsSnapshot } from "@/lib/mock-service";

export async function GET() {
  try {
    const user = await requireAuthenticatedUser();
    return NextResponse.json(getCreditsSnapshot(user.id));
  } catch (error) {
    return toErrorResponse(error, "读取积分失败");
  }
}
