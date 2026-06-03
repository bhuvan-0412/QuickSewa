const isProd = process.env.NODE_ENV === "production";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compress: true,
  images: {
    unoptimized: true,
  },
  ...(isProd
    ? {
        output: "export",
        basePath: "/QuickSewa",
        assetPrefix: "/QuickSewa",
      }
    : {}),
  trailingSlash: true,
};

module.exports = nextConfig;
