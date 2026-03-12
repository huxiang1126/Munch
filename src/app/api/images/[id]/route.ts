import { NextResponse } from "next/server";

import { requireAuthenticatedUser } from "@/lib/auth";
import { toErrorResponse } from "@/lib/errors";
import { getImageById } from "@/lib/mock-service";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuthenticatedUser();
    const { id } = await params;
    const image = getImageById(user.id, id);

    if (!image) {
      return NextResponse.json(
        {
          error: "IMAGE_NOT_FOUND",
          message: "图片不存在",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      id,
      downloadUrl: image.url,
      width: image.width,
      height: image.height,
    });
  } catch (error) {
    return toErrorResponse(error, "读取图片失败");
  }
}
