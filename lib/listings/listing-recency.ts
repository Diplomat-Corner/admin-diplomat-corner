/** Newest-first ordering aligned with client browse (createdAt, updatedAt, timestamp, ObjectId). */

export function listingRecencyMs(item: Record<string, unknown>): number {
  const tryParse = (v: unknown): number => {
    if (v == null) return 0;
    if (typeof v === "string" && v.trim() !== "") {
      const t = Date.parse(v);
      return Number.isNaN(t) ? 0 : t;
    }
    if (v instanceof Date) return v.getTime();
    if (typeof v === "number" && Number.isFinite(v)) return v;
    return 0;
  };
  const created = tryParse(item.createdAt);
  const updated = tryParse(item.updatedAt);
  const stamp = tryParse(item.timestamp);
  const idHex = typeof item._id === "string" ? item._id : "";
  let idTime = 0;
  if (idHex.length === 24 && /^[0-9a-fA-F]+$/.test(idHex)) {
    idTime = parseInt(idHex.slice(0, 8), 16) * 1000;
  }
  return Math.max(created, updated, stamp, idTime);
}

export function sortListingsLatestFirst<T>(list: T[]): T[] {
  return [...list].sort(
    (a, b) =>
      listingRecencyMs(b as unknown as Record<string, unknown>) -
      listingRecencyMs(a as unknown as Record<string, unknown>)
  );
}
