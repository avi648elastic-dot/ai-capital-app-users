/**
 * 🚀 NEXT.JS PERFORMANCE CONFIGURATION
 * Optimizes bundle size, loading performance, and runtime efficiency
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Performance optimizations
  swcMinify: true, // Use SWC for faster minification
  compress: true, // Enable gzip compression
  
  // Bundle optimization
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Optimize bundle splitting
    config.optimization.splitChunks = {
      chunks: 'all',
      cacheGroups: {
        // Separate vendor chunks for better caching
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
          priority: 10,
        },
        // Separate React chunks
        react: {
          test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
          name: 'react',
          chunks: 'all',
          priority: 20,
        },
        // Separate UI library chunks
        ui: {
          test: /[\\/]node_modules[\\/](lucide-react|@headlessui)[\\/]/,
          name: 'ui',
          chunks: 'all',
          priority: 15,
        },
        // Common chunks for shared code
        common: {
          name: 'common',
          minChunks: 2,
          chunks: 'all',
          priority: 5,
          reuseExistingChunk: true,
        },
      },
    };

    // Tree shaking optimization
    config.optimization.usedExports = true;
    config.optimization.sideEffects = false;

    // Module resolution optimization
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').resolve(__dirname, '.'),
      '@/components': require('path').resolve(__dirname, 'components'),
      '@/lib': require('path').resolve(__dirname, 'lib'),
      '@/contexts': require('path').resolve(__dirname, 'contexts'),
      '@/hooks': require('path').resolve(__dirname, 'hooks'),
      '@/utils': require('path').resolve(__dirname, 'utils'),
    };

    // Bundle analyzer (only in development)
    if (process.env.ANALYZE === 'true') {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'server',
          analyzerPort: isServer ? 8888 : 8889,
          openAnalyzer: true,
        })
      );
    }

    return config;
  },

  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    domains: ['localhost'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },

  // Experimental features for performance
  experimental: {
    // optimizeCss: true, // Disabled - causes critters module error in Next.js 15
    optimizePackageImports: ['lucide-react', '@headlessui/react'],
  },

  // Headers for performance
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=300, s-maxage=600', // 5 min browser, 10 min CDN
          },
        ],
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable', // 1 year
          },
        ],
      },
    ];
  },

  // Redirects for SEO and performance
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/dashboard',
        permanent: true,
      },
    ];
  },

  // Rewrites for API optimization (removed Stripe proxy - using direct calls)
  async rewrites() {
    return [];
  },

  // Environment variables
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://ai-capital-app7.onrender.com',
    NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '749170274091-iekr52ik39mg0gvs7amd67naiuqnr998.apps.googleusercontent.com',
  },

  // Output configuration (standalone mode disabled for Vercel)
  // output: 'standalone',
  
  // ESLint configuration
  eslint: {
    ignoreDuringBuilds: true,
  },

  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: false,
  },

  // Skip legacy error page generation
  skipTrailingSlashRedirect: true,
  skipMiddlewareUrlNormalize: true,

  // Performance monitoring
  poweredByHeader: false,
  generateEtags: false,
};

module.exports = nextConfig;