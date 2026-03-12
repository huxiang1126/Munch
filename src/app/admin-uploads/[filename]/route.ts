import { readFile } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

const MIME_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".avif": "image/avif",
};

function isSafeFilename(filename: string) {
  return /^[a-zA-Z0-9._-]+$/.test(filename);
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ filename: string }> },
) {
  const { filename } = await context.params;

  if (!isSafeFilename(filename)) {
    return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
  }

  const absolutePath = path.join(process.cwd(), "public", "admin-uploads", filename);

  try {
    const file = await readFile(absolutePath);
    const extension = path.extname(filename).toLowerCase();

    return new NextResponse(file, {
      headers: {
        "Content-Type": MIME_TYPES[extension] ?? "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
