import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col items-center justify-center px-4 py-24 text-center sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-slate-900">Page not found</h1>
      <p className="mt-3 max-w-md text-slate-600">
        The category or series you requested does not exist.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-lg bg-[#003f88] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#0056b3]"
      >
        Back to home
      </Link>
    </div>
  );
}
