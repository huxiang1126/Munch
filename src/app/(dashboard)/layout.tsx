import { TopBar } from "@/components/layout/top-bar";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-bg-base pt-14 text-text-primary">
      <TopBar />
      <main className="px-0 py-0">{children}</main>
    </div>
  );
}
