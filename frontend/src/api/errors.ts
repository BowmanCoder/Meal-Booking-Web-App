/** Collect every message string from an API error body, whatever its shape. */
function collect(value: unknown, out: string[]): void {
  if (typeof value === "string") {
    out.push(value);
  } else if (Array.isArray(value)) {
    value.forEach((item) => collect(item, out));
  } else if (value && typeof value === "object") {
    Object.values(value).forEach((item) => collect(item, out));
  }
}

/**
 * Turn an RTK Query error into one readable sentence. The API returns errors
 * in a few shapes ({detail}, {field: [..]}, {errors: {..}}, [..]); all of them
 * reduce to a list of strings.
 */
export function errorMessage(error: unknown, fallback = "Something went wrong. Please try again."): string {
  if (!error || typeof error !== "object" || !("status" in error)) return fallback;
  const { status, data } = error as { status: unknown; data?: unknown };
  if (status === "FETCH_ERROR") return "Could not reach the server. Check your connection and try again.";
  const messages: string[] = [];
  collect(data, messages);
  return messages.length > 0 ? messages.join(" ") : fallback;
}
