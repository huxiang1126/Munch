import { NextResponse } from "next/server";

import { requireAuthenticatedUser } from "@/lib/auth";
import { toErrorResponse } from "@/lib/errors";
import { getUserAssetContent } from "@/lib/user-assets";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuthenticatedUser();
    const { id } = await params;
    const payload = await getUserAssetContent(user.id, id);

    if (!payload) {
      return NextResponse.json({ error: "ASSET_NOT_FOUND", message: "素材不存在" }, { status: 404 });
    }

    return new NextResponse(payload.buffer, {
      headers: {
        "Content-Type": payload.asset.mime_type,
        "Cache-Control": "private, max-age=86400",
      },
    });
  } catch (error) {
    return toErrorResponse(error, "读取素材内容失败");
  }
}
