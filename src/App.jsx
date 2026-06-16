import { useEffect, useMemo, useState } from "react";
import { AppShell } from "./components/AppShell.jsx";
import { AuthScreen } from "./components/AuthScreen.jsx";
import { BodyMetrics } from "./views/BodyMetrics.jsx";
import { Dashboard } from "./views/Dashboard.jsx";
import { ExerciseDetails } from "./views/ExerciseDetails.jsx";
import { History } from "./views/History.jsx";
import { SettingsView } from "./views/Settings.jsx";
import { TrainingPlan } from "./views/TrainingPlan.jsx";
import { compareDateDesc, getDayKeyFromDate, getTodayKey } from "./utils/date.js";
import { api } from "./utils/api.js";

function makeId(prefix) {
  if (window.crypto?.randomUUID) {
    return `${prefix}-${window.crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [appError, setAppError] = useState("");
  const [activeView, setActiveView] = useState("dashboard");
  const [selectedExerciseName, setSelectedExerciseName] = useState("");
  const todayKey = getTodayKey();

  useEffect(() => {
    let active = true;

    api.me().then((result) => {
      if (!active) return;

      if (result.ok) {
        setCurrentUser(result.user);
        setData(result.data);
      } else {
        setCurrentUser(null);
        setData(null);
      }

      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);

  const profile = useMemo(() => data?.profile ?? currentUser ?? {}, [currentUser, data]);

  function persistData(nextData) {
    api.saveData(nextData).then((result) => {
      if (!result.ok) {
        setAppError(result.message);
        return;
      }
      setAppError("");
    });
  }

  function setCurrentUserData(updater) {
    setData((current) => {
      if (!current) return current;
      const nextData = typeof updater === "function" ? updater(current) : updater;
      persistData(nextData);
      return nextData;
    });
  }

  async function handleLogin({ email, password }) {
    const result = await api.login({ email, password });
    if (!result.ok) return result;

    setCurrentUser(result.user);
    setData(result.data);
    setActiveView("dashboard");
    setSelectedExerciseName("");
    setAppError("");
    return { ok: true };
  }

  async function handleRegister({ name, email, password }) {
    const result = await api.register({ name, email, password });
    if (!result.ok) return result;

    setCurrentUser(result.user);
    setData(result.data);
    setActiveView("dashboard");
    setSelectedExerciseName("");
    setAppError("");
    return { ok: true };
  }

  async function handleLogout() {
    await api.logout();
    setCurrentUser(null);
    setData(null);
    setActiveView("dashboard");
    setSelectedExerciseName("");
    setAppError("");
  }

  function handleSetDayType(dayKey, type) {
    setCurrentUserData((current) => ({
      ...current,
      weeklyPlan: {
        ...current.weeklyPlan,
        [dayKey]: {
          ...current.weeklyPlan[dayKey],
          type,
          title: type === "training" && current.weeklyPlan[dayKey].title === "Rest day" ? "Nowy trening" : current.weeklyPlan[dayKey].title,
        },
      },
    }));
  }

  function handleUpdateDay(dayKey, values) {
    setCurrentUserData((current) => ({
      ...current,
      weeklyPlan: {
        ...current.weeklyPlan,
        [dayKey]: {
          ...current.weeklyPlan[dayKey],
          ...values,
        },
      },
    }));
  }

  function handleAddExercise(dayKey, exercise) {
    setCurrentUserData((current) => ({
      ...current,
      weeklyPlan: {
        ...current.weeklyPlan,
        [dayKey]: {
          ...current.weeklyPlan[dayKey],
          type: "training",
          exercises: [
            ...current.weeklyPlan[dayKey].exercises,
            {
              ...exercise,
              id: makeId("ex"),
            },
          ],
        },
      },
    }));
  }

  function handleRemoveExercise(dayKey, exerciseId) {
    setCurrentUserData((current) => ({
      ...current,
      weeklyPlan: {
        ...current.weeklyPlan,
        [dayKey]: {
          ...current.weeklyPlan[dayKey],
          exercises: current.weeklyPlan[dayKey].exercises.filter((exercise) => exercise.id !== exerciseId),
        },
      },
    }));
  }

  function handleSaveResult(result) {
    setCurrentUserData((current) => {
      const dayKey = result.dayKey || getDayKeyFromDate(result.date);
      const dayPlan = current.weeklyPlan[dayKey];
      const workoutTitle = dayPlan?.type === "training" ? dayPlan.title : "Trening własny";
      const series = result.series.map((set) => ({
        weight: Number(set.weight),
        reps: Number(set.reps),
      }));
      const topSet = series.reduce((best, set) => {
        if (!best) return set;
        if (set.weight > best.weight) return set;
        if (set.weight === best.weight && set.reps > best.reps) return set;
        return best;
      }, null);
      const entry = {
        id: makeId("wr"),
        exerciseId: result.exercise.id,
        name: result.exercise.name,
        muscle: result.exercise.muscle ?? "Inne",
        weight: topSet?.weight ?? 0,
        reps: topSet?.reps ?? 0,
        sets: series.length,
        series,
        note: result.note,
      };

      const existingIndex = current.workouts.findIndex((workout) => workout.date === result.date && workout.dayKey === dayKey && workout.title === workoutTitle);
      let workouts;

      if (existingIndex >= 0) {
        workouts = current.workouts.map((workout, index) =>
          index === existingIndex
            ? {
                ...workout,
                exercises: [...workout.exercises, entry],
              }
            : workout,
        );
      } else {
        workouts = [
          {
            id: makeId("w"),
            date: result.date,
            dayKey,
            title: workoutTitle,
            exercises: [entry],
          },
          ...current.workouts,
        ];
      }

      return {
        ...current,
        workouts: workouts.sort(compareDateDesc),
      };
    });
  }

  function handleAddBodyMetric(metric) {
    setCurrentUserData((current) => ({
      ...current,
      bodyMetrics: [{ ...metric, id: makeId("bm") }, ...current.bodyMetrics].sort(compareDateDesc),
    }));
  }

  async function handleUpdateProfile(nextProfile) {
    if (!data) return { ok: false, message: "Brak danych profilu." };

    const previousData = data;
    const optimisticData = {
      ...data,
      profile: nextProfile,
    };

    setData(optimisticData);
    const result = await api.updateProfile(nextProfile);

    if (!result.ok) {
      setData(previousData);
      return result;
    }

    setCurrentUser(result.user);
    setData(result.data);
    setAppError("");
    return { ok: true };
  }

  function openExercise(exerciseName) {
    setSelectedExerciseName(exerciseName);
    setActiveView("exercise");
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-ink px-5 text-zinc-100">
        <div className="rounded-lg border border-line bg-graphite p-6 text-center shadow-glow">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ember">ForgeFit</p>
          <p className="mt-2 text-sm text-zinc-400">Ładowanie bezpiecznej sesji...</p>
        </div>
      </main>
    );
  }

  if (!currentUser || !data) {
    return <AuthScreen onLogin={handleLogin} onRegister={handleRegister} />;
  }

  const views = {
    dashboard: (
      <Dashboard
        data={data}
        todayKey={todayKey}
        onSaveResult={handleSaveResult}
        onOpenExercise={openExercise}
        onChangeView={setActiveView}
      />
    ),
    plan: (
      <TrainingPlan
        data={data}
        todayKey={todayKey}
        onSetDayType={handleSetDayType}
        onUpdateDay={handleUpdateDay}
        onAddExercise={handleAddExercise}
        onRemoveExercise={handleRemoveExercise}
        onOpenExercise={openExercise}
      />
    ),
    exercise: (
      <ExerciseDetails
        data={data}
        selectedExerciseName={selectedExerciseName}
        onSelectExercise={setSelectedExerciseName}
        onSaveResult={handleSaveResult}
      />
    ),
    history: <History data={data} onOpenExercise={openExercise} />,
    body: <BodyMetrics data={data} onAddBodyMetric={handleAddBodyMetric} />,
    settings: <SettingsView profile={data.profile} user={currentUser} onUpdateProfile={handleUpdateProfile} />,
  };

  return (
    <AppShell activeView={activeView} onChangeView={setActiveView} user={currentUser} profile={profile} onLogout={handleLogout}>
      {appError ? <div className="mb-5 rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{appError}</div> : null}
      {views[activeView] ?? views.dashboard}
    </AppShell>
  );
}
