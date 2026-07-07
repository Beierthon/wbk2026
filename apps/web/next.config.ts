import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "localhost",
    "127.0.0.1",
    "*.loca.lt",
    "*.ngrok-free.app",
    "*.trycloudflare.com",
  ],
  transpilePackages: ["@workspace/ui", "@workspace/domain"],
}

export default nextConfig
