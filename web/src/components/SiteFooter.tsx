export default function SiteFooter({ text = "© DEGSON. All rights reserved." }: { text?: string }) {
  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-6 text-sm text-slate-500 sm:px-6 lg:px-8">
        {text}
      </div>
    </footer>
  );
}
