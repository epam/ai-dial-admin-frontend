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

/** @type {import('next').NextConfig} */
const nextConfig = {
  // NX sets NX_NEXT_OUTPUT_PATH during build; replicates withNx distDir logic without the deprecated wrapper.
  distDir: process.env.NX_NEXT_OUTPUT_PATH ? path.join('../../', process.env.NX_NEXT_OUTPUT_PATH, '.next') : '.next',
  async redirects() {
    return [
      // The per-type publication pages were merged into the single Approvals pages; a detail
      // redirect carries the type as a query param (the original `?path=` is preserved).
      ...Object.entries({
        application: 'APPLICATION',
        toolset: 'TOOL_SET',
        prompt: 'PROMPT',
        file: 'FILE',
        conversation: 'CONVERSATION',
        skill: 'SKILL',
      }).flatMap(([slug, type]) => [
        { source: `/:prefix/${slug}-publications`, destination: '/publications', permanent: true },
        {
          source: `/:prefix/${slug}-publications/:id`,
          destination: `/publications/:id?type=${type}`,
          permanent: true,
        },
      ]),
      {
        source: '/:prefix/model-deployments/:path',
        destination: '/model-servings/:path',
        permanent: true, // 308 Permanent Redirect (good for SEO)
      },
      // `*-deployments` are the oldest names; they go straight to the unified Containers pages.
      ...['mcp', 'interceptor'].flatMap((slug) => [
        {
          source: `/:prefix/${slug}-deployments/:path`,
          destination: '/containers/:path',
          permanent: true, // 308 Permanent Redirect (good for SEO)
        },
        {
          source: `/:prefix/${slug}-deployments`,
          destination: '/containers',
          permanent: true, // 308 Permanent Redirect (good for SEO)
        },
      ]),
      // The per-type container pages were merged into the single Containers pages. `:path*` carries
      // the container id and the audit detail segment (`/{id}/{activityId}`).
      ...['adapter', 'application', 'interceptor', 'mcp'].flatMap((slug) => [
        {
          source: `/:prefix/${slug}-containers/:path*`,
          destination: '/containers/:path*',
          permanent: true,
        },
        { source: `/:prefix/${slug}-containers`, destination: '/containers', permanent: true },
      ]),
    ];
  },
  transpilePackages: ['@epam/ai-dial-ui-kit', '@epam/ai-dial-react-file-manager'],
  experimental: {
    serverActions: {
      bodySizeLimit: '64mb',
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

module.exports = nextConfig;
