import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

import type { DemoSession } from "@/types/auth";
import type { UserTier } from "@/types/generation";

const LOCAL_SUPER_ADMIN_EMAILS = [
  "hx831126@gmail.com",
] as const;
const LOCAL_SUPER_ADMIN_PASSWORD = "HxWk1126";
const LOCAL_USERS_FILE = join(process.cwd(), ".munch", "local-users.json");

export interface LocalManagedUser {
  id: string;
  email: string;
  displayName: string;
  passwordHash: string;
  passwordSalt: string;
  tier: UserTier;
  credits: number;
  createdAt: string;
  updatedAt: string;
}

function now() {
  return new Date().toISOString();
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function fallbackDisplayName(email: string) {
  const [name = "Munch User"] = normalizeEmail(email).split("@");
  return name || "Munch User";
}

function ensureStoreDir() {
  mkdirSync(dirname(LOCAL_USERS_FILE), { recursive: true });
}

function hashPassword(password: string, salt: string) {
  return scryptSync(password, salt, 64).toString("hex");
}

function readLocalManagedUsers() {
  try {
    if (!existsSync(LOCAL_USERS_FILE)) {
      return [] as LocalManagedUser[];
    }

    const raw = JSON.parse(readFileSync(LOCAL_USERS_FILE, "utf8")) as unknown;
    if (!Array.isArray(raw)) {
      return [] as LocalManagedUser[];
    }

    return raw
      .filter((item): item is LocalManagedUser => {
        return (
          typeof item === "object" &&
          item !== null &&
          typeof item.id === "string" &&
          typeof item.email === "string" &&
          typeof item.displayName === "string" &&
          typeof item.passwordHash === "string" &&
          typeof item.passwordSalt === "string" &&
          typeof item.tier === "string" &&
          typeof item.credits === "number" &&
          typeof item.createdAt === "string" &&
          typeof item.updatedAt === "string"
        );
      })
      .map((item) => ({
        ...item,
        email: normalizeEmail(item.email),
      }));
  } catch {
    return [] as LocalManagedUser[];
  }
}

function writeLocalManagedUsers(users: LocalManagedUser[]) {
  ensureStoreDir();
  writeFileSync(LOCAL_USERS_FILE, JSON.stringify(users, null, 2), "utf8");
}

function toLocalUserSession(user: LocalManagedUser): DemoSession {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    tier: user.tier,
    credits: user.credits,
  };
}

export function listLocalManagedUsers() {
  return readLocalManagedUsers().sort((left, right) =>
    right.createdAt.localeCompare(left.createdAt),
  );
}

export function getLocalManagedUserByEmail(email: string | null | undefined) {
  if (!email) {
    return null;
  }

  const normalizedEmail = normalizeEmail(email);
  return listLocalManagedUsers().find((user) => user.email === normalizedEmail) ?? null;
}

export function getLocalManagedUserById(id: string | null | undefined) {
  if (!id) {
    return null;
  }

  return listLocalManagedUsers().find((user) => user.id === id) ?? null;
}

export function isLocalSuperAdminEmail(email: string | null | undefined) {
  if (!email) {
    return false;
  }

  return LOCAL_SUPER_ADMIN_EMAILS.includes(
    normalizeEmail(email) as (typeof LOCAL_SUPER_ADMIN_EMAILS)[number],
  );
}

export function isValidLocalSuperAdminPassword(password: string | null | undefined) {
  return (password ?? "") === LOCAL_SUPER_ADMIN_PASSWORD;
}

export function isLocalManagedUserEmail(email: string | null | undefined) {
  return getLocalManagedUserByEmail(email) !== null;
}

export function generateLocalManagedUserPassword() {
  return `Munch-${randomBytes(4).toString("hex")}`;
}

export function isValidLocalManagedUserPassword(
  email: string | null | undefined,
  password: string | null | undefined,
) {
  const user = getLocalManagedUserByEmail(email);
  if (!user || !password) {
    return false;
  }

  const candidateHash = hashPassword(password, user.passwordSalt);
  return timingSafeEqual(Buffer.from(candidateHash, "hex"), Buffer.from(user.passwordHash, "hex"));
}

export function createLocalManagedUser(input: {
  email: string;
  password?: string | null;
  displayName?: string | null;
  tier?: UserTier;
  credits?: number;
}) {
  const users = listLocalManagedUsers();
  const normalizedEmail = normalizeEmail(input.email);

  if (isLocalSuperAdminEmail(normalizedEmail)) {
    throw new Error("该邮箱已作为超级管理员保留使用");
  }

  if (users.some((user) => user.email === normalizedEmail)) {
    throw new Error("该邮箱已在白名单中");
  }

  const generatedPassword = input.password?.trim() || generateLocalManagedUserPassword();
  const passwordSalt = randomBytes(16).toString("hex");
  const timestamp = now();
  const nextUser: LocalManagedUser = {
    id: `local-user-${randomUUID()}`,
    email: normalizedEmail,
    displayName: input.displayName?.trim() || fallbackDisplayName(normalizedEmail),
    passwordHash: hashPassword(generatedPassword, passwordSalt),
    passwordSalt,
    tier: input.tier ?? "pro",
    credits: Math.max(0, Math.round(input.credits ?? 0)),
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  writeLocalManagedUsers([nextUser, ...users]);

  return {
    user: nextUser,
    generatedPassword: input.password?.trim() ? null : generatedPassword,
  };
}

export function updateLocalManagedUser(
  id: string,
  updates: Partial<Pick<LocalManagedUser, "displayName" | "tier" | "credits">> & {
    password?: string | null;
  },
) {
  const users = listLocalManagedUsers();
  const index = users.findIndex((user) => user.id === id);
  if (index === -1) {
    return null;
  }

  const current = users[index];
  const next: LocalManagedUser = {
    ...current,
    displayName: updates.displayName?.trim() || current.displayName,
    tier: updates.tier ?? current.tier,
    credits:
      typeof updates.credits === "number"
        ? Math.max(0, Math.round(updates.credits))
        : current.credits,
    updatedAt: now(),
  };

  if (updates.password?.trim()) {
    next.passwordSalt = randomBytes(16).toString("hex");
    next.passwordHash = hashPassword(updates.password.trim(), next.passwordSalt);
  }

  users[index] = next;
  writeLocalManagedUsers(users);
  return next;
}

export function createLocalSession(displayName: string, email: string): DemoSession {
  const normalizedEmail = normalizeEmail(email);

  if (isLocalSuperAdminEmail(normalizedEmail)) {
    return {
      id: "local-super-admin",
      email: normalizedEmail,
      displayName: displayName.trim() || "HX Super Admin",
      tier: "pro",
      credits: 9999,
    };
  }

  const managedUser = getLocalManagedUserByEmail(normalizedEmail);
  if (!managedUser) {
    throw new Error("账号不在白名单中");
  }

  return toLocalUserSession(managedUser);
}
