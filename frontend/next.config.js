/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://ai-capital-app7.onrender.com',
  },
  // Force environment variables to be loaded
  publicRuntimeConfig: {
    apiUrl: process.env.NEXT_PUBLIC_API_URL || 'https://ai-capital-app7.onrender.com',
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
  // Improve diagnosability in production
  productionBrowserSourceMaps: true,
  swcMinify: false,
}

module.exports = nextConfig
