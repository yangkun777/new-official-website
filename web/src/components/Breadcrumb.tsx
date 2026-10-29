import Link from "next/link";
import type { Crumb } from "@/types/product";

export default function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="border-b border-[#dce1e5] bg-[#f5f6f7]">
      <ol className="mx-auto flex max-w-[1280px] flex-wrap items-center gap-2 px-6 py-4 text-sm sm:px-10 lg:px-12">
        {items.map((it, i) => {
          const last = i === items.length - 1;
          const isCurrent = it.current || last;
          return (
            <li key={`${it.id}-${i}`} className="flex items-center gap-1.5">
              {i > 0 ? (
                <span aria-hidden="true" className="text-[#a7b0b8]">
                  /
                </span>
              ) : null}
              {isCurrent || !it.href ? (
                <span
                  className={
                    isCurrent
                      ? "font-semibold text-[#17212b]"
                      : "text-[#68747e]"
                  }
                >
                  {it.title}
                </span>
              ) : (
                <Link href={it.href} className="text-[#68747e] hover:text-[#af1728]">
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
