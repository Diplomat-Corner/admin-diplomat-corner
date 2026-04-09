"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import PermissionDeniedScreen from "@/components/error/permission-denied";
import { clearAdminStatusCache } from "@/lib/hooks/use-admin-check";
import { useUser } from "@clerk/nextjs";
import LoadingComponent from "@/components/ui/loading-component";

export default function PermissionDeniedPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [isChecking, setIsChecking] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const lastCheckedRef = useRef<number>(Date.now());
  const isRedirectingRef = useRef<boolean>(false);

  // Function to check admin status, with debouncing
  const checkAdminStatus = useCallback(
    async (force = false) => {
      // Don't check if already redirecting
      if (isRedirectingRef.current) return false;

      // Don't check if not authenticated
      if (!isLoaded || !isSignedIn) {
        setIsChecking(false);
        return false;
      }

      // Don't check too frequently unless forced
      const now = Date.now();
      if (!force && now - lastCheckedRef.current < 10000) {
        // 10 second minimum between checks
        return false;
      }

      try {
        console.log("[PermissionDenied] Checking admin status...");
        setIsChecking(true);

        const response = await fetch(
          `${window.location.origin}/api/users?checkAdmin=true`,
          {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            cache: "no-store",
          }
        );

        lastCheckedRef.current = now;

        if (response.ok) {
          const data = await response.json();

          // If user is now an admin, redirect to dashboard
          if (data.isAdmin) {
            console.log("[PermissionDenied] User is now admin, redirecting...");
            isRedirectingRef.current = true;
            clearAdminStatusCache();
            window.location.replace("/");
            return true;
          }
        }
        return false;
      } catch (error) {
        console.error("[PermissionDenied] Error checking admin status:", error);
        return false;
      } finally {
        setIsChecking(false);
      }
    },
    [isLoaded, isSignedIn]
  );

  // Check on initial load
  useEffect(() => {
    checkAdminStatus(true);
  }, [checkAdminStatus]);

  // Check when retryCount changes (manual retry)
  useEffect(() => {
    if (retryCount > 0) {
      checkAdminStatus(true);
    }
  }, [retryCount, checkAdminStatus]);

  // Set up interval to check every minute (but not too frequently)
  useEffect(() => {
    const intervalId = setInterval(() => {
      checkAdminStatus();
    }, 60 * 1000); // Check every minute

    return () => clearInterval(intervalId);
  }, [checkAdminStatus]);

  // Handle visibility change - check when tab becomes visible again
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkAdminStatus();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [checkAdminStatus]);

  const handleManualRetry = () => {
    setRetryCount((prev) => prev + 1);
  };

  // Showing loading state only during initial check
  if (isChecking && retryCount === 0) {
    return <LoadingComponent />;
  }

  return (
    <PermissionDeniedScreen
      title="Admin Access Required"
      message="You do not have permission to access the admin dashboard. Please contact the administrator if you believe this is an error. The system will automatically check for permission changes every minute."
      showHomeButton={true}
      showBackButton={true}
      onRetry={handleManualRetry}
    />
  );
}
