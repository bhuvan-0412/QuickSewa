/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compress: true,
  images: {
    unoptimized: true,
  },
  output: "export",
  basePath: "/QuickSewa",
  assetPrefix: "/QuickSewa",
  trailingSlash: true,
};

module.exports = nextConfig;
