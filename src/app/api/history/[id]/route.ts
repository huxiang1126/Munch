import { NextResponse } from "next/server";

import { requireAuthenticatedUser } from "@/lib/auth";
import { toErrorResponse } from "@/lib/errors";
import { deleteHistoryItem, getHistoryItem } from "@/lib/mock-service";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuthenticatedUser();
    const { id } = await params;
    return NextResponse.json(getHistoryItem(user.id, id));
  } catch (error) {
    return toErrorResponse(error, "读取单次历史失败");
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuthenticatedUser();
    const { id } = await params;
    return NextResponse.json(deleteHistoryItem(user.id, id));
  } catch (error) {
    return toErrorResponse(error, "删除历史记录失败");
  }
}
