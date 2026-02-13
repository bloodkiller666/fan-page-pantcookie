'use client';
import { useState, useRef, useEffect, useMemo } from 'react';
import { musicData } from '../../utils/musicData';
import { useLanguage } from '../../context/LanguageContext';
import {
    FaPlay,
    FaPause,
    FaStepBackward,
    FaStepForward,
    FaVolumeUp,
    FaVolumeMute,
    FaMusic,
    FaListUl,
    FaTimes,
    FaMicrophone,
    FaMicrophoneSlash
} from 'react-icons/fa';

const MusicPlayer = () => {
    const { t } = useLanguage();
    const [currentSongIndex, setCurrentSongIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(0.7);
    const [isMuted, setIsMuted] = useState(false);
    const [showLyrics, setShowLyrics] = useState(true);

    const [showPlaylist, setShowPlaylist] = useState(false);
    const [visualizerStyle, setVisualizerStyle] = useState(0); // 0-4 styles
    const playlistRef = useRef<HTMLDivElement>(null);
    const topRef = useRef<HTMLDivElement>(null);

    const audioRef = useRef<HTMLAudioElement>(null);
    const lyricsContainerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number>(0);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
    const bgVideoRef = useRef<HTMLVideoElement>(null);
    const vimeoRef = useRef<HTMLIFrameElement>(null);

    const getVimeoId = (url) => {
        if (!url) return null;
        const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
        return match ? match[1] : null;
    };

    const currentSong = musicData[currentSongIndex];
    const vimeoId = getVimeoId(currentSong.backgroundVideo);

    const vimeoSrc = useMemo(() => {
        if (!vimeoId) return '';
        // Only autoplay if we're actually playing music
        return `https://player.vimeo.com/video/${vimeoId}?background=1&autoplay=${isPlaying ? 1 : 0}&loop=1&muted=1&autopause=0&api=1`;
    }, [vimeoId]); // Crucial: ONLY reload if ID changes, NOT on every play/pause toggle

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = isMuted ? 0 : volume;
        }
    }, [volume, isMuted]);

    useEffect(() => {
        if (isPlaying) {
            // Audio Context Setup for Visualizer
            if (!sourceRef.current && audioRef.current) {
                const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
                analyserRef.current = audioCtx.createAnalyser();
                sourceRef.current = audioCtx.createMediaElementSource(audioRef.current);
                sourceRef.current.connect(analyserRef.current);
                analyserRef.current.connect(audioCtx.destination);
                analyserRef.current.fftSize = 256;
            }

            if (audioRef.current) {
                audioRef.current.play()
                    .then(() => drawVisualizer())
                    .catch(err => console.error("Playback failed:", err));
            }

            if (bgVideoRef.current && currentSong.backgroundVideo) {
                bgVideoRef.current.play().catch(err => console.error("Video playback failed:", err));
            }
            if (vimeoRef.current) {
                vimeoRef.current.contentWindow?.postMessage(JSON.stringify({ method: 'play' }), '*');
            }
        } else {
            audioRef.current?.pause();
            bgVideoRef.current?.pause();
            if (vimeoRef.current) {
                vimeoRef.current.contentWindow?.postMessage(JSON.stringify({ method: 'pause' }), '*');
            }
            cancelAnimationFrame(animationRef.current);
        }
    }, [isPlaying, currentSongIndex, visualizerStyle]); // Added visualizerStyle dependency

    // Scroll to playlist/top when toggled
    useEffect(() => {
        if (showPlaylist && playlistRef.current) {
            playlistRef.current.scrollIntoView({ behavior: 'smooth' });
        } else if (!showPlaylist && topRef.current) {
            topRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [showPlaylist]);

    const drawVisualizer = () => {
        if (!canvasRef.current || !analyserRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        // Check for Light Mode (naive check, usually implied by lack of dark class on document, or we use media query)
        const isDarkMode = document.documentElement.classList.contains('dark') || window.matchMedia('(prefers-color-scheme: dark)').matches;

        const colors = isDarkMode
            ? { p: '#ff00ff', s: '#00ffff' } // Pink/Cyan Neon
            : { p: '#d602d6', s: '#00b7b7' }; // Slightly darker/richer for light mode visibility

        const renderFrame = () => {
            if (!analyserRef.current) return;
            animationRef.current = requestAnimationFrame(renderFrame);
            analyserRef.current.getByteFrequencyData(dataArray);

            if (!ctx) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const w = canvas.width;
            const h = canvas.height;
            const cx = w / 2;
            const cy = h / 2;
            const barWidth = (w / bufferLength) * 2.5;

            // Style Switcher
            if (visualizerStyle === 0) {
                // 0: Classic Bars (Mirrored)
                let x = 0;
                for (let i = 0; i < bufferLength; i++) {
                    const barHeight = dataArray[i] / 2.5;
                    const gradient = ctx.createLinearGradient(0, h / 2 - barHeight, 0, h / 2 + barHeight);
                    gradient.addColorStop(0, colors.p);
                    gradient.addColorStop(0.5, colors.s);
                    gradient.addColorStop(1, colors.p);
                    ctx.fillStyle = gradient;
                    ctx.fillRect(x, h - barHeight, barWidth, barHeight); // Bottom aligned simpler
                    x += barWidth + 1;
                }
            } else if (visualizerStyle === 1) {
                // 1: Center Mirrored
                let x = 0;
                for (let i = 0; i < bufferLength; i++) {
                    const barHeight = dataArray[i] / 3;
                    ctx.fillStyle = i % 2 === 0 ? colors.p : colors.s;
                    ctx.fillRect(cx - x, cy - barHeight / 2, barWidth, barHeight);
                    ctx.fillRect(cx + x, cy - barHeight / 2, barWidth, barHeight);
                    x += barWidth + 1;
                }
            } else if (visualizerStyle === 2) {
                // 2: Waveform Line
                ctx.lineWidth = 3;
                ctx.strokeStyle = colors.s;
                ctx.beginPath();
                const sliceWidth = w / bufferLength;
                let x = 0;
                for (let i = 0; i < bufferLength; i++) {
                    const v = dataArray[i] / 128.0;
                    const y = v * h / 2;
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                    x += sliceWidth;
                }
                ctx.lineTo(w, h / 2);
                ctx.stroke();
            } else if (visualizerStyle === 3) {
                // 3: Bubbles / Circles
                for (let i = 0; i < bufferLength; i += 10) {
                    const radius = dataArray[i] / 5;
                    ctx.beginPath();
                    ctx.arc(Math.random() * w, Math.random() * h, radius, 0, 2 * Math.PI);
                    ctx.fillStyle = `rgba(${isDarkMode ? '255,0,255' : '200,0,200'}, ${dataArray[i] / 255})`;
                    ctx.fill();
                }
            } else {
                // 4: Bars Top/Down
                let x = 0;
                for (let i = 0; i < bufferLength; i++) {
                    const barHeight = dataArray[i] / 2;
                    ctx.fillStyle = colors.p;
                    ctx.fillRect(x, 0, barWidth, barHeight);
                    ctx.fillStyle = colors.s;
                    ctx.fillRect(x, h - barHeight, barWidth, barHeight);
                    x += barWidth + 1;
                }
            }

        };
        renderFrame();
    };

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
        }
    };

    const handleLoadedMetadata = () => {
        if (audioRef.current) {
            setDuration(audioRef.current.duration);
        }
    };

    const handlePlayPause = () => {
        setIsPlaying(!isPlaying);
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const time = Number(e.target.value);
        if (audioRef.current) {
            audioRef.current.currentTime = time;
        }
        setCurrentTime(time);
    };

    const handleNext = () => {
        setCurrentSongIndex((prev) => (prev + 1) % musicData.length);
        setIsPlaying(true);
    };

    const handlePrevious = () => {
        setCurrentSongIndex((prev) => (prev - 1 + musicData.length) % musicData.length);
        setIsPlaying(true);
    };

    const formatTime = (time) => {
        const mins = Math.floor(time / 60);
        const secs = Math.floor(time % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const parseTimestamp = (timestamp) => {
        if (typeof timestamp === 'number') return timestamp;
        if (typeof timestamp === 'string' && timestamp.includes(':')) {
            const [mins, secs] = timestamp.split(':').map(Number);
            return mins * 60 + secs;
        }
        return Number(timestamp) || 0;
    };

    // Lyrics logic
    const currentLyricIndex = currentSong.lyrics.findLastIndex(l => parseTimestamp(l.time) <= currentTime);

    // Auto-scroll lyrics
    // Auto-scroll lyrics - Position at top
    useEffect(() => {
        if (currentLyricIndex !== -1 && lyricsContainerRef.current) {
            const activeLyric = lyricsContainerRef.current.children[currentLyricIndex];
            if (activeLyric) {
                // Scroll the specific element to near the top (not center)
                // We leave some offset (e.g., 40px) so it's not jammed against the edge
                const container = lyricsContainerRef.current;
                const offsetTop = (activeLyric as HTMLElement).offsetTop - container.offsetTop;

                container.scrollTo({
                    top: offsetTop - 40, // 40px padding from top
                    behavior: 'smooth'
                });
            }
        }
    }, [currentLyricIndex]);

    return (
        <div ref={topRef} className="w-full max-w-7xl mx-auto bg-white/40 dark:bg-black/60 backdrop-blur-2xl rounded-3xl p-6 md:p-10 shadow-[0_0_50px_rgba(0,0,0,0.1)] dark:shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/20 dark:border-white/10 transition-all duration-500 relative overflow-hidden">
            {/* Decoration: Scanlines or Glows */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#ff00ff] to-transparent opacity-50 animate-pulse" />

            {/* Background Looping Video (Spotify Canvas Style) */}
            {currentSong.backgroundVideo && (
                <div className="absolute inset-0 z-0 overflow-hidden">
                    <div className="absolute inset-0 bg-black/40 z-10" /> {/* Backdrop to improve text readability */}
                    {vimeoId ? (
                        <div className="absolute inset-0 w-full h-full scale-[1.3] pointer-events-none">
                            <iframe
                                ref={vimeoRef}
                                src={vimeoSrc}
                                className="absolute top-1/2 left-1/2 w-full h-full -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                                frameBorder="0"
                                allow="autoplay; fullscreen; picture-in-picture"
                                style={{
                                    width: '177.78vh', /* (16/9) * 100vh to ensure it covers even on wide screens */
                                    minWidth: '100%',
                                    minHeight: '100%',
                                    filter: 'blur(4px)'
                                }}
                            />
                        </div>
                    ) : (
                        <video
                            ref={bgVideoRef}
                            src={currentSong.backgroundVideo}
                            poster={currentSong.coverUrl} // Show cover while loading
                            loop
                            muted
                            playsInline
                            autoPlay={isPlaying} // Sync autoplay with state
                            onCanPlay={() => {
                                if (isPlaying && bgVideoRef.current) {
                                    bgVideoRef.current.play().catch(() => { });
                                }
                            }}
                            className="w-full h-full object-cover opacity-60 scale-105 transition-opacity duration-500"
                            style={{ filter: 'blur(4px)' }}
                        />
                    )}
                </div>
            )}

            {/* Main Layout Grid */}
            <div className={`grid gap-8 md:gap-12 items-center relative z-10 transition-all duration-700 ${showLyrics ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1 max-w-2xl mx-auto'}`}>

                {/* Album Cover Section */}
                <div className={`flex flex-col items-center transition-all duration-700 ${!showLyrics ? 'mb-4' : ''}`}>
                    <div className="relative group">
                        {/* Glowing Ring behind cover */}
                        <div className={`absolute -inset-4 bg-gradient-to-tr from-[#ff00ff] to-[#00ffff] rounded-full blur-2xl transition-opacity duration-1000 ${isPlaying ? 'opacity-30 animate-pulse' : 'opacity-0'}`} />

                        <img
                            src={currentSong.coverUrl}
                            alt={currentSong.title}
                            className={`object-cover rounded-xl shadow-[0_0_30px_rgba(0,0,0,0.5)] border border-white/10 transition-all duration-700 ${showLyrics ? 'w-72 h-72 md:w-96 md:h-96' : 'w-48 h-48 md:w-64 md:h-64'} ${isPlaying ? 'scale-105 rotate-1' : 'scale-100'}`}
                        />
                    </div>

                    <div className={`mt-6 text-center w-full overflow-hidden ${!showLyrics ? 'max-w-md' : ''}`}>
                        <div className="relative w-full max-w-xs md:max-w-sm mx-auto overflow-hidden whitespace-nowrap">
                            <h2
                                className={`text-2xl md:text-3xl font-black text-white tracking-tighter uppercase italic neon-text-pink inline-block ${currentSong.title.length > 20 ? 'animate-marquee' : ''}`}
                                style={currentSong.title.length > 20 ? { animationDuration: '10s' } : {}}
                            >
                                {currentSong.title}&nbsp;&nbsp;&nbsp;&nbsp;{currentSong.title.length > 20 ? currentSong.title : ''}
                            </h2>
                        </div>
                        <p className="text-[#00ffff] font-bold mt-1 tracking-widest uppercase text-[10px] md:text-xs">
                            {currentSong.coverArtist}
                        </p>
                        <p className="text-gray-400 dark:text-gray-500 text-[9px] md:text-xs italic mt-0.5 uppercase tracking-tighter opacity-80 dark:opacity-60">
                            {t('musicPlayer.originalBy')} {currentSong.artist}
                        </p>
                    </div>

                    {/* Playlist Toggle Button */}
                    <button
                        onClick={() => setShowPlaylist(!showPlaylist)}
                        className={`mt-6 cyber-button flex items-center gap-3 px-6 py-3 md:px-8 md:py-4 font-black uppercase text-xs md:text-sm tracking-widest transition-all duration-300 ${showPlaylist ? 'bg-[#ff00ff] text-white shadow-[0_0_20px_rgba(255,0,255,0.4)]' : 'bg-white/5 text-gray-400 border border-white/10 hover:border-[#ff00ff]'}`}
                    >
                        {showPlaylist ? <FaTimes /> : <FaListUl />}
                        {t('Lista de Reproducción') || 'Playlist'}
                    </button>

                    {/* Visualizer - Interactive */}
                    <div
                        className={`mt-6 w-full bg-black/20 rounded-xl overflow-hidden border border-white/5 shadow-inner cursor-pointer hover:border-primary-pink/50 transition-all ${showLyrics ? 'h-24' : 'h-16'}`}
                        onClick={() => setVisualizerStyle(prev => (prev + 1) % 5)}
                        title={t('Clic para cambiar estilo') || 'Click to change visualizer style'}
                    >
                        <canvas
                            ref={canvasRef}
                            width={400}
                            height={100}
                            className="w-full h-full opacity-80"
                        />
                    </div>
                </div>

                {/* Lyrics and Controls Section */}
                <div className={`flex flex-col h-full w-full transition-all duration-500`}>
                    {/* Lyrics Display */}
                    <div className={`relative w-full bg-white/30 dark:bg-black/50 backdrop-blur-xl rounded-2xl border border-black/10 dark:border-white/10 overflow-hidden mb-8 shadow-none flex flex-col transition-all duration-700 ease-in-out ${showLyrics ? 'h-[28rem] md:h-[36rem] opacity-100' : 'h-0 opacity-0 mb-0 border-0'}`}>
                        {/* Removed Top Visualizer */}

                        <div className="relative flex-1 overflow-hidden">
                            {/* Gradient Fade Masks */}
                            <div className="absolute top-0 left-0 w-full h-12 bg-gradient-to-b from-white/30 dark:from-black/40 to-transparent z-10 pointer-events-none" />
                            <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-white/30 dark:from-black/40 to-transparent z-10 pointer-events-none" />

                            <div
                                ref={lyricsContainerRef}
                                className="h-full overflow-y-auto overflow-x-hidden no-scrollbar px-6 scroll-smooth pb-32 pt-10" // Added padding top/bottom
                            >
                                {currentSong.lyrics.map((lyric, index) => (
                                    <button
                                        key={index}
                                        onClick={() => {
                                            const time = parseTimestamp(lyric.time);
                                            if (audioRef.current) {
                                                audioRef.current.currentTime = time;
                                            }
                                            setCurrentTime(time);
                                            setIsPlaying(true);
                                        }}
                                        className={`w-full text-left py-3 transition-all duration-300 group outline-none ${index === currentLyricIndex
                                            ? 'opacity-100 scale-100'
                                            : 'opacity-40 hover:opacity-100'}`}
                                    >
                                        <p className={`text-xl md:text-2xl font-bold leading-relaxed break-words whitespace-normal transition-colors ${index === currentLyricIndex
                                            ? 'text-[#ff00ff]'
                                            : 'text-gray-800 dark:text-gray-200'
                                            }`}>
                                            {lyric.text}
                                        </p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="space-y-6 md:space-y-8 bg-black/5 dark:bg-white/5 p-4 md:p-6 rounded-2xl border border-black/5 dark:border-white/5 backdrop-blur-sm">
                        {/* Progress Bar */}
                        <div className="space-y-2">
                            <input
                                type="range"
                                min="0"
                                max={duration || 0}
                                value={currentTime}
                                onChange={handleSeek}
                                className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-[#00ffff] hover:accent-[#ff00ff] transition-all"
                            />
                            <div className="flex justify-between text-[10px] font-bold text-[#00ffff] uppercase tracking-widest opacity-70">
                                <span>{formatTime(currentTime)}</span>
                                <span>{formatTime(duration)}</span>
                            </div>
                        </div>

                        {/* Playback Buttons & Volume */}
                        <div className="flex flex-col md:flex-row items-center justify-between gap-6">

                            {/* Controls */}
                            <div className="flex items-center justify-center gap-6 flex-1">
                                <button onClick={handlePrevious} className="text-gray-600 dark:text-gray-400 hover:text-[#ff00ff] dark:hover:text-[#ff00ff] transition-all transform hover:scale-125">
                                    <FaStepBackward size={20} />
                                </button>
                                <button
                                    onClick={handlePlayPause}
                                    className="w-16 h-16 bg-white dark:bg-gray-200 text-black rounded-full flex items-center justify-center hover:scale-110 transition-all shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:shadow-[0_0_40px_rgba(255,0,255,0.5)] active:scale-95 group"
                                >
                                    {isPlaying ? <FaPause size={24} /> : <FaPlay size={24} className="ml-1 text-black group-hover:text-[#ff00ff] transition-colors" />}
                                </button>
                                <button onClick={handleNext} className="text-gray-600 dark:text-gray-400 hover:text-[#ff00ff] dark:hover:text-[#ff00ff] transition-all transform hover:scale-125">
                                    <FaStepForward size={20} />
                                </button>

                                {/* Lyrics Toggle Button (Placed between Next and Volume as requested) */}
                                <button
                                    onClick={() => setShowLyrics(!showLyrics)}
                                    className={`p-3 rounded-full transition-all duration-300 ${showLyrics ? 'text-[#ff00ff] bg-[#ff00ff]/10' : 'text-gray-500 hover:text-white'}`}
                                    title={showLyrics ? t('Ocultar Letra') || 'Hide Lyrics' : t('Mostrar Letra') || 'Show Lyrics'}
                                >
                                    {showLyrics ? <FaMicrophone size={18} /> : <FaMicrophoneSlash size={18} />}
                                </button>
                            </div>

                            {/* Volume Control - Compact inline */}
                            <div className="flex items-center gap-3 w-full md:w-auto justify-center opacity-80 hover:opacity-100 transition-opacity bg-black/5 dark:bg-white/5 p-2 rounded-full px-4 border border-black/5 dark:border-white/5">
                                <button onClick={() => setIsMuted(!isMuted)} className="text-gray-700 dark:text-gray-300 hover:text-primary-pink">
                                    {isMuted || volume === 0 ? <FaVolumeMute size={16} /> : <FaVolumeUp size={16} />}
                                </button>
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.01"
                                    value={isMuted ? 0 : volume}
                                    onChange={(e) => {
                                        setVolume(Number(e.target.value));
                                        setIsMuted(false);
                                    }}
                                    className="w-24 h-1 bg-gray-400 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer accent-gray-800 dark:accent-white hover:accent-primary-pink"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <audio
                ref={audioRef}
                src={currentSong.audioUrl}
                crossOrigin="anonymous"
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={handleNext}
            />

            {/* Playlist Sidebar/Panel */}
            {showPlaylist && (
                <div ref={playlistRef} className="mt-12 border-t border-gray-200 dark:border-white/5 pt-10 animate-fade-in relative z-20">
                    <h3 className="text-2xl font-black text-gray-800 dark:text-white mb-8 flex items-center gap-3 uppercase tracking-tighter italic">
                        <div className="w-8 h-[2px] bg-[#ff00ff]" />
                        {t('Canciones') || 'Tracks'}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {musicData.map((song, index) => (
                            <button
                                key={song.id}
                                onClick={() => {
                                    setCurrentSongIndex(index);
                                    setIsPlaying(true);
                                }}
                                className={`flex items-center gap-5 p-5 rounded-2xl transition-all duration-300 text-left border relative overflow-hidden group ${index === currentSongIndex
                                    ? 'bg-[#ff00ff]/10 border-[#ff00ff] shadow-[0_0_20px_rgba(255,0,255,0.2)]'
                                    : 'bg-white/60 dark:bg-black/40 border-gray-200 dark:border-white/5 hover:border-[#ff00ff]/50'}`}
                            >
                                <div className="relative">
                                    <img src={song.coverUrl} alt="" className="w-16 h-16 rounded-xl object-cover shadow-lg" />
                                    {index === currentSongIndex && isPlaying && (
                                        <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center">
                                            <div className="flex gap-1 items-end h-6">
                                                <div className="w-1 bg-[#ff00ff] animate-music-bar-1" style={{ animation: 'music-bar 0.6s ease-in-out infinite alternate' }}></div>
                                                <div className="w-1 bg-[#00ffff] animate-music-bar-2" style={{ animation: 'music-bar 0.8s ease-in-out infinite alternate' }}></div>
                                                <div className="w-1 bg-[#ff00ff] animate-music-bar-3" style={{ animation: 'music-bar 0.7s ease-in-out infinite alternate' }}></div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className={`font-black uppercase tracking-tighter truncate ${index === currentSongIndex ? 'text-[#ff00ff]' : 'text-gray-900 dark:text-white/90'}`}>{song.title}</p>
                                    <p className={`text-xs font-bold tracking-widest uppercase mt-1 truncate ${index === currentSongIndex ? 'text-[#00ffff]' : 'text-gray-500 dark:text-gray-400'}`}>
                                        {song.coverArtist}
                                    </p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MusicPlayer;
