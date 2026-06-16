import { useState } from "react";
import { Activity, ArrowRight, Dumbbell, Lock, Mail, UserRound } from "lucide-react";
import { Field, inputClass } from "./Field.jsx";

const initialForm = {
  name: "",
  email: "demo@forgefit.app",
  password: "demo123",
};

export function AuthScreen({ onLogin, onRegister }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
    setServerError("");
  }

  function validate() {
    const nextErrors = {};

    if (mode === "register" && form.name.trim().length < 2) {
      nextErrors.name = "Podaj imię lub nazwę profilu.";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      nextErrors.email = "Podaj poprawny adres e-mail.";
    }

    if (form.password.length < 6) {
      nextErrors.password = "Hasło musi mieć co najmniej 6 znaków.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!validate()) return;

    const payload = {
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      password: form.password,
    };

    setSubmitting(true);
    const result = mode === "login" ? await onLogin(payload) : await onRegister(payload);
    setSubmitting(false);

    if (!result.ok) {
      setServerError(result.message);
    }
  }

  return (
    <main className="min-h-screen bg-ink text-zinc-50">
      <div className="auth-grid min-h-screen">
        <section className="flex min-h-screen items-center justify-center px-5 py-10 lg:px-10">
          <div className="w-full max-w-md">
            <div className="mb-10 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-ember text-black shadow-glow">
                <Dumbbell size={24} />
              </div>
              <div>
                <p className="text-xl font-semibold">ForgeFit</p>
                <p className="text-sm text-zinc-500">Prywatny panel progresu</p>
              </div>
            </div>

            <div className="rounded-lg border border-line bg-graphite p-6 shadow-glow sm:p-8">
              <div className="mb-6 grid grid-cols-2 rounded-md border border-line bg-coal p-1">
                <button
                  className={`rounded px-4 py-2 text-sm font-semibold transition ${
                    mode === "login" ? "bg-ember text-black" : "text-zinc-500 hover:text-zinc-200"
                  }`}
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setErrors({});
                    setServerError("");
                  }}
                >
                  Logowanie
                </button>
                <button
                  className={`rounded px-4 py-2 text-sm font-semibold transition ${
                    mode === "register" ? "bg-ember text-black" : "text-zinc-500 hover:text-zinc-200"
                  }`}
                  type="button"
                  onClick={() => {
                    setMode("register");
                    setErrors({});
                    setServerError("");
                  }}
                >
                  Rejestracja
                </button>
              </div>

              <form className="space-y-5" onSubmit={handleSubmit}>
                {mode === "register" ? (
                  <Field label="Nazwa profilu" error={errors.name}>
                    <div className="relative">
                      <UserRound className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
                      <input
                        className={`${inputClass} pl-10`}
                        value={form.name}
                        onChange={(event) => updateField("name", event.target.value)}
                        placeholder="Np. Jakub"
                      />
                    </div>
                  </Field>
                ) : null}

                <Field label="E-mail" error={errors.email}>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
                    <input
                      className={`${inputClass} pl-10`}
                      type="email"
                      value={form.email}
                      onChange={(event) => updateField("email", event.target.value)}
                      placeholder="demo@forgefit.app"
                    />
                  </div>
                </Field>

                <Field label="Hasło" error={errors.password}>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
                    <input
                      className={`${inputClass} pl-10`}
                      type="password"
                      value={form.password}
                      onChange={(event) => updateField("password", event.target.value)}
                      placeholder="Minimum 6 znaków"
                    />
                  </div>
                </Field>

                {serverError ? <p className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{serverError}</p> : null}

                <button
                  className="flex w-full items-center justify-center gap-2 rounded-md bg-ember px-4 py-3 text-sm font-bold text-black transition hover:bg-amberline disabled:cursor-not-allowed disabled:opacity-60"
                  type="submit"
                  disabled={submitting}
                >
                  {submitting ? "Łączenie..." : mode === "login" ? "Wejdź do panelu" : "Utwórz konto"}
                  <ArrowRight size={18} />
                </button>
              </form>
            </div>
          </div>
        </section>

        <aside className="hidden min-h-screen border-l border-line bg-coal/80 px-10 py-12 lg:flex lg:flex-col lg:justify-between">
          <div className="max-w-xl">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-ember">Premium fitness SaaS</p>
            <h1 className="mt-5 text-5xl font-semibold leading-tight text-zinc-50">
              Siła, plan i pomiary w jednym panelu.
            </h1>
            <p className="mt-5 text-base leading-7 text-zinc-400">
              Dzienny plan, historia wyników i parametry ciała są zszyte w jeden rytm pracy. Bez backendu, bez rozproszenia, gotowe do dalszej rozbudowy.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {[
              ["5x5", "Plan na dziś"],
              ["92.5 kg", "Ostatni bench"],
              ["-1.9 kg", "Zmiana masy"],
            ].map(([value, label]) => (
              <div key={label} className="rounded-lg border border-line bg-graphite p-5">
                <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-md bg-ember text-black">
                  <Activity size={18} />
                </div>
                <p className="text-2xl font-semibold">{value}</p>
                <p className="mt-1 text-sm text-zinc-500">{label}</p>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </main>
  );
}
