import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { getSiteSettings } from "@/lib/repo";

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "DEGSON", template: "%s | DEGSON" },
  description:
    "DEGSON industrial connection solutions — terminal blocks and connectors.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSiteSettings();
  const siteName = settings?.site_name ?? "DEGSON";
  const footerText =
    settings?.footer_text ?? "© DEGSON. All rights reserved.";
  return (
    <html lang="en" className={`${roboto.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-white text-slate-900">
        <SiteHeader siteName={siteName} />
        <main className="flex-1">{children}</main>
        <SiteFooter text={footerText} />
      </body>
    </html>
  );
}
