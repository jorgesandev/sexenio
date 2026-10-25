import type { Metadata, Viewport } from "next";
import { Inter, Source_Serif_4 } from "next/font/google";
import { AppShell } from "@/components/shell/app-shell";
import { OG_IMAGE, SITE_URL } from "@/lib/site";
import { strings } from "@/lib/strings";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["400", "500", "600"],
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-source-serif",
  display: "swap",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: strings.meta.title,
    template: "%s — Sexenio",
  },
  description: strings.meta.description,
  applicationName: strings.header.brand,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "es_MX",
    siteName: strings.header.brand,
    title: strings.meta.title,
    description: strings.meta.description,
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: strings.meta.title,
    description: strings.meta.description,
    images: [OG_IMAGE.url],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#FAF9F6",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="es-MX"
      className={`${inter.variable} ${sourceSerif.variable}`}
    >
      <body className="min-h-dvh">
        <a
          href="#contenido"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:border focus:border-rule focus:bg-surface focus:px-4 focus:py-3 focus:text-sm focus:font-medium focus:text-ink"
        >
          {strings.header.skip}
        </a>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
