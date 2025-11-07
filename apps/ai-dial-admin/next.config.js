const { composePlugins, withNx } = require('@nx/next');
const fs = require('fs');
const path = require('path');

let packageJson = '';

try {
  packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../../package.json'), 'utf-8'));
} catch {
  packageJson = '';
}

const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
const ContentSecurityPolicy = `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https:;
    style-src 'self' https://cdn.jsdelivr.net 'unsafe-inline';
    img-src 'self' blob: data: https://authjs.dev;
    font-src 'self' data: https://cdn.jsdelivr.net fonts.gstatic.com;
    frame-src 'self';
    object-src 'none';
    base-uri 'self';
    ${process.env.NODE_ENV === 'production' ? 'upgrade-insecure-requests;' : ''}
    frame-ancestors ${process.env.ALLOWED_FRAME_ANCESTORS ?? "'none'"};
`;

    // script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https: http: ${
    //   process.env.NODE_ENV === 'production' ? '' : `'unsafe-eval'`
    // };
    // frame-ancestors ${process.env.ALLOWED_FRAME_ANCESTORS ?? "'none'"};
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
          {
            key: 'Content-Security-Policy',
            value: ContentSecurityPolicy.replace(/\n/g, '').trim(),
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
