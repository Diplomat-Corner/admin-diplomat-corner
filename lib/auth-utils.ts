import { diplomatServerFetch } from "./diplomat-server";

interface AdminCacheEntry {
  isAdmin: boolean;
  timestamp: number;
}

const adminStatusCache = new Map<string, AdminCacheEntry>();
const ADMIN_CACHE_TTL = 30 * 60 * 1000;

export async function isUserAdmin(
  clerkId: string,
  forceRefresh = false
): Promise<boolean> {
  if (!clerkId) return false;

  const cachedEntry = adminStatusCache.get(clerkId);
  const now = Date.now();

  if (
    !forceRefresh &&
    cachedEntry &&
    now - cachedEntry.timestamp < ADMIN_CACHE_TTL
  ) {
    return cachedEntry.isAdmin;
  }

  try {
    const res = await diplomatServerFetch("/api/users?checkAdmin=true");
    if (!res.ok) {
      return false;
    }
    const data = (await res.json()) as { isAdmin?: boolean };
    const isAdmin = data.isAdmin === true;
    adminStatusCache.set(clerkId, { isAdmin, timestamp: now });
    return isAdmin;
  } catch (error) {
    console.error(`Error checking admin status for user ${clerkId}:`, error);
    return false;
  }
}

export async function checkAdminAccess(
  clerkId: string,
  forceRefresh = false,
  isClientSide = false
): Promise<{
  isAdmin: boolean;
  error?: string;
}> {
  if (!clerkId) {
    return {
      isAdmin: false,
      error: "Unauthorized: User not authenticated",
    };
  }

  if (isClientSide && !forceRefresh) {
    const cachedEntry = adminStatusCache.get(clerkId);
    const now = Date.now();

    if (cachedEntry && now - cachedEntry.timestamp < ADMIN_CACHE_TTL) {
      return {
        isAdmin: cachedEntry.isAdmin,
        ...(cachedEntry.isAdmin
          ? {}
          : { error: "Forbidden: Admin access required" }),
      };
    }
  }

  try {
    const res = await diplomatServerFetch("/api/users?checkAdmin=true");
    if (!res.ok) {
      return { isAdmin: false, error: "Internal server error during authorization check" };
    }
    const data = (await res.json()) as { isAdmin?: boolean };
    const isAdmin = data.isAdmin === true;
    const now = Date.now();
    adminStatusCache.set(clerkId, { isAdmin, timestamp: now });

    if (!isAdmin) {
      return {
        isAdmin: false,
        error: "Forbidden: Admin access required",
      };
    }

    return { isAdmin: true };
  } catch (error) {
    console.error(`Error in admin access check for user ${clerkId}:`, error);
    return {
      isAdmin: false,
      error: "Internal server error during authorization check",
    };
  }
}
