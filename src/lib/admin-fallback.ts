import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

import { templates as staticTemplates } from "@/data/templates";
import { getImageDimensions } from "@/lib/image-dimensions";
import {
  getLocalManagedUserByEmail,
  getLocalManagedUserById,
  isLocalSuperAdminEmail,
  listLocalManagedUsers,
  updateLocalManagedUser,
} from "@/lib/local-admin";
import { addTransaction, now, state as mockState } from "@/lib/mock-store";
import { staticTemplateToDb } from "@/lib/template-adapters";
import type { AppUser } from "@/types/auth";
import type { Database, DbTemplate, UserRole } from "@/types/database";
import { seedTemplates } from "../../scripts/seed-data";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type TemplateInsert = Database["public"]["Tables"]["templates"]["Insert"];
type TemplateUpdate = Database["public"]["Tables"]["templates"]["Update"];
type FallbackProfile = ProfileRow & {
  email?: string | null;
  auth_source?: "local-super-admin" | "local-whitelist" | "runtime";
};

type FallbackAdminState = {
  profiles: Map<string, FallbackProfile>;
};

const globalForFallback = globalThis as typeof globalThis & {
  __munchAdminFallback?: FallbackAdminState;
};

const FALLBACK_TEMPLATES_FILE = join(process.cwd(), ".munch", "admin-templates.json");
const FALLBACK_TEMPLATE_UPLOADS_DIR = join(process.cwd(), "public", "admin-uploads");
const FALLBACK_DELETED_TEMPLATE_SLUGS_FILE = join(process.cwd(), ".munch", "deleted-template-slugs.json");

function cloneTemplate(template: DbTemplate): DbTemplate {
  return {
    ...template,
    tags: [...template.tags],
    compatible_models: [...template.compatible_models],
    default_image_size: {
      width: template.default_image_size.width,
      height: template.default_image_size.height,
    },
    variables: template.variables.map((variable) => ({
      ...variable,
      options: variable.options?.map((option) => ({ ...option })),
    })),
  };
}

function cloneTemplateInsert(template: TemplateInsert): TemplateInsert {
  return {
    ...template,
    tags: [...template.tags],
    compatible_models: [...template.compatible_models],
    default_image_size: {
      width: template.default_image_size.width,
      height: template.default_image_size.height,
    },
    variables: template.variables.map((variable) => ({
      ...variable,
      options: variable.options?.map((option) => ({ ...option })),
    })),
  };
}

function readDeletedTemplateSlugs() {
  try {
    if (!existsSync(FALLBACK_DELETED_TEMPLATE_SLUGS_FILE)) {
      return new Set<string>();
    }

    const raw = JSON.parse(readFileSync(FALLBACK_DELETED_TEMPLATE_SLUGS_FILE, "utf8")) as unknown;
    if (!Array.isArray(raw)) {
      return new Set<string>();
    }

    return new Set(raw.filter((item): item is string => typeof item === "string"));
  } catch {
    return new Set<string>();
  }
}

function persistDeletedTemplateSlugs(slugs: Set<string>) {
  mkdirSync(dirname(FALLBACK_DELETED_TEMPLATE_SLUGS_FILE), { recursive: true });
  writeFileSync(
    FALLBACK_DELETED_TEMPLATE_SLUGS_FILE,
    JSON.stringify([...slugs].sort(), null, 2),
    "utf8",
  );
}

const fallbackState: FallbackAdminState =
  globalForFallback.__munchAdminFallback ??
  (globalForFallback.__munchAdminFallback = {
    profiles: new Map<string, ProfileRow>(),
  });

function initialTemplateInserts() {
  const merged = new Map<string, TemplateInsert>();

  for (const template of staticTemplates.map(staticTemplateToDb)) {
    merged.set(template.slug, cloneTemplateInsert(template));
  }

  for (const template of seedTemplates as unknown as readonly TemplateInsert[]) {
    merged.set(template.slug, cloneTemplateInsert(template));
  }

  return [...merged.values()];
}

function incrementalSeedTemplateInserts() {
  const merged = new Map<string, TemplateInsert>();

  for (const template of seedTemplates as unknown as readonly TemplateInsert[]) {
    merged.set(template.slug, cloneTemplateInsert(template));
  }

  return [...merged.values()];
}

function createFallbackTemplateRecord(template: TemplateInsert): DbTemplate {
  const timestamp = now();

  return {
    id: randomUUID(),
    ...cloneTemplateInsert(template),
    created_at: timestamp,
    updated_at: timestamp,
  };
}

function seedFallbackTemplates() {
  return initialTemplateInserts().map(createFallbackTemplateRecord);
}

function reconcileSeedTemplates(existingTemplates: DbTemplate[]) {
  const nextTemplates = [...existingTemplates];
  const existingSlugs = new Set(existingTemplates.map((template) => template.slug));
  const deletedSeedSlugs = readDeletedTemplateSlugs();
  let didChange = false;

  for (const template of incrementalSeedTemplateInserts()) {
    if (existingSlugs.has(template.slug) || deletedSeedSlugs.has(template.slug)) {
      continue;
    }

    nextTemplates.unshift(createFallbackTemplateRecord(template));
    existingSlugs.add(template.slug);
    didChange = true;
  }

  return { templates: nextTemplates, didChange };
}

function resolveTemplateUploadPath(template: DbTemplate) {
  if (template.thumbnail_path?.startsWith("admin-uploads/")) {
    return template.thumbnail_path;
  }

  if (!existsSync(FALLBACK_TEMPLATE_UPLOADS_DIR)) {
    return null;
  }

  const matched = readdirSync(FALLBACK_TEMPLATE_UPLOADS_DIR).find((fileName) =>
    fileName.startsWith(`${template.id}.`),
  );

  if (!matched) {
    return null;
  }

  return `admin-uploads/${matched}`;
}

function recoverTemplatePreview(template: DbTemplate) {
  const storagePath = resolveTemplateUploadPath(template);

  if (!storagePath) {
    return template;
  }

  const absolutePath = join(process.cwd(), "public", storagePath);
  const dimensions = existsSync(absolutePath)
    ? getImageDimensions(readFileSync(absolutePath))
    : null;

  return {
    ...template,
    thumbnail_url: template.thumbnail_url ?? `/${storagePath}`,
    thumbnail_path: template.thumbnail_path ?? storagePath,
    default_image_size: dimensions ?? template.default_image_size,
  };
}

function persistFallbackTemplates(templates: DbTemplate[]) {
  mkdirSync(dirname(FALLBACK_TEMPLATES_FILE), { recursive: true });
  writeFileSync(FALLBACK_TEMPLATES_FILE, JSON.stringify(templates, null, 2), "utf8");
}

function readFallbackTemplates() {
  try {
    if (existsSync(FALLBACK_TEMPLATES_FILE)) {
      const raw = JSON.parse(readFileSync(FALLBACK_TEMPLATES_FILE, "utf8")) as unknown;
      if (Array.isArray(raw)) {
        const { templates, didChange } = reconcileSeedTemplates(raw as DbTemplate[]);
        const recovered = templates.map(recoverTemplatePreview);
        if (didChange || JSON.stringify(recovered) !== JSON.stringify(raw)) {
          persistFallbackTemplates(recovered);
        }
        return recovered;
      }
    }
  } catch {}

  const seededTemplates = seedFallbackTemplates();
  persistFallbackTemplates(seededTemplates);
  return seededTemplates;
}

function toFallbackProfile(user: AppUser, role: UserRole = "admin"): ProfileRow {
  const timestamp = now();

  return {
    id: user.id,
    display_name: user.displayName,
    avatar_url: null,
    phone: null,
    credit_balance: user.credits,
    tier: user.tier,
    role,
    created_at: timestamp,
    updated_at: timestamp,
  };
}

function toLocalWhitelistProfile(user: ReturnType<typeof listLocalManagedUsers>[number]): FallbackProfile {
  return {
    id: user.id,
    display_name: user.displayName,
    avatar_url: null,
    phone: null,
    credit_balance: user.credits,
    tier: user.tier,
    role: "user",
    created_at: user.createdAt,
    updated_at: user.updatedAt,
    email: user.email,
    auth_source: "local-whitelist",
  };
}

function syncProfilesFromMockUsers() {
  for (const user of mockState.users.values()) {
    if (!isLocalSuperAdminEmail(user.email) && !getLocalManagedUserByEmail(user.email)) {
      continue;
    }

    const current = fallbackState.profiles.get(user.id);
    fallbackState.profiles.set(user.id, {
      ...(current ?? toFallbackProfile(user, "user")),
      display_name: user.displayName,
      credit_balance: user.credits,
      tier: user.tier,
      updated_at: now(),
    });
  }

  for (const user of listLocalManagedUsers()) {
    const current = fallbackState.profiles.get(user.id);
    fallbackState.profiles.set(user.id, {
      ...(current ?? toLocalWhitelistProfile(user)),
      display_name: user.displayName,
      credit_balance: user.credits,
      tier: user.tier,
      role: "user",
      created_at: current?.created_at ?? user.createdAt,
      updated_at: user.updatedAt,
      email: user.email,
      auth_source: "local-whitelist",
    });
  }
}

export function ensureFallbackAdminUser(user: AppUser) {
  const current = fallbackState.profiles.get(user.id);
  const nextProfile: FallbackProfile = {
    ...(current ?? toFallbackProfile(user, "admin")),
    display_name: user.displayName,
    credit_balance: user.credits,
    tier: user.tier,
    role: current?.role ?? "admin",
    updated_at: now(),
    email: user.email,
    auth_source: "local-super-admin",
  };

  fallbackState.profiles.set(user.id, nextProfile);
  return nextProfile;
}

export function listFallbackTemplates(options?: {
  publishedOnly?: boolean;
  category?: DbTemplate["category"] | null;
}) {
  const { publishedOnly = false, category = null } = options ?? {};
  const templates = readFallbackTemplates();

  return templates
    .filter((template) => (publishedOnly ? template.is_published : true))
    .filter((template) => (category ? template.category === category : true))
    .sort((left, right) => {
      if (left.sort_order === right.sort_order) {
        return right.created_at.localeCompare(left.created_at);
      }
      return left.sort_order - right.sort_order;
    })
    .map(cloneTemplate);
}

export function getFallbackTemplateById(id: string, includeUnpublished = false) {
  const templates = readFallbackTemplates();
  const template = templates.find((item) => item.id === id || item.slug === id);

  if (!template) {
    return null;
  }

  if (!includeUnpublished && !template.is_published) {
    return null;
  }

  return cloneTemplate(template);
}

export function createFallbackTemplate(payload: TemplateInsert) {
  const templates = readFallbackTemplates();
  const deletedSeedSlugs = readDeletedTemplateSlugs();
  if (deletedSeedSlugs.delete(payload.slug)) {
    persistDeletedTemplateSlugs(deletedSeedSlugs);
  }
  const template: DbTemplate = {
    id: randomUUID(),
    ...payload,
    created_at: now(),
    updated_at: now(),
  };

  persistFallbackTemplates([template, ...templates]);
  return cloneTemplate(template);
}

export function updateFallbackTemplate(id: string, updates: TemplateUpdate) {
  const templates = readFallbackTemplates();
  const index = templates.findIndex((item) => item.id === id);
  if (index === -1) {
    return null;
  }

  const current = templates[index];
  const nextTemplate: DbTemplate = {
    ...current,
    ...updates,
    updated_at: now(),
  };

  templates[index] = nextTemplate;
  persistFallbackTemplates(templates);
  return cloneTemplate(nextTemplate);
}

export function deleteFallbackTemplate(id: string) {
  const templates = readFallbackTemplates();
  const index = templates.findIndex((item) => item.id === id);
  if (index === -1) {
    return false;
  }

  const [deletedTemplate] = templates.splice(index, 1);
  persistFallbackTemplates(templates);

  if (deletedTemplate) {
    const seedSlugs = new Set(incrementalSeedTemplateInserts().map((template) => template.slug));
    if (seedSlugs.has(deletedTemplate.slug)) {
      const deletedSeedSlugs = readDeletedTemplateSlugs();
      deletedSeedSlugs.add(deletedTemplate.slug);
      persistDeletedTemplateSlugs(deletedSeedSlugs);
    }
  }

  return true;
}

export function listFallbackProfiles() {
  syncProfilesFromMockUsers();

  return [...fallbackState.profiles.values()]
    .filter((profile) => {
      if (profile.id === "local-super-admin") {
        return true;
      }

      return getLocalManagedUserById(profile.id) !== null;
    })
    .sort((left, right) => right.created_at.localeCompare(left.created_at)) as FallbackProfile[];
}

export function updateFallbackProfile(id: string, updates: Partial<ProfileRow>) {
  syncProfilesFromMockUsers();

  const current =
    fallbackState.profiles.get(id) ??
    ({
      id,
      display_name: null,
      avatar_url: null,
      phone: null,
      credit_balance: 0,
      tier: "free",
      role: "user",
      created_at: now(),
      updated_at: now(),
    } satisfies ProfileRow);

  const nextProfile: ProfileRow = {
    ...current,
    ...updates,
    updated_at: now(),
  };

  fallbackState.profiles.set(id, nextProfile);

  const localManagedUser = getLocalManagedUserById(id);
  if (localManagedUser) {
    updateLocalManagedUser(id, {
      displayName: updates.display_name ?? localManagedUser.displayName,
      tier: updates.tier ?? localManagedUser.tier,
      credits:
        typeof updates.credit_balance === "number"
          ? updates.credit_balance
          : localManagedUser.credits,
    });
  }

  const mockUser = mockState.users.get(id);
  if (mockUser) {
    if (typeof updates.credit_balance === "number") {
      mockUser.credits = updates.credit_balance;
    }
    if (updates.tier) {
      mockUser.tier = updates.tier;
    }
  }

  return nextProfile;
}

export function recordFallbackCreditAdjustment(userId: string, amount: number, description: string) {
  syncProfilesFromMockUsers();

  const profile = fallbackState.profiles.get(userId);
  if (!profile || amount === 0) {
    return;
  }

  addTransaction(
    userId,
    amount > 0 ? "grant" : "consume",
    amount,
    profile.credit_balance,
    description,
  );
}

export function listFallbackCreditTransactions() {
  syncProfilesFromMockUsers();

  return [...mockState.transactions.entries()]
    .flatMap(([userId, transactions]) => {
      const profile = fallbackState.profiles.get(userId);
      const displayName = profile?.display_name ?? mockState.users.get(userId)?.displayName ?? "未命名用户";

      return transactions.map((transaction) => ({
        id: transaction.id,
        user_id: userId,
        user_name: displayName,
        type: transaction.type,
        amount: transaction.amount,
        balance_after: transaction.balanceAfter,
        description: transaction.description,
        created_at: transaction.createdAt,
      }));
    })
    .sort((left, right) => right.created_at.localeCompare(left.created_at));
}

export function getFallbackStats() {
  syncProfilesFromMockUsers();
  const templates = readFallbackTemplates();

  const totalGenerations = [...mockState.generations.values()].reduce((sum, items) => sum + items.length, 0);
  const totalCreditsConsumed = [...mockState.transactions.values()]
    .flat()
    .filter((item) => item.type === "consume")
    .reduce((sum, item) => sum + Math.abs(item.amount), 0);

  return {
    totalUsers: fallbackState.profiles.size,
    publishedTemplates: templates.filter((template) => template.is_published).length,
    totalGenerations,
    totalCreditsConsumed,
  };
}
