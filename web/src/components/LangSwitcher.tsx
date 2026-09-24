import Link from "next/link";

export default function LangSwitcher({
  lang,
  basePath,
}: {
  lang: string;
  basePath: string;
}) {
  const isZh = lang === "zh-CN";
  const item = (code: string, label: string, active: boolean) => (
    <Link
      key={code}
      href={`${basePath}?lang=${code}`}
      aria-current={active ? "true" : undefined}
      className={
        active
          ? "font-semibold text-[#003f88]"
          : "text-slate-500 hover:text-[#003f88]"
      }
    >
      {label}
    </Link>
  );
  return (
    <nav aria-label="Language" className="flex items-center gap-3 text-sm">
      {item("en-US", "English", !isZh)}
      <span className="text-slate-300">|</span>
      {item("zh-CN", "中文", isZh)}
    </nav>
  );
}
