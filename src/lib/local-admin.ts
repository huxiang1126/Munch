import type { DemoSession } from "@/types/auth";

const LOCAL_SUPER_ADMIN_EMAILS = [
  "hx831126@gmail.com",
] as const;
const LOCAL_SUPER_ADMIN_PASSWORD = "HxWk1126";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function toDemoUserId(email: string) {
  const slug = normalizeEmail(email)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `demo-${slug || "user"}`;
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

  return {
    id: toDemoUserId(normalizedEmail),
    email: normalizedEmail,
    displayName: displayName.trim() || "Munch Beta User",
    tier: "basic",
    credits: 128,
  };
}
