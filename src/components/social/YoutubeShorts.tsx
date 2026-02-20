'use client';
import { useEffect, useState } from 'react';
import { FaYoutube } from 'react-icons/fa';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, EffectCoverflow, Autoplay } from 'swiper/modules';

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-coverflow';

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

  const API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY || '';
  const CHANNEL_ID = process.env.NEXT_PUBLIC_YOUTUBE_CHANNEL_ID || '';

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
    <div className="w-full max-w-4xl mx-auto">
      <Swiper
        effect={'coverflow'}
        grabCursor={true}
        centeredSlides={true}
        slidesPerView={1}
        coverflowEffect={{
          rotate: 50,
          stretch: 0,
          depth: 100,
          modifier: 1,
          slideShadows: true,
        }}
        pagination={{ clickable: true }}
        navigation={true}
        modules={[EffectCoverflow, Pagination, Navigation, Autoplay]}
        className="mySwiper w-full py-10"
      >
        {videos.map((video) => (
          <SwiperSlide key={video.id.videoId} className="bg-transparent">
            <div className="flex flex-col gap-2 p-2">
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
              <h3 className="text-[10px] font-bold text-gray-300 uppercase tracking-tighter line-clamp-1 px-1 text-center">
                {video.snippet.title}
              </h3>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}