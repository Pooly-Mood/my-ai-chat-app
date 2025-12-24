/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
serverComponentsExternalPackages: ['openai', 'uuid'],
  },        

};

export default nextConfig;