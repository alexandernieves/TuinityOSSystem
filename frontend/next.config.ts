import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    // Permite que las imágenes de S3 se carguen sin restricciones
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "**.amazonaws.com",
            },
        ],
    },
    // Expone la URL del backend al browser (debe empezar con NEXT_PUBLIC_)
    env: {
        NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001",
    },
};

export default nextConfig;
