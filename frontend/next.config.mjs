/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'd14q55p4nerl4m.cloudfront.net' },
      { protocol: 'https', hostname: '**' },
    ],
  },
}

export default nextConfig
