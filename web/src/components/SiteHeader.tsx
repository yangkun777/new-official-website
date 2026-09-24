import Link from "next/link";
import { localePath } from "@/lib/site";
import type { Lang } from "@/lib/lang";

const NAV = [
  { path: "/", label: "Home" },
  { path: "/#products", label: "Products" },
  { path: "/news", label: "News" },
];

export default function SiteHeader({
  siteName = "DEGSON",
  lang,
}: {
  siteName?: string;
  lang: Lang;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href={localePath(lang, "/")} className="flex items-center gap-2">
          <span className="text-lg font-bold tracking-tight text-[#003f88]">
            {siteName}
          </span>
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          {NAV.map((n) => (
            <Link
              key={n.path}
              href={localePath(lang, n.path)}
              className="text-slate-600 hover:text-[#003f88]"
            >
              {n.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
