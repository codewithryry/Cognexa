import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

import AppShell from "@/components/AppShell";

export const metadata: Metadata = {
  title: "Cognexa",
  description: "AI-powered Dataset - Self-hosted RAG platform for organizing documents and retrieving answers grounded in your own knowledge.",
  icons: {
    icon: [
      { url: "/Cognexa.png", sizes: "1024x1024", type: "image/png" },
    ],
    apple: "/Cognexa.png",
  },
  openGraph: {
    title: "Cognexa",
    description: "AI-powered Dataset - Self-hosted RAG platform for organizing documents and retrieving answers grounded in your own knowledge.",
    images: [
      {
        url: "/Cognexa.png",
        width: 1024,
        height: 1024,
        alt: "Cognexa",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Cognexa",
    description: "AI-powered Dataset - Self-hosted RAG platform",
    images: ["/Cognexa.png"],
  },
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
        <Script src="https://apis.google.com/js/api.js" strategy="lazyOnload" />
        <link rel="icon" href="/Cognexa.png" sizes="1024x1024" />
        <link rel="apple-touch-icon" href="/Cognexa.png" sizes="1024x1024" />
        <meta property="og:image" content="/Cognexa.png" />
        <meta property="og:image:width" content="1024" />
        <meta property="og:image:height" content="1024" />
        <meta name="twitter:image" content="/Cognexa.png" />
      </head>
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}