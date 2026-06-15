import { compareDateAsc, formatDate } from "./date.js";

export function getPlanExercises(weeklyPlan) {
  return Object.values(weeklyPlan).flatMap((day) => day.exercises ?? []);
}

export function flattenWorkoutResults(workouts) {
  return workouts.flatMap((workout) =>
    workout.exercises.map((exercise) => ({
      ...exercise,
      workoutId: workout.id,
      date: workout.date,
      dayKey: workout.dayKey,
      title: workout.title,
      volume: Number((exercise.weight * exercise.reps * exercise.sets).toFixed(1)),
    })),
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
      volume: Number(
        workout.exercises.reduce((sum, exercise) => sum + exercise.weight * exercise.reps * exercise.sets, 0).toFixed(1),
      ),
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
  return workouts.reduce(
    (total, workout) => total + workout.exercises.reduce((sum, exercise) => sum + exercise.weight * exercise.reps * exercise.sets, 0),
    0,
  );
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
