import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ESLint during `next build` is disabled via `next build --no-lint` in package.json
  // (replaces removed `eslint.ignoreDuringBuilds` in Next.js 16+).
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.clerk.com",
        pathname: "**",
      },
      {
        protocol: "https",
        hostname: "images.clerk.dev",
        pathname: "**",
      },
      {
        protocol: "https",
        hostname: "diplomatcorner.net",
        pathname: "**",
      },
      {
        protocol: "https",
        hostname: "media-api.diplomatcorner.net",
        pathname: "**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        pathname: "**",
      },
    ],
  },
};

export default nextConfig;
