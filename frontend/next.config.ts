import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['socket.io-client'],
};

export default nextConfig;
