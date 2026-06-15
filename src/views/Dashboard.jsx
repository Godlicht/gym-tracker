import { useEffect, useState } from "react";
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
import { Activity, CalendarCheck, ChevronRight, Flame, Scale, Trophy } from "lucide-react";
import { ChartPanel } from "../components/ChartPanel.jsx";
import { EmptyState } from "../components/EmptyState.jsx";
import { ExerciseResultForm } from "../components/ExerciseResultForm.jsx";
import { SectionHeader } from "../components/SectionHeader.jsx";
import { StatCard } from "../components/StatCard.jsx";
import { DAYS, formatDate, getDayLabel } from "../utils/date.js";
import {
  formatPlannedSeries,
  getBestResult,
  getBodyMetricSeries,
  getLatestBodyMetric,
  getPlannedSetCount,
  getPlannedTopSet,
  getThisMonthWorkouts,
  getTotalVolume,
  getWorkoutVolumeSeries,
} from "../utils/progress.js";

const tooltipStyle = {
  background: "#151517",
  border: "1px solid #2b2b31",
  borderRadius: 8,
  color: "#f4f4f5",
};

export function Dashboard({ data, todayKey, onSaveResult, onOpenExercise, onChangeView }) {
  const [selectedExerciseId, setSelectedExerciseId] = useDashboardSelection(data.weeklyPlan[todayKey]?.exercises?.[0]?.id);
  const todayPlan = data.weeklyPlan[todayKey];
  const selectedExercise = todayPlan?.exercises.find((exercise) => exercise.id === selectedExerciseId) ?? todayPlan?.exercises[0];
  const volumeSeries = getWorkoutVolumeSeries(data.workouts);
  const bodySeries = getBodyMetricSeries(data.bodyMetrics);
  const latestBodyMetric = getLatestBodyMetric(data.bodyMetrics);
  const lastWorkout = [...data.workouts].sort((a, b) => b.date.localeCompare(a.date))[0];
  const benchBest = getBestResult(data.workouts, "Wyciskanie sztangi leżąc");
  const monthWorkouts = getThisMonthWorkouts(data.workouts);
  const totalVolume = getTotalVolume(monthWorkouts);

  return (
    <>
      <SectionHeader
        eyebrow={getDayLabel(todayKey)}
        title="Dashboard"
        description="Najważniejsze dane treningowe, plan dnia i progres widoczne od razu po wejściu do panelu."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={CalendarCheck}
          label="Treningi w miesiącu"
          value={monthWorkouts.length}
          hint={lastWorkout ? `Ostatnio: ${formatDate(lastWorkout.date)}` : "Brak historii treningów"}
        />
        <StatCard
          icon={Trophy}
          label="Najlepszy bench"
          value={benchBest ? `${benchBest.weight} kg` : "Brak danych"}
          hint={benchBest ? `${benchBest.reps} powt. z ${formatDate(benchBest.date)}` : "Brak danych do wykresu"}
        />
        <StatCard
          icon={Flame}
          label="Wolumen miesiąca"
          value={`${Math.round(totalVolume).toLocaleString("pl-PL")} kg`}
          hint="Suma ciężar x serie x powtórzenia"
        />
        <StatCard
          icon={Scale}
          label="Aktualna waga"
          value={latestBodyMetric ? `${latestBodyMetric.weight} kg` : "Brak danych"}
          hint={latestBodyMetric ? `Pomiar: ${formatDate(latestBodyMetric.date)}` : "Brak danych do wykresu"}
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-lg border border-line bg-graphite p-5">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ember">Plan na dziś</p>
              <h2 className="mt-1 text-xl font-semibold text-zinc-50">{todayPlan?.title ?? "Brak planu"}</h2>
              <p className="mt-1 text-sm text-zinc-500">{todayPlan?.focus ?? "Brak planu na dziś"}</p>
            </div>
            <button
              className="inline-flex items-center justify-center gap-2 rounded-md border border-line px-3 py-2 text-sm font-semibold text-zinc-300 transition hover:border-ember/60 hover:text-zinc-50"
              type="button"
              onClick={() => onChangeView("plan")}
            >
              Otwórz plan
              <ChevronRight size={16} />
            </button>
          </div>

          {todayPlan?.type === "rest" ? (
            <EmptyState title="Rest day" description="Dzisiejszy dzień jest oznaczony jako regeneracyjny." />
          ) : todayPlan?.exercises?.length ? (
            <>
              <div className="divide-y divide-line rounded-lg border border-line">
                {todayPlan.exercises.map((exercise) => {
                  const topSet = getPlannedTopSet(exercise);
                  return (
                    <div key={exercise.id} className="grid gap-4 p-4 md:grid-cols-[1fr_auto] md:items-center">
                      <div>
                        <button className="text-left text-base font-semibold text-zinc-100 hover:text-ember" type="button" onClick={() => onOpenExercise(exercise.name)}>
                          {exercise.name}
                        </button>
                        <p className="mt-1 text-sm text-zinc-500">
                          {exercise.muscle} · {getPlannedSetCount(exercise)} serii · top {topSet?.reps ?? 0} powt. x {topSet?.weight ?? 0} kg
                        </p>
                        <p className="mt-2 text-sm leading-6 text-zinc-400">{formatPlannedSeries(exercise)}</p>
                        {exercise.note ? <p className="mt-2 text-sm text-zinc-500">{exercise.note}</p> : null}
                      </div>
                      <div className="flex gap-2">
                        <button
                          className={`rounded-md px-3 py-2 text-sm font-semibold transition ${
                            selectedExercise?.id === exercise.id ? "bg-ember text-black" : "border border-line text-zinc-400 hover:border-ember/60 hover:text-zinc-100"
                          }`}
                          type="button"
                          onClick={() => setSelectedExerciseId(exercise.id)}
                        >
                          Wynik
                        </button>
                        <button
                          className="rounded-md border border-line px-3 py-2 text-sm font-semibold text-zinc-400 transition hover:border-ember/60 hover:text-zinc-100"
                          type="button"
                          onClick={() => onOpenExercise(exercise.name)}
                        >
                          Szczegóły
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-5">
                <ExerciseResultForm exercise={selectedExercise} dayKey={todayKey} onSave={onSaveResult} compact />
              </div>
            </>
          ) : (
            <EmptyState title="Brak planu na dziś" description="Ten dzień jest treningowy, ale nie ma jeszcze dodanych ćwiczeń." />
          )}
        </section>

        <section className="rounded-lg border border-line bg-graphite p-5">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ember">Tydzień</p>
              <h2 className="mt-1 text-xl font-semibold text-zinc-50">Rytm planu</h2>
            </div>
            <Activity className="text-ember" size={22} />
          </div>
          <div className="grid gap-3">
            {DAYS.map((day) => {
              const plan = data.weeklyPlan[day.key];
              const isToday = day.key === todayKey;
              return (
                <button
                  key={day.key}
                  className={`grid grid-cols-[44px_1fr_auto] items-center gap-3 rounded-md border p-3 text-left transition ${
                    isToday ? "border-ember bg-ember/10" : "border-line bg-coal/60 hover:border-ember/50"
                  }`}
                  type="button"
                  onClick={() => onChangeView("plan")}
                >
                  <span className={`flex h-11 w-11 items-center justify-center rounded-md text-sm font-bold ${isToday ? "bg-ember text-black" : "bg-graphite text-zinc-400"}`}>
                    {day.short}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-zinc-100">{plan.title}</span>
                    <span className="block truncate text-xs text-zinc-500">{plan.focus}</span>
                  </span>
                  <span className={`rounded px-2 py-1 text-xs font-semibold ${plan.type === "rest" ? "bg-zinc-800 text-zinc-400" : "bg-ember/15 text-ember"}`}>
                    {plan.type === "rest" ? "Rest" : `${plan.exercises.length} ćw.`}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <ChartPanel title="Wolumen treningowy" subtitle="Ostatnie zapisane jednostki">
          {volumeSeries.length >= 2 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={volumeSeries}>
                <CartesianGrid stroke="#2b2b31" vertical={false} />
                <XAxis dataKey="label" stroke="#71717a" tickLine={false} axisLine={false} minTickGap={20} />
                <YAxis stroke="#71717a" tickLine={false} axisLine={false} width={56} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(255, 122, 26, 0.08)" }} />
                <Bar dataKey="volume" fill="#ff7a1a" radius={[6, 6, 0, 0]} name="Wolumen" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState title="Brak danych do wykresu" description="Zapisz co najmniej dwa wyniki treningowe." />
          )}
        </ChartPanel>

        <ChartPanel title="Trend masy ciała" subtitle="Pomiary z panelu parametrów">
          {bodySeries.length >= 2 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={bodySeries}>
                <CartesianGrid stroke="#2b2b31" vertical={false} />
                <XAxis dataKey="label" stroke="#71717a" tickLine={false} axisLine={false} minTickGap={20} />
                <YAxis stroke="#71717a" tickLine={false} axisLine={false} domain={["dataMin - 1", "dataMax + 1"]} width={42} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="weight" stroke="#ff7a1a" strokeWidth={3} dot={{ r: 4, fill: "#0b0b0c", strokeWidth: 2 }} name="Waga" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState title="Brak danych do wykresu" description="Dodaj co najmniej dwa pomiary ciała." />
          )}
        </ChartPanel>
      </div>
    </>
  );
}

function useDashboardSelection(initialId) {
  const [selectedExerciseId, setSelectedExerciseId] = useState(initialId);

  useEffect(() => {
    setSelectedExerciseId(initialId);
  }, [initialId]);

  return [selectedExerciseId, setSelectedExerciseId];
}
