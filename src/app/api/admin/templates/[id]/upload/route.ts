import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { NextRequest, NextResponse } from "next/server";

import { updateFallbackTemplate } from "@/lib/admin-fallback";
import { requireAdmin } from "@/lib/admin-auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import type { Database } from "@/types/database";

function readPngDimensions(buffer: Buffer) {
  const pngSignature = "89504e470d0a1a0a";
  if (buffer.length < 24 || buffer.subarray(0, 8).toString("hex") !== pngSignature) {
    return null;
  }

  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

function readJpegDimensions(buffer: Buffer) {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) {
    return null;
  }

  let offset = 2;
  while (offset < buffer.length) {
    while (buffer[offset] === 0xff) {
      offset += 1;
    }

    const marker = buffer[offset];
    offset += 1;

    if (marker === 0xd9 || marker === 0xda) {
      break;
    }

    if (offset + 1 >= buffer.length) {
      break;
    }

    const size = buffer.readUInt16BE(offset);
    if (size < 2 || offset + size > buffer.length) {
      break;
    }

    if (
      (marker >= 0xc0 && marker <= 0xc3) ||
      (marker >= 0xc5 && marker <= 0xc7) ||
      (marker >= 0xc9 && marker <= 0xcb) ||
      (marker >= 0xcd && marker <= 0xcf)
    ) {
      return {
        height: buffer.readUInt16BE(offset + 3),
        width: buffer.readUInt16BE(offset + 5),
      };
    }

    offset += size;
  }

  return null;
}

function readWebpDimensions(buffer: Buffer) {
  if (
    buffer.length < 30 ||
    buffer.subarray(0, 4).toString("ascii") !== "RIFF" ||
    buffer.subarray(8, 12).toString("ascii") !== "WEBP"
  ) {
    return null;
  }

  const chunkType = buffer.subarray(12, 16).toString("ascii");

  if (chunkType === "VP8X" && buffer.length >= 30) {
    return {
      width: 1 + buffer.readUIntLE(24, 3),
      height: 1 + buffer.readUIntLE(27, 3),
    };
  }

  if (chunkType === "VP8L" && buffer.length >= 25) {
    const b0 = buffer[21];
    const b1 = buffer[22];
    const b2 = buffer[23];
    const b3 = buffer[24];

    return {
      width: 1 + (((b1 & 0x3f) << 8) | b0),
      height: 1 + (((b3 & 0x0f) << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6)),
    };
  }

  return null;
}

function getImageDimensions(buffer: Buffer) {
  return (
    readPngDimensions(buffer) ??
    readJpegDimensions(buffer) ??
    readWebpDimensions(buffer)
  );
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { supabase } = await requireAdmin();
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file" }, { status: 400 });
    }

    const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
    const buffer = Buffer.from(await file.arrayBuffer());
    const imageDimensions = getImageDimensions(buffer);

    if (!supabase) {
      const uploadsDir = path.join(process.cwd(), "public", "admin-uploads");
      await mkdir(uploadsDir, { recursive: true });

      const storagePath = `admin-uploads/${id}.${ext}`;
      const absolutePath = path.join(process.cwd(), "public", storagePath);
      await writeFile(absolutePath, buffer);

      const updated = updateFallbackTemplate(id, {
        thumbnail_url: `/${storagePath}`,
        thumbnail_path: storagePath,
        ...(imageDimensions ? { default_image_size: imageDimensions } : {}),
      } satisfies Database["public"]["Tables"]["templates"]["Update"]);

      if (!updated) {
        return NextResponse.json({ error: "Template not found" }, { status: 404 });
      }

      return NextResponse.json(updated);
    }

    const admin = createSupabaseAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Server config error" }, { status: 500 });
    }

    const storagePath = `templates/${id}.${ext}`;
    const { error: uploadError } = await admin.storage
      .from("template-images")
      .upload(storagePath, buffer, { upsert: true, contentType: file.type });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: urlData } = admin.storage.from("template-images").getPublicUrl(storagePath);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (admin.from("templates") as any)
      .update({
        thumbnail_url: urlData.publicUrl,
        thumbnail_path: storagePath,
        ...(imageDimensions ? { default_image_size: imageDimensions } : {}),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
