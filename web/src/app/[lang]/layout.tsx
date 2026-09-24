import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import { notFound } from "next/navigation";
import "../globals.css";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { getSiteSettings } from "@/lib/repo";
import { LANGS, htmlLang, isLang, type Lang } from "@/lib/lang";
import { SITE_ORIGIN } from "@/lib/site";

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

/** 路径式语言路由：[lang] 是顶层段，本文件即根布局 */
export function generateStaticParams() {
  return LANGS.map((lang) => ({ lang }));
}

export const metadata: Metadata = {
  metadataBase: new URL(SITE_ORIGIN),
  title: { default: "DEGSON", template: "%s | DEGSON" },
  description:
    "DEGSON industrial connection solutions — terminal blocks and connectors.",
};

export default async function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang: raw } = await params;
  if (!isLang(raw)) notFound();
  const lang: Lang = raw;

  const settings = await getSiteSettings();
  const siteName = settings?.site_name ?? "DEGSON";
  const footerText = settings?.footer_text ?? "© DEGSON. All rights reserved.";

  return (
    <html
      lang={htmlLang(lang)}
      className={`${roboto.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-white text-slate-900">
        <SiteHeader siteName={siteName} lang={lang} />
        <main className="flex-1">{children}</main>
        <SiteFooter text={footerText} />
      </body>
    </html>
  );
}
