/**
 * Formats a date into a human-readable string
 * @param date The date to format
 * @returns A formatted date string
 */
export const formatDate = (date: Date | string): string => {
  const dateObj = date instanceof Date ? date : new Date(date);
  return dateObj.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Calculates and formats the duration between two dates
 * @param start The start date
 * @param end The end date (defaults to current time if not provided)
 * @returns A formatted duration string (e.g., "2h 30m" or "45m")
 */
export const formatDuration = (
  start: Date | string,
  end?: Date | string | null,
): string => {
  const startDate = start instanceof Date ? start : new Date(start);
  const endDate = end
    ? end instanceof Date
      ? end
      : new Date(end)
    : new Date();

  const diff = Math.floor(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60),
  ); // Duration in minutes

  if (diff < 60) {
    return `${diff}m`;
  }

  const hours = Math.floor(diff / 60);
  const minutes = diff % 60;
  return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
};
