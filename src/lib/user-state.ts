import { addTransaction, state } from "@/lib/mock-store";
import type { AppUser } from "@/types/auth";

export function ensureUserState(seed: AppUser) {
  const existing = state.users.get(seed.id);
  if (existing) {
    existing.displayName = seed.displayName;
    existing.email = seed.email;
    existing.tier = seed.tier;
    existing.isDemo = seed.isDemo;
    return existing;
  }

  const user = { ...seed };
  state.users.set(user.id, user);
  state.generations.set(user.id, []);
  state.transactions.set(user.id, []);
  addTransaction(user.id, "grant", user.credits, user.credits, "演示账号初始积分");
  return user;
}
