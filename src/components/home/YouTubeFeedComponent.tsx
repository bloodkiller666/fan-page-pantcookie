'use client';
import { useEffect, useRef, useState } from 'react';
import { MdOpenInNew, MdPlayArrow } from 'react-icons/md';
import { useLanguage } from '../../context/LanguageContext';
import { useScrollReveal } from '../../hooks/useScrollReveal';
import RevealTitle from '../ui/RevealTitle';

interface YouTubeVideo {
    id: string;
    title: string;
    thumbnail: string;
}

/** Latest uploads. Renders nothing at all when the API is not configured or returns no videos. */
export default function YouTubeFeedComponent() {
    const { t, language } = useLanguage();
    const [videos, setVideos] = useState<YouTubeVideo[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const rootRef = useRef<HTMLElement>(null);

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
                    setVideos(
                        data.items.slice(0, 3).map((item: { id: { videoId: string }; snippet: { title: string; thumbnails: { high: { url: string } } } }) => ({
                            id: item.id.videoId,
                            title: item.snippet.title,
                            thumbnail: item.snippet.thumbnails.high.url,
                        }))
                    );
                }
            } catch (e) {
                console.error('Error fetching YouTube videos:', e);
            } finally {
                setIsLoading(false);
            }
        };
        fetchVideos();
    }, [API_KEY, CHANNEL_ID]);

    useScrollReveal(rootRef, [language, isLoading, videos.length]);

    if (!isLoading && videos.length === 0) return null;

    return (
        <section ref={rootRef} className="bg-[var(--surface-2)] py-24 sm:py-32">
            <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
                <RevealTitle className="font-display text-[clamp(2.4rem,6.5vw,5.5rem)] font-bold uppercase leading-[0.95] tracking-[-0.02em]">
                    {t('home.latest')}
                </RevealTitle>
                <p data-reveal className="mt-5 text-lg font-medium text-[var(--muted)]">
                    {t('home.latestSub')}
                </p>

                <ul className="mt-14 grid gap-10 md:grid-cols-3">
                    {isLoading
                        ? [1, 2, 3].map((i) => (
                              <li key={i} className="aspect-video animate-pulse border-[3px] border-[var(--line)] bg-[var(--surface)]" />
                          ))
                        : videos.map((video) => (
                              <li key={video.id} data-reveal>
                                  <a
                                      href={`https://www.youtube.com/watch?v=${video.id}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="group block"
                                  >
                                      <div className="cart-shell is-interactive">
                                          <div className="cart">
                                              <div className="cart__face">
                                                  <div className="relative aspect-video overflow-hidden bg-black">
                                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                                      <img
                                                          src={video.thumbnail}
                                                          alt=""
                                                          loading="lazy"
                                                          className="h-full w-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
                                                      />
                                                      <span className="absolute bottom-3 left-3 flex h-12 w-12 items-center justify-center border-[3px] border-[var(--ink)] bg-[var(--pink)] text-[var(--ink)] shadow-[3px_3px_0_var(--ink)]">
                                                          <MdPlayArrow className="text-3xl" aria-hidden />
                                                      </span>
                                                  </div>
                                                  <div className="p-5">
                                                      <h3 className="line-clamp-2 font-display text-lg font-bold uppercase leading-tight">{video.title}</h3>
                                                      <p className="mt-3 flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wide text-[var(--pink)]">
                                                          {t('home.watch')} <MdOpenInNew aria-hidden />
                                                      </p>
                                                  </div>
                                              </div>
                                          </div>
                                      </div>
                                  </a>
                              </li>
                          ))}
                </ul>
            </div>
        </section>
    );
}
