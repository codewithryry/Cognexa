import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

import AppShell from "@/components/AppShell";

export const metadata: Metadata = {
  title: "Cognexa",
  description: "AI-powered Dataset",
};

const THEME_INIT_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem("cognexa_theme");
    var theme = stored === "light" ? "light" : "dark";
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  } catch (e) {
    document.documentElement.classList.add("dark");
  }
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <Script id="theme-init" strategy="beforeInteractive">
          {THEME_INIT_SCRIPT}
        </Script>
      </head>
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
