'use client';
import { useEffect, useState } from 'react';
import { FaYoutube } from 'react-icons/fa';

interface Video {
  id: { videoId: string };
  snippet: {
    title: string;
    thumbnails: { high: { url: string } };
  };
}

export default function YoutubeFeedPlayer() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const API_KEY = 'AIzaSyBTsljyBnsCk-sdDTAWRH9pqdAZN2HSYiY';
  const CHANNEL_ID = 'UC9jHOiM5W_HVOIG6Jv4Ax0w';

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const res = await fetch(
          `https://www.googleapis.com/youtube/v3/search?key=${API_KEY}&channelId=${CHANNEL_ID}&part=snippet,id&order=date&maxResults=3&type=video`
        );
        const data = await res.json();
        setVideos(data.items || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchVideos();
  }, []);

  if (loading) return <div className="text-center p-10 text-gray-500 animate-pulse">CARGANDO...</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4">
      {videos.map((video) => (
        <div key={video.id.videoId} className="flex flex-col gap-2">
          <div className="relative aspect-video rounded-2xl overflow-hidden bg-zinc-900 border border-white/10 shadow-2xl">
            {playingVideo === video.id.videoId ? (
              /* REPRODUCTOR REAL DENTRO DE TU WEB */
              <iframe
                src={`https://www.youtube.com/embed/${video.id.videoId}?autoplay=1&modestbranding=1&rel=0`}
                title={video.snippet.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            ) : (
              /* PREVIEW CON BOTÓN DE PLAY */
              <button 
                onClick={() => setPlayingVideo(video.id.videoId)}
                className="group w-full h-full relative"
              >
                <img 
                  src={video.snippet.thumbnails.high.url} 
                  className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-all duration-500"
                  alt="thumbnail"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-14 h-14 bg-red-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-red-600/20">
                    <div className="w-0 h-0 border-t-[8px] border-t-transparent border-l-[12px] border-l-white border-b-[8px] border-b-transparent ml-1" />
                  </div>
                </div>
              </button>
            )}
          </div>
          <h3 className="text-[10px] font-bold text-gray-300 uppercase tracking-tighter line-clamp-1 px-1">
            {video.snippet.title}
          </h3>
        </div>
      ))}
    </div>
  );
}