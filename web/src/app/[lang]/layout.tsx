import type { Metadata } from "next";
import { IBM_Plex_Sans, Noto_Sans_SC } from "next/font/google";
import { notFound } from "next/navigation";
import "../globals.css";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { getSiteSettings, getSocialLinks, localizeSiteCopy } from "@/lib/repo";
import { LANGS, htmlLang, isLang, type Lang } from "@/lib/lang";
import { headers } from "next/headers";
import { localePath, publicOriginFromHeaders, siteUrl } from "@/lib/site";
import { serializeJsonLd } from "@/lib/seo";

const plex = IBM_Plex_Sans({
  variable: "--font-plex",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});
const noto = Noto_Sans_SC({
  variable: "--font-noto",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

const IS_PRODUCTION = process.env.SITE_MODE === "production";

/** 路径式语言路由：[lang] 是顶层段，本文件即根布局 */
export function generateStaticParams() {
  return LANGS.map((lang) => ({ lang }));
}

export async function generateMetadata(): Promise<Metadata> {
  const origin = publicOriginFromHeaders(await headers());
  return {
    metadataBase: new URL(origin),
    title: { default: "DEGSON", template: "%s | DEGSON" },
    description:
      "DEGSON industrial connection solutions — terminal blocks and connectors.",
    openGraph: {
      type: "website",
      siteName: "DEGSON",
      title: "DEGSON",
      description:
        "DEGSON industrial connection solutions — terminal blocks and connectors.",
      url: origin,
    },
    twitter: {
      card: "summary_large_image",
      title: "DEGSON",
      description:
        "DEGSON industrial connection solutions — terminal blocks and connectors.",
    },
    robots: IS_PRODUCTION
      ? { index: true, follow: true }
      : { index: false, follow: false },
  };
}

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

  const [settings, social] = await Promise.all([
    getSiteSettings(),
    getSocialLinks(),
  ]);
  const copy = localizeSiteCopy(settings, lang);
  const siteName = copy.siteName;
  const siteDescription = copy.siteDescription ?? "";
  const footerText = copy.footerText;
  const origin = publicOriginFromHeaders(await headers());
  const abs = (code: Lang, path = "/") =>
    IS_PRODUCTION ? siteUrl(code, path) : `${origin}${localePath(code, path)}`;
  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${abs("en")}#organization`,
    name: siteName,
    url: abs("en"),
    description: siteDescription,
  };
  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${abs(lang)}#website`,
    name: siteName,
    url: abs(lang),
    description: siteDescription,
    inLanguage: htmlLang(lang),
    publisher: { "@id": `${abs("en")}#organization` },
  };

  return (
    <html
      lang={htmlLang(lang)}
      className={`${plex.variable} ${noto.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var t=localStorage.getItem('degson-theme');if(t==='blue'||t==='teal')document.documentElement.setAttribute('data-theme',t)}catch(e){}})();",
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(websiteJsonLd) }}
        />
      </head>
      <body className="flex min-h-full flex-col bg-white text-slate-900">
        <SiteHeader siteName={siteName} lang={lang} />
        <main className="flex-1">{children}</main>
        <SiteFooter text={footerText} social={social} lang={lang} />
      </body>
    </html>
  );
}
