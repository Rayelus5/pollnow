/** @type {import('next').NextConfig} */
import dotenv from 'dotenv';
import { ALLOWED_IMAGE_HOSTS } from './src/lib/image-hosts';
dotenv.config();

const ip = process.env.IP_ADDRESS;
const nextConfig = {
  allowedDevOrigins: [ip],
  // 1. Configuración para ignorar errores en build (Ya la tenías)
  typescript: {
    ignoreBuildErrors: true,
  },
  // eslint: {
  //   ignoreDuringBuilds: true,
  // },

  experimental: {
    serverActions: {
      bodySizeLimit: '2mb', // Aumenta el límite a 1MB para permitir imágenes más grandes
    },
  },

  // 2. NUEVA CONFIGURACIÓN DE IMÁGENES
  images: {
    // Permitir SVGs (DiceBear usa SVGs)
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    formats: ['image/avif', 'image/webp'],

    // Lista blanca de dominios externos — única fuente de verdad en src/lib/image-hosts.ts
    // (compartida con ImageWithSkeleton.tsx/ResultsClient.tsx para saber cuándo NO se
    // puede optimizar una URL pegada por el usuario y hay que caer a `unoptimized`).
    remotePatterns: ALLOWED_IMAGE_HOSTS,
  },
};

export default nextConfig;