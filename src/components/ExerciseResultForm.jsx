import { useEffect, useState } from "react";
import { Plus, Save, Trash2 } from "lucide-react";
import { Field, inputClass } from "./Field.jsx";
import { toInputDate } from "../utils/date.js";
import { getPlannedSeries } from "../utils/progress.js";

function makeSeriesRow(weight = "", reps = "") {
  return {
    id: window.crypto?.randomUUID ? window.crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    weight,
    reps,
  };
}

function makeInitialSeries(exercise) {
  const plannedSeries = getPlannedSeries(exercise ?? {});
  if (plannedSeries.length) {
    return plannedSeries.map((set) => makeSeriesRow(set.weight, set.reps));
  }

  const setCount = Math.max(1, Number(exercise?.targetSets) || 1);
  return Array.from({ length: setCount }, () => makeSeriesRow(exercise?.targetWeight ?? "", exercise?.targetReps ?? ""));
}

function makeInitialResult(exercise) {
  return {
    date: toInputDate(),
    series: makeInitialSeries(exercise),
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

  function updateSeries(rowId, field, value) {
    setResult((current) => ({
      ...current,
      series: current.series.map((row) => (row.id === rowId ? { ...row, [field]: value } : row)),
    }));
    setErrors((current) => ({ ...current, series: "" }));
    setSaved(false);
  }

  function addSeries() {
    setResult((current) => ({
      ...current,
      series: [...current.series, makeSeriesRow(current.series.at(-1)?.weight ?? exercise?.targetWeight ?? "", exercise?.targetReps ?? "")],
    }));
    setErrors((current) => ({ ...current, series: "" }));
    setSaved(false);
  }

  function removeSeries(rowId) {
    setResult((current) => ({
      ...current,
      series: current.series.length > 1 ? current.series.filter((row) => row.id !== rowId) : current.series,
    }));
    setErrors((current) => ({ ...current, series: "" }));
    setSaved(false);
  }

  function validate() {
    const nextErrors = {};
    const hasInvalidSeries = result.series.some((row) => row.weight === "" || Number(row.weight) < 0 || row.reps === "" || Number(row.reps) <= 0);

    if (!result.date) nextErrors.date = "Wybierz datę.";
    if (!result.series.length || hasInvalidSeries) {
      nextErrors.series = "Każda seria musi mieć ciężar 0 lub większy i przynajmniej 1 powtórzenie.";
    }

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
      series: result.series.map((row) => ({
        weight: Number(row.weight),
        reps: Number(row.reps),
      })),
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
      </div>

      <div className="mt-5">
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Serie</p>
            <p className="mt-1 text-sm text-zinc-400">Osobny ciężar i powtórzenia dla każdej serii.</p>
          </div>
          <button
            className="inline-flex items-center justify-center gap-2 rounded-md border border-line px-3 py-2 text-sm font-semibold text-zinc-300 transition hover:border-ember/60 hover:text-zinc-50"
            type="button"
            onClick={addSeries}
          >
            <Plus size={16} />
            Dodaj serię
          </button>
        </div>

        <div className="space-y-3">
          {result.series.map((row, index) => (
            <div key={row.id} className="grid gap-3 rounded-md border border-line bg-coal/70 p-3 sm:grid-cols-[44px_1fr_1fr_40px] sm:items-end">
              <div className="flex h-10 w-11 items-center justify-center rounded-md bg-graphite text-sm font-bold text-ember">{index + 1}</div>
              <Field label="Ciężar (kg)">
                <input className={inputClass} min="0" step="0.5" type="number" value={row.weight} onChange={(event) => updateSeries(row.id, "weight", event.target.value)} />
              </Field>
              <Field label="Powtórzenia">
                <input className={inputClass} min="1" step="1" type="number" value={row.reps} onChange={(event) => updateSeries(row.id, "reps", event.target.value)} />
              </Field>
              <button
                className="flex h-10 w-10 items-center justify-center rounded-md border border-line text-zinc-500 transition hover:border-red-400/70 hover:text-red-300 disabled:hover:border-line disabled:hover:text-zinc-500"
                type="button"
                onClick={() => removeSeries(row.id)}
                disabled={result.series.length === 1}
                title="Usuń serię"
              >
                <Trash2 size={17} />
              </button>
            </div>
          ))}
        </div>
        {errors.series ? <p className="mt-2 text-sm text-red-300">{errors.series}</p> : null}
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
