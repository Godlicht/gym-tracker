import { compareDateAsc, formatDate } from "./date.js";

export function getPlanExercises(weeklyPlan) {
  return Object.values(weeklyPlan).flatMap((day) => day.exercises ?? []);
}

export function getPlannedSeries(exercise) {
  if (Array.isArray(exercise.targetSeries) && exercise.targetSeries.length) {
    return exercise.targetSeries
      .map((set, index) => ({
        id: set.id ?? `${exercise.id ?? "target"}-${index}`,
        weight: Number(set.weight),
        reps: Number(set.reps),
      }))
      .filter((set) => Number.isFinite(set.weight) && Number.isFinite(set.reps) && set.weight >= 0 && set.reps > 0);
  }

  const setCount = Math.max(0, Number(exercise.targetSets) || 0);
  const weight = Number(exercise.targetWeight) || 0;
  const reps = Number(exercise.targetReps) || 0;

  return Array.from({ length: setCount }, (_, index) => ({
    id: `${exercise.id ?? "target"}-${index}`,
    weight,
    reps,
  })).filter((set) => set.reps > 0);
}

export function getPlannedSetCount(exercise) {
  return getPlannedSeries(exercise).length;
}

export function getPlannedTopSet(exercise) {
  return getPlannedSeries(exercise).reduce((best, set) => {
    if (!best) return set;
    if (set.weight > best.weight) return set;
    if (set.weight === best.weight && set.reps > best.reps) return set;
    return best;
  }, null);
}

export function formatPlannedSeries(exercise) {
  const series = getPlannedSeries(exercise);
  if (!series.length) return "Brak rozpisanych serii";

  return series
    .map((set, index) => {
      const weight = Number(set.weight.toFixed(1)).toLocaleString("pl-PL");
      return `Seria ${index + 1}: ${set.reps} powt. x ${weight} kg`;
    })
    .join(" · ");
}

export function getExerciseSeries(exercise) {
  if (Array.isArray(exercise.series) && exercise.series.length) {
    return exercise.series
      .map((set, index) => ({
        id: set.id ?? `${exercise.id ?? exercise.exerciseId ?? "set"}-${index}`,
        weight: Number(set.weight),
        reps: Number(set.reps),
      }))
      .filter((set) => Number.isFinite(set.weight) && Number.isFinite(set.reps) && set.weight >= 0 && set.reps > 0);
  }

  const setCount = Number(exercise.sets) || 0;
  const weight = Number(exercise.weight) || 0;
  const reps = Number(exercise.reps) || 0;

  return Array.from({ length: setCount }, (_, index) => ({
    id: `${exercise.id ?? exercise.exerciseId ?? "legacy"}-${index}`,
    weight,
    reps,
  })).filter((set) => set.reps > 0);
}

export function getExerciseVolume(exercise) {
  return getExerciseSeries(exercise).reduce((sum, set) => sum + set.weight * set.reps, 0);
}

export function getExerciseTopSet(exercise) {
  return getExerciseSeries(exercise).reduce((best, set) => {
    if (!best) return set;
    if (set.weight > best.weight) return set;
    if (set.weight === best.weight && set.reps > best.reps) return set;
    return best;
  }, null);
}

export function getExerciseSetCount(exercise) {
  return getExerciseSeries(exercise).length;
}

export function formatSetCount(exercise) {
  const count = getExerciseSetCount(exercise);
  if (count === 1) return "1 seria";
  if (count > 1 && count < 5) return `${count} serie`;
  return `${count} serii`;
}

export function formatSeriesWeights(exercise) {
  const values = getExerciseSeries(exercise).map((set) => Number(set.weight.toFixed(1)).toLocaleString("pl-PL"));
  return values.length ? values.join(" / ") : "-";
}

export function formatSeriesReps(exercise) {
  const values = getExerciseSeries(exercise).map((set) => set.reps);
  return values.length ? values.join(" / ") : "-";
}

export function flattenWorkoutResults(workouts) {
  return workouts.flatMap((workout) =>
    workout.exercises.map((exercise) => {
      const series = getExerciseSeries(exercise);
      const topSet = getExerciseTopSet(exercise) ?? { weight: 0, reps: 0 };

      return {
        ...exercise,
        series,
        sets: series.length,
        weight: topSet.weight,
        reps: topSet.reps,
        totalReps: series.reduce((sum, set) => sum + set.reps, 0),
        workoutId: workout.id,
        date: workout.date,
        dayKey: workout.dayKey,
        title: workout.title,
        volume: Number(getExerciseVolume(exercise).toFixed(1)),
      };
    }),
  );
}

export function getExerciseCatalog(data) {
  const byName = new Map();

  getPlanExercises(data.weeklyPlan).forEach((exercise) => {
    byName.set(exercise.name, exercise);
  });

  flattenWorkoutResults(data.workouts).forEach((exercise) => {
    if (!byName.has(exercise.name)) {
      byName.set(exercise.name, {
        id: exercise.exerciseId,
        name: exercise.name,
        muscle: exercise.muscle,
        targetSets: exercise.sets,
        targetReps: exercise.reps,
        targetWeight: exercise.weight,
        note: exercise.note,
      });
    }
  });

  return [...byName.values()].sort((a, b) => a.name.localeCompare(b.name, "pl"));
}

export function getProgressForExercise(workouts, exerciseName) {
  return flattenWorkoutResults(workouts)
    .filter((exercise) => exercise.name === exerciseName)
    .sort(compareDateAsc)
    .map((entry) => ({
      ...entry,
      label: formatDate(entry.date),
      e1rm: Number((entry.weight * (1 + entry.reps / 30)).toFixed(1)),
    }));
}

export function getWorkoutVolumeSeries(workouts) {
  return [...workouts]
    .sort(compareDateAsc)
    .slice(-10)
    .map((workout) => ({
      date: workout.date,
      label: formatDate(workout.date),
      volume: Number(workout.exercises.reduce((sum, exercise) => sum + getExerciseVolume(exercise), 0).toFixed(1)),
    }));
}

export function getBestResult(workouts, exerciseName) {
  const entries = getProgressForExercise(workouts, exerciseName);
  if (!entries.length) return null;
  return entries.reduce((best, entry) => {
    if (!best || entry.weight > best.weight) return entry;
    return best;
  }, null);
}

export function getTotalVolume(workouts) {
  return workouts.reduce((total, workout) => total + workout.exercises.reduce((sum, exercise) => sum + getExerciseVolume(exercise), 0), 0);
}

export function getThisMonthWorkouts(workouts, date = new Date()) {
  const month = date.toISOString().slice(0, 7);
  return workouts.filter((workout) => workout.date.startsWith(month));
}

export function getLatestBodyMetric(bodyMetrics) {
  return [...bodyMetrics].sort(compareDateAsc).at(-1) ?? null;
}

export function getBodyMetricSeries(bodyMetrics) {
  return [...bodyMetrics].sort(compareDateAsc).map((metric) => ({
    ...metric,
    label: formatDate(metric.date),
  }));
}
