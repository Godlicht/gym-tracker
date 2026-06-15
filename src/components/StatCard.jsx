export function StatCard({ label, value, hint, icon: Icon }) {
  return (
    <div className="rounded-lg border border-line bg-graphite p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">{label}</p>
          <p className="mt-3 text-2xl font-semibold text-zinc-50">{value}</p>
        </div>
        {Icon ? (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-line bg-coal text-ember">
            <Icon size={20} />
          </div>
        ) : null}
      </div>
      {hint ? <p className="mt-3 text-sm text-zinc-500">{hint}</p> : null}
    </div>
  );
}
