import { CircleOff } from "lucide-react";

export function EmptyState({ title, description, action }) {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center rounded-lg border border-dashed border-line bg-coal/70 p-8 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-line bg-graphite text-ember">
        <CircleOff size={22} />
      </div>
      <h3 className="text-base font-semibold text-zinc-100">{title}</h3>
      {description ? <p className="mt-2 max-w-md text-sm leading-6 text-zinc-500">{description}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
