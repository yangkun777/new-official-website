export type SocialPlatform = "twitter" | "linkedin" | "youtube" | "facebook";

export interface SocialLinkItem {
  platform: SocialPlatform;
  url: string;
  label?: string | null;
}

const META: Record<
  SocialPlatform,
  { label: string; icon: string }
> = {
  twitter: { label: "Twitter / X", icon: "/icons/social/twitter.svg" },
  linkedin: { label: "LinkedIn", icon: "/icons/social/linkedin.svg" },
  youtube: { label: "YouTube", icon: "/icons/social/youtube.svg" },
  facebook: { label: "Facebook", icon: "/icons/social/facebook.svg" },
};

function isSafeHttpUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export default function SocialIcons({
  items,
  className = "",
}: {
  items: SocialLinkItem[];
  className?: string;
}) {
  const list = items.filter(
    (i) => i.url && isSafeHttpUrl(i.url) && META[i.platform],
  );
  if (!list.length) return null;

  return (
    <ul className={`flex items-center gap-3 ${className}`.trim()}>
      {list.map((item) => {
        const meta = META[item.platform];
        const title = item.label?.trim() || meta.label;
        return (
          <li key={item.platform}>
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              title={title}
              aria-label={title}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-brand hover:text-brand"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={meta.icon} alt="" width={18} height={18} className="opacity-80" />
            </a>
          </li>
        );
      })}
    </ul>
  );
}
