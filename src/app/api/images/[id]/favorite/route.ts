import { NextResponse } from "next/server";

import { requireAuthenticatedUser } from "@/lib/auth";
import { toErrorResponse } from "@/lib/errors";
import { toggleImageFavorite } from "@/lib/mock-service";

export async function PATCH(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuthenticatedUser();
    const { id } = await params;
    return NextResponse.json(toggleImageFavorite(user.id, id));
  } catch (error) {
    return toErrorResponse(error, "收藏状态更新失败");
  }
}
