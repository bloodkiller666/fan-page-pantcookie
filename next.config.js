/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    turbopack: {},

    // Security Headers
    async headers() {
        return [
            {
                source: '/:path*',
                headers: [
                    {
                        key: 'Content-Security-Policy',
                        value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' blob: data: https://res.cloudinary.com https://ik.imagekit.io https://*.r2.dev https://lh3.googleusercontent.com https://www.google.com https://*.firebaseapp.com https://*.firebasestorage.app https://www.transparenttextures.com https://*.ytimg.com https://*.ggpht.com; media-src 'self' blob: data: https://res.cloudinary.com https://*.r2.dev https://*.firebasestorage.app https://www.youtube.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self' ws: wss: https://api.groq.com https://*.cloudinary.com https://*.supabase.co https://*.firebaseio.com https://firestore.googleapis.com https://*.firebaseapp.com https://*.firebasestorage.app https://*.googleapis.com https://discord.com https://*.twitch.tv; frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://player.twitch.tv; worker-src 'self' blob:; frame-ancestors 'none'; upgrade-insecure-requests;",
                    },
                    {
                        key: 'X-Frame-Options',
                        value: 'DENY',
                    },
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff',
                    },
                    {
                        key: 'Referrer-Policy',
                        value: 'origin-when-cross-origin',
                    },
                    {
                        key: 'Strict-Transport-Security',
                        value: 'max-age=31536000; includeSubDomains; preload',
                    },
                    {
                        key: 'Permissions-Policy',
                        value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
                    },
                ],
            },
        ];
    },

    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'res.cloudinary.com',
            },
            {
                protocol: 'https',
                hostname: 'ik.imagekit.io',
            },
            {
                protocol: 'https',
                hostname: 'pub-0ef08802741a422c9c654724deba61f7.r2.dev',
            },
            {
                protocol: 'https',
                hostname: 'lh3.googleusercontent.com',
            },
            {
                protocol: 'https',
                hostname: 'pub-bdbaaa8e6a3e405c965b621a6503229c.r2.dev',
            },
            {
                protocol: 'https',
                hostname: 'www.google.com',
            },
            {
                protocol: 'https',
                hostname: 'pantcookie-fanpage.firebasestorage.app',
            },
            {
                protocol: 'https',
                hostname: 'www.transparenttextures.com',
            },
        ],
    },
    webpack: (config, { isServer }) => {
        if (!isServer) {
            config.resolve.fallback = {
                ...config.resolve.fallback,
                fs: false,
                'react-native-fs': false,
            };
        }
        return config;
    },
};

export default nextConfig;

