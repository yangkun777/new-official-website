import Link from "next/link";
import type { Crumb } from "@/types/product";

export default function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="border-b border-slate-200 bg-slate-50">
      <ol className="mx-auto flex max-w-7xl flex-wrap items-center gap-1.5 px-4 py-3 text-sm sm:px-6 lg:px-8">
        {items.map((it, i) => {
          const last = i === items.length - 1;
          const isCurrent = it.current || last;
          return (
            <li key={`${it.id}-${i}`} className="flex items-center gap-1.5">
              {i > 0 ? (
                <span aria-hidden="true" className="text-slate-300">
                  /
                </span>
              ) : null}
              {isCurrent || !it.href ? (
                <span
                  className={
                    isCurrent
                      ? "font-semibold text-[#003f88]"
                      : "text-slate-500"
                  }
                >
                  {it.title}
                </span>
              ) : (
                <Link href={it.href} className="text-slate-500 hover:text-[#003f88]">
                  {it.title}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
