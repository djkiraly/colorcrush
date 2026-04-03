import type { NextConfig } from "next";
import { execSync } from "child_process";

let gitCommitDate = new Date().toISOString();
let gitCommitHash = "unknown";
try {
  gitCommitDate = execSync("git log -1 --format=%cI").toString().trim();
  gitCommitHash = execSync("git log -1 --format=%h").toString().trim();
} catch {}

const nextConfig: NextConfig = {
  output: "standalone",
  env: {
    NEXT_PUBLIC_APP_VERSION: process.env.npm_package_version || "0.0.0",
    NEXT_PUBLIC_BUILD_DATE: gitCommitDate,
    NEXT_PUBLIC_BUILD_HASH: gitCommitHash,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "placehold.co" },
      { protocol: "https", hostname: "storage.googleapis.com" },
    ],
  },
};

export default nextConfig;
