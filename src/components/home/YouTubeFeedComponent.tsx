'use client';
import { useState, useEffect } from 'react';
import { FiYoutube, FiExternalLink } from 'react-icons/fi';
import { gsap } from 'gsap';

interface YouTubeVideo {
    id: string;
    title: string;
    thumbnail: string;
    publishedAt: string;
}

export default function YouTubeFeedComponent() {
    const [videos, setVideos] = useState<YouTubeVideo[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY || '';
    const CHANNEL_ID = process.env.NEXT_PUBLIC_YOUTUBE_CHANNEL_ID || '';

    useEffect(() => {
        const fetchVideos = async () => {
            if (!API_KEY || !CHANNEL_ID) {
                setIsLoading(false);
                return;
            }

            try {
                const res = await fetch(
                    `https://www.googleapis.com/youtube/v3/search?key=${API_KEY}&channelId=${CHANNEL_ID}&part=snippet,id&order=date&maxResults=3&type=video`
                );
                const data = await res.json();
                
                if (data.items) {
                    const mappedVideos = data.items.map((item: any) => ({
                        id: item.id.videoId,
                        title: item.snippet.title,
                        thumbnail: item.snippet.thumbnails.high.url,
                        publishedAt: item.snippet.publishedAt
                    }));
                    setVideos(mappedVideos);
                }
            } catch (e) {
                console.error("Error fetching YouTube videos:", e);
            } finally {
                setIsLoading(false);
            }
        };

        fetchVideos();
    }, [API_KEY, CHANNEL_ID]);

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="aspect-video bg-white/5 rounded-3xl animate-pulse" />
                ))}
            </div>
        );
    }

    if (videos.length === 0) return null;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto px-4">
            {videos.map((video, index) => (
                <a
                    key={video.id}
                    href={`https://www.youtube.com/watch?v=${video.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="video-card group relative aspect-video bg-black rounded-3xl border-2 border-white/10 overflow-hidden shadow-[0_0_30px_rgba(255,0,0,0.1)] hover:shadow-[0_0_50px_rgba(255,0,0,0.3)] transition-all duration-500 hover:-translate-y-2"
                >
                    <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                    
                    <div className="absolute top-4 right-4 bg-red-600 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                        <FiYoutube className="text-white w-5 h-5" />
                    </div>

                    <div className="absolute bottom-6 left-6 right-6">
                        <h4 className="text-white font-black text-sm md:text-base leading-tight line-clamp-2 uppercase italic tracking-tight mb-2">
                            {video.title}
                        </h4>
                        <div className="flex items-center gap-2 text-red-500 text-xs font-bold uppercase tracking-widest">
                            Ver Desmadre <FiExternalLink />
                        </div>
                    </div>
                </a>
            ))}
        </div>
    );
}
