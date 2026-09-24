"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="mx-auto flex max-w-3xl flex-col items-start px-4 py-24 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-slate-900">出错了</h1>
      <p className="mt-3 text-slate-600">
        页面渲染失败。若后台正在重启，稍后重试即可。
      </p>
      <pre className="mt-4 max-w-full overflow-auto rounded-lg bg-slate-50 p-4 text-xs text-slate-500">
        {error.message}
      </pre>
      <button
        onClick={reset}
        className="mt-6 rounded-md bg-[#003f88] px-4 py-2 text-sm font-medium text-white hover:bg-[#0056b3]"
      >
        重试
      </button>
    </section>
  );
}
