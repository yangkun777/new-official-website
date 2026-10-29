import { cmsHtml } from "@/lib/contentSafety";

export default function CmsHtml({
  html,
  className,
}: {
  html?: string | null;
  className?: string;
}) {
  const safe = cmsHtml(html);
  if (!safe) return null;
  return <div className={className} dangerouslySetInnerHTML={{ __html: safe }} />;
}
