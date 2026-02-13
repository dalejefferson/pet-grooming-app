/**
 * Convert a "HH:mm" (24-hour) time string to 12-hour AM/PM format.
 * e.g. "09:00" → "9:00 AM", "17:00" → "5:00 PM", "13:30" → "1:30 PM"
 */
export function formatTime12h(time: string): string {
  const [hourStr, minute] = time.split(':')
  const hour = parseInt(hourStr, 10)

  if (hour === 0) return `12:${minute} AM`
  if (hour < 12) return `${hour}:${minute} AM`
  if (hour === 12) return `12:${minute} PM`
  return `${hour - 12}:${minute} PM`
}
