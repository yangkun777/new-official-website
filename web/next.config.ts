import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allows isolated verification builds without touching the running demo's .next output.
  distDir: process.env.DEGSON_NEXT_DIST_DIR || ".next",
  // Keep the small demo's routes compiled during presentation browsing.
  // The default idle eviction causes long recompiles when revisiting pages.
  onDemandEntries: {
    maxInactiveAge: 60 * 60 * 1000,
    pagesBufferLength: 12,
  },
  /**
   * 关闭「流式 metadata」（Next 15 默认开启）。
   *
   * 默认行为下，只有命中 isbot 名单的 UA（Bingbot / Twitterbot / Slackbot…）
   * 才会拿到写在 <head> 里的 metadata；其余一律被推迟到 body 流中，
   * 靠一段 React 脚本运行时搬回 <head>。本机实测：
   *   Googlebot / GPTBot / ClaudeBot / PerplexityBot / Bytespider → title 在 <head> 外
   * 不执行 JS 的爬虫读原始 HTML 时看不到 title / description / canonical / hreflang——
   * 对本项目要考的 GEO 指标是硬伤（PRD §8.1.1）。
   *
   * 这里用「匹配任意 UA」的正则，让所有 UA 都走「阻塞渲染」路径，
   * metadata 必定出现在首屏 <head>。
   * 不采用「扩充机器人名单」的做法：AI 爬虫层出不穷，维护名单长期必漏。
   * 代价是首字节要等 metadata 查完（本页与页面正文复用同一次查询，影响很小）。
   */
  htmlLimitedBots: /.*/,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "enoss.degson.com" },
      { protocol: "https", hostname: "oss.degson.com" },
      { protocol: "http", hostname: "enoss.degson.com" },
      { protocol: "http", hostname: "oss.degson.com" },
      { protocol: "http", hostname: "localhost", port: "8055" },
    ],
  },
};

export default nextConfig;
