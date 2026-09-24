import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "enoss.degson.com" },
      { protocol: "https", hostname: "oss.degson.com" },
      { protocol: "http", hostname: "enoss.degson.com" },
      { protocol: "http", hostname: "oss.degson.com" },
      { protocol: "http", hostname: "localhost", port: "8055" },
    ],
  },
};

export default nextConfig;
