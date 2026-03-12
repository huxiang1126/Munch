import { NextResponse } from "next/server";

import { requireAuthenticatedUser } from "@/lib/auth";
import { toErrorResponse } from "@/lib/errors";
import { createUserAsset, listUserAssets, toUserAssetResponse } from "@/lib/user-assets";

export async function GET() {
  try {
    const user = await requireAuthenticatedUser();
    const assets = await listUserAssets(user.id);
    return NextResponse.json({ items: assets.map(toUserAssetResponse) });
  } catch (error) {
    return toErrorResponse(error, "读取素材库失败");
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuthenticatedUser();
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File) || !file.type.startsWith("image/")) {
      return NextResponse.json({ error: "INVALID_FILE", message: "请上传图片文件" }, { status: 400 });
    }

    const asset = await createUserAsset(user.id, file);
    return NextResponse.json(toUserAssetResponse(asset), { status: 201 });
  } catch (error) {
    return toErrorResponse(error, "上传素材失败");
  }
}
