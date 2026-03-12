# Codex 任务：登录页重做 + 全站路由保护（白名单模式）

你在 `/Volumes/HX/Munch` 项目中工作。这是 Next.js 15 + React 19 + TypeScript + Tailwind CSS 4 + Supabase 项目。纯暗色主题（#0f0f10）。

## 总览

当前状态：
- 首页 `/` 是公开的，任何人可以看到画廊
- 中间件只保护 `/workspace`、`/history`、`/credits` 三个路由
- 有登录页但设计简陋（Card 组件 + demo 默认值）
- 有注册页（需要禁用，白名单模式不允许自注册）

目标：
1. **全站保护**：未登录用户访问任何页面都重定向到 `/login`
2. **登录页重做**：左侧背景图 + 右侧 MUNCH 品牌登录表单
3. **禁用注册**：`/register` 重定向到 `/login`
4. **登录成功后跳转到 `/`**（首页画廊），不再跳 `/workspace`

---

## Part 1：扩展中间件 — 保护全站

### 修改 `src/lib/supabase/middleware.ts`

把整个文件替换为：

```typescript
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import type { Database } from "@/types/database";

const DEMO_SESSION_COOKIE = "munch_demo_session";

function hasSupabaseEnv() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

/** 不需要认证的路由前缀 */
const publicPaths = [
  "/login",
  "/register",
  "/api/auth",
  "/_next",
  "/favicon.ico",
  "/images",
  "/brand",
];

function isPublicPath(pathname: string) {
  return publicPaths.some((prefix) => pathname.startsWith(prefix));
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // 公开路径直接放行
  if (isPublicPath(pathname)) {
    // 但如果已登录用户访问 /login，重定向到首页
    if (pathname.startsWith("/login")) {
      const isAuthenticated = await checkAuthentication(request);
      if (isAuthenticated) {
        return NextResponse.redirect(new URL("/", request.url));
      }
    }
    return NextResponse.next({
      request: { headers: request.headers },
    });
  }

  // 所有其他路由都需要认证
  const isAuthenticated = await checkAuthentication(request);
  if (!isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    // 保存原始请求路径，登录后可以跳回
    if (pathname !== "/") {
      loginUrl.searchParams.set("redirect", pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next({
    request: { headers: request.headers },
  });
}

async function checkAuthentication(request: NextRequest): Promise<boolean> {
  const hasDemoSession = Boolean(
    request.cookies.get(DEMO_SESSION_COOKIE)?.value,
  );

  if (!hasSupabaseEnv()) {
    return hasDemoSession;
  }

  const response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return Boolean(user) || hasDemoSession;
}

export const config = {
  matcher: [
    /*
     * 匹配所有路由，除了：
     * - _next/static (静态文件)
     * - _next/image (图片优化)
     * - favicon.ico
     * - 以 . 结尾的文件（静态资源如 .svg, .png）
     */
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\..*).*)",
  ],
};
```

---

## Part 2：重做登录页

### 修改 `src/app/(auth)/login/page.tsx`

把整个文件替换为：

```tsx
"use client";

import { startTransition, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/auth-store";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const loginDemo = useAuthStore((state) => state.loginDemo);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const redirectTo = searchParams.get("redirect") || "/";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!email.trim() || !password.trim()) {
      setError("请输入邮箱和密码");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const supabase = createSupabaseBrowserClient();
      if (supabase) {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (authError) {
          throw authError;
        }
      } else {
        await loginDemo({
          email: email.trim(),
          displayName: email.split("@")[0],
        });
      }

      startTransition(() => {
        router.push(redirectTo);
        router.refresh();
      });
    } catch (err) {
      if (err instanceof Error) {
        // Supabase 错误信息映射
        if (err.message.includes("Invalid login credentials")) {
          setError("邮箱或密码错误");
        } else if (err.message.includes("Email not confirmed")) {
          setError("邮箱尚未验证，请检查收件箱");
        } else {
          setError(err.message);
        }
      } else {
        setError("登录失败，请稍后重试");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="relative flex min-h-screen">
      {/* 左侧 — 背景图区域（桌面端显示） */}
      <div className="hidden lg:block lg:w-[55%] xl:w-[60%]">
        <div
          className="relative h-full w-full bg-cover bg-center"
          style={{
            backgroundImage: "url('/images/login-bg.jpg')",
          }}
        >
          {/* 渐变遮罩 */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#0f0f10]" />
          <div className="absolute inset-0 bg-black/30" />

          {/* 左下角品牌标语 */}
          <div className="absolute bottom-12 left-12 max-w-md">
            <p className="text-3xl font-semibold leading-snug text-white">
              AI-Powered<br />
              Image Workflow
            </p>
            <p className="mt-4 text-sm leading-relaxed text-white/60">
              Create stunning visuals with intelligent templates and multi-model generation.
            </p>
          </div>
        </div>
      </div>

      {/* 右侧 — 登录表单 */}
      <div className="flex w-full flex-col items-center justify-center bg-[#0f0f10] px-6 lg:w-[45%] xl:w-[40%]">
        {/* 移动端背景（全屏渐变） */}
        <div
          className="pointer-events-none fixed inset-0 bg-cover bg-center opacity-20 lg:hidden"
          style={{
            backgroundImage: "url('/images/login-bg.jpg')",
          }}
        />
        <div className="pointer-events-none fixed inset-0 bg-[#0f0f10]/80 lg:hidden" />

        <div className="relative z-10 w-full max-w-sm space-y-10">
          {/* Logo + 品牌名 */}
          <div className="text-center">
            <h1 className="text-5xl font-bold tracking-[0.08em] text-white">
              M<span className="text-brand">u</span>NCH
            </h1>
            <p className="mt-3 text-sm text-[#636366]">
              仅限受邀用户登录
            </p>
          </div>

          {/* 表单 */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="mb-2 block text-xs font-medium uppercase tracking-widest text-[#636366]">
                邮箱
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                autoComplete="email"
                autoFocus
                disabled={isSubmitting}
                className="w-full rounded-xl border border-white/[0.1] bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-[#636366] focus:border-brand/60 focus:outline-none focus:ring-1 focus:ring-brand/30 disabled:opacity-50 transition"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-xs font-medium uppercase tracking-widest text-[#636366]">
                密码
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="输入密码"
                  autoComplete="current-password"
                  disabled={isSubmitting}
                  className="w-full rounded-xl border border-white/[0.1] bg-white/[0.04] px-4 py-3 pr-12 text-sm text-white placeholder:text-[#636366] focus:border-brand/60 focus:outline-none focus:ring-1 focus:ring-brand/30 disabled:opacity-50 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#636366] hover:text-white transition"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {/* 错误提示 */}
            {error && (
              <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
                {error}
              </p>
            )}

            {/* 登录按钮 */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="relative w-full overflow-hidden rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  登录中...
                </span>
              ) : (
                "登录"
              )}
            </button>
          </form>

          {/* 底部 */}
          <p className="text-center text-xs text-[#48484a]">
            Munch &copy; {new Date().getFullYear()} &mdash; AI Image Workflow Platform
          </p>
        </div>
      </div>
    </div>
  );
}
```

**注意**：
- 不要导入 `BrandLockup`、`Card` 等旧组件
- 品牌名使用 `M<span className="text-brand">u</span>NCH` 样式（u 字母用品牌色 #C1272D）
- 背景图用 `/images/login-bg.jpg`，用户自己放图片进 `public/images/`。如果图片不存在，页面不会报错（CSS background-image 找不到图片只会不显示，渐变遮罩和深色背景仍然有效）
- `brand` 和 `brand-hover` 颜色变量已在 Tailwind 主题中定义

---

## Part 3：禁用注册页

### 修改 `src/app/(auth)/register/page.tsx`

把整个文件替换为：

```tsx
import { redirect } from "next/navigation";

export default function RegisterPage() {
  redirect("/login");
}
```

这是一个服务端组件，访问 `/register` 会立即 302 重定向到 `/login`。

---

## Part 4：创建 Auth 路由组布局

### 新建 `src/app/(auth)/layout.tsx`

```tsx
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
```

这个布局确保 `(auth)` 路由组不继承 `(dashboard)` 的 TopBar 和 padding。内容就是透传 children，因为登录页自己管理全屏布局。

---

## 验收标准

| # | 检查项 | 通过标准 |
|---|--------|---------|
| 1 | `pnpm build` | 零报错 |
| 2 | 未登录访问 `/` | 重定向到 `/login` |
| 3 | 未登录访问 `/admin` | 重定向到 `/login` |
| 4 | 未登录访问 `/workspace` | 重定向到 `/login` |
| 5 | 访问 `/register` | 重定向到 `/login` |
| 6 | 已登录访问 `/login` | 重定向到 `/` |
| 7 | 登录页 UI | 左侧背景图 + 右侧表单 + MUNCH 品牌展示 + 暗色主题 |
| 8 | 登录成功 | 跳转到 `/`（或 `?redirect=` 指定的路径） |
| 9 | 登录失败 | 显示红色错误提示（邮箱或密码错误） |
| 10 | 移动端 | 背景图半透明 + 表单居中叠加，可正常使用 |

---

## 文件操作清单

### 修改文件：
```
src/lib/supabase/middleware.ts     — 全站路由保护
src/app/(auth)/login/page.tsx      — 重做登录页 UI
src/app/(auth)/register/page.tsx   — 禁用注册，重定向到 /login
```

### 新建文件：
```
src/app/(auth)/layout.tsx          — Auth 路由组布局（透传）
```

### 不修改的文件：
```
middleware.ts                      — 保持不变（继续导出 src/lib/supabase/middleware.ts）
```

---

**开始执行。登录页中不要有任何注册入口、Demo 入口或演示默认值。**
