import { useMemo, useState } from "react";
import { AppShell } from "./components/AppShell.jsx";
import { AuthScreen } from "./components/AuthScreen.jsx";
import { seedAppData, seedUsers } from "./data/seedData.js";
import { useLocalStorage } from "./hooks/useLocalStorage.js";
import { BodyMetrics } from "./views/BodyMetrics.jsx";
import { Dashboard } from "./views/Dashboard.jsx";
import { ExerciseDetails } from "./views/ExerciseDetails.jsx";
import { History } from "./views/History.jsx";
import { SettingsView } from "./views/Settings.jsx";
import { TrainingPlan } from "./views/TrainingPlan.jsx";
import { compareDateDesc, getDayKeyFromDate, getTodayKey } from "./utils/date.js";

function makeId(prefix) {
  if (window.crypto?.randomUUID) {
    return `${prefix}-${window.crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function App() {
  const [users, setUsers] = useLocalStorage("forgefit:users", seedUsers);
  const [session, setSession] = useLocalStorage("forgefit:session", null);
  const [data, setData] = useLocalStorage("forgefit:data", seedAppData);
  const [activeView, setActiveView] = useState("dashboard");
  const [selectedExerciseName, setSelectedExerciseName] = useState("Wyciskanie sztangi leżąc");
  const todayKey = getTodayKey();

  const currentUser = useMemo(() => users.find((user) => user.id === session?.userId), [users, session]);

  function handleLogin({ email, password }) {
    const user = users.find((candidate) => candidate.email === email && candidate.password === password);
    if (!user) {
      return { ok: false, message: "Nie znaleziono konta z takim e-mailem i hasłem." };
    }
    setSession({ userId: user.id, loggedAt: new Date().toISOString() });
    return { ok: true };
  }

  function handleRegister({ name, email, password }) {
    const exists = users.some((candidate) => candidate.email === email);
    if (exists) {
      return { ok: false, message: "Konto z tym adresem e-mail już istnieje." };
    }

    const user = {
      id: makeId("user"),
      name,
      email,
      password,
    };

    setUsers((current) => [...current, user]);
    setData((current) => ({
      ...current,
      profile: {
        ...current.profile,
        name,
        email,
      },
    }));
    setSession({ userId: user.id, loggedAt: new Date().toISOString() });
    return { ok: true };
  }

  function handleLogout() {
    setSession(null);
    setActiveView("dashboard");
  }

  function handleSetDayType(dayKey, type) {
    setData((current) => ({
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
    setData((current) => ({
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
    setData((current) => ({
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
    setData((current) => ({
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
    setData((current) => {
      const dayKey = result.dayKey || getDayKeyFromDate(result.date);
      const dayPlan = current.weeklyPlan[dayKey];
      const workoutTitle = dayPlan?.type === "training" ? dayPlan.title : "Trening własny";
      const entry = {
        id: makeId("wr"),
        exerciseId: result.exercise.id,
        name: result.exercise.name,
        muscle: result.exercise.muscle ?? "Inne",
        weight: result.weight,
        reps: result.reps,
        sets: result.sets,
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
    setData((current) => ({
      ...current,
      bodyMetrics: [{ ...metric, id: makeId("bm") }, ...current.bodyMetrics].sort(compareDateDesc),
    }));
  }

  function handleUpdateProfile(profile) {
    setData((current) => ({
      ...current,
      profile,
    }));
  }

  function openExercise(exerciseName) {
    setSelectedExerciseName(exerciseName);
    setActiveView("exercise");
  }

  if (!currentUser) {
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
    <AppShell activeView={activeView} onChangeView={setActiveView} user={currentUser} profile={data.profile} onLogout={handleLogout}>
      {views[activeView] ?? views.dashboard}
    </AppShell>
  );
}
