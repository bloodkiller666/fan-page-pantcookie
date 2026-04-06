'use client';
import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { musicData as initialMusicData } from '../../utils/musicData';
import { useLanguage } from '../../context/LanguageContext';
import { initDB } from '../../utils/db';
import {
    MdGraphicEq, MdSearch, MdSettings, MdClose, MdFavorite, MdFavoriteBorder,
    MdOpenInFull, MdEqualizer, MdAddCircle, MdLibraryMusic, MdShuffle,
    MdSkipPrevious, MdPause, MdPlayArrow, MdSkipNext, MdRepeat,
    MdVolumeOff, MdVolumeUp, MdMic, MdQueueMusic, MdFullscreen, MdDelete
} from 'react-icons/md';

interface Song {
    id: string | number;
    title: string;
    coverArtist: string;
    audioUrl: string;
    coverUrl: string;
    lyrics?: { time: string | number; text: string }[];
    backgroundVideo?: string;
    artist?: string;
}

const MusicPlayer = () => {
    const { t } = useLanguage();

    // -- State Management --
    const [playlist, setPlaylist] = useState<Song[]>(initialMusicData);
    const [localLibrary, setLocalLibrary] = useState<Song[]>([]);
    const [showLocalLibrary, setShowLocalLibrary] = useState(false);
    const [currentSongIndex, setCurrentSongIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(0.7);
    const [isMuted, setIsMuted] = useState(false);
    const [showLyrics, setShowLyrics] = useState(true);
    const [showPlaylist, setShowPlaylist] = useState(false);
    const [isFavorite, setIsFavorite] = useState(false);
    const [isShuffle, setIsShuffle] = useState(false);
    const [isLoop, setIsLoop] = useState(false);

    // -- Search State --
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    // -- Settings State --
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [playerColor, setPlayerColor] = useState('#ff007a');
    const [showVisualizer, setShowVisualizer] = useState(true);
    const [performanceMode, setPerformanceMode] = useState(false);

    // -- Equalizer State (DJ Mixer) --
    const [eqBands, setEqBands] = useState([0, 0, 0, 0, 0]);
    const eqNodesRef = useRef<BiquadFilterNode[]>([]);

    // -- Refs --
    const audioRef = useRef<HTMLAudioElement>(null);
    const lyricsContainerRef = useRef<HTMLDivElement>(null);
    const bgVideoRef = useRef<HTMLVideoElement>(null);
    const playerRef = useRef<HTMLDivElement>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const dataArrayRef = useRef<Uint8Array | null>(null);
    const gainNodeRef = useRef<GainNode | null>(null);
    const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
    const [visualizerData, setVisualizerData] = useState<number[]>(() => new Array(40).fill(0));
    const animationFrameRef = useRef<number | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // -- Load Library & Settings --
    useEffect(() => {
        const loadLocalLibrary = async () => {
            try {
                const db = await initDB();
                const transaction = db.transaction('library', 'readonly');
                const store = transaction.objectStore('library');
                const request = store.getAll();

                request.onsuccess = () => {
                    const songs = request.result.map(song => ({
                        ...song,
                        audioUrl: URL.createObjectURL(song.audioFile)
                    }));
                    setLocalLibrary(songs);
                    setPlaylist([...initialMusicData, ...songs]);
                };
            } catch (error) {
                console.error("Error al cargar la biblioteca local:", error);
            }
        };
        loadLocalLibrary();

        const savedSettings = localStorage.getItem('music_player_settings');
        if (savedSettings) {
            try {
                const s = JSON.parse(savedSettings);
                if (s.color) setPlayerColor(s.color);
                if (s.visualizer !== undefined) setShowVisualizer(s.visualizer);
                if (s.performance !== undefined) setPerformanceMode(s.performance);
                if (s.eq) setEqBands(s.eq);
            } catch (e) { console.error(e); }
        }
    }, []);

    // Save Settings
    useEffect(() => {
        const settings = { color: playerColor, visualizer: showVisualizer, performance: performanceMode, eq: eqBands };
        localStorage.setItem('music_player_settings', JSON.stringify(settings));
    }, [playerColor, showVisualizer, performanceMode, eqBands]);

    // -- Audio Context & Visualizer & EQ --
    const initAudioContext = useCallback(() => {
        if (audioContextRef.current) return;

        const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
        const context = new AudioContextClass();
        const analyser = context.createAnalyser();
        const gainNode = context.createGain();

        if (!sourceRef.current && audioRef.current) {
            sourceRef.current = context.createMediaElementSource(audioRef.current);
        }

        if (sourceRef.current) {
            const frequencies = [60, 250, 1000, 4000, 16000];
            let lastNode: AudioNode = sourceRef.current;

            const nodes = frequencies.map((freq, i) => {
                const filter = context.createBiquadFilter();
                filter.type = 'peaking';
                filter.frequency.value = freq;
                filter.Q.value = 1;
                filter.gain.value = eqBands[i];
                lastNode.connect(filter);
                lastNode = filter;
                return filter;
            });
            eqNodesRef.current = nodes;

            lastNode.connect(analyser);
            analyser.connect(gainNode);
            gainNode.connect(context.destination);

            analyser.fftSize = 128;
            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);

            audioContextRef.current = context;
            analyserRef.current = analyser;
            dataArrayRef.current = dataArray;
            gainNodeRef.current = gainNode;
        }
    }, [eqBands]);

    useEffect(() => {
        eqNodesRef.current.forEach((node, i) => {
            node.gain.value = eqBands[i];
        });
    }, [eqBands]);

    useEffect(() => {
        const updateVisualizer = () => {
            if (analyserRef.current && dataArrayRef.current && isPlaying && showVisualizer) {
                const data = dataArrayRef.current as any;
                analyserRef.current.getByteFrequencyData(data);
                const barsCount = 40;
                const step = Math.floor(data.length / barsCount);
                const newData: number[] = [];
                for (let i = 0; i < barsCount; i++) {
                    let sum = 0;
                    for (let j = 0; j < (step || 1); j++) {
                        if (data[i * step + j] !== undefined) {
                            sum += data[i * step + j];
                        }
                    }
                    const avg = sum / (step || 1);
                    newData.push((avg / 255) * (isMuted ? 0 : volume) * 100);
                }
                setVisualizerData(newData);
            } else if (!isPlaying || !showVisualizer) {
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

        audioRef.current?.addEventListener('play', handleStart);
        updateVisualizer();

        return () => {
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
            audioRef.current?.removeEventListener('play', handleStart);
        };
    }, [isPlaying, volume, isMuted, showVisualizer, initAudioContext]);

    // -- Library Logic --
    const extractAlbumArt = (file: File): Promise<string | null> => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (ev) => {
                try {
                    const buf = ev.target?.result as ArrayBuffer;
                    const bytes = new Uint8Array(buf);
                    if (bytes[0] !== 0x49 || bytes[1] !== 0x44 || bytes[2] !== 0x33) { resolve(null); return; }
                    let offset = 10;
                    while (offset < bytes.length - 10) {
                        const frameId = String.fromCharCode(bytes[offset], bytes[offset + 1], bytes[offset + 2], bytes[offset + 3]);
                        const frameSize = (bytes[offset + 4] << 24) | (bytes[offset + 5] << 16) | (bytes[offset + 6] << 8) | bytes[offset + 7];
                        if (frameSize <= 0 || frameSize > 5_000_000) break;
                        if (frameId === 'APIC') {
                            let pos = offset + 10;
                            pos++;
                            let mime = "";
                            while (bytes[pos] !== 0 && pos < bytes.length) { mime += String.fromCharCode(bytes[pos]); pos++; }
                            pos += 2;
                            while (bytes[pos] !== 0 && pos < bytes.length) pos++;
                            pos++;
                            const imgData = bytes.slice(pos, offset + 10 + frameSize);
                            const blob = new Blob([imgData], { type: mime });
                            resolve(URL.createObjectURL(blob));
                            return;
                        }
                        offset += 10 + frameSize;
                    }
                    resolve(null);
                } catch { resolve(null); }
            };
            reader.onerror = () => resolve(null);
            reader.readAsArrayBuffer(file.slice(0, 65536)); // Only first 64KB — ID3 tags are always at the start
        });
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        e.target.value = '';
        if (files.length === 0) return;

        // Extract metadata for all files FIRST to avoid transaction timeout
        const songDataArr = await Promise.all(
            files.map(async (file) => {
                const albumArt = await extractAlbumArt(file);
                const songId = `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                
                // Parse filename: "Artist - Title.mp3" or just "Title.mp3"
                const fullFileName = file.name.replace(/\.[^/.]+$/, "");
                let artist = "Archivo Local";
                let title = fullFileName;

                if (fullFileName.includes(" - ")) {
                    const parts = fullFileName.split(" - ");
                    artist = parts[0].trim();
                    title = parts.slice(1).join(" - ").trim();
                }

                return {
                    file,
                    newSong: {
                        id: songId,
                        title: title,
                        coverArtist: artist,
                        audioUrl: URL.createObjectURL(file),
                        coverUrl: albumArt || "https://img.freepik.com/vector-gratis/gato-lindo-escuchando-musica-telefono-auriculares-icono-vectorial-dibujos-animados-ilustracion-tecnologia-animal_138676-11290.jpg",
                        lyrics: [{ time: 0, text: "Archivo local - Sin letra disponible" }]
                    }
                };
            })
        );

        try {
            const db = await initDB();
            const tx = db.transaction('library', 'readwrite');
            const store = tx.objectStore('library');

            for (const { file, newSong } of songDataArr) {
                store.add({ ...newSong, audioFile: file });
            }

            tx.oncomplete = () => {
                const newSongs = songDataArr.map(s => s.newSong);
                setLocalLibrary(prev => [...prev, ...newSongs]);
                setPlaylist(prev => [...prev, ...newSongs]);
            };
        } catch (err) {
            console.error('Error guardando en IndexedDB:', err);
        }
    };

    const handleDeleteSong = async (songId: string | number, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            const db = await initDB();
            const tx = db.transaction('library', 'readwrite');
            tx.objectStore('library').delete(songId as IDBValidKey);

            // Find index before deleting
            const deletedIndex = playlist.findIndex(s => s.id === songId);

            // Update lists
            setLocalLibrary(prev => prev.filter(s => s.id !== songId));
            setPlaylist(prev => {
                const newList = prev.filter(s => s.id !== songId);

                // If we deleted the current song, adjust index
                if (deletedIndex === currentSongIndex) {
                    if (newList.length === 0) {
                        setCurrentSongIndex(0);
                        setIsPlaying(false);
                    } else if (currentSongIndex >= newList.length) {
                        setCurrentSongIndex(newList.length - 1);
                    }
                    // Otherwise keep same index (which now points to next song)
                } else if (deletedIndex < currentSongIndex) {
                    setCurrentSongIndex(prevIdx => Math.max(0, prevIdx - 1));
                }

                return newList;
            });

        } catch (err) { console.error('Error eliminando canción:', err); }
    };

    // -- Search Logic --
    const filteredPlaylist = useMemo(() => {
        if (!searchQuery) return playlist;
        const q = searchQuery.toLowerCase();
        return playlist.filter(song =>
            song.title.toLowerCase().includes(q) ||
            song.coverArtist.toLowerCase().includes(q)
        );
    }, [playlist, searchQuery]);

    const filteredLocalLibrary = useMemo(() => {
        if (!searchQuery) return localLibrary;
        const q = searchQuery.toLowerCase();
        return localLibrary.filter(song =>
            song.title.toLowerCase().includes(q) ||
            song.coverArtist.toLowerCase().includes(q)
        );
    }, [localLibrary, searchQuery]);

    // -- Playback Helpers --
    const currentSong = playlist[currentSongIndex];
    const isLocalSong = currentSong?.coverArtist === "Local Upload";

    useEffect(() => {
        if (audioRef.current) audioRef.current.volume = isMuted ? 0 : volume;
    }, [volume, isMuted]);

    useEffect(() => {
        const playMedia = async () => {
            if (isPlaying) {
                try {
                    if (audioRef.current) await audioRef.current.play();
                    if (bgVideoRef.current && currentSong?.backgroundVideo && !performanceMode && !isLocalSong) await bgVideoRef.current.play();
                } catch (err) { console.error(err); }
            } else {
                audioRef.current?.pause();
                bgVideoRef.current?.pause();
            }
        };
        playMedia();
    }, [isPlaying, currentSongIndex, performanceMode, currentSong?.backgroundVideo, isLocalSong]);

    const handlePlayPause = () => setIsPlaying(!isPlaying);
    const handleTimeUpdate = () => { if (audioRef.current) setCurrentTime(audioRef.current.currentTime); };
    const handleLoadedMetadata = () => { if (audioRef.current) setDuration(audioRef.current.duration); };
    const handleNext = () => {
        if (isShuffle) {
            let nextIndex = Math.floor(Math.random() * playlist.length);
            // Try to pick a different song if there's more than one
            if (playlist.length > 1 && nextIndex === currentSongIndex) {
                nextIndex = (nextIndex + 1) % playlist.length;
            }
            setCurrentSongIndex(nextIndex);
        } else {
            setCurrentSongIndex((prev) => (prev + 1) % playlist.length);
        }
        setIsPlaying(true);
    };
    const handlePrevious = () => {
        if (isShuffle) {
            let prevIndex = Math.floor(Math.random() * playlist.length);
            if (playlist.length > 1 && prevIndex === currentSongIndex) {
                prevIndex = (prevIndex - 1 + playlist.length) % playlist.length;
            }
            setCurrentSongIndex(prevIndex);
        } else {
            setCurrentSongIndex((prev) => (prev - 1 + playlist.length) % playlist.length);
        }
        setIsPlaying(true);
    };
    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => { const time = Number(e.target.value); if (audioRef.current) audioRef.current.currentTime = time; setCurrentTime(time); };
    const formatTime = (time: number) => { const mins = Math.floor(time / 60); const secs = Math.floor(time % 60); return `${mins}:${secs < 10 ? '0' : ''}${secs}`; };
    const parseTimestamp = (timestamp: string | number) => { if (typeof timestamp === 'number') return timestamp; if (typeof timestamp === 'string' && timestamp.includes(':')) { const [mins, secs] = timestamp.split(':').map(Number); return mins * 60 + secs; } return Number(timestamp) || 0; };
    const currentLyricIndex = currentSong?.lyrics?.findLastIndex(l => parseTimestamp(l.time) <= currentTime);

    useEffect(() => {
        if (typeof currentLyricIndex === 'number' && currentLyricIndex !== -1 && lyricsContainerRef.current) {
            const activeLyric = lyricsContainerRef.current.children[currentLyricIndex];
            if (activeLyric) {
                const container = lyricsContainerRef.current;
                const offsetTop = (activeLyric as HTMLElement).offsetTop - container.offsetTop;
                container.scrollTo({ top: offsetTop - 150, behavior: 'smooth' });
            }
        }
    }, [currentLyricIndex]);

    const toggleFullscreen = () => {
        if (!playerRef.current) return;
        if (!document.fullscreenElement) playerRef.current.requestFullscreen().catch(console.error);
        else document.exitFullscreen();
    };

    if (!currentSong) return null;

    return (
        <div ref={playerRef} className="relative w-full h-[calc(100vh-6rem)] min-h-[1100px] bg-[#080c0e] font-display text-slate-100 overflow-hidden rounded-3xl shadow-2xl select-none transition-all duration-500 border border-white/10">
            {/* Ambient Cinematic Background */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-gradient-to-br from-[#080c0e] via-[#140a0e] to-[#080c0e]"></div>
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full blur-[150px] animate-pulse-slow" style={{ backgroundColor: `${playerColor}33` }}></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-[#ff2d55]/15 rounded-full blur-[150px] animate-pulse-slow" style={{ animationDelay: '-4s' }}></div>

                {!performanceMode && currentSong.backgroundVideo && !isLocalSong && (
                    <div className="absolute inset-0 opacity-100 mix-blend-screen overflow-hidden">
                        <video ref={bgVideoRef} src={currentSong.backgroundVideo} loop muted playsInline autoPlay={isPlaying} className="w-full h-full object-cover scale-110" />
                    </div>
                )}
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] mix-blend-overlay"></div>
            </div>

            <div className="relative z-10 flex flex-col h-full">
                {/* Header */}
                <header className="flex items-center justify-between px-8 py-5 bg-[#080c0e]/40 backdrop-blur-md border-b border-white/5 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center" style={{ color: playerColor }}>
                            <MdGraphicEq className="text-3xl" />
                        </div>
                        <h2 className="text-xl font-bold tracking-tight uppercase">RADIO<span style={{ color: playerColor }}>HIWA</span></h2>
                    </div>
                    <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
                        <button className="hover:text-white transition-colors" style={{ color: isSearchOpen ? playerColor : '' }} onClick={() => setIsSearchOpen(!isSearchOpen)}>Discover</button>
                        <button className="hover:text-white transition-colors" style={{ color: showLocalLibrary ? playerColor : '' }} onClick={() => { setShowLocalLibrary(!showLocalLibrary); if (!showLocalLibrary) { setShowPlaylist(true); setShowLyrics(false); } }}>Library</button>
                        <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="audio/*" multiple className="hidden" />
                        <a className="text-white border-b-2 pb-1" style={{ borderColor: playerColor, color: !showLocalLibrary ? 'white' : 'inherit' }} href="#" onClick={(e) => { e.preventDefault(); setShowLocalLibrary(false); }}>Radio</a>
                    </nav>
                    <div className="flex items-center gap-4">
                        {isSearchOpen && (
                            <div className="relative animate-fade-in group">
                                <input
                                    type="text"
                                    placeholder="Search song or artist..."
                                    className="bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider focus:outline-none focus:border-white/40 w-48 md:w-80 group-hover:bg-white/15 transition-all"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                {searchQuery && (
                                    <div className="absolute top-full right-0 mt-3 w-64 md:w-96 bg-[#0a0a0a]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden z-[999] max-h-[60vh] overflow-y-auto animate-fade-in">
                                        <div className="p-3 border-b border-white/5 bg-white/5 flex items-center justify-between">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Resultados de Búsqueda</span>
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/10 text-slate-400">{(filteredPlaylist.length + filteredLocalLibrary.length)}</span>
                                        </div>
                                        {filteredPlaylist.length === 0 && filteredLocalLibrary.length === 0 ? (
                                            <div className="p-8 text-center text-slate-500 text-xs italic font-medium uppercase tracking-widest">No se encontraron coincidencias</div>
                                        ) : (
                                            <div className="py-2">
                                                {filteredPlaylist.map((song) => {
                                                    const idx = playlist.findIndex(s => s.id === song.id);
                                                    const isActive = idx === currentSongIndex;
                                                    return (
                                                        <button key={song.id} onClick={() => { setCurrentSongIndex(idx); setIsPlaying(true); setSearchQuery(''); }} className="w-full text-left p-4 hover:bg-white/10 transition-all border-b border-white/5 last:border-0 flex items-center gap-4 group/item">
                                                            <div className="relative size-12 rounded-xl overflow-hidden shadow-2xl shrink-0">
                                                                <img src={song.coverUrl} className="w-full h-full object-cover group-hover/item:scale-110 transition-transform duration-500" />
                                                                {isActive && <div className="absolute inset-0 flex items-center justify-center bg-black/40"><MdEqualizer className="text-white animate-pulse" /></div>}
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <p className={`font-black text-[11px] truncate uppercase tracking-tight ${isActive ? 'text-white' : 'text-slate-200 group-hover/item:text-white'}`}>{song.title}</p>
                                                                <p className="text-[10px] font-bold truncate uppercase mt-0.5" style={{ color: isActive ? playerColor : 'rgb(148, 163, 184)' }}>{song.coverArtist}</p>
                                                            </div>
                                                            <div className="size-8 rounded-full border border-white/10 flex items-center justify-center group-hover/item:bg-white/10 transition-all">
                                                                <MdPlayArrow className="text-white text-lg" />
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                                {filteredLocalLibrary.map((song) => {
                                                    const idx = playlist.findIndex(s => s.id === song.id);
                                                    const isActive = idx === currentSongIndex;
                                                    return (
                                                        <button key={song.id} onClick={() => { setCurrentSongIndex(idx); setIsPlaying(true); setSearchQuery(''); }} className="w-full text-left p-4 hover:bg-white/10 transition-all border-b border-white/5 last:border-0 flex items-center gap-4 group/item">
                                                            <div className="relative size-12 rounded-xl overflow-hidden shadow-2xl shrink-0">
                                                                <img src={song.coverUrl} className="w-full h-full object-cover group-hover/item:scale-110 transition-transform duration-500" />
                                                                {isActive && <div className="absolute inset-0 flex items-center justify-center bg-black/40"><MdEqualizer className="text-white animate-pulse" /></div>}
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <p className={`font-black text-[11px] truncate uppercase tracking-tight ${isActive ? 'text-white' : 'text-slate-200 group-hover/item:text-white'}`}>{song.title}</p>
                                                                <div className="flex items-center gap-2 mt-0.5">
                                                                    <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-white/10 text-slate-400 uppercase tracking-tighter">LOCAL</span>
                                                                    <p className="text-[10px] font-bold truncate uppercase" style={{ color: isActive ? playerColor : 'rgb(148, 163, 184)' }}>{song.coverArtist}</p>
                                                                </div>
                                                            </div>
                                                            <div className="size-8 rounded-full border border-white/10 flex items-center justify-center group-hover/item:bg-white/10 transition-all">
                                                                <MdPlayArrow className="text-white text-lg" />
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                        <button onClick={() => setIsSearchOpen(!isSearchOpen)} className="flex items-center justify-center rounded-lg h-10 w-10 bg-white/5 hover:bg-white/10 transition-colors">
                            <MdSearch className="text-white text-xl" />
                        </button>
                        <button onClick={() => setIsSettingsOpen(!isSettingsOpen)} className="flex items-center justify-center rounded-lg h-10 w-10 bg-white/5 hover:bg-white/10 transition-colors">
                            <MdSettings className="text-white text-xl" />
                        </button>
                    </div>
                </header>

                <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 px-8 overflow-hidden relative">
                    {/* Settings Panel Overlay */}
                    {isSettingsOpen && (
                        <div className="absolute inset-0 z-50 flex items-center justify-center p-8 bg-black/60 backdrop-blur-sm animate-fade-in">
                            <div className="glass p-8 rounded-3xl border border-white/20 w-full max-w-2xl shadow-2xl space-y-8 overflow-y-auto max-h-[80%]">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-2xl font-black uppercase italic tracking-tighter">Audio Settings</h3>
                                    <button onClick={() => setIsSettingsOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                                        <MdClose />
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    <div className="space-y-6">
                                        <div className="space-y-4">
                                            <h4 className="text-sm font-bold uppercase tracking-widest text-slate-500">Visuals & Performance</h4>
                                            <div className="flex flex-col gap-4">
                                                <label className="flex items-center justify-between cursor-pointer group">
                                                    <span className="text-sm font-medium group-hover:text-white transition-colors">Show Visualizer</span>
                                                    <input type="checkbox" checked={showVisualizer} onChange={(e) => setShowVisualizer(e.target.checked)} className="accent-[#ff007a]" />
                                                </label>
                                                <label className="flex items-center justify-between cursor-pointer group">
                                                    <span className="text-sm font-medium group-hover:text-white transition-colors">Performance (Hide Video)</span>
                                                    <input type="checkbox" checked={performanceMode} onChange={(e) => setPerformanceMode(e.target.checked)} className="accent-[#ff007a]" />
                                                </label>
                                                <div className="space-y-2">
                                                    <span className="text-sm font-medium">Player Accent Color</span>
                                                    <div className="flex gap-3">
                                                        {['#ff007a', '#0db9f2', '#ffbf00', '#7a00ff', '#00ff88'].map(c => (
                                                            <button key={c} onClick={() => setPlayerColor(c)} className={`size-8 rounded-full border-2 transition-all ${playerColor === c ? 'border-white scale-110' : 'border-transparent hover:scale-105'}`} style={{ backgroundColor: c }} />
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h4 className="text-sm font-bold uppercase tracking-widest text-slate-500">DJ Mixer (Equalizer)</h4>
                                        <div className="flex justify-between items-end h-40 gap-4 bg-black/20 p-4 rounded-2xl border border-white/5">
                                            {eqBands.map((gain, i) => (
                                                <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full">
                                                    <div className="flex-1 relative w-2 bg-white/5 rounded-full overflow-hidden">
                                                        <input
                                                            type="range" min="-12" max="12" step="0.5" value={gain}
                                                            onChange={(e) => {
                                                                const newBands = [...eqBands];
                                                                newBands[i] = Number(e.target.value);
                                                                setEqBands(newBands);
                                                            }}
                                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer vertical-slider z-10"
                                                            style={{ transform: 'rotate(-90deg)', width: '120px', left: '-55px', top: '55px' }}
                                                        />
                                                        <div className="absolute bottom-0 left-0 w-full" style={{ height: `${((gain + 12) / 24) * 100}%`, backgroundColor: playerColor }}></div>
                                                    </div>
                                                    <span className="text-[10px] font-bold text-slate-500 uppercase">{['60', '250', '1k', '4k', '16k'][i]}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Left Content: Album Art & Visualizer */}
                    <div className={`${(showLyrics || showPlaylist || showLocalLibrary) ? 'lg:col-span-7' : 'lg:col-span-12'} flex flex-col items-center justify-center p-4 relative transition-all duration-700`}>
                        <div className="max-w-2xl w-full space-y-10">
                            <div className="flex justify-center">
                                <div className="relative group">
                                    <div className={`absolute -inset-4 rounded-2xl blur-3xl transition duration-1000 ${isPlaying ? 'opacity-80 scale-110' : 'opacity-50'}`} style={{ backgroundColor: `${playerColor}33` }}></div>
                                    <div className="relative glass p-2 rounded-3xl shadow-2xl border border-white/10 transition-transform duration-700 ease-in-out" style={{ transform: isPlaying ? 'scale(1.02)' : 'scale(1)' }}>
                                        <div className="aspect-square w-64 md:w-80 rounded-2xl overflow-hidden shadow-2xl relative bg-black/20">
                                            <img className="w-full h-full object-cover" src={currentSong?.coverUrl || "https://img.freepik.com/vector-gratis/gato-lindo-escuchando-musica-telefono-auriculares-icono-vectorial-dibujos-animados-ilustracion-tecnologia-animal_138676-11290.jpg"} alt={currentSong?.title || "No song"} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="text-center space-y-3">
                                <div className="flex items-center justify-center gap-4">
                                    <h1 className="text-4xl font-bold tracking-tight text-white">{currentSong?.title || "No hay canción seleccionada"}</h1>
                                    <button onClick={() => setIsFavorite(!isFavorite)} className={`transition-all duration-300 ${isFavorite ? 'scale-110' : 'text-slate-400 hover:text-white'}`} style={{ color: isFavorite ? '#ff2d55' : '' }}>
                                        {isFavorite ? <MdFavorite className="text-2xl" /> : <MdFavoriteBorder className="text-2xl" />}
                                    </button>
                                </div>
                                <p className="text-xl font-medium tracking-wide" style={{ color: playerColor }}>{currentSong?.coverArtist || ""}</p>

                                <div className="flex items-center justify-center gap-1.5 h-16 mt-8">
                                    {visualizerData.slice(0, 40).map((h, i) => (
                                        <div key={i} className="w-1.5 rounded-full bg-current transition-all duration-75 shadow-[0_0_10px_rgba(0,0,0,0.2)]" style={{ height: `${Math.max(15, h * 1.2)}%`, backgroundColor: playerColor, color: playerColor, opacity: 0.6 + (h / 200) }} />
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Main Visualizer - only shown when side panels are hidden and not in performance mode */}
                    </div>

                    {/* Right Content */}
                    {(showLyrics || showPlaylist || showLocalLibrary) && (
                        <div className={`lg:col-span-5 glass border-l border-white/10 flex flex-col overflow-hidden transition-all duration-700 rounded-3xl my-8 ${searchQuery ? 'scale-90 opacity-40 blur-sm pointer-events-none translate-x-12' : 'scale-100 opacity-100 blur-0'}`}>
                            {showLyrics && !isLocalSong && !showLocalLibrary && (
                                <div className="flex-1 flex flex-col overflow-hidden border-b border-white/5 transition-all duration-500">
                                    <div className="px-8 pt-6 pb-2 flex items-center justify-between">
                                        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Lyrics</h3>
                                        <button onClick={() => setShowLyrics(false)} className="text-slate-500 hover:text-white transition-colors"><MdOpenInFull className="text-sm" /></button>
                                    </div>
                                    <div ref={lyricsContainerRef} className="flex-1 overflow-y-auto custom-scrollbar px-8 py-4 space-y-6 lyrics-mask">
                                        {currentSong?.lyrics?.map((lyric, index) => (
                                            <p key={index} className={`font-bold transition-all duration-500 cursor-pointer ${index === currentLyricIndex ? 'text-2xl text-white' : 'text-xl text-slate-500/50 hover:text-slate-300'}`} style={{ textShadow: index === currentLyricIndex ? `0 0 20px ${playerColor}80` : '' }} onClick={() => { const time = parseTimestamp(lyric.time); if (audioRef.current) audioRef.current.currentTime = time; setCurrentTime(time); setIsPlaying(true); }}>{lyric.text}</p>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {showPlaylist && !showLocalLibrary && (
                                <div className="flex-1 flex flex-col overflow-hidden transition-all duration-500">
                                    <div className="px-8 pt-6 pb-2 flex items-center justify-between">
                                        <div className="flex flex-col">
                                            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Up Next</h3>
                                            <p className="text-[10px] font-bold" style={{ color: playerColor }}>SonicWave Radio • Mix for You</p>
                                        </div>
                                        <button onClick={() => setShowPlaylist(false)} className="text-slate-500 hover:text-white transition-colors"><MdClose className="text-sm" /></button>
                                    </div>
                                    <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-4 space-y-1">
                                        {filteredPlaylist.map((song) => {
                                            const idxInOrig = playlist.findIndex(s => s.id === song.id);
                                            const isActive = idxInOrig === currentSongIndex;
                                            return (
                                                <div key={song.id} onClick={() => { setCurrentSongIndex(idxInOrig); setIsPlaying(true); }} className={`flex items-center gap-4 p-3 rounded-xl transition-all group cursor-pointer border ${isActive ? 'bg-white/5 border-white/10' : 'border-transparent hover:bg-white/5 hover:border-white/5'}`}>
                                                    <div className="relative size-10 rounded-lg overflow-hidden flex-shrink-0">
                                                        <img className={`w-full h-full object-cover ${!isActive ? 'grayscale group-hover:grayscale-0' : ''}`} src={song.coverUrl} alt={song.title} />
                                                        {isActive && <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: `${playerColor}99` }}><MdEqualizer className="text-white text-xl animate-pulse" /></div>}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className={`text-xs font-bold truncate ${isActive ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>{song.title}</h4>
                                                        <p className={`text-[10px] font-medium truncate ${isActive ? '' : 'text-slate-500 group-hover:text-white'}`} style={{ color: isActive ? playerColor : '' }}>{song.coverArtist}</p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {filteredPlaylist.length === 0 && <div className="text-center py-10 text-slate-500 text-sm italic">No records found...</div>}
                                    </div>
                                </div>
                            )}

                            {showLocalLibrary && (
                                <div className="flex-1 flex flex-col overflow-hidden transition-all duration-500">
                                    <div className="px-8 pt-6 pb-2 flex items-center justify-between">
                                        <div className="flex flex-col">
                                            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Tu Biblioteca</h3>
                                            <p className="text-[10px] font-bold" style={{ color: playerColor }}>Archivos locales</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => fileInputRef.current?.click()} className="text-slate-400 hover:text-white transition-colors" title="Subir canción">
                                                <MdAddCircle className="text-xl" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-4 space-y-1">
                                        {filteredLocalLibrary.map((song) => {
                                            const idxInOrig = playlist.findIndex(s => s.id === song.id);
                                            const isActive = idxInOrig === currentSongIndex;
                                            return (
                                                <div key={song.id} onClick={() => { setCurrentSongIndex(idxInOrig); setIsPlaying(true); }} className={`flex items-center gap-4 p-3 rounded-xl transition-all group cursor-pointer border ${isActive ? 'bg-white/5 border-white/10' : 'border-transparent hover:bg-white/5 hover:border-white/5'}`}>
                                                    <div className="relative size-10 rounded-lg overflow-hidden flex-shrink-0">
                                                        <img className={`w-full h-full object-cover ${!isActive ? 'grayscale group-hover:grayscale-0' : ''}`} src={song.coverUrl} alt={song.title} />
                                                        {isActive && <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: `${playerColor}99` }}><MdEqualizer className="text-white text-xl animate-pulse" /></div>}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className={`text-xs font-bold truncate ${isActive ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>{song.title}</h4>
                                                        <p className={`text-[10px] font-medium truncate ${isActive ? '' : 'text-slate-500 group-hover:text-white'}`} style={{ color: isActive ? playerColor : '' }}>{song.coverArtist}</p>
                                                    </div>
                                                    <button
                                                        onClick={(e) => handleDeleteSong(song.id, e)}
                                                        className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-all ml-auto flex-shrink-0"
                                                        title="Eliminar canción"
                                                    >
                                                        <MdDelete className="text-base" />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                        {filteredLocalLibrary.length === 0 && (
                                            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                                                <MdLibraryMusic className="text-5xl text-slate-700" />
                                                <p className="text-slate-500 text-sm italic">{searchQuery ? 'No se encontraron resultados' : 'No se encontraron canciones'}</p>
                                                {!searchQuery && <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 rounded-full border border-white/10 hover:bg-white/5 transition-colors text-xs font-bold uppercase tracking-widest">Subir Canción</button>}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </main>

                <footer className="h-28 bg-[#080c0e]/80 backdrop-blur-2xl border-t border-white/10 flex flex-col justify-center px-10 z-30 shrink-0">
                    <div className="max-w-6xl mx-auto w-full space-y-4">
                        <div className="flex items-center gap-4 w-full group">
                            <span className="text-[10px] font-bold text-slate-500 w-10">{formatTime(currentTime)}</span>
                            <div className="relative flex-1 h-1 bg-white/10 rounded-full overflow-visible">
                                <input type="range" min="0" max={duration || 0} value={currentTime} onChange={handleSeek} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" />
                                <div className="absolute top-0 left-0 h-full rounded-full transition-all duration-150" style={{ width: `${(currentTime / (duration || 1)) * 100}%`, backgroundColor: playerColor, boxShadow: `0 0 15px ${playerColor}80` }}>
                                    <div className="absolute right-0 top-1/2 -translate-y-1/2 size-3 bg-white rounded-full shadow-xl scale-0 group-hover:scale-100 transition-transform"></div>
                                </div>
                            </div>
                            <span className="text-[10px] font-bold text-slate-500 w-10 text-right">{formatTime(duration)}</span>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 w-1/4">
                                <div className="size-12 rounded-lg overflow-hidden shrink-0 border border-white/5">
                                    <img className="w-full h-full object-cover" src={currentSong?.coverUrl || "https://img.freepik.com/vector-gratis/gato-lindo-escuchando-musica-telefono-auriculares-icono-vectorial-dibujos-animados-ilustracion-tecnologia-animal_138676-11290.jpg"} alt={currentSong?.title || "No song"} />
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span className="text-sm font-bold truncate text-white">{currentSong?.title || "Seleccionar música"}</span>
                                    <span className="text-xs font-medium truncate" style={{ color: playerColor }}>{currentSong?.coverArtist || ""}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-8">
                                <button 
                                    onClick={() => setIsShuffle(!isShuffle)} 
                                    className={`transition-colors ${isShuffle ? 'text-white' : 'text-slate-400 hover:text-white'}`}
                                    style={{ color: isShuffle ? playerColor : '' }}
                                    title="Shuffle"
                                >
                                    <MdShuffle />
                                </button>
                                <button onClick={handlePrevious} className="text-white text-3xl hover:text-white transition-colors" style={{ color: playerColor }}><MdSkipPrevious /></button>
                                <button onClick={handlePlayPause} className="size-14 rounded-full flex items-center justify-center text-[#080c0e] shadow-lg hover:scale-105 active:scale-[0.98] transition-all" style={{ backgroundColor: playerColor, boxShadow: `0 10px 15px -3px ${playerColor}66` }}>
                                    {isPlaying ? <MdPause className="text-4xl" /> : <MdPlayArrow className="text-4xl" />}
                                </button>
                                <button onClick={handleNext} className="text-white text-3xl hover:text-white transition-colors" style={{ color: playerColor }}><MdSkipNext /></button>
                                <button 
                                    onClick={() => setIsLoop(!isLoop)} 
                                    className={`transition-colors ${isLoop ? 'text-white' : 'text-slate-400 hover:text-white'}`}
                                    style={{ color: isLoop ? playerColor : '' }}
                                    title="Repeat One"
                                >
                                    <MdRepeat />
                                </button>
                            </div>

                            <div className="flex items-center justify-end gap-6 w-1/4">
                                <div className="flex items-center gap-3">
                                    <button onClick={() => setIsMuted(!isMuted)} className="text-slate-400 hover:text-white transition-colors">{isMuted || volume === 0 ? <MdVolumeOff /> : <MdVolumeUp />}</button>
                                    <div className="w-20 h-1 bg-white/10 rounded-full relative">
                                        <input type="range" min="0" max="1" step="0.01" value={isMuted ? 0 : volume} onChange={(e) => { setVolume(Number(e.target.value)); setIsMuted(false); }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                                        <div className="absolute top-0 left-0 h-full rounded-full transition-all" style={{ width: `${(isMuted ? 0 : volume) * 100}%`, backgroundColor: playerColor }}></div>
                                    </div>
                                </div>
                                {!showLocalLibrary && (
                                    <>
                                        <button onClick={() => { setShowLyrics(!showLyrics); setShowPlaylist(false); }} className={`transition-all ${showLyrics ? 'scale-110' : 'text-slate-400 hover:text-white'}`} style={{ color: showLyrics ? playerColor : '' }}><MdMic /></button>
                                        <button onClick={() => { setShowPlaylist(!showPlaylist); setShowLyrics(false); }} className={`transition-all ${showPlaylist ? 'scale-110' : 'text-slate-400 hover:text-white'}`} style={{ color: showPlaylist ? playerColor : '' }}><MdQueueMusic /></button>
                                    </>
                                )}
                                <button onClick={toggleFullscreen} className="text-slate-400 hover:text-white transition-colors"><MdFullscreen /></button>
                            </div>
                        </div>
                    </div>
                </footer>
            </div>

            <audio 
                ref={audioRef} 
                src={currentSong?.audioUrl || ""} 
                crossOrigin="anonymous" 
                onTimeUpdate={handleTimeUpdate} 
                onLoadedMetadata={handleLoadedMetadata} 
                onEnded={() => {
                    if (isLoop) {
                        if (audioRef.current) {
                            audioRef.current.currentTime = 0;
                            audioRef.current.play();
                        }
                    } else {
                        handleNext();
                    }
                }} 
            />

            <style jsx>{`
                .glass { background: rgba(16, 30, 34, 0.4); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.05); }
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
                @keyframes pulse-soft { 0%, 100% { transform: scale(1); opacity: 0.4; } 50% { transform: scale(1.05); opacity: 0.6; } }
                .animate-pulse-slow { animation: pulse-soft 8s infinite ease-in-out; }
                .visualizer-bar { transition: height 0.1s ease-in-out; }
                .lyrics-mask { mask-image: linear-gradient(to bottom, transparent, black 15%, black 85%, transparent); -webkit-mask-image: linear-gradient(to bottom, transparent, black 15%, black 85%, transparent); }
            `}</style>
        </div>
    );
};

export default MusicPlayer;
