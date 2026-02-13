'use client';
import { useState, useRef, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FiPlay, FiPause, FiVolume2, FiVolumeX, FiMaximize, FiDownload, FiX, FiSettings } from 'react-icons/fi';
import { getCloudinaryVideo } from '../../utils/cloudinary';
import { format } from '@cloudinary/url-gen/actions/delivery';
import { useLanguage } from '../../context/LanguageContext';

const VideoPlayer = ({ query = '' }) => {
    const { t } = useLanguage();
    const [playingIndex, setPlayingIndex] = useState(null);
    const [progress, setProgress] = useState<Record<number, { current: number, duration: number, percent: number }>>({});
    const [volumes, setVolumes] = useState<Record<number, { level: number; muted: boolean }>>({}); // Volume per video { level: 1, muted: false }
    const videoRefs = useRef<HTMLVideoElement[]>([]);
    const containerRefs = useRef<HTMLDivElement[]>([]);

    // List of video filenames from Cloudinary
    const videoList = [
        { id: 'La_creadora_de_la_grasa_yrci3z', title: 'La Creadora de la Grasa' },
        { id: 'Shura_descuido_v2syi0', title: 'Shura Descuido' },
        { id: 'vod-2363747114-offset-2196_bnqebg', title: 'Vod Offset 2196' },
        { id: 'video-1080_jlejtp', title: 'Video 1080' }
    ];

    const videos = useMemo(() => videoList.map((video, index) => ({
        id: index,
        src: getCloudinaryVideo(video.id),
        // Create a download URL that forces attachment
        downloadUrl: getCloudinaryVideo(video.id).delivery(format('mp4')).toURL() + '?fl_attachment',
        title: video.title
    })), []);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return videos;
        return videos.filter(v =>
            v.title.toLowerCase().includes(q)
        );
    }, [videos, query]);

    // Helper to format time
    const formatTime = (time) => {
        if (isNaN(time)) return "0:00";
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds} `;
    };

    const togglePlay = (index) => {
        const video = videoRefs.current[index];
        if (!video) return;

        if (playingIndex === index && !video.paused) {
            video.pause();
            setPlayingIndex(null); // Just pause UI update
        } else {
            // Pause others
            if (playingIndex !== null && playingIndex !== index) {
                videoRefs.current[playingIndex]?.pause();
            }
            video.play()
                .then(() => setPlayingIndex(index))
                .catch(err => console.error("Error playing:", err));
        }
    };

    const handleTimeUpdate = (index) => {
        const video = videoRefs.current[index];
        if (video) {
            const current = video.currentTime;
            const duration = video.duration || 1;
            const percent = (current / duration) * 100;
            setProgress(prev => ({
                ...prev,
                [index]: { current, duration, percent }
            }));
        }
    };

    const handleSeek = (index, e) => {
        const video = videoRefs.current[index];
        const newTime = (e.target.value / 100) * (video.duration || 0);
        video.currentTime = newTime;
    };

    const handleVolumeChange = (index, e) => {
        const newVolume = parseFloat(e.target.value);
        const video = videoRefs.current[index];
        video.volume = newVolume;
        video.muted = newVolume === 0;

        setVolumes(prev => ({
            ...prev,
            [index]: { level: newVolume, muted: newVolume === 0 }
        }));
    };

    const toggleMute = (index) => {
        const video = videoRefs.current[index];
        const currentVol = volumes[index] || { level: 1, muted: false };

        if (currentVol.muted) {
            video.muted = false;
            video.volume = currentVol.level || 1;
            setVolumes(prev => ({
                ...prev,
                [index]: { ...prev[index], muted: false }
            }));
        } else {
            video.muted = true;
            // Not changing level so we can restore it
            setVolumes(prev => ({
                ...prev,
                [index]: { ...prev[index], muted: true }
            }));
        }
    };

    const handleFullscreen = async (index) => {
        const container = containerRefs.current[index];
        if (container) {
            if (!document.fullscreenElement) {
                try {
                    await container.requestFullscreen();

                    if (screen.orientation && (screen.orientation as any).lock) {
                        try {
                            await (screen.orientation as any).lock('landscape');
                        } catch (err) {
                            // Ignored: orientation lock not supported or failed (expected on some devices)
                            console.log("Orientation lock not supported:", err);
                        }
                    }
                } catch (err) {
                    console.error("Fullscreen error:", err);
                }
            } else {
                document.exitFullscreen();
                if (screen.orientation && (screen.orientation as any).unlock) {
                    (screen.orientation as any).unlock();
                }
            }
        }
    };

    const [modalVideoIndex, setModalVideoIndex] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [currentQuality, setCurrentQuality] = useState('auto');
    const [videoSrc, setVideoSrc] = useState('');
    const [showControls, setShowControls] = useState(true);
    const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const modalContainerRef = useRef<HTMLDivElement>(null);

    const qualities = [
        { label: 'Auto', value: 'auto' },
        { label: '1080p', value: '1080' },
        { label: '720p', value: '720' },
        { label: '480p', value: '480' },
        { label: '360p', value: '360' },
        { label: '240p', value: '240' },
    ];

    useEffect(() => {
        if (modalVideoIndex !== null) {
            setVideoSrc(videos[modalVideoIndex].src.toURL());
            setCurrentQuality('auto');
            setShowSettings(false);
            setShowControls(true);
        }
    }, [modalVideoIndex, videos]);

    const resetControlsTimeout = () => {
        setShowControls(true);
        if (controlsTimeoutRef.current) {
            clearTimeout(controlsTimeoutRef.current);
        }
        if (modalVideoIndex !== null && playingIndex === modalVideoIndex) {
            controlsTimeoutRef.current = setTimeout(() => {
                setShowControls(false);
            }, 3000);
        }
    };

    const handleMouseMove = () => {
        resetControlsTimeout();
    };

    const handleMouseLeave = () => {
        if (modalVideoIndex !== null && playingIndex === modalVideoIndex) {
            setShowControls(false);
        }
    };

    const handleModalFullscreen = async () => {
        if (modalContainerRef.current) {
            if (!document.fullscreenElement) {
                try {
                    await modalContainerRef.current.requestFullscreen();
                } catch (err) {
                    console.error("Fullscreen error:", err);
                }
            } else {
                document.exitFullscreen();
            }
        }
    };

    // Reset timeout when play state changes
    useEffect(() => {
        if (playingIndex === modalVideoIndex) {
            resetControlsTimeout();
        } else {
            setShowControls(true);
            if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        }
    }, [playingIndex, modalVideoIndex]);


    const handleQualityChange = (quality) => {
        if (modalVideoIndex === null) return;

        const video = videoRefs.current[modalVideoIndex];
        const currentTime = video ? video.currentTime : 0;
        const wasPlaying = video ? !video.paused : false;

        setIsLoading(true);
        setCurrentQuality(quality);
        setShowSettings(false);

        let originalUrl = videos[modalVideoIndex].src.toURL();
        let newUrl = originalUrl;

        if (quality !== 'auto') {
            newUrl = originalUrl.replace(/\/upload\//, `/upload/h_${quality},c_scale/`);
        }

        setVideoSrc(newUrl);
    };

    const restoreTimeRef = useRef(0);
    const restorePlayRef = useRef(false);

    // Intecept quality change to save restore points
    const changeQuality = (q) => {
        if (modalVideoIndex === null) return;
        const video = videoRefs.current[modalVideoIndex];
        if (video) {
            restoreTimeRef.current = video.currentTime;
            restorePlayRef.current = !video.paused;
        }
        handleQualityChange(q);
    }


    // ... (videoList and videos array definition remains same)

    const openVideoModal = (index) => {
        setModalVideoIndex(index);
        setIsLoading(true);
        document.body.style.overflow = 'hidden'; // Lock scroll
        // Simulate network delay for loader
        setTimeout(() => {
            setIsLoading(false);
            // Auto play could go here if needed, via ref
            const vid = videoRefs.current[index];
            if (vid) vid.play().catch(() => { });
        }, 1500);
    };

    const closeVideoModal = () => {
        if (modalVideoIndex !== null) {
            const vid = videoRefs.current[modalVideoIndex];
            if (vid) vid.pause();
        }

        setModalVideoIndex(null);
        setPlayingIndex(null);
        document.body.style.overflow = 'unset'; // Unlock scroll
    };

    // Close on Escape
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && modalVideoIndex !== null) {
                closeVideoModal();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [modalVideoIndex]);

    const handleDownload = async (videoUrl, filename) => {
        try {
            const response = await fetch(videoUrl);
            const blob = await response.blob();

            // Try File System Access API
            if ('showSaveFilePicker' in window) {
                try {
                    const handle = await (window as any).showSaveFilePicker({
                        suggestedName: filename,
                        types: [{
                            description: 'Video File',
                            accept: { 'video/mp4': ['.mp4'] },
                        }],
                    });
                    const writable = await handle.createWritable();
                    await writable.write(blob);
                    await writable.close();
                    return; // Success
                } catch (err) {
                    if (err.name !== 'AbortError') {
                        console.error('SaveFilePicker failed:', err);
                    }
                    // Fallback if user cancels or errors (excluding abort)
                    if (err.name === 'AbortError') return;
                }
            }

            // Fallback: Blob URL
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

        } catch (error) {
            console.error("Download failed:", error);
            // Fallback: Direct Link
            const link = document.createElement('a');
            link.href = videoUrl;
            link.setAttribute('download', filename);
            link.setAttribute('target', '_blank');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const modalContent = modalVideoIndex !== null ? (
        <div
            className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-10"
            onClick={closeVideoModal}
        >
            {/* Close Button */}
            <button
                onClick={closeVideoModal}
                className={`absolute top-6 right-6 text-white/50 hover:text-white hover:bg-white/10 p-3 rounded-full transition-all duration-300 z-[120] ${showControls ? 'opacity-100' : 'opacity-0'}`}
            >
                <FiX className="w-10 h-10" />
            </button>

            <div
                ref={modalContainerRef}
                className="w-full max-w-[85vw] aspect-video relative bg-black rounded-xl shadow-2xl overflow-hidden border border-white/10 group/modal"
                onClick={e => e.stopPropagation()}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
            >
                {isLoading ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-white z-20">
                        <div className="w-16 h-16 border-4 border-[#ff00ff] border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="animate-pulse tracking-widest uppercase text-xs font-bold text-[#00ffff]">
                            {t('Cargando Experiencia') || 'LOADING EXPERIENCE...'}
                        </p>
                    </div>
                ) : null}

                <video
                    src={videoSrc || undefined}
                    className="w-full h-full object-contain"
                    // Removed controls, using custom overlay
                    ref={el => { if (el && modalVideoIndex !== null) videoRefs.current[modalVideoIndex] = el; }}
                    onTimeUpdate={() => modalVideoIndex !== null && handleTimeUpdate(modalVideoIndex)}
                    onLoadedData={() => {
                        setIsLoading(false);
                        const video = videoRefs.current[modalVideoIndex];
                        if (video && restoreTimeRef.current > 0) {
                            video.currentTime = restoreTimeRef.current;
                            restoreTimeRef.current = 0; // Reset
                            if (restorePlayRef.current) video.play().catch(() => { });
                        }
                    }}
                    onClick={() => togglePlay(modalVideoIndex)}
                    onPlay={() => setPlayingIndex(modalVideoIndex)}
                    onPause={() => setPlayingIndex(null)}
                >
                    {t('common.videoNotSupported')}
                </video>

                {/* Custom Controls Overlay (Always visible or hover) */}
                <div className={`absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent flex flex-col justify-end p-6 md:p-10 transition-opacity duration-300 ${isLoading ? 'opacity-0' : (showControls ? 'opacity-100 cursor-auto' : 'opacity-0 cursor-none')}`}>

                    {/* Big Play Button Center (if paused) */}
                    {playingIndex !== modalVideoIndex && !isLoading && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <button
                                onClick={() => togglePlay(modalVideoIndex)}
                                className="bg-primary-pink/90 text-white rounded-full p-6 transform hover:scale-110 transition-transform pointer-events-auto shadow-[0_0_30px_rgba(255,0,255,0.4)]"
                            >
                                <FiPlay className="w-12 h-12 fill-current translate-x-1" />
                            </button>
                        </div>
                    )}

                    {/* Bottom Bar */}
                    <div className="flex flex-col gap-4 transform translate-y-4 group-hover/modal:translate-y-0 transition-transform duration-300">
                        {/* Title Area */}
                        <div className="flex justify-between items-end">
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-1 drop-shadow-md">{videos[modalVideoIndex].title}</h2>
                                <p className="text-gray-400 text-sm">{t('Reproduciendo en Modo Cine') || 'Playing in Cinema Mode'}</p>
                            </div>
                            <button
                                onClick={() => handleDownload(videos[modalVideoIndex].downloadUrl, `Video_${modalVideoIndex + 1}.mp4`)}
                                className="bg-white/10 hover:bg-[#ff00ff] text-white px-4 py-2 rounded-lg backdrop-blur-md transition-colors flex items-center gap-2 text-sm font-bold border border-white/10"
                            >
                                <FiDownload />
                                <span>{t('Descargar') || 'Download'}</span>
                            </button>
                        </div>

                        {/* Progress Bar */}
                        <div className="flex items-center gap-4">
                            <span className="text-xs font-mono text-white/80 w-10 text-right">
                                {formatTime(progress[modalVideoIndex]?.current || 0)}
                            </span>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={progress[modalVideoIndex]?.percent || 0}
                                onChange={(e) => handleSeek(modalVideoIndex, e)}
                                className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#ff00ff] hover:h-3 transition-all"
                            />
                            <span className="text-xs font-mono text-white/80 w-10">
                                {formatTime(progress[modalVideoIndex]?.duration || 0)}
                            </span>
                        </div>

                        {/* Controls Row */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-6">
                                <button
                                    onClick={() => togglePlay(modalVideoIndex)}
                                    className="text-white hover:text-primary-pink transition-colors"
                                >
                                    {playingIndex === modalVideoIndex ? <FiPause className="w-8 h-8 fill-current" /> : <FiPlay className="w-8 h-8 fill-current" />}
                                </button>

                                <div className="flex items-center gap-3">
                                    <button onClick={() => toggleMute(modalVideoIndex)} className="text-white hover:text-gray-300">
                                        {(volumes[modalVideoIndex]?.muted || (volumes[modalVideoIndex]?.level === 0)) ?
                                            <FiVolumeX className="w-6 h-6" /> :
                                            <FiVolume2 className="w-6 h-6" />
                                        }
                                    </button>
                                    <input
                                        type="range"
                                        min="0"
                                        max="1"
                                        step="0.05"
                                        value={volumes[modalVideoIndex]?.muted ? 0 : (volumes[modalVideoIndex]?.level ?? 1)}
                                        onChange={(e) => handleVolumeChange(modalVideoIndex, e)}
                                        className="w-24 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-white hover:accent-primary-pink"
                                    />
                                </div>

                                {/* Quality Selector */}
                                <div className="relative">
                                    <button
                                        onClick={() => setShowSettings(!showSettings)}
                                        className="text-white hover:text-primary-pink transition-colors p-2 hover:bg-white/10 rounded-full"
                                    >
                                        <FiSettings className={`w-6 h-6 ${showSettings ? 'rotate-90 text-primary-pink' : ''} transition-all duration-300`} />
                                    </button>

                                    {/* Settings Menu */}
                                    {showSettings && (
                                        <div className="absolute bottom-full right-0 mb-4 bg-black/90 backdrop-blur-xl border border-white/10 rounded-xl p-2 min-w-[120px] shadow-2xl animate-fade-in z-50">
                                            <div className="text-xs font-bold text-gray-500 uppercase px-3 py-2 mb-1 border-b border-white/5">
                                                {t('Calidad') || 'Quality'}
                                            </div>
                                            {qualities.map((q) => (
                                                <button
                                                    key={q.value}
                                                    onClick={() => changeQuality(q.value)}
                                                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-between ${currentQuality === q.value
                                                        ? 'bg-primary-pink text-white shadow-[0_0_10px_rgba(255,0,255,0.4)]'
                                                        : 'text-gray-300 hover:bg-white/10 hover:text-white'
                                                        }`}
                                                >
                                                    <span>{q.label}</span>
                                                    {currentQuality === q.value && <div className="w-2 h-2 rounded-full bg-white ml-2" />}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                {/* Fullscreen Button */}
                                <button
                                    onClick={handleModalFullscreen}
                                    className="text-white hover:text-primary-pink transition-colors p-2 hover:bg-white/10 rounded-full"
                                >
                                    <FiMaximize className="w-6 h-6" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div >
    ) : null;

    return (
        <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map((video) => (
                    <div
                        key={video.id}
                        className="group relative overflow-hidden rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-black aspect-video transition-all duration-500 cursor-pointer"
                        onClick={() => openVideoModal(video.id)} // Click card to open modal
                    >
                        <video
                            src={video.src.toURL()}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                            muted
                            loop
                            onMouseOver={e => (e.target as HTMLVideoElement).play().catch(() => { })}
                            onMouseOut={e => { (e.target as HTMLVideoElement).pause(); (e.target as HTMLVideoElement).currentTime = 0; }}
                        />

                        {/* Overlay */}
                        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                            <div className="w-16 h-16 bg-primary-pink/90 backdrop-blur-md rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(255,0,255,0.6)] border border-white/30">
                                <FiPlay className="w-8 h-8 text-white fill-current translate-x-1" />
                            </div>
                        </div>

                        <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-black/80 to-transparent translate-y-full group-hover:translate-y-0 transition-transform">
                            <h3 className="text-white font-bold truncate">{video.title}</h3>
                        </div>
                    </div>
                ))}
            </div>

            {/* Cinema Mode Modal Portal */}
            {modalVideoIndex !== null && createPortal(modalContent, document.body)}
        </>
    );
}
export default VideoPlayer