import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Manrope, Sora } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { cookies } from "next/headers";
import { Toaster } from "sonner";
import { QueryProvider } from "@/components/query-provider";
import { THEME_COOKIE_NAME } from "@/lib/theme-cookie";
import "./globals.css";

const sans = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const display = Sora({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "HealthyTech Atlântico",
    template: "%s · HTA",
  },
  description: "School health platform for FitEscola and ZAF workflows.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
    shortcut: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  themeColor: "#102a43",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [locale, messages, cookieStore] = await Promise.all([
    getLocale(),
    getMessages(),
    cookies(),
  ]);
  const theme =
    cookieStore.get(THEME_COOKIE_NAME)?.value === "dark" ? "dark" : "light";

  return (
    <html
      lang={locale}
      data-theme={theme}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className="scroll-smooth"
    >
      <body
        className={`${sans.variable} ${display.variable} ${mono.variable} bg-background text-foreground antialiased`}
      >
        <NextIntlClientProvider messages={messages}>
          <QueryProvider>{children}</QueryProvider>
          <Toaster
            richColors
            position="top-right"
            toastOptions={{
              className:
                "border border-white/20 dark:border-white/10/70 bg-white/75 dark:bg-navy-950/65 text-foreground shadow-float",
              style: {
                fontFamily: "var(--font-sans)",
              },
              classNames: {
                toast: "rounded-2xl",
                title: "font-semibold tracking-tight",
                description: "text-muted-foreground",
              },
            }}
          />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
