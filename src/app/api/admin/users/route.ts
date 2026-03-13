import { NextResponse } from "next/server";
import { z } from "zod";

import { listFallbackProfiles } from "@/lib/admin-fallback";
import { requireAdmin } from "@/lib/admin-auth";
import { createLocalManagedUser } from "@/lib/local-admin";
import { addTransaction, state } from "@/lib/mock-store";

const createUserSchema = z.object({
  email: z.string().email(),
  display_name: z.string().trim().optional(),
  password: z.string().trim().optional(),
  tier: z.enum(["free", "basic", "pro"]).default("pro"),
  credit_balance: z.coerce.number().min(0).default(0),
});

export async function GET() {
  try {
    const { supabase } = await requireAdmin();

    if (!supabase) {
      return NextResponse.json(listFallbackProfiles());
    }

    const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const { supabase } = await requireAdmin();

    if (supabase) {
      return NextResponse.json(
        { error: "当前版本只支持在本地白名单模式下创建账号" },
        { status: 400 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const parsed = createUserSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "INVALID_PAYLOAD",
          message: "请输入有效的邮箱、密码和积分信息",
        },
        { status: 400 },
      );
    }

    const { user, generatedPassword } = createLocalManagedUser({
      email: parsed.data.email,
      displayName: parsed.data.display_name,
      password: parsed.data.password,
      tier: parsed.data.tier,
      credits: parsed.data.credit_balance,
    });

    state.users.set(user.id, {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      tier: user.tier,
      credits: user.credits,
      isDemo: true,
    });
    state.generations.set(user.id, state.generations.get(user.id) ?? []);
    state.transactions.set(user.id, state.transactions.get(user.id) ?? []);
    addTransaction(
      user.id,
      "grant",
      user.credits,
      user.credits,
      "Admin 创建白名单账号并发放初始积分",
    );

    return NextResponse.json({
      id: user.id,
      email: user.email,
      display_name: user.displayName,
      credit_balance: user.credits,
      tier: user.tier,
      role: "user",
      created_at: user.createdAt,
      updated_at: user.updatedAt,
      generated_password: generatedPassword,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized";
    const status =
      message === "Unauthorized" || message === "Not authorized" || message === "Not authenticated"
        ? 401
        : 400;
    return NextResponse.json({ error: message, message }, { status });
  }
}
