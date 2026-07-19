import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

import ThemeProvider from "@/lib/ThemeContext";

export const metadata: Metadata = {
  title: "Cognexa — Your documents. Your AI dataset.",
  description:
    "Cognexa is a self-hosted retrieval-augmented generation platform. Upload documents, build a searchable dataset, and get grounded answers from your own content.",
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
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
