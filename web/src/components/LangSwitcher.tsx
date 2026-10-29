import Link from "next/link";
import { LANGS, type Lang } from "@/lib/lang";
import { siteHref } from "@/lib/site";

const LABEL: Record<Lang, string> = { en: "English", zh: "中文" };

/**
 * 语言切换：链接到同一 path 的另一种语言版本。
 * available 给出该页真实存在的语言（详情页只列有翻译的语言），
 * 未列出的语言不渲染，避免把用户送到空页（PRD §6.4 / §8.1.1）。
 */
export default function LangSwitcher({
  lang,
  path,
  available = [...LANGS],
  paths,
  nativeNavigation = false,
}: {
  lang: Lang;
  path: string;
  available?: Lang[];
  paths?: Partial<Record<Lang, string>>;
  nativeNavigation?: boolean;
}) {
  const list = available.includes(lang) ? available : [lang, ...available];

  return (
    <nav aria-label="Language" className="flex items-center gap-3 text-[13px]">
      {list.map((code, i) => (
        <span key={code} className="flex items-center gap-3">
          {i > 0 ? <span className="text-[#ddd]">|</span> : null}
          {code === lang ? (
            <span aria-current="true" className="font-medium text-[#161616]">
              {LABEL[code]}
            </span>
          ) : nativeNavigation ? (
            <a href={siteHref(code, paths?.[code] ?? path)} hrefLang={code === "zh" ? "zh-Hans" : code} className="inline-flex min-h-11 items-center text-[#888] hover:text-[#161616]">{LABEL[code]}</a>
          ) : (
            <Link
              href={siteHref(code, paths?.[code] ?? path)}
              hrefLang={code === "zh" ? "zh-Hans" : code}
              className="text-[#888] hover:text-[#161616]"
            >
              {LABEL[code]}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
