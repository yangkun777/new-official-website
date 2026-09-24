import Link from "next/link";

interface Props {
  page: number;
  totalPages: number;
  total: number;
  basePath: string;
}

function pageRange(current: number, total: number): (number | "...")[] {
  const pages: (number | "...")[] = [];
  const window = 1;
  for (let p = 1; p <= total; p++) {
    if (p === 1 || p === total || (p >= current - window && p <= current + window)) {
      pages.push(p);
    } else if (pages[pages.length - 1] !== "...") {
      pages.push("...");
    }
  }
  return pages;
}

export default function Pagination({ page, totalPages, total, basePath }: Props) {
  if (totalPages <= 1) {
    return <p className="text-sm text-slate-500">Total {total} series</p>;
  }
  const items = pageRange(page, totalPages);
  const href = (p: number) => `${basePath}?page=${p}`;
  const btn = "inline-flex h-9 min-w-9 items-center justify-center rounded-md px-3 text-sm transition-colors";

  return (
    <nav aria-label="Pagination" className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
      <p className="text-sm text-slate-500">
        Page {page} of {totalPages} · {total} series
      </p>
      <ol className="flex items-center gap-1">
        <li>
          {page > 1 ? (
            <Link href={href(page - 1)} className={`${btn} border border-slate-200 text-slate-600 hover:bg-slate-50`}>Prev</Link>
          ) : (
            <span className={`${btn} cursor-not-allowed border border-slate-200 text-slate-300`}>Prev</span>
          )}
        </li>
        {items.map((it, i) =>
          it === "..." ? (
            <li key={`e-${i}`} className="px-2 text-slate-400">…</li>
          ) : (
            <li key={it}>
              {it === page ? (
                <span aria-current="page" className={`${btn} bg-[#003f88] font-medium text-white`}>{it}</span>
              ) : (
                <Link href={href(it)} className={`${btn} border border-slate-200 text-slate-600 hover:bg-slate-50`}>{it}</Link>
              )}
            </li>
          )
        )}
        <li>
          {page < totalPages ? (
            <Link href={href(page + 1)} className={`${btn} border border-slate-200 text-slate-600 hover:bg-slate-50`}>Next</Link>
          ) : (
            <span className={`${btn} cursor-not-allowed border border-slate-200 text-slate-300`}>Next</span>
          )}
        </li>
      </ol>
    </nav>
  );
}
