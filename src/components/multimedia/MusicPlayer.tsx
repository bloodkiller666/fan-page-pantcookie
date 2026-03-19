'use client';
import { useState, useRef, useEffect, useMemo } from 'react';
import { musicData } from '../../utils/musicData';
import { useLanguage } from '../../context/LanguageContext';

const MusicPlayer = () => {
    const { t } = useLanguage();
    const [currentSongIndex, setCurrentSongIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(0.7);
    const [isMuted, setIsMuted] = useState(false);
    const [showLyrics, setShowLyrics] = useState(true);
    const [showPlaylist, setShowPlaylist] = useState(true);
    const [isFavorite, setIsFavorite] = useState(false);

    const audioRef = useRef<HTMLAudioElement>(null);
    const lyricsContainerRef = useRef<HTMLDivElement>(null);
    const bgVideoRef = useRef<HTMLVideoElement>(null);
    const vimeoRef = useRef<HTMLIFrameElement>(null);
    const playerRef = useRef<HTMLDivElement>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const dataArrayRef = useRef<Uint8Array | null>(null);
    const gainNodeRef = useRef<GainNode | null>(null);
    const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
    const [visualizerData, setVisualizerData] = useState<number[]>(() => new Array(40).fill(0));
    const animationFrameRef = useRef<number | null>(null);

    // Fullscreen logic
    const toggleFullscreen = () => {
        if (!playerRef.current) return;
        if (!document.fullscreenElement) {
            playerRef.current.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable full-screen mode: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    };

    // Initialize Audio Analyzer for Visualizer
    useEffect(() => {
        if (!audioRef.current) return;

        const initAudioContext = () => {
            if (audioContextRef.current) return;
            
            const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
            const context = new AudioContextClass();
            const analyser = context.createAnalyser();
            const gainNode = context.createGain();
            
            // Check if source already exists to avoid re-connection error
            if (!sourceRef.current) {
                sourceRef.current = context.createMediaElementSource(audioRef.current!);
            }
            
            sourceRef.current.connect(analyser);
            analyser.connect(gainNode);
            gainNode.connect(context.destination);
            
            analyser.fftSize = 128;
            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            
            audioContextRef.current = context;
            analyserRef.current = analyser;
            dataArrayRef.current = dataArray;
            gainNodeRef.current = gainNode;
        };

        const updateVisualizer = () => {
            if (analyserRef.current && dataArrayRef.current && isPlaying) {
                // Use a local variable and cast to any to bypass the specific Uint8Array/SharedArrayBuffer conflict in this environment
                const data = dataArrayRef.current as any;
                analyserRef.current.getByteFrequencyData(data);
                
                const barsCount = 40;
                const step = Math.floor(data.length / barsCount);
                const newData: number[] = [];
                
                for (let i = 0; i < barsCount; i++) {
                    let sum = 0;
                    for (let j = 0; j < step; j++) {
                        sum += data[i * step + j];
                    }
                    const avg = sum / (step || 1);
                    newData.push((avg / 255) * (isMuted ? 0 : volume) * 100);
                }
                setVisualizerData(newData);
            } else if (!isPlaying) {
                setVisualizerData(prev => prev.map(val => val * 0.9));
            }
            animationFrameRef.current = requestAnimationFrame(updateVisualizer);
        };

        const handleStart = () => {
            initAudioContext();
            if (audioContextRef.current?.state === 'suspended') {
                audioContextRef.current.resume();
            }
        };

        audioRef.current.addEventListener('play', handleStart);
        updateVisualizer();

        return () => {
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
            audioRef.current?.removeEventListener('play', handleStart);
        };
    }, [isPlaying, volume, isMuted]);

    const getVimeoId = (url: string | undefined) => {
        if (!url) return null;
        const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
        return match ? match[1] : null;
    };

    const currentSong = musicData[currentSongIndex];
    const vimeoId = getVimeoId(currentSong.backgroundVideo);

    const vimeoSrc = useMemo(() => {
        if (!vimeoId) return '';
        return `https://player.vimeo.com/video/${vimeoId}?background=1&autoplay=${isPlaying ? 1 : 0}&loop=1&muted=1&autopause=0&api=1`;
    }, [vimeoId, isPlaying]);

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = isMuted ? 0 : volume;
        }
    }, [volume, isMuted]);

    useEffect(() => {
        let isMounted = true;
        const playMedia = async () => {
            if (isPlaying) {
                try {
                    if (audioRef.current) {
                        await audioRef.current.play();
                    }
                    if (bgVideoRef.current && currentSong.backgroundVideo) {
                        await bgVideoRef.current.play();
                    }
                    if (vimeoRef.current) {
                        vimeoRef.current.contentWindow?.postMessage(JSON.stringify({ method: 'play' }), '*');
                    }
                } catch (err) {
                    console.error("Playback failed or interrupted:", err);
                }
            } else {
                audioRef.current?.pause();
                bgVideoRef.current?.pause();
                if (vimeoRef.current) {
                    vimeoRef.current.contentWindow?.postMessage(JSON.stringify({ method: 'pause' }), '*');
                }
            }
        };

        playMedia();
        return () => { isMounted = false; };
    }, [isPlaying, currentSongIndex]);

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

    const formatTime = (time: number) => {
        const mins = Math.floor(time / 60);
        const secs = Math.floor(time % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const parseTimestamp = (timestamp: string | number) => {
        if (typeof timestamp === 'number') return timestamp;
        if (typeof timestamp === 'string' && timestamp.includes(':')) {
            const [mins, secs] = timestamp.split(':').map(Number);
            return mins * 60 + secs;
        }
        return Number(timestamp) || 0;
    };

    const currentLyricIndex = currentSong.lyrics.findLastIndex(l => parseTimestamp(l.time) <= currentTime);

    useEffect(() => {
        if (currentLyricIndex !== -1 && lyricsContainerRef.current) {
            const activeLyric = lyricsContainerRef.current.children[currentLyricIndex];
            if (activeLyric) {
                const container = lyricsContainerRef.current;
                const offsetTop = (activeLyric as HTMLElement).offsetTop - container.offsetTop;
                container.scrollTo({
                    top: offsetTop - 150,
                    behavior: 'smooth'
                });
            }
        }
    }, [currentLyricIndex]);

    return (
        <div ref={playerRef} className="relative w-full h-[calc(100vh-6rem)] min-h-[1100px] bg-[#080c0e] dark:bg-[#080c0e] font-display text-slate-100 dark:text-slate-100 overflow-hidden rounded-3xl shadow-2xl select-none transition-all duration-500 border border-white/10">
            {/* Ambient Cinematic Background */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-gradient-to-br from-[#080c0e] via-[#140a0e] to-[#080c0e] dark:from-[#080c0e] dark:via-[#140a0e] dark:to-[#080c0e]"></div>
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-[#ff007a]/20 rounded-full blur-[150px] animate-pulse-slow"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-[#ff2d55]/15 rounded-full blur-[150px] animate-pulse-slow" style={{ animationDelay: '-4s' }}></div>
                
                {/* Background Looping Video */}
                {currentSong.backgroundVideo && (
                    <div className="absolute inset-0 opacity-100 mix-blend-screen overflow-hidden">
                        {vimeoId ? (
                            <iframe
                                ref={vimeoRef}
                                src={vimeoSrc}
                                className="w-[120%] h-[120%] -translate-x-[10%] -translate-y-[10%] pointer-events-none border-none scale-110"
                                allow="autoplay; fullscreen"
                                style={{ filter: 'none' }}
                            />
                        ) : (
                            <video
                                ref={bgVideoRef}
                                src={currentSong.backgroundVideo}
                                loop
                                muted
                                playsInline
                                autoPlay={isPlaying}
                                className="w-full h-full object-cover scale-110"
                                style={{ filter: 'none' }}
                            />
                        )}
                    </div>
                )}
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] mix-blend-overlay"></div>
            </div>

            <div className="relative z-10 flex flex-col h-full">
                {/* Top Navigation - Optional but kept for structure */}
                <header className="flex items-center justify-between px-8 py-5 bg-[#080c0e]/40 backdrop-blur-md border-b border-white/5 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="text-[#ff007a] flex items-center justify-center">
                            <span className="material-symbols-outlined text-3xl">motion_photos_on</span>
                        </div>
                        <h2 className="text-xl font-bold tracking-tight uppercase">SONIC<span className="text-[#ff007a]">WAVE</span></h2>
                    </div>
                    <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
                        <a className="hover:text-[#ff007a] transition-colors" href="#">Discover</a>
                        <a className="hover:text-[#ff007a] transition-colors" href="#">Library</a>
                        <a className="text-white border-b-2 border-[#ff007a] pb-1" href="#">Radio</a>
                    </nav>
                    <div className="flex items-center gap-4">
                        <button className="flex items-center justify-center rounded-lg h-10 w-10 bg-white/5 hover:bg-white/10 transition-colors">
                            <span className="material-symbols-outlined text-white text-xl">search</span>
                        </button>
                        <button className="flex items-center justify-center rounded-lg h-10 w-10 bg-white/5 hover:bg-white/10 transition-colors">
                            <span className="material-symbols-outlined text-white text-xl">settings</span>
                        </button>
                        <div className="size-10 rounded-full border border-[#ff007a]/50 overflow-hidden ml-2 p-0.5">
                            <img 
                                className="w-full h-full rounded-full object-cover" 
                                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDgfGeuk1z0qS3AEVOoolsEG2CTgm0BDtL0ijpZIlHkg0staUYGChf7pqcHyj0wKccKNHiHkNzliqRvyclen3rHFFpyadnl8ByxSdQvzPQ2pBJmATTSrISu47SLEV9yYpui6LsPSd_HmDDEPpPxeqfY065dlGg38yTnLn2K8h074UNZlCGBmMAsu-vGPwUHF74dIIPn-LTUdJy_VVUN0SsKS8F1Qgix84lkGe9BWGfVUYOARy12C_e6Dull4zSJWDCGa6sVTQcQhbo"
                                alt="User Profile"
                            />
                        </div>
                    </div>
                </header>

                {/* Main Content Area */}
                <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 px-8 overflow-hidden relative">
                    {/* Left Content: Album Art */}
                    <div className={`${(showLyrics || showPlaylist) ? 'lg:col-span-7' : 'lg:col-span-12'} flex flex-col items-center justify-center p-4 relative transition-all duration-700`}>
                        <div className="max-w-2xl w-full space-y-10">
                            <div className="flex justify-center">
                                <div className="relative group">
                                    <div className={`absolute -inset-4 bg-[#ff007a]/20 rounded-2xl blur-3xl transition duration-1000 ${isPlaying ? 'opacity-80 scale-110' : 'opacity-50'}`}></div>
                                    <div className="relative glass p-2 rounded-3xl shadow-2xl border border-white/10 transition-transform duration-700 ease-in-out" style={{ transform: isPlaying ? 'scale(1.02)' : 'scale(1)' }}>
                                        <div className="aspect-video w-full max-w-[800px] rounded-2xl overflow-hidden shadow-2xl relative bg-black/20">
                                            <img className="w-full h-full object-contain" src={currentSong.coverUrl} alt={currentSong.title} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="text-center space-y-3">
                                <div className="flex items-center justify-center gap-4">
                                    <h1 className="text-4xl font-bold tracking-tight text-white">{currentSong.title}</h1>
                                    <button 
                                        onClick={() => setIsFavorite(!isFavorite)}
                                        className={`transition-all duration-300 ${isFavorite ? 'text-[#ff2d55] scale-110' : 'text-slate-400 hover:text-[#ff2d55]'}`}
                                    >
                                        <span className={`material-symbols-outlined text-2xl ${isFavorite ? 'fill-[1]' : ''}`}>favorite</span>
                                    </button>
                                </div>
                                <p className="text-xl font-medium text-[#ff007a] tracking-wide">{currentSong.coverArtist}</p>
                            </div>
                        </div>

                        {/* Synchronized Visualizer - Full Width Bottom when no panels */}
                        {(!showLyrics && !showPlaylist) && (
                            <div className="absolute bottom-10 left-0 right-0 px-20">
                                <div className="flex items-end justify-center gap-1.5 h-32 w-full">
                                    {visualizerData.map((height, i) => (
                                        <div 
                                            key={i} 
                                            className="visualizer-bar flex-1 min-w-[2px] max-w-[8px] rounded-full bg-gradient-to-t from-[#ff007a] to-[#ff2d55] neon-shadow-pink opacity-80"
                                            style={{ 
                                                height: `${Math.max(4, height * 1.5)}%`,
                                                transition: 'height 0.05s ease-out'
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Content: Lyrics & Playlist Dual Panel */}
                    {(showLyrics || showPlaylist) && (
                        <div className="lg:col-span-5 glass border-l border-white/10 flex flex-col overflow-hidden transition-all duration-500 rounded-3xl my-8">
                            {/* Lyrics Section */}
                            {showLyrics && (
                                <div className="flex-1 flex flex-col overflow-hidden border-b border-white/5 transition-all duration-500">
                                    <div className="px-8 pt-6 pb-2 flex items-center justify-between">
                                        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Lyrics</h3>
                                        <button 
                                            onClick={() => setShowLyrics(false)}
                                            className="text-slate-500 hover:text-white transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-sm">open_in_full</span>
                                        </button>
                                    </div>
                                    <div 
                                        ref={lyricsContainerRef}
                                        className="flex-1 overflow-y-auto custom-scrollbar px-8 py-4 space-y-6 lyrics-mask"
                                    >
                                        {currentSong.lyrics.map((lyric, index) => (
                                            <p 
                                                key={index}
                                                className={`font-bold transition-all duration-500 cursor-pointer ${
                                                    index === currentLyricIndex 
                                                    ? 'text-2xl text-white neon-shadow-pink' 
                                                    : 'text-xl text-slate-500/50 hover:text-slate-300'
                                                }`}
                                                onClick={() => {
                                                    const time = parseTimestamp(lyric.time);
                                                    if (audioRef.current) audioRef.current.currentTime = time;
                                                    setCurrentTime(time);
                                                    setIsPlaying(true);
                                                }}
                                            >
                                                {lyric.text}
                                            </p>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Playlist Section */}
                            {showPlaylist && (
                                <div className="flex-1 flex flex-col overflow-hidden transition-all duration-500">
                                    <div className="px-8 pt-6 pb-2 flex items-center justify-between">
                                        <div className="flex flex-col">
                                            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Up Next</h3>
                                            <p className="text-[10px] text-[#ff007a] font-bold">SonicWave Radio • Mix for You</p>
                                        </div>
                                        <button 
                                            onClick={() => setShowPlaylist(false)}
                                            className="text-slate-500 hover:text-white transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-sm">close</span>
                                        </button>
                                    </div>
                                    <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-4 space-y-1">
                                        {musicData.map((song, index) => (
                                            <div 
                                                key={song.id}
                                                onClick={() => {
                                                    setCurrentSongIndex(index);
                                                    setIsPlaying(true);
                                                }}
                                                className={`flex items-center gap-4 p-3 rounded-xl transition-all group cursor-pointer border ${
                                                    index === currentSongIndex 
                                                    ? 'bg-white/5 border-white/10' 
                                                    : 'border-transparent hover:bg-white/5 hover:border-white/5'
                                                }`}
                                            >
                                                <div className="relative size-10 rounded-lg overflow-hidden flex-shrink-0">
                                                    <img className={`w-full h-full object-cover ${index !== currentSongIndex ? 'grayscale group-hover:grayscale-0' : ''}`} src={song.coverUrl} alt={song.title} />
                                                    {index === currentSongIndex && (
                                                        <div className="absolute inset-0 bg-[#ff007a]/60 flex items-center justify-center">
                                                            <span className="material-symbols-outlined text-white text-xl animate-pulse">equalizer</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className={`text-xs font-bold truncate ${index === currentSongIndex ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>{song.title}</h4>
                                                    <p className={`text-[10px] font-medium truncate ${index === currentSongIndex ? 'text-[#ff007a]' : 'text-slate-500 group-hover:text-[#ff007a]'}`}>{song.coverArtist}</p>
                                                </div>
                                                <span className="text-[10px] font-bold text-slate-500">04:12</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Frequency Visualizer in Panel */}
                            <div className="px-8 py-6 border-t border-white/5 bg-black/10 shrink-0">
                                <div className="flex items-end justify-center gap-1 h-16 w-full">
                                    {visualizerData.slice(0, 20).map((height, i) => (
                                        <div 
                                            key={i} 
                                            className="visualizer-bar flex-1 rounded-full bg-[#ff007a] neon-shadow-pink opacity-70"
                                            style={{ 
                                                height: `${Math.max(4, height)}%`,
                                                transition: 'height 0.05s ease-out'
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </main>

                {/* Bottom Control Bar */}
                <footer className="h-28 bg-[#080c0e]/80 backdrop-blur-2xl border-t border-white/10 flex flex-col justify-center px-10 z-30 shrink-0">
                    <div className="max-w-6xl mx-auto w-full space-y-4">
                        {/* Sleek Progress Bar */}
                        <div className="flex items-center gap-4 w-full group">
                            <span className="text-[10px] font-bold text-slate-500 w-10">{formatTime(currentTime)}</span>
                            <div className="relative flex-1 h-1 bg-white/10 rounded-full overflow-visible">
                                <input 
                                    type="range"
                                    min="0"
                                    max={duration || 0}
                                    value={currentTime}
                                    onChange={handleSeek}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                                />
                                <div 
                                    className="absolute top-0 left-0 h-full rounded-full bg-[#ff007a] transition-all duration-150" 
                                    style={{ width: `${(currentTime / (duration || 1)) * 100}%`, boxShadow: '0 0 15px rgba(255, 0, 122, 0.5)' }}
                                >
                                    <div className="absolute right-0 top-1/2 -translate-y-1/2 size-3 bg-white rounded-full shadow-xl scale-0 group-hover:scale-100 transition-transform"></div>
                                </div>
                            </div>
                            <span className="text-[10px] font-bold text-slate-500 w-10 text-right">{formatTime(duration)}</span>
                        </div>

                        <div className="flex items-center justify-between">
                            {/* Current Track Info */}
                            <div className="flex items-center gap-4 w-1/4">
                                <div className="size-12 rounded-lg overflow-hidden shrink-0 border border-white/5">
                                    <img className="w-full h-full object-cover" src={currentSong.coverUrl} alt={currentSong.title} />
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span className="text-sm font-bold truncate text-white">{currentSong.title}</span>
                                    <span className="text-xs text-[#ff007a] font-medium truncate">{currentSong.coverArtist}</span>
                                </div>
                            </div>

                            {/* Main Playback Controls */}
                            <div className="flex items-center gap-8">
                                <button className="material-symbols-outlined text-slate-400 hover:text-white transition-colors">shuffle</button>
                                <button onClick={handlePrevious} className="material-symbols-outlined text-white text-3xl hover:text-[#ff007a] transition-colors" style={{ fontVariationSettings: "'FILL' 1" }}>skip_previous</button>
                                <button 
                                    onClick={handlePlayPause}
                                    className="size-14 rounded-full flex items-center justify-center text-[#080c0e] shadow-lg hover:scale-105 active:scale-95 transition-all bg-[#ff007a]" 
                                    style={{ boxShadow: '0 10px 15px -3px rgba(255, 0, 122, 0.4)' }}
                                >
                                    <span className="material-symbols-outlined text-4xl fill-[1]">
                                        {isPlaying ? 'pause' : 'play_arrow'}
                                    </span>
                                </button>
                                <button onClick={handleNext} className="material-symbols-outlined text-white text-3xl hover:text-[#ff007a] transition-colors" style={{ fontVariationSettings: "'FILL' 1" }}>skip_next</button>
                                <button className="material-symbols-outlined text-slate-400 hover:text-white transition-colors">repeat</button>
                            </div>

                            {/* Secondary Controls */}
                            <div className="flex items-center justify-end gap-6 w-1/4">
                                <div className="flex items-center gap-3">
                                    <button onClick={() => setIsMuted(!isMuted)} className="material-symbols-outlined text-slate-400 hover:text-white transition-colors">
                                        {isMuted || volume === 0 ? 'volume_off' : 'volume_up'}
                                    </button>
                                    <div className="w-20 h-1 bg-white/10 rounded-full relative">
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
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        />
                                        <div 
                                            className="absolute top-0 left-0 h-full bg-[#ff007a] rounded-full transition-all"
                                            style={{ width: `${(isMuted ? 0 : volume) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setShowLyrics(!showLyrics)}
                                    className={`material-symbols-outlined transition-all ${showLyrics ? 'text-[#ff007a] scale-110' : 'text-slate-400 hover:text-white'}`}
                                >
                                    mic
                                </button>
                                <button 
                                    onClick={() => setShowPlaylist(!showPlaylist)}
                                    className={`material-symbols-outlined transition-all ${showPlaylist ? 'text-[#ff007a] scale-110' : 'text-slate-400 hover:text-white'}`}
                                >
                                    queue_music
                                </button>
                                <button 
                                    onClick={toggleFullscreen}
                                    className="material-symbols-outlined text-slate-400 hover:text-white transition-colors"
                                >
                                    fullscreen
                                </button>
                            </div>
                        </div>
                    </div>
                </footer>
            </div>

            <audio
                ref={audioRef}
                src={currentSong.audioUrl}
                crossOrigin="anonymous"
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={handleNext}
            />

            <style jsx>{`
                .glass {
                    background: rgba(16, 30, 34, 0.4);
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                }
                .neon-shadow-pink {
                    text-shadow: 0 0 20px rgba(255, 0, 122, 0.5);
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 0, 122, 0.3);
                    border-radius: 10px;
                }
                @keyframes pulse-soft {
                    0%, 100% { transform: scale(1); opacity: 0.4; }
                    50% { transform: scale(1.05); opacity: 0.6; }
                }
                .animate-pulse-slow {
                    animation: pulse-soft 8s infinite ease-in-out;
                }
                @keyframes music-bar {
                    0% { height: 20%; }
                    100% { height: 100%; }
                }
                .animate-music-bar {
                    animation: music-bar 0.6s ease-in-out infinite alternate;
                }
                .visualizer-bar {
                    transition: height 0.1s ease-in-out;
                }
                .lyrics-mask {
                    mask-image: linear-gradient(to bottom, transparent, black 15%, black 85%, transparent);
                    -webkit-mask-image: linear-gradient(to bottom, transparent, black 15%, black 85%, transparent);
                }
            `}</style>
        </div>
    );
};

export default MusicPlayer;
