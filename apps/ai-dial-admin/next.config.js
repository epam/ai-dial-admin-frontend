const { composePlugins, withNx } = require('@nx/next');
const fs = require('fs');
const path = require('path');

let packageJson = '';

try {
  packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../../package.json'), 'utf-8'));
} catch {
  packageJson = '';
}

console.log('ALLOWED_IFRAME_ORIGINS:', process.env.ALLOWED_IFRAME_ORIGINS);
// script-src 'self' 'unsafe-inline' 'unsafe-eval' ${process.env.ALLOWED_IFRAME_ORIGINS || ''};
// frame-src 'self' ${process.env.ALLOWED_IFRAME_ORIGINS || ''};

const ContentSecurityPolicy = `
    default-src 'self';
    style-src 'self' https://cdn.jsdelivr.net 'unsafe-inline';
    img-src 'self' blob: data: https://authjs.dev ${process.env.ALLOWED_IMAGE_ORIGINS || ''};
    font-src 'self' data: https://cdn.jsdelivr.net fonts.gstatic.com;
    object-src 'none';
    base-uri 'self';
    ${process.env.NODE_ENV === 'production' ? 'upgrade-insecure-requests;' : ''}
`;

/**
 * @type {import('@nx/next/plugins/with-nx').WithNxOptions}
 **/
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/:prefix/model-deployments/:path',
        destination: '/model-servings/:path',
        permanent: true, // 308 Permanent Redirect (good for SEO)
      },
      {
        source: '/:prefix/mcp-deployments/:path',
        destination: '/mcp-containers/:path',
        permanent: true, // 308 Permanent Redirect (good for SEO)
      },

      {
        source: '/:prefix/mcp-deployments',
        destination: '/mcp-containers',
        permanent: true, // 308 Permanent Redirect (good for SEO)
      },

      {
        source: '/:prefix/interceptor-deployments/:path',
        destination: '/interceptor-containers/:path',
        permanent: true, // 308 Permanent Redirect (good for SEO)
      },

      {
        source: '/:prefix/interceptor-deployments',
        destination: '/interceptor-containers',
        permanent: true, // 308 Permanent Redirect (good for SEO)
      },

      {
        source: '/:prefix/deployment-images/:path',
        destination: '/images/:path',
        permanent: true, // 308 Permanent Redirect (good for SEO)
      },

      {
        source: '/:prefix/deployment-images',
        destination: '/images',
        permanent: true, // 308 Permanent Redirect (good for SEO)
      },
    ];
  },
  nx: {},
  experimental: {
    serverActions: {
      bodySizeLimit: '4mb',
    },
  },
  env: {
    NEXT_PUBLIC_APP_VERSION: packageJson.version,
  },
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/((?!api/v1).*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate', // Adjust as needed
          },
          // {
          //   key: 'Content-Security-Policy',
          //   value: ContentSecurityPolicy.replace(/\n/g, '').trim(),
          // },
        ],
      },
    ];
  },
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });

    return config;
  },
};

const plugins = [
  // Add more Next.js plugins to this list if needed.
  withNx,
];

module.exports = composePlugins(...plugins)(nextConfig);
