import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Define the routes that should be accessible without authentication
const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/permission-denied(.*)",
]);

// Define admin-only routes
const isAdminRoute = createRouteMatcher([
  "/", // Dashboard home
  "/products(.*)",
  "/payments(.*)",
  "/statistics(.*)",
  "/advertisements(.*)",
  "/messages(.*)",
  // Add other admin routes as needed
]);

// Next.js 16+: `proxy.ts` replaces `middleware.ts` (same Clerk default export pattern).
export default clerkMiddleware(async (auth, req) => {
  // Do not run Clerk for `/api` proxy route handlers. Combining Clerk middleware
  // (rewrites) with the App Router BFF that `fetch`es `DIPLOMAT_API` can error or loop
  // (e.g. "NextResponse.rewrite() was used in a app route handler") on long requests.
  if (req.nextUrl.pathname.startsWith("/api")) {
    return NextResponse.next();
  }
  try {
    const { userId } = await auth();
    const pathname = req.nextUrl.pathname;

    console.log(
      `Proxy processing path: ${pathname}, userId: ${userId || "none"}`
    );

    if (userId && pathname.startsWith("/sign-in")) {
      const homeUrl = new URL("/", req.url);
      console.log(`Redirecting signed-in user from sign-in to home`);
      return NextResponse.redirect(homeUrl);
    }

    if (!isPublicRoute(req) && !userId) {
      console.log(`Unauthenticated access to protected route: ${pathname}`);
      const signInUrl = new URL("/sign-in", req.url);
      signInUrl.searchParams.set("redirect_url", req.url);
      return NextResponse.redirect(signInUrl);
    }

    if (userId && isAdminRoute(req)) {
      console.log(`User ${userId} accessing admin route: ${pathname}`);
    }

    return NextResponse.next();
  } catch (error) {
    console.error("Proxy error:", error);
    if (req.nextUrl.pathname.startsWith("/api")) {
      return NextResponse.json(
        {
          error: "Proxy error",
          details: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 }
      );
    }
    return NextResponse.next();
  }
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
