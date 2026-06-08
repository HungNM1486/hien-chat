import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["@hien-nha/shared", "@hien-nha/theme", "@hien-nha/crypto"],
};

export default nextConfig;
