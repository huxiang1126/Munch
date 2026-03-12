import { NextResponse } from "next/server";

import { requireAuthenticatedUser } from "@/lib/auth";
import { toErrorResponse } from "@/lib/errors";
import { getHistory } from "@/lib/mock-service";

export async function GET(request: Request) {
  try {
    const user = await requireAuthenticatedUser();
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page") ?? "1");
    const pageSize = Number(searchParams.get("pageSize") ?? "20");
    const status = searchParams.get("status") ?? undefined;

    return NextResponse.json(getHistory(user.id, page, pageSize, status));
  } catch (error) {
    return toErrorResponse(error, "读取历史失败");
  }
}
