"use client";

import { startTransition, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

import { isLocalSuperAdminEmail } from "@/lib/local-admin";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/auth-store";

function getSafeRedirect(pathname: string | null) {
  if (!pathname) {
    return "/";
  }

  if (!pathname.startsWith("/") || pathname.startsWith("//")) {
    return "/";
  }

  if (pathname.startsWith("/login") || pathname.startsWith("/register")) {
    return "/";
  }

  return pathname;
}

export default function LoginPage() {
  const router = useRouter();
  const loginDemo = useAuthStore((state) => state.loginDemo);
  const [email, setEmail] = useState("hx831126@gmail.com");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsModalOpen(false);
      }
    }

    if (isModalOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isModalOpen]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();
    const isLocalAdmin = isLocalSuperAdminEmail(normalizedEmail);

    if (!normalizedEmail || (!isLocalAdmin && !password.trim())) {
      setError("请输入邮箱和密码");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const redirectTo = getSafeRedirect(
        typeof window === "undefined"
          ? null
          : new URLSearchParams(window.location.search).get("redirect"),
      );

      if (isLocalAdmin) {
        await loginDemo({
          email: normalizedEmail,
          displayName: "HX Super Admin",
        });
      } else {
        const supabase = createSupabaseBrowserClient();
        if (supabase) {
          const { error: authError } = await supabase.auth.signInWithPassword({
            email: normalizedEmail,
            password,
          });
          if (authError) {
            throw authError;
          }
        } else {
          await loginDemo({
            email: normalizedEmail,
            displayName: normalizedEmail.split("@")[0] || "Munch User",
          });
        }
      }

      const nextPath =
        isLocalAdmin && redirectTo === "/" ? "/admin/templates" : redirectTo;

      startTransition(() => {
        setIsModalOpen(false);
        router.push(nextPath);
        router.refresh();
      });
    } catch (err) {
      if (err instanceof Error) {
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
    <main
      className="relative flex min-h-screen items-center bg-[#0f0f10] px-8 py-10 text-white"
      style={{
        backgroundImage: "url('/images/login-bg.jpg')",
        backgroundPosition: "center",
        backgroundSize: "cover",
      }}
    >
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(11,11,12,0.16),rgba(11,11,12,0.04)_36%,rgba(11,11,12,0.02)_100%)]" />

      <div className="relative z-10 mx-auto flex w-full max-w-[1280px] items-center">
        <div className="w-full max-w-[520px] pl-[8vw]">
          <img
            src="/brand/logo-login-wordmark.png"
            alt="Munch"
            className="h-auto w-full max-w-[520px]"
          />
          <p className="mt-8 max-w-[280px] text-left text-[15px] leading-8 text-white/72">
            Before imagination becomes an image,
            <br />
            it&apos;s a thought, a gust of wind,
            <br />
            a dream not yet awake.
          </p>
          <button
            type="button"
            onClick={() => {
              setError("");
              setIsModalOpen(true);
            }}
            className="mt-8 inline-flex h-12 items-center justify-center rounded-full bg-white px-8 text-sm font-medium text-black transition hover:bg-white/92"
          >
            Log in
          </button>
        </div>
      </div>

      {isModalOpen ? (
        <div className="absolute inset-0 z-20 flex items-center justify-center px-6">
          <button
            type="button"
            aria-label="关闭登录框"
            onClick={() => setIsModalOpen(false)}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />

          <div className="relative z-10 w-full max-w-[420px] rounded-[28px] border border-white/10 bg-black/55 p-8 backdrop-blur-md">
            <button
              type="button"
              aria-label="关闭"
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 rounded-full p-1.5 text-white/50 transition hover:bg-white/8 hover:text-white"
            >
              <X className="size-4" />
            </button>

            <img
              src="/brand/logo.png"
              alt="Munch logo"
              className="mb-5 h-14 w-14 rounded-[16px] object-cover"
            />

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Email"
                autoComplete="email"
                className="h-12 w-full rounded-2xl border border-white/12 bg-white/6 px-4 text-sm text-white placeholder:text-white/35 focus:outline-none focus:ring-1 focus:ring-white/20"
              />
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Password"
                autoComplete="current-password"
                className="h-12 w-full rounded-2xl border border-white/12 bg-white/6 px-4 text-sm text-white placeholder:text-white/35 focus:outline-none focus:ring-1 focus:ring-white/20"
              />

              {error ? (
                <p className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex h-12 w-full items-center justify-center rounded-full bg-white text-sm font-medium text-black transition hover:bg-white/92 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? "Logging in..." : "Continue"}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </main>
  );
}
