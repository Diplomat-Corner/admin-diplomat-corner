import { connectToDatabase } from "./db-connect";
import User from "./models/user.model";

// Admin status cache with TTL
interface AdminCacheEntry {
  isAdmin: boolean;
  timestamp: number;
}

// Cache map with clerk ID as key and cache entry as value
const adminStatusCache = new Map<string, AdminCacheEntry>();

// TTL for admin status cache (30 minutes instead of 5)
const ADMIN_CACHE_TTL = 30 * 60 * 1000;

/**
 * WARNING: Do not use this in `proxy.ts` / the request edge layer (DB + latency).
 * Check if a user has admin role
 * @param clerkId The Clerk user ID to check
 * @param forceRefresh Force a refresh of the cached status
 * @returns True if the user is an admin, false otherwise
 */
export async function isUserAdmin(
  clerkId: string,
  forceRefresh = false
): Promise<boolean> {
  if (!clerkId) return false;

  // Check if we have a cached entry that's still valid
  const cachedEntry = adminStatusCache.get(clerkId);
  const now = Date.now();

  if (
    !forceRefresh &&
    cachedEntry &&
    now - cachedEntry.timestamp < ADMIN_CACHE_TTL
  ) {
    // Use cached result if TTL hasn't expired
    return cachedEntry.isAdmin;
  }

  try {
    // Direct database access
    await connectToDatabase();
    const user = await User.findOne({ clerkId });
    const isAdmin = user?.role === "admin";

    // Cache the result with current timestamp
    adminStatusCache.set(clerkId, {
      isAdmin,
      timestamp: now,
    });

    return isAdmin;
  } catch (error) {
    console.error(`Error checking admin status for user ${clerkId}:`, error);
    return false;
  }
}

/**
 * Function that can be used in API routes to ensure admin access
 * @param clerkId The Clerk user ID to check
 * @param forceRefresh Force a refresh of the cached status
 * @param isClientSide Set to true when called from client components to use longer cache
 * @returns An object with isAdmin flag and error message if applicable
 */
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

  // Use cached result for client-side calls to prevent unnecessary DB hits
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
    // Direct database access
    await connectToDatabase();
    const user = await User.findOne({ clerkId });
    const isAdmin = user?.role === "admin";

    // Cache the result with current timestamp
    const now = Date.now();
    adminStatusCache.set(clerkId, {
      isAdmin,
      timestamp: now,
    });

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
