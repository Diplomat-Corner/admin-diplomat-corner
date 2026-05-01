import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Gets the primary image URL for a car or house, prioritizing imageUrls array if it exists
 */
export function getPrimaryImageUrl(item: {
  imageUrl?: string;
  imageUrls?: string[];
}): string | undefined {
  if (item.imageUrls && item.imageUrls.length > 0) {
    return item.imageUrls[0];
  }
  return item.imageUrl;
}

/** Mongo `_id` over JSON: hex string or Extended JSON `{ "$oid": "..." }`. */
export function normalizeMongoId(id: unknown): string | undefined {
  if (id === null || id === undefined) return undefined;
  if (typeof id === "string" && id.length > 0) return id;
  if (
    typeof id === "object" &&
    id !== null &&
    "$oid" in id &&
    typeof (id as { $oid: unknown }).$oid === "string"
  ) {
    const oid = (id as { $oid: string }).$oid;
    return oid.length > 0 ? oid : undefined;
  }
  return undefined;
}

/** App Router dynamic segment from `useParams()` → single id string. */
export function routeSegmentToString(
  param: string | string[] | undefined
): string | undefined {
  if (param === undefined) return undefined;
  if (typeof param === "string") return param.length > 0 ? param : undefined;
  const first = param[0];
  return typeof first === "string" && first.length > 0 ? first : undefined;
}

/**
 * Single-document listing GET responses may be nested (`car`, `house`) or flat
 * (`{ success: true, ...fields }`) — unwrap to a plain record with listing fields.
 */
export function unwrapApiListingPayload(
  body: Record<string, unknown>,
  nestedKey?: string
): Record<string, unknown> | null {
  if (!body || body.success !== true) return null;
  if (nestedKey) {
    const nested = body[nestedKey];
    if (nested && typeof nested === "object" && !Array.isArray(nested)) {
      return nested as Record<string, unknown>;
    }
  }
  const omit = new Set(["success", "error", "seller", "message"]);
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(body)) {
    if (!omit.has(k)) out[k] = v;
  }
  return out;
}
