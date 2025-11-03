import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'placehold.co', pathname: '/**' },
      { protocol: 'https', hostname: 'images.unsplash.com', pathname: '/**' },
      { protocol: 'https', hostname: 'picsum.photos', pathname: '/**' },
      // Host que realmente serve o arquivo do Storage
      { protocol: 'https',"hostname": "firebasestorage.googleapis.com", pathname: '/**' },
      // Domínio de host específico para o projeto
      { protocol: 'https', hostname: 'studio-3759592126-ec313.firebasestorage.app', pathname: '/**' },
    ],
  },
};

export default nextConfig;
