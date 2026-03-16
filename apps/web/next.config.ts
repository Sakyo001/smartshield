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
  };
};

export default nextConfig;
