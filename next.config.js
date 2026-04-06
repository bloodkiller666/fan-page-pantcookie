/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,

    eslint: {
        ignoreDuringBuilds: true,
    },
    typescript: {
        ignoreBuildErrors: true,
    },

    async headers() {
        return [
            {
                source: '/:path*',
                headers: [
                    {
                        key: 'Content-Security-Policy',
                        value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' blob: data: https://res.cloudinary.com https://ik.imagekit.io https://*.r2.dev https://lh3.googleusercontent.com https://www.google.com https://*.firebaseapp.com https://*.firebasestorage.app https://www.transparenttextures.com https://*.ytimg.com https://*.ggpht.com https://images.unsplash.com https://*.unsplash.com https://placehold.co https://*.placehold.co https://cdn.jsdelivr.net https://img.freepik.com; media-src 'self' blob: data: https://res.cloudinary.com https://*.r2.dev https://*.firebasestorage.app https://www.youtube.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self' ws: wss: https://api.groq.com https://*.cloudinary.com https://*.supabase.co https://*.firebaseio.com https://firestore.googleapis.com https://*.firebaseapp.com https://*.firebasestorage.app https://*.googleapis.com https://discord.com https://*.twitch.tv; frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://player.twitch.tv https://www.facebook.com https://*.google.com https://*.supabase.co;",
                    },
                    {
                        key: 'X-Frame-Options',
                        value: 'SAMEORIGIN',
                    },
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff',
                    },
                    {
                        key: 'Referrer-Policy',
                        value: 'strict-origin-when-cross-origin',
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
            { protocol: 'https', hostname: 'res.cloudinary.com' },
            { protocol: 'https', hostname: 'ik.imagekit.io' },
            { protocol: 'https', hostname: 'pub-0ef08802741a422c9c654724deba61f7.r2.dev' },
            { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
            { protocol: 'https', hostname: 'pub-bdbaaa8e6a3e405c965b621a6503229c.r2.dev' },
            { protocol: 'https', hostname: 'www.google.com' },
            { protocol: 'https', hostname: 'pantcookie-fanpage.firebasestorage.app' },
            { protocol: 'https', hostname: 'www.transparenttextures.com' },
            { protocol: 'https', hostname: 'images.unsplash.com' },
            { protocol: 'https', hostname: '**.unsplash.com' },
            { protocol: 'https', hostname: 'placehold.co' },
            { protocol: 'https', hostname: '**.placehold.co' },
        ],
    },

    webpack: (config, { isServer }) => {
        if (!isServer) {
            config.resolve.fallback = {
                ...config.resolve.fallback,
                fs: false,
                net: false,
                tls: false,
            };
        }
        return config;
    },
};

export default nextConfig;