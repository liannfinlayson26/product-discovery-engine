import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep the libSQL client (and its native deps) external so Next doesn't try to
  // bundle them into the serverless functions.
  serverExternalPackages: ["@libsql/client", "libsql"],
};

export default nextConfig;
