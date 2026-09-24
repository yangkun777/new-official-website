import Link from "next/link";

export default function SiteHeader({ siteName = "DEGSON" }: { siteName?: string }) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-lg font-bold tracking-tight text-[#003f88]">
            {siteName}
          </span>
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          <Link href="/" className="text-slate-600 hover:text-[#003f88]">Home</Link>
          <Link href="/#products" className="text-slate-600 hover:text-[#003f88]">Products</Link>
          <Link href="/news" className="text-slate-600 hover:text-[#003f88]">News</Link>
        </nav>
      </div>
    </header>
  );
}
