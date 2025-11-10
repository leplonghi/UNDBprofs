
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },

  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: 'placehold.co', pathname: '/**' },
      { protocol: 'https', hostname: 'images.unsplash.com', pathname: '/**' },
      { protocol: 'https', hostname: 'picsum.photos', pathname: '/**' },
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com', pathname: '/**' },
      { protocol: 'https', hostname: '**.firebasestorage.app', pathname: '/**' },
      { protocol: 'https', hostname: '**.googleusercontent.com', pathname: '/**' },
    ],
  },

  // Garante compatibilidade total com App Hosting (sem campos experimentais)
  output: 'standalone',
  reactStrictMode: true,
  // Aumentar o tempo limite para ações do servidor para permitir a geração de vídeo
  serverActions: {
    bodySizeLimit: '4.5mb',
    serverActionsBodySizeLimit: '4.5mb',
  },
};

export default nextConfig;
