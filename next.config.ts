import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // A raiz abre o site público; o painel admin fica em /painel (protegido por senha).
  async redirects() {
    return [{ source: "/", destination: "/inicio.html", permanent: false }];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
