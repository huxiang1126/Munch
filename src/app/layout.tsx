import type { Metadata } from "next";

import { AuthBootstrap } from "@/components/layout/auth-bootstrap";
import { APP_NAME } from "@/lib/constants";
import { ThemeProvider } from "@/components/layout/theme-provider";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: `${APP_NAME} | AI 出图工作流平台`,
  description: "面向广告公司与中小商家的 AI 出图工作流平台。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>
        <ThemeProvider>
          <AuthBootstrap />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
