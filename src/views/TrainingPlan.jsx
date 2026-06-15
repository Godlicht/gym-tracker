import { useEffect, useState } from "react";
import { Dumbbell, Moon, Plus, Trash2 } from "lucide-react";
import { EmptyState } from "../components/EmptyState.jsx";
import { Field, inputClass, selectClass } from "../components/Field.jsx";
import { SectionHeader } from "../components/SectionHeader.jsx";
import { DAYS, getDayLabel } from "../utils/date.js";

const defaultExercise = {
  name: "",
  muscle: "Klatka",
  targetSets: 4,
  targetReps: 8,
  targetWeight: 60,
  note: "",
};

const muscleOptions = ["Klatka", "Plecy", "Nogi", "Barki", "Triceps", "Biceps", "Core", "Łydki", "Tył uda"];

export function TrainingPlan({ data, todayKey, onSetDayType, onUpdateDay, onAddExercise, onRemoveExercise, onOpenExercise }) {
  const [activeDay, setActiveDay] = useState(todayKey);
  const [exerciseForm, setExerciseForm] = useState(defaultExercise);
  const [errors, setErrors] = useState({});
  const dayPlan = data.weeklyPlan[activeDay];

  useEffect(() => {
    setActiveDay(todayKey);
  }, [todayKey]);

  function updateExercise(field, value) {
    setExerciseForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
  }

  function validateExercise() {
    const nextErrors = {};
    if (exerciseForm.name.trim().length < 3) nextErrors.name = "Podaj nazwę ćwiczenia.";
    if (Number(exerciseForm.targetSets) <= 0) nextErrors.targetSets = "Serie muszą być większe od 0.";
    if (Number(exerciseForm.targetReps) <= 0) nextErrors.targetReps = "Powtórzenia muszą być większe od 0.";
    if (Number(exerciseForm.targetWeight) < 0) nextErrors.targetWeight = "Ciężar nie może być ujemny.";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function handleAddExercise(event) {
    event.preventDefault();
    if (!validateExercise()) return;

    onAddExercise(activeDay, {
      ...exerciseForm,
      name: exerciseForm.name.trim(),
      targetSets: Number(exerciseForm.targetSets),
      targetReps: Number(exerciseForm.targetReps),
      targetWeight: Number(exerciseForm.targetWeight),
      note: exerciseForm.note.trim(),
    });
    setExerciseForm(defaultExercise);
  }

  return (
    <>
      <SectionHeader
        eyebrow="Plan treningowy"
        title="Tydzień pracy"
        description="Ustaw dni treningowe, rest day i konkretne ćwiczenia dla każdej jednostki."
      />

      <div className="grid gap-6 xl:grid-cols-[330px_1fr]">
        <aside className="rounded-lg border border-line bg-graphite p-4">
          <div className="grid gap-2">
            {DAYS.map((day) => {
              const plan = data.weeklyPlan[day.key];
              const active = activeDay === day.key;
              return (
                <button
                  key={day.key}
                  className={`grid grid-cols-[44px_1fr_auto] items-center gap-3 rounded-md border p-3 text-left transition ${
                    active ? "border-ember bg-ember/10" : "border-line bg-coal/60 hover:border-ember/50"
                  }`}
                  type="button"
                  onClick={() => setActiveDay(day.key)}
                >
                  <span className={`flex h-11 w-11 items-center justify-center rounded-md text-sm font-bold ${active ? "bg-ember text-black" : "bg-graphite text-zinc-400"}`}>
                    {day.short}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-zinc-100">{plan.title}</span>
                    <span className="block truncate text-xs text-zinc-500">{plan.focus}</span>
                  </span>
                  <span className={`rounded px-2 py-1 text-xs font-semibold ${plan.type === "rest" ? "bg-zinc-800 text-zinc-400" : "bg-ember/15 text-ember"}`}>
                    {plan.type === "rest" ? "Rest" : plan.exercises.length}
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="rounded-lg border border-line bg-graphite p-5">
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ember">{getDayLabel(activeDay)}</p>
              <h2 className="mt-1 text-2xl font-semibold text-zinc-50">{dayPlan.title}</h2>
              <p className="mt-1 text-sm text-zinc-500">{dayPlan.focus}</p>
            </div>
            <div className="grid grid-cols-2 rounded-md border border-line bg-coal p-1">
              <button
                className={`flex items-center justify-center gap-2 rounded px-3 py-2 text-sm font-semibold transition ${
                  dayPlan.type === "training" ? "bg-ember text-black" : "text-zinc-500 hover:text-zinc-200"
                }`}
                type="button"
                onClick={() => onSetDayType(activeDay, "training")}
              >
                <Dumbbell size={16} />
                Trening
              </button>
              <button
                className={`flex items-center justify-center gap-2 rounded px-3 py-2 text-sm font-semibold transition ${
                  dayPlan.type === "rest" ? "bg-ember text-black" : "text-zinc-500 hover:text-zinc-200"
                }`}
                type="button"
                onClick={() => onSetDayType(activeDay, "rest")}
              >
                <Moon size={16} />
                Rest day
              </button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Nazwa jednostki">
              <input className={inputClass} value={dayPlan.title} onChange={(event) => onUpdateDay(activeDay, { title: event.target.value })} />
            </Field>
            <Field label="Focus">
              <input className={inputClass} value={dayPlan.focus} onChange={(event) => onUpdateDay(activeDay, { focus: event.target.value })} />
            </Field>
          </div>

          {dayPlan.type === "rest" ? (
            <div className="mt-6">
              <EmptyState
                title="Rest day"
                description="Ten dzień nie pokazuje ćwiczeń w dashboardzie. Możesz w każdej chwili przełączyć go na treningowy."
                action={
                  <button className="rounded-md bg-ember px-4 py-2 text-sm font-bold text-black transition hover:bg-amberline" type="button" onClick={() => onSetDayType(activeDay, "training")}>
                    Oznacz jako trening
                  </button>
                }
              />
            </div>
          ) : (
            <>
              <div className="mt-6 overflow-hidden rounded-lg border border-line">
                {dayPlan.exercises.length ? (
                  <div className="divide-y divide-line">
                    {dayPlan.exercises.map((exercise) => (
                      <div key={exercise.id} className="grid gap-4 p-4 lg:grid-cols-[1fr_auto] lg:items-center">
                        <div>
                          <button className="text-left text-base font-semibold text-zinc-100 hover:text-ember" type="button" onClick={() => onOpenExercise(exercise.name)}>
                            {exercise.name}
                          </button>
                          <p className="mt-1 text-sm text-zinc-500">
                            {exercise.muscle} · {exercise.targetSets} serii · {exercise.targetReps} powt. · {exercise.targetWeight} kg
                          </p>
                          {exercise.note ? <p className="mt-2 text-sm text-zinc-400">{exercise.note}</p> : null}
                        </div>
                        <div className="flex gap-2">
                          <button
                            className="rounded-md border border-line px-3 py-2 text-sm font-semibold text-zinc-400 transition hover:border-ember/60 hover:text-zinc-100"
                            type="button"
                            onClick={() => onOpenExercise(exercise.name)}
                          >
                            Szczegóły
                          </button>
                          <button
                            className="flex h-10 w-10 items-center justify-center rounded-md border border-line text-zinc-500 transition hover:border-red-400/70 hover:text-red-300"
                            type="button"
                            onClick={() => onRemoveExercise(activeDay, exercise.id)}
                            title="Usuń ćwiczenie"
                          >
                            <Trash2 size={17} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState title="Brak planu na dziś" description="Ten dzień jest treningowy, ale lista ćwiczeń jest pusta." />
                )}
              </div>

              <form className="mt-6 rounded-lg border border-line bg-coal/60 p-5" onSubmit={handleAddExercise}>
                <div className="mb-5 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ember">Nowe ćwiczenie</p>
                    <h3 className="mt-1 text-lg font-semibold text-zinc-50">Dodaj do planu</h3>
                  </div>
                  <Plus className="text-ember" size={21} />
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <Field label="Nazwa" error={errors.name}>
                    <input className={inputClass} value={exerciseForm.name} onChange={(event) => updateExercise("name", event.target.value)} placeholder="Np. Hip thrust" />
                  </Field>
                  <Field label="Partia">
                    <select className={selectClass} value={exerciseForm.muscle} onChange={(event) => updateExercise("muscle", event.target.value)}>
                      {muscleOptions.map((option) => (
                        <option key={option}>{option}</option>
                      ))}
                    </select>
                  </Field>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  <Field label="Serie" error={errors.targetSets}>
                    <input className={inputClass} min="1" type="number" value={exerciseForm.targetSets} onChange={(event) => updateExercise("targetSets", event.target.value)} />
                  </Field>
                  <Field label="Powtórzenia" error={errors.targetReps}>
                    <input className={inputClass} min="1" type="number" value={exerciseForm.targetReps} onChange={(event) => updateExercise("targetReps", event.target.value)} />
                  </Field>
                  <Field label="Ciężar (kg)" error={errors.targetWeight}>
                    <input className={inputClass} min="0" step="0.5" type="number" value={exerciseForm.targetWeight} onChange={(event) => updateExercise("targetWeight", event.target.value)} />
                  </Field>
                </div>

                <div className="mt-4">
                  <Field label="Notatka">
                    <textarea
                      className={`${inputClass} min-h-[88px] resize-y`}
                      value={exerciseForm.note}
                      onChange={(event) => updateExercise("note", event.target.value)}
                      placeholder="Tempo, przerwy, akcent techniczny"
                    />
                  </Field>
                </div>

                <button className="mt-4 inline-flex items-center justify-center gap-2 rounded-md bg-ember px-4 py-2.5 text-sm font-bold text-black transition hover:bg-amberline" type="submit">
                  <Plus size={17} />
                  Dodaj ćwiczenie
                </button>
              </form>
            </>
          )}
        </section>
      </div>
    </>
  );
}
