/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
  },
  // Keep config minimal for Vercel build stability
  output: 'standalone',
  eslint: {
    // Do not block builds on lint errors in CI
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Do not block builds on type errors in CI
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig
