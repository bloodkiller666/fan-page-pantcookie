'use client';
import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
    MdAddCircle, MdClose, MdDelete, MdEqualizer, MdFullscreen, MdGraphicEq, MdLibraryMusic, MdPause, MdPlayArrow,
    MdQueueMusic, MdRepeat, MdSearch, MdSettings, MdShuffle, MdSkipNext, MdSkipPrevious, MdVolumeOff, MdVolumeUp, MdMic,
} from 'react-icons/md';
import { musicData as initialMusicData } from '../../utils/musicData';
import { useLanguage } from '../../context/LanguageContext';
import { initDB } from '../../utils/db';
import GameDialog from '../game/GameDialog';

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

type Panel = 'lyrics' | 'queue' | 'library';

const BARS = 32;
const ACCENTS = ['#ff007f', '#0070ff', '#00f3ff', '#ffee00', '#fde0f6'];
const FALLBACK_COVER = 'https://img.freepik.com/vector-gratis/gato-lindo-escuchando-musica-telefono-auriculares-icono-vectorial-dibujos-animados-ilustracion-tecnologia-animal_138676-11290.jpg';

const formatTime = (time: number) => {
    if (!Number.isFinite(time)) return '0:00';
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

const MusicPlayer = () => {
    const { t } = useLanguage();

    // -- State --
    const [playlist, setPlaylist] = useState<Song[]>(initialMusicData);
    const [localLibrary, setLocalLibrary] = useState<Song[]>([]);
    const [panel, setPanel] = useState<Panel>('lyrics');
    const [currentSongIndex, setCurrentSongIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(0.7);
    const [isMuted, setIsMuted] = useState(false);
    const [isShuffle, setIsShuffle] = useState(false);
    const [isLoop, setIsLoop] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [playerColor, setPlayerColor] = useState(ACCENTS[0]);
    const [showVisualizer, setShowVisualizer] = useState(true);
    const [performanceMode, setPerformanceMode] = useState(false);
    const [isVideoLoading, setIsVideoLoading] = useState(false);
    const [eqBands, setEqBands] = useState([0, 0, 0, 0, 0]);

    // -- Refs --
    const audioRef = useRef<HTMLAudioElement>(null);
    const lyricsContainerRef = useRef<HTMLUListElement>(null);
    const bgVideoRef = useRef<HTMLVideoElement>(null);
    const playerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const eqNodesRef = useRef<BiquadFilterNode[]>([]);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const dataArrayRef = useRef<Uint8Array | null>(null);
    const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
    const barRefs = useRef<(HTMLSpanElement | null)[]>([]);
    const levelsRef = useRef<number[]>(new Array(BARS).fill(0));

    // -- Load library & settings --
    useEffect(() => {
        const loadLocalLibrary = async () => {
            try {
                const db = await initDB();
                const request = db.transaction('library', 'readonly').objectStore('library').getAll();
                request.onsuccess = () => {
                    const songs = request.result.map((song) => ({ ...song, audioUrl: URL.createObjectURL(song.audioFile) }));
                    setLocalLibrary(songs);
                    setPlaylist([...initialMusicData, ...songs]);
                };
            } catch (error) {
                console.error('Error loading the local library:', error);
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
            } catch (e) {
                console.error(e);
            }
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('music_player_settings', JSON.stringify({ color: playerColor, visualizer: showVisualizer, performance: performanceMode, eq: eqBands }));
    }, [playerColor, showVisualizer, performanceMode, eqBands]);

    // -- Audio graph: 5-band EQ -> analyser -> output --
    const initAudioContext = useCallback(() => {
        if (audioContextRef.current) return;

        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const context = new AudioContextClass();
        const analyser = context.createAnalyser();
        const gainNode = context.createGain();

        if (!sourceRef.current && audioRef.current) {
            sourceRef.current = context.createMediaElementSource(audioRef.current);
        }
        if (!sourceRef.current) return;

        const frequencies = [60, 250, 1000, 4000, 16000];
        let lastNode: AudioNode = sourceRef.current;
        eqNodesRef.current = frequencies.map((freq, i) => {
            const filter = context.createBiquadFilter();
            filter.type = 'peaking';
            filter.frequency.value = freq;
            filter.Q.value = 1;
            filter.gain.value = eqBands[i];
            lastNode.connect(filter);
            lastNode = filter;
            return filter;
        });

        lastNode.connect(analyser);
        analyser.connect(gainNode);
        gainNode.connect(context.destination);

        analyser.fftSize = 128;
        audioContextRef.current = context;
        analyserRef.current = analyser;
        dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
    }, [eqBands]);

    useEffect(() => {
        eqNodesRef.current.forEach((node, i) => {
            node.gain.value = eqBands[i];
        });
    }, [eqBands]);

    // Create the audio graph on the first play (browsers require a user gesture)
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;
        const handleStart = () => {
            initAudioContext();
            if (audioContextRef.current?.state === 'suspended') audioContextRef.current.resume();
        };
        audio.addEventListener('play', handleStart);
        return () => audio.removeEventListener('play', handleStart);
    }, [initAudioContext]);

    // Visualizer: writes straight to the bar elements, so React never re-renders at 60fps.
    useEffect(() => {
        if (!showVisualizer) return;
        let raf = 0;
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        const paint = () => {
            levelsRef.current.forEach((level, i) => {
                const el = barRefs.current[i];
                if (el) el.style.transform = `scaleY(${0.1 + level * 0.9})`;
            });
        };

        const tick = () => {
            const analyser = analyserRef.current;
            const data = dataArrayRef.current;
            let alive = false;

            if (analyser && data && isPlaying && !reduce) {
                analyser.getByteFrequencyData(data as Uint8Array<ArrayBuffer>);
                const step = Math.max(1, Math.floor(data.length / BARS));
                for (let i = 0; i < BARS; i++) {
                    let sum = 0;
                    for (let j = 0; j < step; j++) sum += data[i * step + j] ?? 0;
                    levelsRef.current[i] = isMuted ? 0 : sum / step / 255;
                }
                alive = true;
            } else {
                // Ease back down, then stop looping once everything is at rest
                levelsRef.current = levelsRef.current.map((v) => v * 0.88);
                alive = levelsRef.current.some((v) => v > 0.01);
            }

            paint();
            if (alive || isPlaying) raf = requestAnimationFrame(tick);
        };

        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [isPlaying, isMuted, showVisualizer]);

    // -- Local library --
    const extractAlbumArt = (file: File): Promise<string | null> =>
        new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (ev) => {
                try {
                    const bytes = new Uint8Array(ev.target?.result as ArrayBuffer);
                    if (bytes[0] !== 0x49 || bytes[1] !== 0x44 || bytes[2] !== 0x33) return resolve(null);
                    let offset = 10;
                    while (offset < bytes.length - 10) {
                        const frameId = String.fromCharCode(bytes[offset], bytes[offset + 1], bytes[offset + 2], bytes[offset + 3]);
                        const frameSize = (bytes[offset + 4] << 24) | (bytes[offset + 5] << 16) | (bytes[offset + 6] << 8) | bytes[offset + 7];
                        if (frameSize <= 0 || frameSize > 5_000_000) break;
                        if (frameId === 'APIC') {
                            let pos = offset + 11;
                            let mime = '';
                            while (bytes[pos] !== 0 && pos < bytes.length) mime += String.fromCharCode(bytes[pos++]);
                            pos += 2;
                            while (bytes[pos] !== 0 && pos < bytes.length) pos++;
                            pos++;
                            const imgData = bytes.slice(pos, offset + 10 + frameSize);
                            return resolve(URL.createObjectURL(new Blob([imgData], { type: mime })));
                        }
                        offset += 10 + frameSize;
                    }
                    resolve(null);
                } catch {
                    resolve(null);
                }
            };
            reader.onerror = () => resolve(null);
            reader.readAsArrayBuffer(file.slice(0, 65536)); // ID3 tags always sit at the start
        });

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        e.target.value = '';
        if (files.length === 0) return;

        // Read metadata first so the IndexedDB transaction does not time out
        const songDataArr = await Promise.all(
            files.map(async (file) => {
                const albumArt = await extractAlbumArt(file);
                const fullFileName = file.name.replace(/\.[^/.]+$/, '');
                let artist = t('multimedia.music.localFiles');
                let title = fullFileName;
                if (fullFileName.includes(' - ')) {
                    const parts = fullFileName.split(' - ');
                    artist = parts[0].trim();
                    title = parts.slice(1).join(' - ').trim();
                }
                return {
                    file,
                    newSong: {
                        id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
                        title,
                        coverArtist: artist,
                        audioUrl: URL.createObjectURL(file),
                        coverUrl: albumArt || FALLBACK_COVER,
                        lyrics: [{ time: 0, text: t('multimedia.music.noLyrics') }],
                    } as Song,
                };
            })
        );

        try {
            const db = await initDB();
            const tx = db.transaction('library', 'readwrite');
            const store = tx.objectStore('library');
            for (const { file, newSong } of songDataArr) store.add({ ...newSong, audioFile: file });
            tx.oncomplete = () => {
                const newSongs = songDataArr.map((s) => s.newSong);
                setLocalLibrary((prev) => [...prev, ...newSongs]);
                setPlaylist((prev) => [...prev, ...newSongs]);
            };
        } catch (err) {
            console.error('Error saving to IndexedDB:', err);
        }
    };

    const handleDeleteSong = async (songId: string | number, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            const db = await initDB();
            db.transaction('library', 'readwrite').objectStore('library').delete(songId as IDBValidKey);

            const deletedIndex = playlist.findIndex((s) => s.id === songId);
            setLocalLibrary((prev) => prev.filter((s) => s.id !== songId));
            setPlaylist((prev) => {
                const newList = prev.filter((s) => s.id !== songId);
                if (deletedIndex === currentSongIndex) {
                    if (newList.length === 0) {
                        setCurrentSongIndex(0);
                        setIsPlaying(false);
                    } else if (currentSongIndex >= newList.length) {
                        setCurrentSongIndex(newList.length - 1);
                    }
                } else if (deletedIndex < currentSongIndex) {
                    setCurrentSongIndex((idx) => Math.max(0, idx - 1));
                }
                return newList;
            });
        } catch (err) {
            console.error('Error deleting song:', err);
        }
    };

    // -- Search --
    const matches = useCallback(
        (list: Song[]) => {
            if (!searchQuery) return list;
            const q = searchQuery.toLowerCase();
            return list.filter((song) => song.title.toLowerCase().includes(q) || song.coverArtist.toLowerCase().includes(q));
        },
        [searchQuery]
    );
    const filteredPlaylist = useMemo(() => matches(playlist), [playlist, matches]);
    const filteredLocalLibrary = useMemo(() => matches(localLibrary), [localLibrary, matches]);

    // -- Playback --
    const currentSong = playlist[currentSongIndex];
    const isLocalSong = String(currentSong?.id ?? '').startsWith('local-');
    const showVideo = !performanceMode && !!currentSong?.backgroundVideo && !isLocalSong;

    useEffect(() => {
        if (audioRef.current) audioRef.current.volume = isMuted ? 0 : volume;
    }, [volume, isMuted]);

    useEffect(() => {
        const playMedia = async () => {
            if (isPlaying) {
                try {
                    if (audioRef.current) await audioRef.current.play();
                    if (bgVideoRef.current && showVideo) {
                        setIsVideoLoading(true);
                        await bgVideoRef.current.play();
                    }
                } catch (err) {
                    console.error(err);
                }
            } else {
                audioRef.current?.pause();
                bgVideoRef.current?.pause();
            }
        };
        playMedia();
    }, [isPlaying, currentSongIndex, showVideo]);

    const handleNext = () => {
        if (isShuffle) {
            let next = Math.floor(Math.random() * playlist.length);
            if (playlist.length > 1 && next === currentSongIndex) next = (next + 1) % playlist.length;
            setCurrentSongIndex(next);
        } else {
            setCurrentSongIndex((prev) => (prev + 1) % playlist.length);
        }
        setIsPlaying(true);
    };

    const handlePrevious = () => {
        if (isShuffle) {
            let prev = Math.floor(Math.random() * playlist.length);
            if (playlist.length > 1 && prev === currentSongIndex) prev = (prev - 1 + playlist.length) % playlist.length;
            setCurrentSongIndex(prev);
        } else {
            setCurrentSongIndex((prev) => (prev - 1 + playlist.length) % playlist.length);
        }
        setIsPlaying(true);
    };

    const seekTo = (time: number) => {
        if (audioRef.current) audioRef.current.currentTime = time;
        setCurrentTime(time);
    };

    const currentLyricIndex = currentSong?.lyrics?.findLastIndex((l) => parseTimestamp(l.time) <= currentTime) ?? -1;

    useEffect(() => {
        if (panel !== 'lyrics' || currentLyricIndex < 0 || !lyricsContainerRef.current) return;
        const active = lyricsContainerRef.current.children[currentLyricIndex] as HTMLElement | undefined;
        if (active) lyricsContainerRef.current.scrollTo({ top: active.offsetTop - lyricsContainerRef.current.offsetTop - 120, behavior: 'smooth' });
    }, [currentLyricIndex, panel]);

    const toggleFullscreen = () => {
        if (!playerRef.current) return;
        if (!document.fullscreenElement) playerRef.current.requestFullscreen().catch(console.error);
        else document.exitFullscreen();
    };

    const playSong = (index: number) => {
        setCurrentSongIndex(index);
        setIsPlaying(true);
    };

    if (!currentSong) return null;

    const iconBtn = 'flex h-11 w-11 shrink-0 items-center justify-center border-[3px] border-[var(--line)] transition-colors';

    // A plain render function (not a component): a nested component would remount on every time update and drop focus.
    const songRow = (song: Song, removable = false) => {
        const idx = playlist.findIndex((s) => s.id === song.id);
        const active = idx === currentSongIndex;
        return (
            <li key={song.id}>
                <div className={`flex items-center gap-3 border-[3px] p-2 ${active ? 'border-[var(--line)] bg-[var(--yellow)] text-[var(--ink)] shadow-[3px_3px_0_var(--shadow)]' : 'border-transparent hover:border-[var(--line)] hover:bg-[var(--surface-2)]'}`}>
                    <button type="button" onClick={() => playSong(idx)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                        <span className="relative block h-12 w-12 shrink-0 overflow-hidden border-2 border-[var(--line)] bg-[var(--ink)]">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={song.coverUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
                            {active && isPlaying && (
                                <span className="absolute inset-0 flex items-center justify-center bg-black/50">
                                    <MdEqualizer className="animate-pulse text-2xl text-white" aria-hidden />
                                </span>
                            )}
                        </span>
                        <span className="min-w-0">
                            <span className="block truncate font-display text-base font-bold leading-tight">{song.title}</span>
                            <span className="mt-0.5 flex items-center gap-2 truncate text-sm font-semibold opacity-70">
                                {String(song.id).startsWith('local-') && <span className="tag !px-1.5 !py-1 !text-[0.6rem]">{t('multimedia.music.local')}</span>}
                                {song.coverArtist}
                            </span>
                        </span>
                    </button>
                    {removable && (
                        <button type="button" onClick={(e) => handleDeleteSong(song.id, e)} aria-label={`${t('multimedia.music.remove')}: ${song.title}`} className="flex h-10 w-10 shrink-0 items-center justify-center hover:bg-[var(--pink)] hover:text-[var(--ink)]">
                            <MdDelete className="text-xl" />
                        </button>
                    )}
                </div>
            </li>
        );
    };

    const tabs: { id: Panel; label: string; Icon: typeof MdMic }[] = [
        { id: 'lyrics', label: t('multimedia.music.lyrics'), Icon: MdMic },
        { id: 'queue', label: t('multimedia.music.queue'), Icon: MdQueueMusic },
        { id: 'library', label: t('multimedia.music.library'), Icon: MdLibraryMusic },
    ];

    return (
        <div ref={playerRef} className="bg-[var(--bg)] p-0 fullscreen:overflow-y-auto fullscreen:p-6">
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="audio/*" multiple className="hidden" />

            <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
                {/* Stage */}
                <section aria-label={t('multimedia.music.nowPlaying')}>
                    <div className="bezel shadow-[10px_10px_0_var(--shadow)]">
                        <div className="bezel__screen relative aspect-video bg-black">
                            {showVideo ? (
                                <>
                                    <video
                                        ref={bgVideoRef}
                                        key={currentSong.backgroundVideo}
                                        src={currentSong.backgroundVideo}
                                        poster={currentSong.coverUrl}
                                        loop
                                        muted
                                        playsInline
                                        preload="metadata"
                                        onCanPlay={() => setIsVideoLoading(false)}
                                        onWaiting={() => setIsVideoLoading(true)}
                                        onLoadStart={() => setIsVideoLoading(true)}
                                        className="h-full w-full object-cover"
                                    />
                                    {isVideoLoading && isPlaying && (
                                        <span className="absolute right-3 top-3 flex items-center gap-2 bg-black/70 px-3 py-2" role="status">
                                            <span className="h-4 w-4 animate-spin border-[3px] border-white/40 border-t-white" aria-hidden />
                                        </span>
                                    )}
                                </>
                            ) : (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={currentSong.coverUrl || FALLBACK_COVER} alt={currentSong.title} className="h-full w-full object-contain" />
                            )}
                        </div>
                    </div>

                    <div className="mt-8">
                        <p className="mb-2 flex items-center gap-2 font-display text-sm font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
                            <MdGraphicEq className="text-xl" style={{ color: playerColor }} aria-hidden />
                            {t('multimedia.music.nowPlaying')}
                        </p>
                        <h2 className="font-display text-[clamp(1.8rem,4vw,3rem)] font-bold uppercase leading-[0.95]">{currentSong.title}</h2>
                        <p className="mt-2 font-display text-xl font-bold" style={{ color: playerColor }}>
                            {currentSong.coverArtist}
                        </p>

                        {showVisualizer && (
                            <div className="mt-6 flex h-16 items-end gap-1" aria-hidden>
                                {Array.from({ length: BARS }).map((_, i) => (
                                    <span key={i} ref={(el) => { barRefs.current[i] = el; }} className="h-full w-full origin-bottom scale-y-[0.1] will-change-transform" style={{ backgroundColor: playerColor }} />
                                ))}
                            </div>
                        )}
                    </div>
                </section>

                {/* Side panel */}
                <section className="cart-shell" aria-label={t('multimedia.music.radio')}>
                    <div className="cart">
                        <div className="cart__face">
                            <div role="tablist" className="flex border-b-[3px] border-[var(--line)]">
                                {tabs.map(({ id, label, Icon }) => (
                                    <button
                                        key={id}
                                        type="button"
                                        role="tab"
                                        aria-selected={panel === id}
                                        onClick={() => setPanel(id)}
                                        className={`flex min-h-12 flex-1 items-center justify-center gap-2 font-display text-sm font-bold uppercase tracking-[0.06em] ${panel === id ? 'bg-[var(--pink)] text-[var(--ink)]' : 'bg-[var(--surface-2)] hover:bg-[var(--yellow)] hover:text-[var(--ink)]'}`}
                                    >
                                        <Icon className="text-xl" aria-hidden />
                                        <span className="hidden sm:inline">{label}</span>
                                    </button>
                                ))}
                            </div>

                            {panel !== 'lyrics' && (
                                <div className="relative border-b-[3px] border-[var(--line)] p-3">
                                    <MdSearch className="pointer-events-none absolute left-6 top-1/2 -translate-y-1/2 text-xl text-[var(--muted)]" aria-hidden />
                                    <label htmlFor="music-search" className="sr-only">{t('multimedia.music.search')}</label>
                                    <input id="music-search" type="search" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t('multimedia.music.search')} className="w-full border-[3px] border-[var(--line)] bg-[var(--surface-2)] py-2.5 pl-11 pr-3 font-display text-base font-bold text-[var(--text)] placeholder:font-medium placeholder:text-[var(--muted)] focus:outline-none focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[var(--focus)]" />
                                </div>
                            )}

                            <div className="h-[26rem] overflow-y-auto p-3">
                                {panel === 'lyrics' &&
                                    (currentSong.lyrics?.length && !isLocalSong ? (
                                        <ul ref={lyricsContainerRef} className="space-y-2">
                                            {currentSong.lyrics.map((lyric, index) => (
                                                <li key={index}>
                                                    <button type="button" onClick={() => { seekTo(parseTimestamp(lyric.time)); setIsPlaying(true); }} className={`w-full px-3 py-2 text-left font-display font-bold leading-snug transition-colors ${index === currentLyricIndex ? 'bg-[var(--yellow)] text-xl text-[var(--ink)]' : 'text-lg text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]'}`}>
                                                        {lyric.text}
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="py-16 text-center font-display text-xl font-bold uppercase text-[var(--muted)]">{t('multimedia.music.noLyrics')}</p>
                                    ))}

                                {panel === 'queue' &&
                                    (filteredPlaylist.length ? (
                                        <ul className="space-y-2">{filteredPlaylist.map((song) => songRow(song))}</ul>
                                    ) : (
                                        <p className="py-16 text-center font-display text-xl font-bold uppercase text-[var(--muted)]">{t('multimedia.music.noMatches')}</p>
                                    ))}

                                {panel === 'library' && (
                                    <>
                                        <button type="button" onClick={() => fileInputRef.current?.click()} className="btn btn--ghost mb-3 w-full !min-h-11 !text-sm">
                                            <MdAddCircle className="text-xl" aria-hidden />
                                            {t('multimedia.music.upload')}
                                        </button>
                                        {filteredLocalLibrary.length ? (
                                            <ul className="space-y-2">{filteredLocalLibrary.map((song) => songRow(song, true))}</ul>
                                        ) : (
                                            <div className="py-12 text-center">
                                                <MdLibraryMusic className="mx-auto text-6xl text-[var(--muted)]" aria-hidden />
                                                <p className="mt-3 font-display text-xl font-bold uppercase">{searchQuery ? t('multimedia.music.noMatches') : t('multimedia.music.emptyLibrary')}</p>
                                                {!searchQuery && <p className="mx-auto mt-2 max-w-[28ch] text-base font-medium text-[var(--muted)]">{t('multimedia.music.emptyLibraryHint')}</p>}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                            <div className="pins" aria-hidden />
                        </div>
                    </div>
                </section>
            </div>

            {/* Transport */}
            <div className="cart-shell mt-10">
                <div className="cart">
                    <div className="cart__face space-y-4 p-4 sm:p-5">
                        <div className="flex items-center gap-3">
                            <span className="score w-12 text-right text-[0.55rem]">{formatTime(currentTime)}</span>
                            <input type="range" aria-label={t('multimedia.video.seek')} min={0} max={duration || 0} step={0.1} value={Math.min(currentTime, duration || 0)} onChange={(e) => seekTo(Number(e.target.value))} className="h-3 flex-1 cursor-pointer" style={{ accentColor: playerColor }} />
                            <span className="score w-12 text-[0.55rem]">{formatTime(duration)}</span>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div className="flex min-w-0 items-center gap-3 sm:w-1/4">
                                <span className="block h-12 w-12 shrink-0 overflow-hidden border-[3px] border-[var(--line)] bg-[var(--ink)]">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={currentSong.coverUrl || FALLBACK_COVER} alt="" className="h-full w-full object-cover" />
                                </span>
                                <span className="min-w-0">
                                    <span className="block truncate font-display text-base font-bold">{currentSong.title}</span>
                                    <span className="block truncate text-sm font-semibold text-[var(--muted)]">{currentSong.coverArtist}</span>
                                </span>
                            </div>

                            <div className="flex items-center gap-2 sm:gap-3">
                                <button type="button" onClick={() => setIsShuffle(!isShuffle)} aria-pressed={isShuffle} aria-label={t('multimedia.music.shuffle')} title={t('multimedia.music.shuffle')} className={`${iconBtn} ${isShuffle ? 'bg-[var(--yellow)] text-[var(--ink)]' : 'bg-[var(--surface-2)]'}`}>
                                    <MdShuffle className="text-2xl" />
                                </button>
                                <button type="button" onClick={handlePrevious} aria-label={t('multimedia.music.previous')} className={`${iconBtn} bg-[var(--surface-2)]`}>
                                    <MdSkipPrevious className="text-3xl" />
                                </button>
                                <button type="button" onClick={() => setIsPlaying(!isPlaying)} aria-label={isPlaying ? t('multimedia.music.pause') : t('multimedia.music.play')} className="btn !min-h-14 !min-w-14 !px-4">
                                    {isPlaying ? <MdPause className="text-4xl" /> : <MdPlayArrow className="text-4xl" />}
                                </button>
                                <button type="button" onClick={handleNext} aria-label={t('multimedia.music.next')} className={`${iconBtn} bg-[var(--surface-2)]`}>
                                    <MdSkipNext className="text-3xl" />
                                </button>
                                <button type="button" onClick={() => setIsLoop(!isLoop)} aria-pressed={isLoop} aria-label={t('multimedia.music.repeat')} title={t('multimedia.music.repeat')} className={`${iconBtn} ${isLoop ? 'bg-[var(--yellow)] text-[var(--ink)]' : 'bg-[var(--surface-2)]'}`}>
                                    <MdRepeat className="text-2xl" />
                                </button>
                            </div>

                            <div className="flex items-center justify-end gap-3 sm:w-1/4">
                                <button type="button" onClick={() => setIsMuted(!isMuted)} aria-label={t('multimedia.music.mute')} aria-pressed={isMuted} className={`${iconBtn} bg-[var(--surface-2)]`}>
                                    {isMuted || volume === 0 ? <MdVolumeOff className="text-2xl" /> : <MdVolumeUp className="text-2xl" />}
                                </button>
                                <input type="range" aria-label={t('multimedia.music.volume')} min={0} max={1} step={0.01} value={isMuted ? 0 : volume} onChange={(e) => { setVolume(Number(e.target.value)); setIsMuted(false); }} className="hidden h-2 w-24 cursor-pointer lg:block" style={{ accentColor: playerColor }} />
                                <button type="button" onClick={() => setIsSettingsOpen(true)} aria-label={t('multimedia.music.settings')} title={t('multimedia.music.settings')} className={`${iconBtn} bg-[var(--surface-2)]`}>
                                    <MdSettings className="text-2xl" />
                                </button>
                                <button type="button" onClick={toggleFullscreen} aria-label={t('multimedia.music.fullscreen')} title={t('multimedia.music.fullscreen')} className={`${iconBtn} hidden bg-[var(--surface-2)] sm:flex`}>
                                    <MdFullscreen className="text-2xl" />
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="pins" aria-hidden />
                </div>
            </div>

            <GameDialog open={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} title={t('multimedia.music.settings')} icon={<MdSettings />} tone="cyan" wide>
                <div className="grid gap-8 md:grid-cols-2">
                    <div className="space-y-5">
                        <label className="flex cursor-pointer items-center justify-between gap-4 border-[3px] border-[var(--line)] bg-[var(--surface-2)] px-4 py-3 font-display text-base font-bold uppercase">
                            {t('multimedia.music.visualizer')}
                            <input type="checkbox" checked={showVisualizer} onChange={(e) => setShowVisualizer(e.target.checked)} className="h-5 w-5 accent-[var(--pink)]" />
                        </label>
                        <label className="flex cursor-pointer items-center justify-between gap-4 border-[3px] border-[var(--line)] bg-[var(--surface-2)] px-4 py-3 font-display text-base font-bold uppercase">
                            {t('multimedia.music.performance')}
                            <input type="checkbox" checked={performanceMode} onChange={(e) => setPerformanceMode(e.target.checked)} className="h-5 w-5 accent-[var(--pink)]" />
                        </label>
                        <div>
                            <p className="mb-3 font-display text-sm font-bold uppercase tracking-[0.12em]">{t('multimedia.music.accent')}</p>
                            <div className="flex gap-3">
                                {ACCENTS.map((c) => (
                                    <button key={c} type="button" onClick={() => setPlayerColor(c)} aria-label={c} aria-pressed={playerColor === c} className={`h-11 w-11 border-[3px] ${playerColor === c ? 'border-[var(--text)] shadow-[3px_3px_0_var(--shadow)]' : 'border-[var(--line)]'}`} style={{ backgroundColor: c }} />
                                ))}
                            </div>
                        </div>
                    </div>

                    <div>
                        <p className="mb-3 font-display text-sm font-bold uppercase tracking-[0.12em]">{t('multimedia.music.equalizer')}</p>
                        <ul className="space-y-3">
                            {eqBands.map((gain, i) => (
                                <li key={i} className="flex items-center gap-3">
                                    <span className="score w-10 text-[0.5rem]">{['60', '250', '1k', '4k', '16k'][i]}</span>
                                    <input
                                        type="range"
                                        aria-label={`${['60 Hz', '250 Hz', '1 kHz', '4 kHz', '16 kHz'][i]}`}
                                        min={-12}
                                        max={12}
                                        step={0.5}
                                        value={gain}
                                        onChange={(e) => {
                                            const next = [...eqBands];
                                            next[i] = Number(e.target.value);
                                            setEqBands(next);
                                        }}
                                        className="h-2 flex-1 cursor-pointer"
                                        style={{ accentColor: playerColor }}
                                    />
                                    <span className="score w-10 text-right text-[0.5rem]">{gain > 0 ? `+${gain}` : gain}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
                <button type="button" onClick={() => setIsSettingsOpen(false)} className="btn btn--ghost mt-8 w-full">
                    <MdClose className="text-xl" aria-hidden />
                    {t('multimedia.music.close')}
                </button>
            </GameDialog>

            <audio
                ref={audioRef}
                src={currentSong.audioUrl || ''}
                crossOrigin="anonymous"
                preload="metadata"
                onTimeUpdate={() => audioRef.current && setCurrentTime(audioRef.current.currentTime)}
                onLoadedMetadata={() => audioRef.current && setDuration(audioRef.current.duration)}
                onEnded={() => {
                    if (isLoop && audioRef.current) {
                        audioRef.current.currentTime = 0;
                        audioRef.current.play();
                    } else {
                        handleNext();
                    }
                }}
            />
        </div>
    );
};

export default MusicPlayer;
