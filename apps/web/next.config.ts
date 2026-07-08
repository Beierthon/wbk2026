import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  cacheComponents: true,
  allowedDevOrigins: [
    "localhost",
    "127.0.0.1",
    "*.loca.lt",
    "*.ngrok-free.app",
    "*.trycloudflare.com",
  ],
  transpilePackages: ["@workspace/ui", "@workspace/domain"],
  async rewrites() {
    return {
      // Serve the Slidev SPA entry for /slides without conflicting with app routes.
      fallback: [
        { source: "/slides", destination: "/slides/index.html" },
        { source: "/slides/", destination: "/slides/index.html" },
      ],
    }
  },
}

export default nextConfig
