import { useMemo, useState } from "react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { Plus, Ruler } from "lucide-react";
import { ChartPanel } from "../components/ChartPanel.jsx";
import { EmptyState } from "../components/EmptyState.jsx";
import { Field, inputClass } from "../components/Field.jsx";
import { SectionHeader } from "../components/SectionHeader.jsx";
import { toInputDate } from "../utils/date.js";
import { getBodyMetricSeries, getLatestBodyMetric } from "../utils/progress.js";

const tooltipStyle = {
  background: "#151517",
  border: "1px solid #2b2b31",
  borderRadius: 8,
  color: "#f4f4f5",
};

const metricFields = [
  { key: "weight", label: "Waga", unit: "kg", step: "0.1" },
  { key: "height", label: "Wzrost", unit: "cm", step: "0.5" },
  { key: "chest", label: "Klatka", unit: "cm", step: "0.1" },
  { key: "waist", label: "Talia", unit: "cm", step: "0.1" },
  { key: "hips", label: "Biodra", unit: "cm", step: "0.1" },
  { key: "arm", label: "Ramię", unit: "cm", step: "0.1" },
  { key: "thigh", label: "Udo", unit: "cm", step: "0.1" },
  { key: "calf", label: "Łydka", unit: "cm", step: "0.1" },
];

function createMetricForm(latest) {
  return {
    date: toInputDate(),
    weight: latest?.weight ?? "",
    height: latest?.height ?? "",
    chest: latest?.chest ?? "",
    waist: latest?.waist ?? "",
    hips: latest?.hips ?? "",
    arm: latest?.arm ?? "",
    thigh: latest?.thigh ?? "",
    calf: latest?.calf ?? "",
  };
}

export function BodyMetrics({ data, onAddBodyMetric }) {
  const latest = getLatestBodyMetric(data.bodyMetrics);
  const [form, setForm] = useState(() => createMetricForm(latest));
  const [errors, setErrors] = useState({});
  const series = useMemo(() => getBodyMetricSeries(data.bodyMetrics), [data.bodyMetrics]);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
  }

  function validate() {
    const nextErrors = {};
    if (!form.date) nextErrors.date = "Wybierz datę pomiaru.";
    metricFields.forEach((field) => {
      if (form[field.key] === "" || Number(form[field.key]) <= 0) {
        nextErrors[field.key] = "Podaj wartość większą od 0.";
      }
    });
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!validate()) return;

    onAddBodyMetric({
      date: form.date,
      ...Object.fromEntries(metricFields.map((field) => [field.key, Number(form[field.key])])),
    });
    setForm((current) => ({ ...current, date: toInputDate() }));
  }

  return (
    <>
      <SectionHeader
        eyebrow="Parametry ciała"
        title="Pomiary i trendy"
        description="Masa ciała i obwody zapisane w czasie, gotowe do analizy razem z treningiem."
      />

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <form className="rounded-lg border border-line bg-graphite p-5" onSubmit={handleSubmit}>
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ember">Nowy pomiar</p>
              <h2 className="mt-1 text-xl font-semibold text-zinc-50">Parametry</h2>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-md border border-line bg-coal text-ember">
              <Ruler size={19} />
            </div>
          </div>

          <Field label="Data pomiaru" error={errors.date}>
            <input className={inputClass} type="date" value={form.date} onChange={(event) => updateField("date", event.target.value)} />
          </Field>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {metricFields.map((field) => (
              <Field key={field.key} label={`${field.label} (${field.unit})`} error={errors[field.key]}>
                <input
                  className={inputClass}
                  min="0"
                  step={field.step}
                  type="number"
                  value={form[field.key]}
                  onChange={(event) => updateField(field.key, event.target.value)}
                />
              </Field>
            ))}
          </div>

          <button className="mt-5 inline-flex items-center justify-center gap-2 rounded-md bg-ember px-4 py-2.5 text-sm font-bold text-black transition hover:bg-amberline" type="submit">
            <Plus size={17} />
            Dodaj pomiar
          </button>
        </form>

        <div className="grid gap-6">
          <ChartPanel title="Waga" subtitle="Zmiana masy ciała">
            {series.length >= 2 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={series}>
                  <CartesianGrid stroke="#2b2b31" vertical={false} />
                  <XAxis dataKey="label" stroke="#71717a" tickLine={false} axisLine={false} minTickGap={20} />
                  <YAxis stroke="#71717a" tickLine={false} axisLine={false} domain={["dataMin - 1", "dataMax + 1"]} width={44} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line type="monotone" dataKey="weight" stroke="#ff7a1a" strokeWidth={3} dot={{ r: 4, fill: "#0b0b0c", strokeWidth: 2 }} name="Waga" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState title="Brak danych do wykresu" description="Dodaj co najmniej dwa pomiary." />
            )}
          </ChartPanel>

          <ChartPanel title="Obwody" subtitle="Klatka, talia, biodra i kończyny">
            {series.length >= 2 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={series}>
                  <CartesianGrid stroke="#2b2b31" vertical={false} />
                  <XAxis dataKey="label" stroke="#71717a" tickLine={false} axisLine={false} minTickGap={20} />
                  <YAxis stroke="#71717a" tickLine={false} axisLine={false} width={44} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line type="monotone" dataKey="chest" stroke="#ff7a1a" strokeWidth={2.5} dot={false} name="Klatka" />
                  <Line type="monotone" dataKey="waist" stroke="#facc15" strokeWidth={2.5} dot={false} name="Talia" />
                  <Line type="monotone" dataKey="hips" stroke="#e4e4e7" strokeWidth={2.5} dot={false} name="Biodra" />
                  <Line type="monotone" dataKey="arm" stroke="#a1a1aa" strokeWidth={2} dot={false} name="Ramię" />
                  <Line type="monotone" dataKey="thigh" stroke="#fb923c" strokeWidth={2} dot={false} name="Udo" />
                  <Line type="monotone" dataKey="calf" stroke="#71717a" strokeWidth={2} dot={false} name="Łydka" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState title="Brak danych do wykresu" description="Dodaj co najmniej dwa pełne pomiary obwodów." />
            )}
          </ChartPanel>
        </div>
      </div>
    </>
  );
}
