import SocialIcons, { type SocialLinkItem } from "@/components/SocialIcons";

export default function SiteFooter({
  text = "© DEGSON. All rights reserved.",
  social = [],
}: {
  text?: string;
  social?: SocialLinkItem[];
}) {
  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <p className="text-sm text-slate-500">{text}</p>
        <SocialIcons items={social} />
      </div>
    </footer>
  );
}
