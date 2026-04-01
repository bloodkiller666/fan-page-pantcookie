'use client';
import { useEffect, useRef, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { gsap } from 'gsap';
import PuzzleGame from '../components/game/PuzzleGame';
import TriviaGame from '../components/game/trivia/TriviaGame';
import ShuraRunGame from '../components/game/shura-run/ShuraRunGame';
import PlayerInput from '../components/game/PlayerInput';
import { useLanguage } from '../context/LanguageContext';
import Image from 'next/image';
import {
    FaWifi,
    FaThLarge,
    FaPlusCircle,
    FaGlobeAmericas,
    FaNewspaper,
    FaChevronRight
} from 'react-icons/fa';
import { FaBatteryEmpty, FaBatteryQuarter, FaBatteryHalf, FaBatteryThreeQuarters, FaBatteryFull } from 'react-icons/fa';

const GamesContent = () => {
    const { t } = useLanguage();
    const [selected, setSelected] = useState<'puzzle' | 'trivia' | 'shuraRun' | null>(null);
    const [time, setTime] = useState('09:41');
    const [playerName, setPlayerName] = useState('');
    const [showNamePrompt, setShowNamePrompt] = useState(false);
    const searchParams = useSearchParams();
    const containerRef = useRef(null);
    const [batteryLevel, setBatteryLevel] = useState(() => Math.floor(Math.random() * (100 - 20 + 1)) + 20);
    const getBatteryIcon = (level: number) => {
        if (level > 90) return <FaBatteryFull size={24} className="text-neon-volt" />;
        if (level > 60) return <FaBatteryThreeQuarters size={24} className="text-neon-volt" />;
        if (level > 30) return <FaBatteryHalf size={24} className="text-neon-volt" />;
        if (level > 10) return <FaBatteryQuarter size={24} className="text-neon-pink animate-pulse" />;
        return <FaBatteryEmpty size={24} className="text-neon-pink animate-bounce" />;
    };

    useEffect(() => {
        const savedName = localStorage.getItem('playerName');
        if (savedName) {
            setPlayerName(savedName);
        } else {
            setShowNamePrompt(true);
        }
    }, []);

    const handleNameSubmit = () => {
        if (playerName.trim()) {
            localStorage.setItem('playerName', playerName.trim());
            setShowNamePrompt(false);
        }
    };

    useEffect(() => {
        const game = searchParams?.get('game');
        if (game === 'puzzle' || game === 'trivia' || game === 'shuraRun') {
            setSelected(game as 'puzzle' | 'trivia' | 'shuraRun');
        }

        const timer = setInterval(() => {
            const now = new Date();
            setTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
        }, 1000);
        return () => clearInterval(timer);
    }, [searchParams]);

    useEffect(() => {
        if (!selected) {
            const ctx = gsap.context(() => {
                gsap.from("header, h1, .flex.gap-2", {
                    y: -20,
                    opacity: 0,
                    duration: 0.6,
                    ease: "power2.out",
                    stagger: 0.1,
                    delay: 0.8
                });

                gsap.from(".game-card", {
                    scale: 0.8,
                    opacity: 0,
                    y: 40,
                    duration: 0.8,
                    stagger: 0.15,
                    ease: "back.out(1.5)",
                    clearProps: "all",
                    delay: 0.9
                });

                gsap.from("footer", {
                    y: 50,
                    opacity: 0,
                    duration: 1,
                    ease: "expo.out",
                    delay: 1.2
                });
            }, containerRef);
            return () => ctx.revert();
        }
    }, [selected]);

    if (selected) {
        return (
            <div className="min-h-screen bg-[#fff5f9] dark:bg-background-dark bg-grid py-24 px-4 md:px-12 relative overflow-hidden transition-colors duration-300">
                <div className="relative z-10 max-w-7xl mx-auto">
                    <div className="animate-fade-in-up">
                        {selected === 'puzzle' && <PuzzleGame playerName={playerName} />}
                        {selected === 'trivia' && <TriviaGame playerName={playerName} />}
                        {selected === 'shuraRun' && <ShuraRunGame playerName={playerName} />}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div ref={containerRef} className="relative min-h-screen w-full flex flex-col bg-[#fff5f9] dark:bg-background-dark bg-grid overflow-hidden selection:bg-neon-pink selection:text-white transition-colors duration-300">
            <header className="relative z-20 flex items-center justify-between px-6 md:px-12 py-6 border-b border-zinc-200 dark:border-white/10 bg-white/40 dark:bg-black/40 backdrop-blur-md">
                <div className="flex items-center gap-4 md:gap-6">
                    <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-neon-pink to-neon-cyan rounded-full blur opacity-75 group-hover:opacity-100 transition duration-1000" />
                        <div className="relative size-12 md:size-14 rounded-full border-2 border-white/50 overflow-hidden bg-zinc-800 shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                            <Image className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuABVsRxBoEYrSO8zJK96Nfrr7MJeqB3VXJfmhZ9vKKBOdnjtRIBvysl-xVaJ0HyG2u9NwL33d2vpq-MppjNtqHFvHVF13PqbXN2oiCzWl-qnAqdVcD0TmQ1wn6R5dBRZ-Feyid9VbmU2YguRr2gQ5z9g0XWXGgYi6CrO5SGkCsTI2S0VcyhM9nPN8XSVWuvB9ve-xypTaXjuSr5ugxyoeBIG-imklrJ9TE5dzWFzhCSE3Gr2_t9NCVXY9zNfhoMyDvr_WLWuvXntRc" alt="Avatar" width={56} height={56} />
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <h2 onClick={() => setShowNamePrompt(true)} className="text-zinc-900 dark:text-white text-base md:text-xl font-bold tracking-tight italic uppercase neon-text-pink leading-none mb-1 cursor-pointer hover:opacity-80 transition-opacity">
                            {playerName || 'Trainer Pika'}
                        </h2>
                        <div className="flex items-center gap-2">
                            <span className="text-neon-volt text-[10px] font-bold px-1.5 py-0.5 border border-neon-volt/50 rounded italic whitespace-nowrap">LV 99</span>
                            <div className="w-16 md:w-24 h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden border border-zinc-300 dark:border-white/5">
                                <div className="w-[85%] h-full bg-neon-volt shadow-[0_0_8px_#ccff00]" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4 md:gap-8">
                    <div className="hidden sm:flex items-center gap-4 text-zinc-500 dark:text-white/70">
                        <FaWifi size={22} className="text-neon-cyan animate-pulse" />
                        <div className="flex items-center gap-2">
                            {getBatteryIcon(batteryLevel)}
                            <span className={`text-sm font-bold italic ${batteryLevel <= 30 ? 'text-neon-pink' : 'text-zinc-900 dark:text-white'}`}>
                                {batteryLevel}%
                            </span>
                        </div>
                    </div>
                    <h1 className="text-zinc-900 dark:text-white text-2xl md:text-3xl font-black italic tracking-tighter neon-text-cyan">{time}</h1>
                </div>
            </header>

            <main className="relative z-10 flex-1 flex flex-col px-6 md:px-12 py-10 md:py-16 justify-center">
                <div className="flex items-center justify-between mb-8 md:mb-12">
                    <h1 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter text-zinc-900 dark:text-white/90">
                        Mis <span className="text-primary-pink neon-text-pink">Juegos</span>
                    </h1>
                    <div className="flex gap-2">
                        <button className="bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 p-2 rounded-lg border border-zinc-200 dark:border-white/10 transition-colors text-zinc-600 dark:text-white">
                            <FaThLarge size={20} />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8 items-start">
                    <div onClick={() => setSelected('puzzle')} className="game-card group relative aspect-square cursor-pointer transform transition-all duration-300 hover:scale-[1.03] active:scale-[0.98]">
                        <div className="absolute -inset-0.5 bg-neon-pink rounded-2xl blur opacity-0 group-hover:opacity-80 transition duration-300" />
                        <div className="relative h-full flex flex-col rounded-2xl overflow-hidden border-2 border-neon-pink/40 glow-pink bg-zinc-900 transition-colors group-hover:border-neon-pink">
                            <div className="h-full w-full bg-cover bg-center transition-transform duration-700 group-hover:scale-110" style={{ backgroundImage: `linear-gradient(to top, rgba(0,0,0,0.9), transparent), url('https://lh3.googleusercontent.com/aida-public/AB6AXuAPYRsIWbUqNh-a-VWR_MO8g3khJ6eVMNX6l3H5fGPrUnEp01Ml2s40NsSvlvtiTugefIBHdWXFvpoW1Spin-uS77FQg9MXgAGwETbGisA0l-KLocksxXidPCAfLzLKLDN7np1hrP5S3aTv-YIdLwCIMV-66Vkjv2kVfQEi7UrO_Ev_Pcfs6kE5soxk7nbBk3M4FrD0Ezo5GotWMcnP64qcdaZfCUGC2ttpMGPwOPi0CvuAWp0Bp4YDnMR-wH4NnS5u_JdcX3Gto3c')` }} />
                            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                                <h3 className="text-2xl md:text-3xl font-black italic text-white uppercase tracking-tighter neon-text-pink leading-none mb-2">{t('games.options.puzzleTitle')}</h3>
                                <div className="flex items-center gap-2">
                                    <span className="size-2 rounded-full bg-neon-pink shadow-[0_0_10px_#ff007a] animate-pulse" />
                                    <p className="text-neon-pink/90 text-[10px] font-bold uppercase tracking-[0.2em]">Puzzle Royale</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Card 2: PREGUNTADOS - Brillo Intensificado */}
                    <div onClick={() => setSelected('trivia')} className="game-card group relative aspect-square cursor-pointer transform transition-all duration-300 hover:scale-[1.03] active:scale-[0.98]">
                        <div className="absolute -inset-0.5 bg-neon-cyan rounded-2xl blur opacity-0 group-hover:opacity-80 transition duration-300" />
                        <div className="relative h-full flex flex-col rounded-2xl overflow-hidden border-2 border-neon-cyan/40 glow-cyan bg-zinc-900 transition-colors group-hover:border-neon-cyan">
                            <div className="h-full w-full bg-cover bg-center transition-transform duration-700 group-hover:scale-110" style={{ backgroundImage: `linear-gradient(to top, rgba(0,0,0,0.9), transparent), url('https://lh3.googleusercontent.com/aida-public/AB6AXuBy-_fx_lxjGNHUxeykasMYI7eCci5mIMRdbli2KJoQ6ZOh8zPX5DsPI2KOsFqJc9HcSLBsDlcI452Ao_WLwmI-0ulGTvujpIrNw3rV6EP23rWHoHyC0b_9WhsTu4gXGCNs7wrIB3x848y8sHaHOeeQxjezO_009KLOKX3ave43CMREIOLv0NG3rlSq6s0xtqfkZgW_FPAZOSlTUxkXeqbJBSxOFsD9ulxIm0WtO1OoPBymDTz75NSrsqNfrLgeK_s4DuFkLATDz-Q')` }} />
                            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                                <h3 className="text-2xl md:text-3xl font-black italic text-white uppercase tracking-tighter neon-text-cyan leading-none mb-2">{t('games.options.triviaTitle')}</h3>
                                <div className="flex items-center gap-2">
                                    <span className="size-2 rounded-full bg-neon-cyan shadow-[0_0_10px_#00f3ff] animate-pulse" />
                                    <p className="text-neon-cyan/90 text-[10px] font-bold uppercase tracking-[0.2em]">Global Trivia</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Card 3: SHURA RUN - Brillo Intensificado */}
                    <div onClick={() => setSelected('shuraRun')} className="game-card group relative aspect-square cursor-pointer transform transition-all duration-300 hover:scale-[1.03] active:scale-[0.98]">
                        <div className="absolute -inset-0.5 bg-neon-volt rounded-2xl blur opacity-0 group-hover:opacity-80 transition duration-300" />
                        <div className="relative h-full flex flex-col rounded-2xl overflow-hidden border-2 border-neon-volt/40 glow-volt bg-zinc-900 transition-colors group-hover:border-neon-volt">
                            <div className="h-full w-full bg-cover bg-center transition-transform duration-700 group-hover:scale-110" style={{ backgroundImage: `linear-gradient(to top, rgba(0,0,0,0.9), transparent), url('https://lh3.googleusercontent.com/aida-public/AB6AXuDdjL2V2Ot0p54beKJQMARTwB1-XsW7cbFdKE5S52XQnc3SkQl9nnZxUf5DT65t7bswUpYmW8cPJgJsyX2GRNELbKNEQaJ2aI47-UwDKipeFkQk7n2qC2GohuiQ0-FQsDpKZBRR1sElFOMN8zWZwGFSvqJ1WRfzAssc4j0TufHB5Bk2AprrWzu1mQ4TKYVeN4uX2c37yabAFKve30KaaRQYWJXXigGO4-usqEGCZ6Ji8vJblJx2hCX5C2Z42WjtRpyCnuT1LDxXZSk')` }} />
                            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                                <h3 className="text-2xl md:text-3xl font-black italic text-white uppercase tracking-tighter neon-text-volt leading-none mb-2">{t('games.options.shuraRunTitle')}</h3>
                                <div className="flex items-center gap-2">
                                    <span className="size-2 rounded-full bg-neon-volt shadow-[0_0_10px_#ccff00] animate-pulse" />
                                    <p className="text-neon-volt/90 text-[10px] font-bold uppercase tracking-[0.2em]">Speed Action</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Add New Game - Ahora es visible y no "fantasma" */}
                    <div className="game-card group relative aspect-square border-2 border-dashed border-zinc-300 dark:border-white/10 rounded-2xl flex flex-col items-center justify-center gap-4 hover:border-zinc-400 dark:hover:border-white/30 hover:bg-zinc-100 dark:hover:bg-white/5 transition-all cursor-help">
                        <FaPlusCircle className="text-5xl text-zinc-300 dark:text-white/10 group-hover:text-zinc-400 dark:group-hover:text-white/30 transition-colors" />
                        <span className="text-zinc-400 dark:text-white/20 font-bold uppercase tracking-[0.2em] italic text-[10px]">Library Locked</span>
                    </div>
                </div>
            </main>

            <footer className="relative z-20 mt-auto flex flex-col md:flex-row items-center justify-between px-6 md:px-12 py-8 bg-gradient-to-t from-white/90 dark:from-black/80 to-transparent gap-6 md:gap-0">
                <div className="flex gap-4">
                    <div className="flex items-center gap-6 px-6 py-3 bg-zinc-100/50 dark:bg-white/5 rounded-full border border-zinc-200 dark:border-white/10 backdrop-blur-md shadow-[0_0_20px_rgba(0,0,0,0.05)] dark:shadow-[0_0_20px_rgba(0,0,0,0.3)]">
                        <div className="flex items-center gap-2 hover:text-neon-pink cursor-pointer transition-colors group">
                            <FaGlobeAmericas className="text-neon-pink group-hover:scale-110 transition-transform" />
                            <span className="text-zinc-600 dark:text-white/80 text-[10px] font-black uppercase italic tracking-widest">Online</span>
                        </div>
                        <div className="flex items-center gap-2 hover:text-neon-cyan cursor-pointer transition-colors group border-l border-zinc-300 dark:border-white/10 pl-6">
                            <FaNewspaper className="text-neon-cyan group-hover:scale-110 transition-transform" />
                            <span className="text-zinc-600 dark:text-white/80 text-[10px] font-black uppercase italic tracking-widest">News</span>
                        </div>
                        <div className="flex items-center gap-2 hover:text-neon-volt cursor-pointer transition-colors group border-l border-zinc-300 dark:border-white/10 pl-6">
                            <FaChevronRight className="rotate-90 text-neon-volt group-hover:translate-x-1 transition-transform" />
                            <span className="text-zinc-600 dark:text-white/80 text-[10px] font-black uppercase italic tracking-widest">Shop</span>
                        </div>
                    </div>
                </div>

                <div className="flex gap-6 md:gap-8 items-center">
                    <div className="flex items-center gap-3 group cursor-pointer">
                        <div className="size-8 rounded-full bg-neon-cyan/20 border-2 border-neon-cyan flex items-center justify-center group-hover:bg-neon-cyan transition-all group-hover:shadow-[0_0_15px_#00f3ff]">
                            <span className="text-zinc-900 dark:text-white font-black text-xs">X</span>
                        </div>
                        <span className="text-zinc-500 dark:text-white/60 text-[10px] font-bold uppercase italic tracking-widest">Details</span>
                    </div>
                    {/* Botón B Corregido */}
                    <div className="flex items-center gap-3 group cursor-pointer">
                        <div className="size-8 rounded-full bg-neon-pink/20 border-2 border-neon-pink flex items-center justify-center group-hover:bg-neon-pink transition-all group-hover:shadow-[0_0_15px_#ff007a]">
                            <span className="text-zinc-900 dark:text-white font-black text-xs">B</span>
                        </div>
                        <span className="text-zinc-500 dark:text-white/60 text-[10px] font-bold uppercase italic tracking-widest">Back</span>
                    </div>
                    <div className="flex items-center gap-3 group cursor-pointer">
                        <div className="size-8 rounded-full bg-neon-volt/20 border-2 border-neon-volt flex items-center justify-center group-hover:bg-neon-volt transition-all group-hover:shadow-[0_0_15px_#ccff00]">
                            <span className="text-black dark:text-white font-black text-xs">A</span>
                        </div>
                        <span className="text-zinc-500 dark:text-white/60 text-[10px] font-bold uppercase italic tracking-widest">Select</span>
                    </div>
                </div>
            </footer>

            {showNamePrompt && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
                    <div className="max-w-md w-full">
                        <div className="mb-8 text-center animate-fade-in-up">
                            <h2 className="text-4xl font-black italic uppercase tracking-tighter text-white mb-2">
                                {t('games.welcomeTitle')}
                            </h2>
                            <p className="text-zinc-400 font-bold uppercase tracking-widest text-xs">{t('games.welcomeSubtitle')}</p>
                        </div>
                        <PlayerInput
                            playerName={playerName}
                            onNameChange={setPlayerName}
                            onStartGame={handleNameSubmit}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default function Games() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#fff5f9] dark:bg-background-dark bg-grid flex items-center justify-center text-zinc-900 dark:text-white">Loading...</div>}>
            <GamesContent />
        </Suspense>
    );
}
