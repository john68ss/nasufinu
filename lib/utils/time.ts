/** "acum 12 sec", "acum 5 min", "acum 3 h". */
export function timeAgo(timestampMs: number | null | undefined, now: number): string {
  if (timestampMs == null) return "niciodată";
  const seconds = Math.max(0, Math.round((now - timestampMs) / 1000));
  if (seconds < 5) return "chiar acum";
  if (seconds < 60) return `acum ${seconds} sec`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `acum ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `acum ${hours} h`;
  return `acum ${Math.floor(hours / 24)} zile`;
}

export const DAY_MS = 86_400_000;

export function utcDayStart(timestampMs: number): number {
  return Math.floor(timestampMs / DAY_MS) * DAY_MS;
}

/** Accepts unix seconds or milliseconds. */
export function toMillis(timestamp: number): number {
  return timestamp > 1e11 ? timestamp : timestamp * 1000;
}
