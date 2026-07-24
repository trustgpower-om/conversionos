import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output: pakuje Next.js u samodovoljan server za Docker
  // (bez uticaja na Vercel deploy — Vercel ga ionako ignoriše).
  output: "standalone",
};

export default nextConfig;
