import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        // Prevent clickjacking
        { key: "X-Frame-Options", value: "DENY" },
        // Prevent MIME sniffing
        { key: "X-Content-Type-Options", value: "nosniff" },
        // Control referrer info
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        // Disable unnecessary browser features
        {
          key: "Permissions-Policy",
          value: "camera=(), microphone=(), geolocation=()",
        },
        // Force HTTPS
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
        // Content Security Policy
        {
          key: "Content-Security-Policy",
          value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' https://cdn.plaid.com",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: https:",
            "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://cdn.plaid.com https://production.plaid.com https://sandbox.plaid.com https://secure.splitwise.com",
            "frame-src https://cdn.plaid.com",
            "font-src 'self'",
            "object-src 'none'",
            "base-uri 'self'",
            "form-action 'self'",
          ].join("; "),
        },
      ],
    },
  ],
};

export default nextConfig;
