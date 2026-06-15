import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Dumbbell, TrendingUp, Weight } from "lucide-react";
import { ChartPanel } from "../components/ChartPanel.jsx";
import { EmptyState } from "../components/EmptyState.jsx";
import { ExerciseResultForm } from "../components/ExerciseResultForm.jsx";
import { Field, selectClass } from "../components/Field.jsx";
import { SectionHeader } from "../components/SectionHeader.jsx";
import { StatCard } from "../components/StatCard.jsx";
import { formatDate } from "../utils/date.js";
import { getExerciseCatalog, getProgressForExercise } from "../utils/progress.js";

const tooltipStyle = {
  background: "#151517",
  border: "1px solid #2b2b31",
  borderRadius: 8,
  color: "#f4f4f5",
};

export function ExerciseDetails({ data, selectedExerciseName, onSelectExercise, onSaveResult }) {
  const catalog = useMemo(() => getExerciseCatalog(data), [data]);
  const [localSelection, setLocalSelection] = useState(selectedExerciseName ?? catalog[0]?.name ?? "");
  const activeName = selectedExerciseName || localSelection || catalog[0]?.name;
  const activeExercise = catalog.find((exercise) => exercise.name === activeName) ?? catalog[0];
  const progress = activeExercise ? getProgressForExercise(data.workouts, activeExercise.name) : [];
  const latest = progress.at(-1);
  const bestWeight = progress.reduce((best, entry) => (entry.weight > (best?.weight ?? -1) ? entry : best), null);
  const bestE1rm = progress.reduce((best, entry) => (entry.e1rm > (best?.e1rm ?? -1) ? entry : best), null);

  useEffect(() => {
    if (!selectedExerciseName && catalog[0]?.name) {
      setLocalSelection(catalog[0].name);
    }
  }, [catalog, selectedExerciseName]);

  function handleSelect(value) {
    setLocalSelection(value);
    onSelectExercise(value);
  }

  if (!catalog.length) {
    return (
      <>
        <SectionHeader eyebrow="Szczegóły ćwiczenia" title="Brak ćwiczeń" description="Dodaj ćwiczenie do planu, aby zobaczyć ten widok." />
        <EmptyState title="Brak danych do wykresu" description="Katalog ćwiczeń jest pusty." />
      </>
    );
  }

  return (
    <>
      <SectionHeader
        eyebrow="Szczegóły ćwiczenia"
        title={activeExercise.name}
        description="Historia wyników, trend siłowy i szybki zapis kolejnego podejścia."
        action={
          <div className="w-full min-w-[240px] sm:w-[320px]">
            <Field label="Ćwiczenie">
              <select className={selectClass} value={activeExercise.name} onChange={(event) => handleSelect(event.target.value)}>
                {catalog.map((exercise) => (
                  <option key={exercise.name} value={exercise.name}>
                    {exercise.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          icon={Weight}
          label="Ostatni wynik"
          value={latest ? `${latest.weight} kg` : "Brak danych"}
          hint={latest ? `${latest.sets}x${latest.reps} · ${formatDate(latest.date)}` : "Brak historii ćwiczenia"}
        />
        <StatCard
          icon={Dumbbell}
          label="Największy ciężar"
          value={bestWeight ? `${bestWeight.weight} kg` : "Brak danych"}
          hint={bestWeight ? `${bestWeight.sets}x${bestWeight.reps} · ${formatDate(bestWeight.date)}` : "Brak danych do wykresu"}
        />
        <StatCard
          icon={TrendingUp}
          label="Szacowane 1RM"
          value={bestE1rm ? `${bestE1rm.e1rm} kg` : "Brak danych"}
          hint={bestE1rm ? `Na bazie serii z ${formatDate(bestE1rm.date)}` : "Brak danych do wykresu"}
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <ChartPanel title="Progres siłowy" subtitle="Ciężar i estymowane 1RM w czasie">
          {progress.length >= 2 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={progress}>
                <CartesianGrid stroke="#2b2b31" vertical={false} />
                <XAxis dataKey="label" stroke="#71717a" tickLine={false} axisLine={false} minTickGap={20} />
                <YAxis stroke="#71717a" tickLine={false} axisLine={false} width={48} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="weight" stroke="#ff7a1a" strokeWidth={3} dot={{ r: 4, fill: "#0b0b0c", strokeWidth: 2 }} name="Ciężar" />
                <Line type="monotone" dataKey="e1rm" stroke="#facc15" strokeWidth={2} dot={false} name="1RM est." />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState title="Brak danych do wykresu" description="Zapisz co najmniej dwa wyniki dla tego ćwiczenia." />
          )}
        </ChartPanel>

        <ChartPanel title="Wolumen" subtitle="Ciężar x serie x powtórzenia">
          {progress.length >= 2 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={progress}>
                <CartesianGrid stroke="#2b2b31" vertical={false} />
                <XAxis dataKey="label" stroke="#71717a" tickLine={false} axisLine={false} minTickGap={20} />
                <YAxis stroke="#71717a" tickLine={false} axisLine={false} width={58} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(255, 122, 26, 0.08)" }} />
                <Bar dataKey="volume" fill="#ff7a1a" radius={[6, 6, 0, 0]} name="Wolumen" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState title="Brak danych do wykresu" description="Historia tego ćwiczenia jest jeszcze za krótka." />
          )}
        </ChartPanel>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.88fr_1.12fr]">
        <ExerciseResultForm exercise={activeExercise} onSave={onSaveResult} />

        <section className="rounded-lg border border-line bg-graphite p-5">
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ember">Historia</p>
            <h2 className="mt-1 text-lg font-semibold text-zinc-50">Wpisy ćwiczenia</h2>
          </div>
          {progress.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-left text-sm">
                <thead className="border-b border-line text-xs uppercase tracking-[0.16em] text-zinc-500">
                  <tr>
                    <th className="py-3 pr-4 font-semibold">Data</th>
                    <th className="py-3 pr-4 font-semibold">Ciężar</th>
                    <th className="py-3 pr-4 font-semibold">Serie</th>
                    <th className="py-3 pr-4 font-semibold">Powt.</th>
                    <th className="py-3 pr-4 font-semibold">Notatka</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line text-zinc-300">
                  {[...progress].reverse().map((entry) => (
                    <tr key={`${entry.workoutId}-${entry.id}`}>
                      <td className="py-3 pr-4 text-zinc-400">{formatDate(entry.date)}</td>
                      <td className="py-3 pr-4 font-semibold text-zinc-100">{entry.weight} kg</td>
                      <td className="py-3 pr-4">{entry.sets}</td>
                      <td className="py-3 pr-4">{entry.reps}</td>
                      <td className="py-3 pr-4 text-zinc-500">{entry.note || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="Brak historii treningów" description="Nie ma jeszcze zapisanego wyniku dla tego ćwiczenia." />
          )}
        </section>
      </div>
    </>
  );
}
