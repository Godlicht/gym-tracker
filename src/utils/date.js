export const DAYS = [
  { key: "monday", label: "Poniedziałek", short: "Pon" },
  { key: "tuesday", label: "Wtorek", short: "Wt" },
  { key: "wednesday", label: "Środa", short: "Śr" },
  { key: "thursday", label: "Czwartek", short: "Czw" },
  { key: "friday", label: "Piątek", short: "Pt" },
  { key: "saturday", label: "Sobota", short: "Sob" },
  { key: "sunday", label: "Niedziela", short: "Nd" },
];

const dateToDayKey = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

export function getTodayKey(date = new Date()) {
  return dateToDayKey[date.getDay()];
}

export function getDayLabel(dayKey) {
  return DAYS.find((day) => day.key === dayKey)?.label ?? dayKey;
}

export function getDayShort(dayKey) {
  return DAYS.find((day) => day.key === dayKey)?.short ?? dayKey;
}

export function getDayKeyFromDate(dateValue) {
  return getTodayKey(new Date(`${dateValue}T12:00:00`));
}

export function formatDate(dateValue) {
  return new Intl.DateTimeFormat("pl-PL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${dateValue}T12:00:00`));
}

export function toInputDate(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function compareDateAsc(a, b) {
  return new Date(`${a.date}T12:00:00`) - new Date(`${b.date}T12:00:00`);
}

export function compareDateDesc(a, b) {
  return new Date(`${b.date}T12:00:00`) - new Date(`${a.date}T12:00:00`);
}
