"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import QuickSetupDialog from "@/components/QuickSetupDialog";
import AuthProvider from "@/lib/AuthContext";
import ThemeProvider from "@/lib/ThemeContext";
import DialogProvider from "@/lib/DialogContext";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage =
    pathname === "/login" ||
    pathname === "/" ||
    pathname === "/contact" ||
    pathname === "/solutions" ||
    pathname.startsWith("/solutions/") ||
    pathname === "/resources" ||
    pathname.startsWith("/resources/") ||
    pathname === "/community" ||
    pathname.startsWith("/community/") ||
    pathname === "/docs" ||
    pathname.startsWith("/docs/");

  if (isAuthPage) {
    return (
      <ThemeProvider>
        <DialogProvider>
          <AuthProvider>{children}</AuthProvider>
        </DialogProvider>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <DialogProvider>
        <AuthProvider>
          <QuickSetupDialog />
          <div className="flex min-h-screen bg-[#f7f7fb] dark:bg-[#0b0b14]">
            <Sidebar />

            <div className="flex flex-1 flex-col">
              <Navbar />

              <main className="flex-1 p-8">
                <div className="mx-auto max-w-6xl">{children}</div>
              </main>
            </div>
          </div>
        </AuthProvider>
      </DialogProvider>
    </ThemeProvider>
  );
}
