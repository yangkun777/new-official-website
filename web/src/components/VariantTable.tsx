import type { Variant } from "@/types/product";

function cell(value: string | null | undefined): string {
  return value && value.trim() !== "" ? value : "—";
}

export default function VariantTable({ variants }: { variants: Variant[] }) {
  if (variants.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
        Variant information is being recorded.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="min-w-full text-sm">
        <thead className="bg-[#003f88] text-white">
          <tr>
            <th scope="col" className="px-4 py-3 text-left font-semibold">Model</th>
            <th scope="col" className="px-4 py-3 text-left font-semibold">Poles</th>
            <th scope="col" className="px-4 py-3 text-left font-semibold">Pitch</th>
            <th scope="col" className="px-4 py-3 text-left font-semibold">Order No.</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {variants.map((v) => (
            <tr key={v.id} className="odd:bg-white even:bg-slate-50">
              <td className="px-4 py-2.5 font-medium text-slate-900">{cell(v.title)}</td>
              <td className="px-4 py-2.5 text-slate-600">{cell(v.poles)}</td>
              <td className="px-4 py-2.5 text-slate-600">{cell(v.pitch)}</td>
              <td className="px-4 py-2.5 font-mono text-slate-700">{cell(v.order_no)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
