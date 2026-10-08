import { NextResponse, type NextRequest } from "next/server";
import { LANGS, DEFAULT_LANG } from "@/lib/lang";
import { getSitePolicy } from "@/lib/siteConfig";

/**
 * 语言前缀收敛：
 *  - 首段已是受支持语言 → 放行
 *  - 否则把整条路径挂到默认语言下（/ → /en，/news → /en/news）
 * 未受支持的语言码（如 /de/...）同样落到默认语言，一期只有 en / zh。
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const first = pathname.split("/")[1] ?? "";

  const policy = getSitePolicy();
  if (policy.mode === "production") {
    const cnHostname = new URL(policy.siteUrl("zh", "/")).hostname;
    const requestHostname = (req.headers.get("host") ?? req.nextUrl.hostname)
      .split(":")[0]
      .toLowerCase();
    const isCnHost = requestHostname === cnHostname;
    const hostLang = isCnHost ? "zh" : DEFAULT_LANG;
    // Production URL contract: English is the canonical root, while Chinese
    // lives on the separate CN domain. Both prefixed variants are normalized.
    const rest = pathname === "/" ? "/" : pathname.slice(first.length + 1) || "/";
    if (first === "zh") {
      return NextResponse.redirect(policy.siteUrl("zh", rest));
    }
    if (first === DEFAULT_LANG) {
      return NextResponse.redirect(policy.siteUrl(hostLang, rest));
    }
    // Root and unprefixed English routes are canonical in production, but the
    // app router still uses the shared [lang] segment internally.
    const url = req.nextUrl.clone();
    url.pathname = `/${hostLang}${pathname === "/" ? "" : pathname}`;
    return NextResponse.rewrite(url);
  }

  if ((LANGS as readonly string[]).includes(first)) {
    const response = NextResponse.next();
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
    return response;
  }
  const url = req.nextUrl.clone();
  url.pathname = `/${DEFAULT_LANG}${pathname === "/" ? "" : pathname}`;
  const response = NextResponse.redirect(url);
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}

export const config = {
  // 排除 Next 内部资源、favicon 与所有带扩展名的静态文件
  matcher: ["/((?!_next|favicon\\.ico|.*\\.).*)"],
};
