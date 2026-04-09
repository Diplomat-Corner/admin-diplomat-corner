import { useEffect, useState, useCallback, useRef } from "react";
import { useUser } from "@clerk/nextjs";

interface AdminCheckResult {
  isAdmin: boolean;
  isLoading: boolean;
  error: string | null;
  userDetails: {
    id?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    role?: string;
  } | null;
  revalidate: () => Promise<void>;
}

// Global cache for admin status with TTL
type AdminStatusCache = {
  isAdmin: boolean;
  userDetails: AdminCheckResult["userDetails"];
  timestamp: number;
};

const CACHE_KEY = "diplomat_admin_status";
// Increase TTL to 30 minutes to reduce API calls
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes (was 2 minutes)

/** Clears cached admin status so the next check hits the API. Call before redirecting from /permission-denied when the API says the user is admin — otherwise stale `isAdmin: false` in sessionStorage causes a redirect loop with `(root)` AdminProtected. */
export function clearAdminStatusCache(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(CACHE_KEY);
  } catch (e) {
    console.error("Error clearing admin status cache:", e);
  }
}

// Try to get cached admin status from sessionStorage
const getCachedStatus = (): AdminStatusCache | null => {
  if (typeof window === "undefined") return null;

  try {
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const parsedCache = JSON.parse(cached) as AdminStatusCache;
    const now = Date.now();

    // Return null if cache is expired
    if (now - parsedCache.timestamp > CACHE_TTL) {
      return null;
    }

    return parsedCache;
  } catch (e) {
    console.error("Error reading admin status cache:", e);
    return null;
  }
};

// Save admin status to sessionStorage
const setCachedStatus = (status: AdminStatusCache): void => {
  if (typeof window === "undefined") return;

  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(status));
  } catch (e) {
    console.error("Error saving admin status cache:", e);
  }
};

export function useAdminCheck(): AdminCheckResult {
  const { user, isLoaded, isSignedIn } = useUser();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [userDetails, setUserDetails] =
    useState<AdminCheckResult["userDetails"]>(null);
  const lastCheckRef = useRef<number>(0);
  const pendingCheckRef = useRef<boolean>(false);

  // Function to check admin status
  const checkAdminStatus = useCallback(
    async (forceRefresh = false): Promise<void> => {
      // Skip if already checking or not loaded yet
      if (pendingCheckRef.current || !isLoaded) return;

      // Skip if not signed in
      if (!isSignedIn) {
        setIsLoading(false);
        setIsAdmin(false);
        return;
      }

      // Check if we should use cache
      const now = Date.now();
      // Increase minimum time between checks to 1 minute
      if (!forceRefresh && now - lastCheckRef.current < 60000) {
        // 1 minute (was 10 seconds)
        // Minimum 1 min between checks
        return;
      }

      try {
        pendingCheckRef.current = true;
        setIsLoading(true);

        // Get cached status first if not forcing refresh
        if (!forceRefresh) {
          const cachedStatus = getCachedStatus();
          if (cachedStatus) {
            console.log("[useAdminCheck] Using cached admin status");
            setIsAdmin(cachedStatus.isAdmin);
            setUserDetails(cachedStatus.userDetails);
            setIsLoading(false);
            pendingCheckRef.current = false;
            return;
          }
        }

        // Use absolute URL with the current origin to avoid URL parsing issues
        const apiUrl =
          typeof window !== "undefined"
            ? `${
                window.location.origin
              }/api/users?checkAdmin=true&_=${Date.now()}`
            : `/api/users?checkAdmin=true`;

        console.log("[useAdminCheck] Fetching admin status");
        const response = await fetch(apiUrl, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          // Ensure we don't get a cached response from the browser
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`Failed to check admin status: ${response.status}`);
        }

        const data = await response.json();

        lastCheckRef.current = now;
        setIsAdmin(!!data.isAdmin);
        setUserDetails(data.user || null);

        // Cache the result
        setCachedStatus({
          isAdmin: !!data.isAdmin,
          userDetails: data.user || null,
          timestamp: now,
        });
      } catch (err) {
        console.error("[useAdminCheck] Error checking admin status:", err);
        setError(err instanceof Error ? err.message : "Unknown error occurred");
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
        pendingCheckRef.current = false;
      }
    },
    [isLoaded, isSignedIn]
  );

  // Initial check
  useEffect(() => {
    if (isLoaded) {
      checkAdminStatus(false);
    }
  }, [isLoaded, checkAdminStatus]);

  // Periodic check every 30 minutes (was every 2 minutes)
  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    const intervalId = setInterval(() => {
      checkAdminStatus(false);
    }, CACHE_TTL);

    return () => clearInterval(intervalId);
  }, [isLoaded, isSignedIn, checkAdminStatus]);

  // Visibility change handler - only check if cache is expired
  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        // Check if the last check was more than cache TTL ago
        const now = Date.now();
        if (now - lastCheckRef.current > CACHE_TTL) {
          checkAdminStatus(false);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isLoaded, isSignedIn, checkAdminStatus]);

  // Function to force refresh admin status
  const revalidate = useCallback(async () => {
    await checkAdminStatus(true);
  }, [checkAdminStatus]);

  return { isAdmin, isLoading, error, userDetails, revalidate };
}
