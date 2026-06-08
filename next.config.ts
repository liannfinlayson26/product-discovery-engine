import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // better-sqlite3 is a native module: keep it external so Next doesn't bundle
  // the .node binary (which would break loading it on serverless).
  serverExternalPackages: ["better-sqlite3"],
};

export default nextConfig;
