/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  transpilePackages: ['@launchpad/shared'],
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'https://launchpad-g3re.onrender.com'}/api/:path*`,
      },
    ]
  },
}

module.exports = nextConfig
