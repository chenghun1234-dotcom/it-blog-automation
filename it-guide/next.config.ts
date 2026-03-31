import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    '/posts': ['./src/posts/**/*'],
    '/posts/[slug]': ['./src/posts/**/*'],
  },
};

export default nextConfig;
