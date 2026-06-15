import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { Field, inputClass } from "./Field.jsx";
import { toInputDate } from "../utils/date.js";

function makeInitialResult(exercise) {
  return {
    date: toInputDate(),
    weight: exercise?.targetWeight ?? "",
    reps: exercise?.targetReps ?? "",
    sets: exercise?.targetSets ?? "",
    note: "",
  };
}

export function ExerciseResultForm({ exercise, dayKey, onSave, compact = false }) {
  const [result, setResult] = useState(() => makeInitialResult(exercise));
  const [errors, setErrors] = useState({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setResult(makeInitialResult(exercise));
    setErrors({});
    setSaved(false);
  }, [exercise?.id, exercise?.name]);

  function updateField(field, value) {
    setResult((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
    setSaved(false);
  }

  function validate() {
    const nextErrors = {};
    if (!result.date) nextErrors.date = "Wybierz datę.";
    if (Number(result.weight) < 0 || result.weight === "") nextErrors.weight = "Podaj ciężar 0 lub większy.";
    if (Number(result.reps) <= 0 || result.reps === "") nextErrors.reps = "Podaj liczbę powtórzeń.";
    if (Number(result.sets) <= 0 || result.sets === "") nextErrors.sets = "Podaj liczbę serii.";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!validate()) return;

    onSave({
      exercise,
      dayKey,
      date: result.date,
      weight: Number(result.weight),
      reps: Number(result.reps),
      sets: Number(result.sets),
      note: result.note.trim(),
    });
    setSaved(true);
    setResult((current) => ({ ...makeInitialResult(exercise), date: current.date }));
  }

  if (!exercise) return null;

  return (
    <form className={`rounded-lg border border-line bg-graphite ${compact ? "p-4" : "p-5"}`} onSubmit={handleSubmit}>
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ember">Zapis wyniku</p>
        <h3 className="mt-1 text-lg font-semibold text-zinc-50">{exercise.name}</h3>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Field label="Data" error={errors.date}>
          <input className={inputClass} type="date" value={result.date} onChange={(event) => updateField("date", event.target.value)} />
        </Field>
        <Field label="Ciężar (kg)" error={errors.weight}>
          <input className={inputClass} min="0" step="0.5" type="number" value={result.weight} onChange={(event) => updateField("weight", event.target.value)} />
        </Field>
        <Field label="Powtórzenia" error={errors.reps}>
          <input className={inputClass} min="1" step="1" type="number" value={result.reps} onChange={(event) => updateField("reps", event.target.value)} />
        </Field>
        <Field label="Serie" error={errors.sets}>
          <input className={inputClass} min="1" step="1" type="number" value={result.sets} onChange={(event) => updateField("sets", event.target.value)} />
        </Field>
      </div>

      <Field label="Notatka" error={errors.note}>
        <textarea
          className={`${inputClass} min-h-[88px] resize-y`}
          value={result.note}
          onChange={(event) => updateField("note", event.target.value)}
          placeholder="RPE, technika, samopoczucie"
        />
      </Field>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <button className="inline-flex items-center justify-center gap-2 rounded-md bg-ember px-4 py-2.5 text-sm font-bold text-black transition hover:bg-amberline" type="submit">
          <Save size={17} />
          Zapisz wynik
        </button>
        {saved ? <p className="text-sm text-emerald-300">Wynik dodany do historii.</p> : null}
      </div>
    </form>
  );
}
