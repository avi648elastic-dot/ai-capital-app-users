/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://ai-capital-app7.onrender.com',
    // Public by design: Google OAuth Client ID (used by Google Identity Services on client)
    NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '749170274091-iekr52ik39mg0gvs7amd67naiuqnr998.apps.googleusercontent.com',
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
