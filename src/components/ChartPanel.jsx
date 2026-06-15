export function ChartPanel({ title, subtitle, children, action }) {
  return (
    <section className="rounded-lg border border-line bg-graphite p-5">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-50">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm text-zinc-500">{subtitle}</p> : null}
        </div>
        {action}
      </div>
      <div className="h-[300px] min-w-0">{children}</div>
    </section>
  );
}
