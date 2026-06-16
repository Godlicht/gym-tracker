import { useState } from "react";
import { Save, UserRound } from "lucide-react";
import { Field, inputClass, selectClass } from "../components/Field.jsx";
import { SectionHeader } from "../components/SectionHeader.jsx";

export function SettingsView({ profile, user, users = [], onUpdateProfile }) {
  const [form, setForm] = useState({
    name: profile.name || user.name,
    email: profile.email || user.email,
    goal: profile.goal || "",
    trainingLevel: profile.trainingLevel || "Początkujący",
    units: profile.units || "metric",
  });
  const [errors, setErrors] = useState({});
  const [saved, setSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
    setSaved(false);
  }

  function validate() {
    const nextErrors = {};
    const normalizedEmail = form.email.trim().toLowerCase();

    if (form.name.trim().length < 2) nextErrors.name = "Podaj nazwę profilu.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) nextErrors.email = "Podaj poprawny adres e-mail.";
    if (users.some((account) => account.id !== user.id && account.email === normalizedEmail)) {
      nextErrors.email = "Ten e-mail jest już zajęty.";
    }
    if (form.goal.trim().length < 3) nextErrors.goal = "Podaj cel treningowy.";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    const result = await onUpdateProfile({
      ...form,
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      goal: form.goal.trim(),
    });
    setSubmitting(false);

    if (result && !result.ok) {
      setErrors((current) => ({
        ...current,
        email: result.message,
      }));
      setSaved(false);
      return;
    }

    setSaved(true);
  }

  return (
    <>
      <SectionHeader
        eyebrow="Ustawienia"
        title="Profil użytkownika"
        description="Podstawowe dane konta i preferencje, które aplikacja wykorzystuje w panelu."
      />

      <form className="max-w-3xl rounded-lg border border-line bg-graphite p-5" onSubmit={handleSubmit}>
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ember">Konto</p>
            <h2 className="mt-1 text-xl font-semibold text-zinc-50">Dane profilu</h2>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-md border border-line bg-coal text-ember">
            <UserRound size={19} />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Nazwa profilu" error={errors.name}>
            <input className={inputClass} value={form.name} onChange={(event) => updateField("name", event.target.value)} />
          </Field>
          <Field label="E-mail" error={errors.email}>
            <input className={inputClass} type="email" value={form.email} onChange={(event) => updateField("email", event.target.value)} />
          </Field>
          <Field label="Cel" error={errors.goal}>
            <input className={inputClass} value={form.goal} onChange={(event) => updateField("goal", event.target.value)} />
          </Field>
          <Field label="Poziom">
            <select className={selectClass} value={form.trainingLevel} onChange={(event) => updateField("trainingLevel", event.target.value)}>
              <option>Początkujący</option>
              <option>Średnio zaawansowany</option>
              <option>Zaawansowany</option>
            </select>
          </Field>
          <Field label="Jednostki">
            <select className={selectClass} value={form.units} onChange={(event) => updateField("units", event.target.value)}>
              <option value="metric">Metryczne</option>
              <option value="imperial">Imperialne</option>
            </select>
          </Field>
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            className="inline-flex items-center justify-center gap-2 rounded-md bg-ember px-4 py-2.5 text-sm font-bold text-black transition hover:bg-amberline disabled:cursor-not-allowed disabled:opacity-60"
            type="submit"
            disabled={submitting}
          >
            <Save size={17} />
            {submitting ? "Zapisywanie..." : "Zapisz ustawienia"}
          </button>
          {saved ? <p className="text-sm text-emerald-300">Ustawienia zapisane.</p> : null}
        </div>
      </form>
    </>
  );
}
