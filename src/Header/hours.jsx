/**
 * "Open now" for the selected branch.
 *
 * The backend sends `schedule_data` as a JSON string keyed by weekday name and
 * the restaurant reducer reshapes it into `workingHours`. A branch may simply
 * have no row for today, which means closed rather than open-all-day.
 */
const DAYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

function toMinutes(value) {
  const [h, m] = String(value).split(":");
  return +h * 60 + (+m || 0);
}

export function todaysHours(branch) {
  const table = branch && branch.workingHours;
  if (!table) return null;

  const now = new Date(),
    today = table[DAYS[now.getDay()]];

  if (!today || !today.open || !today.close) return null;

  const minutes = now.getHours() * 60 + now.getMinutes(),
    open = toMinutes(today.open),
    close = toMinutes(today.close);

  // A shift that ends past midnight (09:00 → 01:00) reads as close < open, and
  // treating it as a plain range shuts the branch the moment it opens.
  const isOpen =
    close > open
      ? minutes >= open && minutes < close
      : minutes >= open || minutes < close;

  return { isOpen, open: today.open, close: today.close };
}
