import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
  // Prisma's query-engine binary is not auto-detected by Next.js file tracing;
  // include it explicitly so it ends up in .next/standalone/node_modules/.prisma
  outputFileTracingIncludes: {
    '/**': ['./node_modules/.prisma/**/*'],
  },
};

export default nextConfig;
