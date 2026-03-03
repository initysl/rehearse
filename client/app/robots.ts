import type { MetadataRoute } from 'next';

const defaultSiteUrl = 'http://localhost:3000';
const appUrl = process.env.NEXT_PUBLIC_APP_URL || defaultSiteUrl;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/auth', '/console', '/dashboard'],
      },
    ],
    sitemap: `${appUrl}/sitemap.xml`,
  };
}
