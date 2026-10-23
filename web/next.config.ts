import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  reactStrictMode: true,
  devIndicators: false,
  agentRules: false,
};

export default nextConfig;
