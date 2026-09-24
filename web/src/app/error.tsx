"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-7xl flex-col items-center justify-center px-4 py-24 text-center sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-slate-900">
        Unable to load this page
      </h1>
      <p className="mt-3 max-w-md text-slate-600">
        We couldn&apos;t reach the content backend (Directus) right now. Please
        make sure Directus is running on port 8055 and try again.
      </p>
      <button
        onClick={() => reset()}
        className="mt-6 rounded-lg bg-[#003f88] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#0056b3]"
      >
        Try again
      </button>
    </div>
  );
}
