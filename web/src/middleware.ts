import { NextResponse, type NextRequest } from "next/server";
import { LANGS, DEFAULT_LANG } from "@/lib/lang";

/**
 * 语言前缀收敛：
 *  - 首段已是受支持语言 → 放行
 *  - 否则把整条路径挂到默认语言下（/ → /en，/news → /en/news）
 * 未受支持的语言码（如 /de/...）同样落到默认语言，一期只有 en / zh。
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const first = pathname.split("/")[1] ?? "";
  if ((LANGS as readonly string[]).includes(first)) {
    return NextResponse.next();
  }
  const url = req.nextUrl.clone();
  url.pathname = `/${DEFAULT_LANG}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  // 排除 Next 内部资源、favicon 与所有带扩展名的静态文件
  matcher: ["/((?!_next|favicon\\.ico|.*\\.).*)"],
};
