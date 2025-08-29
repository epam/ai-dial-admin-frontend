const { composePlugins, withNx } = require('@nx/next');
const fs = require('fs');
const path = require('path');

let packageJson = '';

try {
  packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../../package.json'), 'utf-8'));
} catch {
  packageJson = '';
}

/**
 * @type {import('@nx/next/plugins/with-nx').WithNxOptions}
 **/
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/:prefix/publications-file',
        destination: '/file-publications',
        permanent: true, // 308 Permanent Redirect (good for SEO)
      },
      {
        source: '/:prefix/publications-prompt',
        destination: '/prompt-publications',
        permanent: true, // 308 Permanent Redirect (good for SEO)
      },
    ];
  },
  nx: {
    // Set this to true if you would like to use SVGR
    // See: https://github.com/gregberge/svgr
    svgr: false,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '15mb',
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
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate', // Adjust as needed
          },
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
