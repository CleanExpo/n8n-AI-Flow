import crypto from 'crypto';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // ESLint configuration
  eslint: {
    dirs: ['app', 'components', 'lib', 'hooks'],
    // Temporarily allow builds to complete with ESLint warnings
    // TODO: Fix all ESLint errors and set to false
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Keep TypeScript strict to catch type errors
    ignoreBuildErrors: false,
  },
  // Optimize build performance
  swcMinify: true,
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  // Optimize images
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },
  // Experimental features for better performance
  experimental: {
    optimizeCss: true,
    scrollRestoration: true,
  },
  // Webpack optimization
  webpack: (config, { isServer }) => {
    // Optimize bundle size
    config.optimization.moduleIds = 'deterministic';
    if (!isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          framework: {
            chunks: 'all',
            name: 'framework',
            test: /(?<!node_modules.*)[\\/]node_modules[\\/](react|react-dom|scheduler|prop-types|use-subscription)[\\/]/,
            priority: 40,
            enforce: true,
          },
          lib: {
            test(module) {
              return module.size() > 160000 &&
                /node_modules[/\\]/.test(module.identifier());
            },
            name(module) {
              const hash = crypto.createHash('sha1');
              hash.update(module.identifier());
              return hash.digest('hex').substring(0, 8);
            },
            priority: 30,
            minChunks: 1,
            reuseExistingChunk: true,
          },
          commons: {
            name: 'commons',
            minChunks: 2,
            priority: 20,
          },
          shared: {
            name(module, chunks) {
              const hash = crypto.createHash('sha1');
              hash.update(chunks.reduce((acc, chunk) => acc + chunk.name, ''));
              return hash.digest('hex');
            },
            priority: 10,
            minChunks: 2,
            reuseExistingChunk: true,
          },
        },
      };
    }
    return config;
  },
};

export default nextConfig;
