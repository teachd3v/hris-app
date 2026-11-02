import type { NextConfig } from "next";

// Security header untuk semua respons dinamis (di Cloudflare, vercel.json tidak berlaku)
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(self), geolocation=(self), microphone=(), payment=()" },
  { key: "Strict-Transport-Security", value: "max-age=31536000" },
  // Hanya direktif yang tidak membatasi script/style (CSP penuh perlu nonce untuk Next.js)
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'" },
];

const nextConfig: any = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  turbopack: {},
  allowedDevOrigins: ['192.168.0.56'],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;

import('@opennextjs/cloudflare').then(m => m.initOpenNextCloudflareForDev());
