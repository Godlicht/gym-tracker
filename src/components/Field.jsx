export function Field({ label, error, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">{label}</span>
      {children}
      {error ? <span className="mt-2 block text-sm text-red-300">{error}</span> : null}
    </label>
  );
}

export const inputClass =
  "w-full rounded-md border border-line bg-coal px-3 py-2.5 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-ember focus:ring-2 focus:ring-ember/20";

export const selectClass =
  "w-full rounded-md border border-line bg-coal px-3 py-2.5 text-sm text-zinc-100 outline-none transition focus:border-ember focus:ring-2 focus:ring-ember/20";
