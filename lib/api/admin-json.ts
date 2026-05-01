/**
 * Fetch helper for admin `/api/*` routes: throws on non-OK with server message when present.
 */
export async function adminFetchJson<T>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(input, init);
  const text = await res.text();
  let data: unknown;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(`Invalid JSON (HTTP ${res.status})`);
  }
  if (!res.ok) {
    const msg =
      typeof data === "object" &&
      data !== null &&
      "error" in data &&
      (typeof (data as { error: unknown }).error === "string" ||
        typeof (data as { error: unknown }).error === "number")
        ? String((data as { error: string | number }).error)
        : `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data as T;
}
