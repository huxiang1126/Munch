import { NextResponse } from "next/server";

import { requireAuthenticatedUser } from "@/lib/auth";
import { toErrorResponse } from "@/lib/errors";
import { deleteUserAsset, touchUserAsset, toUserAssetResponse } from "@/lib/user-assets";

export async function PATCH(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuthenticatedUser();
    const { id } = await params;
    const asset = await touchUserAsset(user.id, id);
    return NextResponse.json(toUserAssetResponse(asset));
  } catch (error) {
    return toErrorResponse(error, "更新素材失败");
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuthenticatedUser();
    const { id } = await params;
    const deleted = await deleteUserAsset(user.id, id);

    if (!deleted) {
      return NextResponse.json({ error: "ASSET_NOT_FOUND", message: "素材不存在" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return toErrorResponse(error, "删除素材失败");
  }
}
