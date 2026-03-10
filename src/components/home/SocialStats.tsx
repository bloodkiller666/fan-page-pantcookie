'use client';
import { useState, useEffect } from 'react';
import { FaYoutube, FaTwitch, FaDiscord, FaTiktok, FaTwitter } from 'react-icons/fa';
import CountUp from 'react-countup';

export default function SocialStats() {
    const [subscribers, setSubscribers] = useState<number | null>(null);
    const [twitchFollowers, setTwitchFollowers] = useState<number>(3100);
    const [discordMembers, setDiscordMembers] = useState<number>(540);
    const [tiktokFollowers, setTiktokFollowers] = useState<number>(17550);
    const [twitterFollowers, setTwitterFollowers] = useState<number>(17570);

    const API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY || '';
    const CHANNEL_ID = process.env.NEXT_PUBLIC_YOUTUBE_CHANNEL_ID || '';
    const DISCORD_INVITE_CODE = "UxvGN36qhX";

    useEffect(() => {
        // YouTube Stats
        const fetchYoutubeStats = async () => {
            if (!API_KEY || !CHANNEL_ID) return;
            try {
                const res = await fetch(
                    `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${CHANNEL_ID}&key=${API_KEY}`
                );
                const data = await res.json();
                if (data.items && data.items.length > 0) {
                    const stats = data.items[0].statistics;
                    setSubscribers(parseInt(stats.subscriberCount));
                }
            } catch (e) {
                console.error("Error fetching YouTube stats:", e);
            }
        };

        // Discord Stats (Invite API)
        const fetchDiscordStats = async () => {
            try {
                const res = await fetch(`https://discord.com/api/v10/invites/${DISCORD_INVITE_CODE}?with_counts=true`);
                const data = await res.json();
                if (data.approximate_member_count) {
                    setDiscordMembers(data.approximate_member_count);
                }
            } catch (e) { console.error("Error fetching Discord stats:", e); }
        };

        // Twitch Stats (Internal API)
        const fetchTwitchStats = async () => {
            try {
                const res = await fetch('/api/twitch/stats');
                const data = await res.json();
                if (data.total) {
                    setTwitchFollowers(data.total);
                }
            } catch (e) { console.error("Error fetching Twitch stats:", e); }
        };

        fetchYoutubeStats();
        fetchDiscordStats();
        fetchTwitchStats();
    }, [API_KEY, CHANNEL_ID]);

    const stats = [
        {
            icon: <FaYoutube size={32} />,
            count: subscribers || 0,
            label: 'Suscriptores',
            color: 'text-red-600',
            bg: 'bg-red-100 dark:bg-red-900/20',
            border: 'border-red-600'
        },
        {
            icon: <FaTwitch size={32} />,
            count: twitchFollowers,
            label: 'Seguidores',
            color: 'text-purple-600',
            bg: 'bg-purple-100 dark:bg-purple-900/20',
            border: 'border-purple-600'
        },
        {
            icon: <FaDiscord size={32} />,
            count: discordMembers,
            label: 'Miembros',
            color: 'text-indigo-600',
            bg: 'bg-indigo-100 dark:bg-indigo-900/20',
            border: 'border-indigo-600'
        },
        {
            icon: <FaTiktok size={32} />,
            count: tiktokFollowers,
            label: 'Seguidores',
            color: 'text-black dark:text-white',
            bg: 'bg-gray-100 dark:bg-gray-800',
            border: 'border-gray-500'
        },
        {
            icon: <FaTwitter size={32} />,
            count: twitterFollowers,
            label: 'Seguidores',
            color: 'text-blue-400',
            bg: 'bg-blue-50 dark:bg-blue-900/20',
            border: 'border-blue-400'
        }
    ];

    return (
        <section className="py-12 bg-white dark:bg-gray-900 border-b-4 border-black">
            <div className="container mx-auto px-4">
                <div className="text-center mb-10">
                    <h2 className="text-3xl font-black uppercase italic tracking-tighter text-gray-800 dark:text-white mb-2">
                        Comunidad <span className="text-primary-pink">ShakeGang</span>
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 font-medium">
                        Creciendo juntos en todas las plataformas
                    </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {stats.map((stat, index) => (
                        <div
                            key={index}
                            className={`p-4 rounded-2xl border-2 ${stat.border} ${stat.bg} flex flex-col items-center justify-center gap-2 transition-transform hover:-translate-y-1`}
                        >
                            <div className={`${stat.color}`}>
                                {stat.icon}
                            </div>
                            <div className="text-2xl font-black text-gray-800 dark:text-white">
                                <CountUp end={stat.count} duration={2.5} separator="," />
                                {stat.count === 0 && subscribers === null && index === 0 && <span className="text-sm">...</span>}
                            </div>
                            <div className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                {stat.label}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}