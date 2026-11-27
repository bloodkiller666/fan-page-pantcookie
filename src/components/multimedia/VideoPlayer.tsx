'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MdClose, MdDownload, MdFullscreen, MdPause, MdPlayArrow, MdReplay, MdVolumeOff, MdVolumeUp } from 'react-icons/md';
import { useLanguage } from '../../context/LanguageContext';
import { useScrollReveal } from '../../hooks/useScrollReveal';
import videoList from '../../data/videos.json';
import { downloadUrl, hdUrl, originalUrl, posterUrl } from '../../utils/videoUrls';

type Quality = 'hd' | 'original';
type Phase = 'loading' | 'ready' | 'buffering' | 'error';

const SLOW_AFTER_MS = 7000;

const formatTime = (time: number) => {
    if (!Number.isFinite(time)) return '0:00';
    const m = Math.floor(time / 60);
    const s = Math.floor(time % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
};

interface VideoItem {
    id: string;
    title: string;
}

/** The modal player. Mounted only while a video is open, so nothing downloads until then. */
function VideoModal({ video, onClose }: { video: VideoItem; onClose: () => void }) {
    const { t } = useLanguage();
    const containerRef = useRef<HTMLDivElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const resumeRef = useRef<{ time: number; play: boolean } | null>(null);

    const [quality, setQuality] = useState<Quality>('hd');
    const [phase, setPhase] = useState<Phase>('loading');
    const [slow, setSlow] = useState(false);
    const [playing, setPlaying] = useState(false);
    const [current, setCurrent] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [muted, setMuted] = useState(false);

    const src = quality === 'hd' ? hdUrl(video.id) : originalUrl(video.id);

    // A load that drags on gets a visible explanation and a way out, never a silent black box.
    useEffect(() => {
        if (phase === 'ready' || phase === 'error') {
            setSlow(false);
            return;
        }
        const timer = setTimeout(() => setSlow(true), SLOW_AFTER_MS);
        return () => clearTimeout(timer);
    }, [phase, src]);

    const switchQuality = useCallback((next: Quality) => {
        const el = videoRef.current;
        resumeRef.current = el ? { time: el.currentTime, play: !el.paused } : null;
        setPhase('loading');
        setQuality(next);
    }, []);

    const retry = () => {
        const el = videoRef.current;
        setPhase('loading');
        el?.load();
    };

    const togglePlay = useCallback(() => {
        const el = videoRef.current;
        if (!el) return;
        if (el.paused) el.play().catch(() => {});
        else el.pause();
    }, []);

    const toggleFullscreen = useCallback(() => {
        const box = containerRef.current;
        if (!box) return;
        if (!document.fullscreenElement) box.requestFullscreen?.().catch(() => {});
        else document.exitFullscreen?.();
    }, []);

    // Keyboard: space/k play, f fullscreen, m mute, arrows seek, Esc close
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            const el = videoRef.current;
            if (e.key === 'Escape' && !document.fullscreenElement) return onClose();
            if (!el || (e.target as HTMLElement)?.tagName === 'INPUT') return;
            if (e.key === ' ' || e.key.toLowerCase() === 'k') {
                if ((e.target as HTMLElement)?.closest('button')) return;
                e.preventDefault();
                togglePlay();
            } else if (e.key.toLowerCase() === 'f') toggleFullscreen();
            else if (e.key.toLowerCase() === 'm') setMuted((m) => !m);
            else if (e.key === 'ArrowRight') el.currentTime = Math.min(el.duration || 0, el.currentTime + 5);
            else if (e.key === 'ArrowLeft') el.currentTime = Math.max(0, el.currentTime - 5);
        };
        window.addEventListener('keydown', onKey);
        document.body.style.overflow = 'hidden';
        return () => {
            window.removeEventListener('keydown', onKey);
            document.body.style.overflow = '';
        };
    }, [onClose, togglePlay, toggleFullscreen]);

    useEffect(() => {
        const el = videoRef.current;
        if (el) {
            el.volume = volume;
            el.muted = muted;
        }
    }, [volume, muted]);

    const onLoadedData = () => {
        const el = videoRef.current;
        if (el && resumeRef.current) {
            el.currentTime = resumeRef.current.time;
            if (resumeRef.current.play) el.play().catch(() => {});
            resumeRef.current = null;
        }
    };

    const onError = () => {
        // The processed version can fail or time out; the original file is always there.
        if (quality === 'hd') {
            switchQuality('original');
        } else {
            setPhase('error');
        }
    };

    const busy = phase === 'loading' || phase === 'buffering';

    return createPortal(
        <div className="fixed inset-0 z-[12000] flex items-center justify-center overflow-y-auto bg-black/85 p-3 sm:p-8" onClick={onClose} role="dialog" aria-modal="true" aria-label={video.title}>
            <div ref={containerRef} className="w-full max-w-5xl bg-[var(--bg)] outline-none" onClick={(e) => e.stopPropagation()}>
                <div className="cart-shell">
                    <div className="cart">
                        <div className="cart__face">
                            <div className="flex items-center justify-between gap-4 border-b-[3px] border-[var(--ink)] bg-[var(--pink)] px-5 py-3 text-[var(--ink)]">
                                <h2 className="truncate font-display text-xl font-bold uppercase leading-none sm:text-2xl">{video.title}</h2>
                                <button type="button" autoFocus onClick={onClose} aria-label={t('multimedia.video.close')} className="flex h-11 w-11 shrink-0 items-center justify-center border-[3px] border-[var(--ink)] bg-[var(--yellow)]">
                                    <MdClose className="text-2xl" />
                                </button>
                            </div>

                            {/* Screen */}
                            <div className="relative aspect-video bg-black">
                                <video
                                    ref={videoRef}
                                    key={src}
                                    src={src}
                                    poster={posterUrl(video.id)}
                                    className="h-full w-full object-contain"
                                    preload="auto"
                                    playsInline
                                    autoPlay
                                    onClick={togglePlay}
                                    onLoadStart={() => setPhase('loading')}
                                    onLoadedData={onLoadedData}
                                    onCanPlay={() => setPhase('ready')}
                                    onPlaying={() => {
                                        setPhase('ready');
                                        setPlaying(true);
                                    }}
                                    onPause={() => setPlaying(false)}
                                    onWaiting={() => setPhase('buffering')}
                                    onStalled={() => setPhase((p) => (p === 'ready' ? 'buffering' : p))}
                                    onError={onError}
                                    onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
                                    onDurationChange={(e) => setDuration(e.currentTarget.duration)}
                                />

                                {busy && (
                                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/40" role="status">
                                        <span className="h-14 w-14 animate-spin border-[5px] border-[#fde0f6] border-t-[var(--pink)]" aria-hidden />
                                        <p className="score text-[0.6rem] text-[#fde0f6]">{phase === 'loading' ? t('multimedia.video.loading') : t('multimedia.video.buffering')}</p>
                                    </div>
                                )}

                                {slow && busy && (
                                    <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-center justify-center gap-3 bg-black/80 p-4 text-center" role="status">
                                        <p className="font-display text-base font-bold uppercase text-[#fde0f6]">{t('multimedia.video.slow')}</p>
                                        {quality === 'hd' && (
                                            <button type="button" onClick={() => switchQuality('original')} className="btn btn--yellow !min-h-10 !px-4 !py-2 !text-sm">
                                                {t('multimedia.video.tryOriginal')}
                                            </button>
                                        )}
                                    </div>
                                )}

                                {phase === 'error' && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-[#180917] p-6 text-center" role="alert">
                                        <p className="font-display text-2xl font-bold uppercase text-[#fde0f6]">{t('multimedia.video.error')}</p>
                                        <button type="button" onClick={retry} className="btn">
                                            <MdReplay className="text-2xl" aria-hidden />
                                            {t('multimedia.video.retry')}
                                        </button>
                                    </div>
                                )}

                                {!playing && phase === 'ready' && (
                                    <button type="button" onClick={togglePlay} aria-label={t('multimedia.video.play')} className="absolute inset-0 flex items-center justify-center">
                                        <span className="flex h-20 w-20 items-center justify-center border-[3px] border-[var(--ink)] bg-[var(--pink)] text-[var(--ink)] shadow-[6px_6px_0_var(--ink)]">
                                            <MdPlayArrow className="text-5xl" />
                                        </span>
                                    </button>
                                )}
                            </div>

                            {/* Controls */}
                            <div className="space-y-3 p-4 sm:p-5">
                                <div className="flex items-center gap-3">
                                    <span className="score w-12 text-right text-[0.55rem]">{formatTime(current)}</span>
                                    <input
                                        type="range"
                                        aria-label={t('multimedia.video.seek')}
                                        min={0}
                                        max={duration || 0}
                                        step={0.1}
                                        value={Math.min(current, duration || 0)}
                                        onChange={(e) => {
                                            const el = videoRef.current;
                                            if (el) el.currentTime = Number(e.target.value);
                                        }}
                                        className="h-3 flex-1 cursor-pointer accent-[var(--pink)]"
                                    />
                                    <span className="score w-12 text-[0.55rem]">{formatTime(duration)}</span>
                                </div>

                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <button type="button" onClick={togglePlay} aria-label={playing ? t('multimedia.video.pause') : t('multimedia.video.play')} className="btn !min-h-11 !px-4 !py-2">
                                            {playing ? <MdPause className="text-2xl" /> : <MdPlayArrow className="text-2xl" />}
                                        </button>
                                        <button type="button" onClick={() => setMuted((m) => !m)} aria-label={muted ? t('multimedia.video.unmute') : t('multimedia.video.mute')} className="flex h-11 w-11 items-center justify-center border-[3px] border-[var(--line)] bg-[var(--surface-2)]">
                                            {muted || volume === 0 ? <MdVolumeOff className="text-2xl" /> : <MdVolumeUp className="text-2xl" />}
                                        </button>
                                        <input
                                            type="range"
                                            aria-label={t('multimedia.video.volume')}
                                            min={0}
                                            max={1}
                                            step={0.05}
                                            value={muted ? 0 : volume}
                                            onChange={(e) => {
                                                setVolume(Number(e.target.value));
                                                setMuted(false);
                                            }}
                                            className="hidden h-2 w-24 cursor-pointer accent-[var(--cyan)] sm:block"
                                        />
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div role="group" aria-label={t('multimedia.video.quality')} className="flex border-[3px] border-[var(--line)]">
                                            {(['hd', 'original'] as const).map((q) => (
                                                <button
                                                    key={q}
                                                    type="button"
                                                    aria-pressed={quality === q}
                                                    onClick={() => quality !== q && switchQuality(q)}
                                                    className={`min-h-10 px-3 font-display text-sm font-bold uppercase ${quality === q ? 'bg-[var(--yellow)] text-[var(--ink)]' : 'bg-[var(--surface-2)]'}`}
                                                >
                                                    {q === 'hd' ? t('multimedia.video.qualityHd') : t('multimedia.video.qualityOriginal')}
                                                </button>
                                            ))}
                                        </div>
                                        <a href={downloadUrl(video.id)} download className="btn btn--ghost !min-h-11 !px-3 !py-2" aria-label={t('multimedia.video.download')} title={t('multimedia.video.download')}>
                                            <MdDownload className="text-2xl" />
                                        </a>
                                        <button type="button" onClick={toggleFullscreen} aria-label={t('multimedia.video.fullscreen')} className="btn btn--ghost !min-h-11 !px-3 !py-2">
                                            <MdFullscreen className="text-2xl" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="pins" aria-hidden />
                        </div>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}

const VideoPlayer = ({ query = '' }: { query?: string }) => {
    const { t, language } = useLanguage();
    const [openId, setOpenId] = useState<string | null>(null);
    const rootRef = useRef<HTMLUListElement>(null);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return q ? (videoList as VideoItem[]).filter((v) => v.title.toLowerCase().includes(q)) : (videoList as VideoItem[]);
    }, [query]);

    useScrollReveal(rootRef, [filtered.length, language]);

    const open = (videoItem: VideoItem) => setOpenId(videoItem.id);
    const openVideo = (videoList as VideoItem[]).find((v) => v.id === openId);

    if (filtered.length === 0) {
        return <p className="py-16 text-center font-display text-2xl font-bold uppercase text-[var(--muted)]">{t('multimedia.noResults')}</p>;
    }

    return (
        <>
            <ul ref={rootRef} className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((video) => (
                    <li key={video.id} data-reveal>
                        <button type="button" onClick={() => open(video)} className="group block w-full text-left outline-offset-8">
                            <div className="cart-shell is-interactive">
                                <div className="cart">
                                    <div className="cart__face">
                                        <div className="relative aspect-video overflow-hidden bg-[var(--ink)]">
                                            {/* A still frame instead of a <video>: nothing streams until the visitor presses play. */}
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={posterUrl(video.id)} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105" />
                                            <span className="absolute bottom-3 left-3 flex h-12 w-12 items-center justify-center border-[3px] border-[var(--ink)] bg-[var(--pink)] text-[var(--ink)] shadow-[3px_3px_0_var(--ink)]" aria-hidden>
                                                <MdPlayArrow className="text-3xl" />
                                            </span>
                                        </div>
                                        <h3 className="line-clamp-2 px-5 py-4 font-display text-lg font-bold uppercase leading-tight">{video.title}</h3>
                                        <div className="pins" aria-hidden />
                                    </div>
                                </div>
                            </div>
                        </button>
                    </li>
                ))}
            </ul>

            {openVideo && <VideoModal video={openVideo} onClose={() => setOpenId(null)} />}
        </>
    );
};

export default VideoPlayer;
