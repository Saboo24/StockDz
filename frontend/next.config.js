/** @type {import('next').NextConfig} */

const nextConfig = {
  reactStrictMode: true,

  experimental: {
    optimizePackageImports: ["lucide-react"],
  },

  output: 'export',

  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig