import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { LayoutWrapper } from "@/components/layout/LayoutWrapper";
import { CommandBar } from "@/components/shared/CommandBar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FailSafe — Chaos Engineering Control Plane",
  description: "Operational control plane for backend, frontend, and Android testing",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <LayoutWrapper>
              <TopBar />
              <main className="flex-1 overflow-auto bg-background">
                {children}
              </main>
            </LayoutWrapper>
          </div>
          <CommandBar />
        </Providers>
      </body>
    </html>
  );
}
