import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Prevent webpack from bundling packages that use native Node.js addons.
  // Without this, ws's native bufferUtil binary gets broken during bundling,
  // causing: "TypeError: bufferUtil.mask is not a function"
  // Next.js will require() these at runtime via Node.js instead.
  serverExternalPackages: ["ws", "@neondatabase/serverless"],
};

export default nextConfig;
