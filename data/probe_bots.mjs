// 实测不同 UA 下 streaming metadata 行为：<title> 是否落在 <head> 内
const url = process.argv[2] ?? "http://localhost:3000/en/product/category/terminal-blocks";

const UAS = {
  "普通浏览器": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36",
  Googlebot: "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
  Bingbot: "Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)",
  GPTBot: "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; GPTBot/1.2; +https://openai.com/gptbot",
  ClaudeBot: "Mozilla/5.0 (compatible; ClaudeBot/1.0; +claudebot@anthropic.com)",
  PerplexityBot: "Mozilla/5.0 (compatible; PerplexityBot/1.0; +https://perplexity.ai/perplexitybot)",
  Bytespider: "Mozilla/5.0 (compatible; Bytespider; spider-feedback@bytedance.com)",
  "无 UA": null,
};

for (const [name, ua] of Object.entries(UAS)) {
  const headers = ua ? { "User-Agent": ua } : {};
  try {
    const r = await fetch(url, { headers });
    const t = await r.text();
    const headEnd = t.indexOf("</head>");
    const ti = t.indexOf("<title");
    const inHead = ti >= 0 && ti < headEnd;
    const hasHreflang = /hreflang/i.test(t);
    console.log(
      name.padEnd(14),
      "[", r.status, "]",
      "title@", String(ti).padStart(6),
      "headEnd@", String(headEnd).padStart(5),
      inHead ? "✅ head 内" : "❌ head 外(流式)",
      "hreflang:", hasHreflang ? "有" : "无"
    );
  } catch (e) {
    console.log(name.padEnd(14), "ERR", e.message);
  }
}

// 打印 isbot 默认正则
const isbot = await import("isbot");
console.log("\nisbot 版本:", isbot.default ? "loaded" : "?");
console.log("HTML_LIMITED_BOT_UA_RE_STRING:");
console.log(isbot.HTML_LIMITED_BOT_UA_RE_STRING ?? "(未导出)");
