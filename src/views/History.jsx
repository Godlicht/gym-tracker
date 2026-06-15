import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { EmptyState } from "../components/EmptyState.jsx";
import { inputClass } from "../components/Field.jsx";
import { SectionHeader } from "../components/SectionHeader.jsx";
import { compareDateDesc, formatDate, getDayLabel } from "../utils/date.js";

function workoutVolume(workout) {
  return workout.exercises.reduce((sum, exercise) => sum + exercise.weight * exercise.reps * exercise.sets, 0);
}

export function History({ data, onOpenExercise }) {
  const [query, setQuery] = useState("");
  const workouts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return [...data.workouts]
      .sort(compareDateDesc)
      .filter((workout) => {
        if (!normalizedQuery) return true;
        const haystack = [
          workout.title,
          workout.date,
          getDayLabel(workout.dayKey),
          ...workout.exercises.flatMap((exercise) => [exercise.name, exercise.muscle, exercise.note]),
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(normalizedQuery);
      });
  }, [data.workouts, query]);

  return (
    <>
      <SectionHeader
        eyebrow="Historia treningów"
        title="Wykonane jednostki"
        description="Pełny dziennik zapisanych serii, ciężarów, powtórzeń i notatek."
        action={
          <div className="relative w-full min-w-[240px] sm:w-[340px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
            <input className={`${inputClass} pl-10`} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Szukaj w historii" />
          </div>
        }
      />

      {!data.workouts.length ? (
        <EmptyState title="Brak historii treningów" description="Zapisz wynik ćwiczenia, aby utworzyć pierwszą jednostkę w historii." />
      ) : workouts.length ? (
        <div className="space-y-4">
          {workouts.map((workout) => (
            <article key={workout.id} className="rounded-lg border border-line bg-graphite p-5">
              <div className="mb-5 grid gap-3 md:grid-cols-[1fr_auto] md:items-start">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ember">{formatDate(workout.date)}</p>
                  <h2 className="mt-1 text-xl font-semibold text-zinc-50">{workout.title}</h2>
                  <p className="mt-1 text-sm text-zinc-500">{getDayLabel(workout.dayKey)}</p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-right sm:flex">
                  <div className="rounded-md border border-line bg-coal px-3 py-2">
                    <p className="text-xs text-zinc-500">Ćwiczenia</p>
                    <p className="text-sm font-semibold text-zinc-100">{workout.exercises.length}</p>
                  </div>
                  <div className="rounded-md border border-line bg-coal px-3 py-2">
                    <p className="text-xs text-zinc-500">Wolumen</p>
                    <p className="text-sm font-semibold text-zinc-100">{Math.round(workoutVolume(workout)).toLocaleString("pl-PL")} kg</p>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="border-b border-line text-xs uppercase tracking-[0.16em] text-zinc-500">
                    <tr>
                      <th className="py-3 pr-4 font-semibold">Ćwiczenie</th>
                      <th className="py-3 pr-4 font-semibold">Partia</th>
                      <th className="py-3 pr-4 font-semibold">Ciężar</th>
                      <th className="py-3 pr-4 font-semibold">Serie</th>
                      <th className="py-3 pr-4 font-semibold">Powt.</th>
                      <th className="py-3 pr-4 font-semibold">Notatka</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line text-zinc-300">
                    {workout.exercises.map((exercise) => (
                      <tr key={exercise.id}>
                        <td className="py-3 pr-4">
                          <button className="font-semibold text-zinc-100 hover:text-ember" type="button" onClick={() => onOpenExercise(exercise.name)}>
                            {exercise.name}
                          </button>
                        </td>
                        <td className="py-3 pr-4 text-zinc-500">{exercise.muscle}</td>
                        <td className="py-3 pr-4">{exercise.weight} kg</td>
                        <td className="py-3 pr-4">{exercise.sets}</td>
                        <td className="py-3 pr-4">{exercise.reps}</td>
                        <td className="py-3 pr-4 text-zinc-500">{exercise.note || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState title="Brak historii treningów" description="Nie znaleziono wpisów pasujących do wyszukiwania." />
      )}
    </>
  );
}
