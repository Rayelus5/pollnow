/** @type {import('next').NextConfig} */
import dotenv from 'dotenv';
dotenv.config();

const ip = process.env.IP_ADDRESS;
const nextConfig = {
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

    // Lista blanca de dominios externos
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
        port: '',
        pathname: '/**', // Permitir cualquier ruta dentro de este dominio
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**', // Permitir cualquier ruta dentro de este dominio
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'pollinations.ai',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'external-content.duckduckgo.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'duckduckgo.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.ibb.co',
        port: '',
        pathname: '/**',
      }
    ],
  },
};

// next.config.js
module.exports = {
  allowedDevOrigins: [ip],
}

export default nextConfig;