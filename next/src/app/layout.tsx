import type { Metadata, Viewport } from "next";
import { Inter, DM_Serif_Display, Space_Grotesk } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const dmSerif = DM_Serif_Display({
  variable: "--font-display",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "HealthyTech Atlântico",
  description:
    "A tua saúde, em movimento — FitEscola / ZAF",
  manifest: "/manifest.json",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
    shortcut: "/logo.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#14304C",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        {/* Blocking script — applies saved theme before first paint to avoid flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark')document.documentElement.setAttribute('data-theme','dark');}catch(e){}})()`,
          }}
        />
      </head>
      <body
        className={`${inter.variable} ${dmSerif.variable} ${spaceGrotesk.variable} antialiased bg-background text-foreground`}
      >
        <NextIntlClientProvider messages={messages}>
          <SessionProvider>
            {children}
            <Toaster
              richColors
              position="top-right"
              toastOptions={{
                className: "glass border shadow-float backdrop-blur-xl rounded-xl",
                style: {
                  fontFamily: "var(--font-sans)",
                },
                classNames: {
                  toast: "bg-card/85 glass border-border/50",
                  title: "font-semibold tracking-tight text-foreground",
                  description: "text-muted-foreground",
                  success: "border-success-500/30 bg-success-50/50 dark:bg-success-900/10 text-success-600 dark:text-success-400 [&_svg]:text-success-600 dark:[&_svg]:text-success-400",
                  error: "border-danger-500/30 bg-danger-50/50 dark:bg-danger-900/10 text-danger-600 dark:text-danger-400 [&_svg]:text-danger-600 dark:[&_svg]:text-danger-400",
                  warning: "border-warning-500/30 bg-warning-50/50 dark:bg-warning-900/10 text-warning-600 dark:text-warning-400 [&_svg]:text-warning-600 dark:[&_svg]:text-warning-400",
                  info: "border-navy-500/30 bg-navy-50/50 dark:bg-navy-900/10 text-navy-600 dark:text-navy-400 [&_svg]:text-navy-600 dark:[&_svg]:text-navy-400",
                }
              }}
            />
          </SessionProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
