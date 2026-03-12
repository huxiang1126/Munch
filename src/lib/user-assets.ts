import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, extname, join } from "node:path";

import { AppError } from "@/lib/errors";
import { getImageDimensions } from "@/lib/image-dimensions";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import type { Database } from "@/types/database";

type UserAssetRow = Database["public"]["Tables"]["user_assets"]["Row"];

const FALLBACK_ASSETS_FILE = join(process.cwd(), ".munch", "user-assets.json");
const FALLBACK_ASSETS_DIR = join(process.cwd(), ".munch", "user-assets");

function readFallbackAssets() {
  try {
    if (existsSync(FALLBACK_ASSETS_FILE)) {
      const raw = JSON.parse(readFileSync(FALLBACK_ASSETS_FILE, "utf8")) as unknown;
      if (Array.isArray(raw)) {
        return raw as UserAssetRow[];
      }
    }
  } catch {}

  persistFallbackAssets([]);
  return [];
}

function persistFallbackAssets(assets: UserAssetRow[]) {
  mkdirSync(dirname(FALLBACK_ASSETS_FILE), { recursive: true });
  writeFileSync(FALLBACK_ASSETS_FILE, JSON.stringify(assets, null, 2), "utf8");
}

function toExt(fileName: string, mimeType: string) {
  const fromName = extname(fileName).toLowerCase().replace(/[^a-z0-9.]/g, "");
  if (fromName) {
    return fromName;
  }

  if (mimeType === "image/png") return ".png";
  if (mimeType === "image/webp") return ".webp";
  if (mimeType === "image/gif") return ".gif";
  return ".jpg";
}

function toAssetUrl(id: string) {
  return `/api/assets/${id}/content`;
}

export async function listUserAssets(userId: string) {
  const admin = createSupabaseAdmin();

  if (!admin) {
    return readFallbackAssets()
      .filter((asset) => asset.user_id === userId)
      .sort((left, right) => {
        const leftKey = left.last_used_at ?? left.created_at;
        const rightKey = right.last_used_at ?? right.created_at;
        return rightKey.localeCompare(leftKey);
      });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin.from("user_assets") as any)
    .select("*")
    .eq("user_id", userId)
    .order("last_used_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw new AppError(500, "ASSET_LIST_FAILED", error.message);
  }

  return data ?? [];
}

export async function getUserAsset(userId: string, assetId: string) {
  const admin = createSupabaseAdmin();

  if (!admin) {
    return readFallbackAssets().find((asset) => asset.id === assetId && asset.user_id === userId) ?? null;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin.from("user_assets") as any)
    .select("*")
    .eq("id", assetId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new AppError(500, "ASSET_READ_FAILED", error.message);
  }

  return data ?? null;
}

export async function createUserAsset(userId: string, file: File) {
  const ext = toExt(file.name, file.type);
  const assetId = randomUUID();
  const storagePath = `${userId}/${assetId}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const dimensions = getImageDimensions(buffer);
  const row: UserAssetRow = {
    id: assetId,
    user_id: userId,
    name: file.name,
    kind: "reference",
    mime_type: file.type || "image/jpeg",
    file_size: buffer.byteLength,
    width: dimensions?.width ?? null,
    height: dimensions?.height ?? null,
    storage_path: storagePath,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    last_used_at: null,
  };

  const admin = createSupabaseAdmin();

  if (!admin) {
    const absolutePath = join(FALLBACK_ASSETS_DIR, storagePath);
    mkdirSync(dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, buffer);

    const assets = readFallbackAssets();
    persistFallbackAssets([row, ...assets]);
    return row;
  }

  const { error: uploadError } = await admin.storage
    .from("user-assets")
    .upload(storagePath, buffer, { upsert: true, contentType: row.mime_type });

  if (uploadError) {
    throw new AppError(500, "ASSET_UPLOAD_FAILED", uploadError.message);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin.from("user_assets") as any).insert(row).select("*").single();
  if (error) {
    throw new AppError(500, "ASSET_SAVE_FAILED", error.message);
  }

  return data;
}

export async function touchUserAsset(userId: string, assetId: string) {
  const asset = await getUserAsset(userId, assetId);
  if (!asset) {
    throw new AppError(404, "ASSET_NOT_FOUND", "素材不存在");
  }

  const nextTimestamp = new Date().toISOString();
  const admin = createSupabaseAdmin();

  if (!admin) {
    const assets = readFallbackAssets();
    const index = assets.findIndex((item) => item.id === assetId && item.user_id === userId);
    if (index >= 0) {
      assets[index] = {
        ...assets[index],
        last_used_at: nextTimestamp,
        updated_at: nextTimestamp,
      };
      persistFallbackAssets(assets);
      return assets[index];
    }
    throw new AppError(404, "ASSET_NOT_FOUND", "素材不存在");
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin.from("user_assets") as any)
    .update({ last_used_at: nextTimestamp, updated_at: nextTimestamp })
    .eq("id", assetId)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error) {
    throw new AppError(500, "ASSET_TOUCH_FAILED", error.message);
  }

  return data;
}

export async function deleteUserAsset(userId: string, assetId: string) {
  const asset = await getUserAsset(userId, assetId);
  if (!asset) {
    return false;
  }

  const admin = createSupabaseAdmin();

  if (!admin) {
    const absolutePath = join(FALLBACK_ASSETS_DIR, asset.storage_path);
    if (existsSync(absolutePath)) {
      rmSync(absolutePath, { force: true });
    }

    const assets = readFallbackAssets().filter((item) => item.id !== assetId || item.user_id !== userId);
    persistFallbackAssets(assets);
    return true;
  }

  const { error: storageError } = await admin.storage.from("user-assets").remove([asset.storage_path]);
  if (storageError) {
    throw new AppError(500, "ASSET_DELETE_FAILED", storageError.message);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin.from("user_assets") as any)
    .delete()
    .eq("id", assetId)
    .eq("user_id", userId);
  if (error) {
    throw new AppError(500, "ASSET_DELETE_FAILED", error.message);
  }

  return true;
}

export async function getUserAssetContent(userId: string, assetId: string) {
  const asset = await getUserAsset(userId, assetId);
  if (!asset) {
    return null;
  }

  const admin = createSupabaseAdmin();

  if (!admin) {
    const absolutePath = join(FALLBACK_ASSETS_DIR, asset.storage_path);
    if (!existsSync(absolutePath)) {
      return null;
    }

    return {
      asset,
      buffer: await readFile(absolutePath),
    };
  }

  const { data, error } = await admin.storage.from("user-assets").download(asset.storage_path);
  if (error || !data) {
    throw new AppError(500, "ASSET_DOWNLOAD_FAILED", error?.message ?? "素材读取失败");
  }

  return {
    asset,
    buffer: Buffer.from(await data.arrayBuffer()),
  };
}

export function toUserAssetResponse(asset: UserAssetRow) {
  return {
    id: asset.id,
    name: asset.name,
    kind: asset.kind,
    mimeType: asset.mime_type,
    fileSize: asset.file_size,
    width: asset.width,
    height: asset.height,
    url: toAssetUrl(asset.id),
    createdAt: asset.created_at,
    updatedAt: asset.updated_at,
    lastUsedAt: asset.last_used_at,
  };
}
