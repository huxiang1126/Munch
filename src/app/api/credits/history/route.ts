import { NextResponse } from "next/server";

import { requireAuthenticatedUser } from "@/lib/auth";
import { toErrorResponse } from "@/lib/errors";
import { getCreditTransactions } from "@/lib/mock-service";

export async function GET() {
  try {
    const user = await requireAuthenticatedUser();
    const items = getCreditTransactions(user.id);
    return NextResponse.json({
      items,
      total: items.length,
    });
  } catch (error) {
    return toErrorResponse(error, "读取积分流水失败");
  }
}
