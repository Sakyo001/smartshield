import type { NextConfig } from "next";
import path from "path";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

const nextConfig = (phase: string): NextConfig => {
  return {
    // Prevent `next build` from deleting the dev server output while `next dev`
    // is running (common in monorepos with Turbo).
    distDir: phase === PHASE_DEVELOPMENT_SERVER ? ".next-dev" : ".next",
    turbopack: {
      root: path.resolve(__dirname, "../.."),
    },
    webpack: (config) => {
      config.resolve.alias = {
        ...(config.resolve.alias || {}),
        "@components": path.resolve(__dirname, "src/app/components"),
        "@lib": path.resolve(__dirname, "src/app/lib"),
        "@": path.resolve(__dirname, "src"),
      };

      return config;
    },
  };
};

export default nextConfig;
