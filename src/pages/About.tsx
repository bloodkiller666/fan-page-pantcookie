'use client';
import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useLanguage } from '../context/LanguageContext';
import { FaYoutube, FaTwitch, FaTiktok, FaTwitter, FaInstagram, FaBolt, FaFire, FaWater, FaLeaf, FaSkull } from 'react-icons/fa';
import { SiKofi } from 'react-icons/si';

gsap.registerPlugin(ScrollTrigger);

interface Attack {
    name: string;
    cost: string[];
    damage: string;
    description: string;
}

interface PokemonData {
    name: string;
    hp: string;
    type: string;
    image: string;
    number: string;
    species: string;
    height: string;
    weight: string;
    cardColor?: string;
    imagePosition?: string;
    attacks: Attack[];
    weakness: string;
    resistance?: { type: string; value: string };
    retreatCost: number;
    flavorText: string;
    illustrator: string;
    cardNumber: string;
    totalCards: string;
}

const EnergyIcon = ({ type }: { type: string }) => {
    const icons: Record<string, { icon: any; color: string; label: string }> = {
        fire: { icon: FaFire, color: 'energy-fire', label: 'R' },
        water: { icon: FaWater, color: 'energy-water', label: 'W' },
        electric: { icon: FaBolt, color: 'energy-electric', label: 'L' },
        grass: { icon: FaLeaf, color: 'energy-grass', label: 'G' },
        dark: { icon: FaSkull, color: 'energy-psychic', label: 'P' },
        normal: { icon: null, color: 'energy-normal', label: '*' }
    };
    const { icon: Icon, color, label } = icons[type] || icons.normal;
    return (
        <div className={`energy-icon ${color}`}>
            {Icon ? <Icon /> : label}
        </div>
    );
};

const PokemonCard = ({ data, activeTab }: { data: PokemonData, activeTab: string }) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const [style, setStyle] = useState<React.CSSProperties & { [key: string]: any }>({});

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const card = cardRef.current;
        if (!card) return;
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = (y - centerY) / 15;
        const rotateY = (centerX - x) / 15;

        setStyle({
            transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
            '--x': `${(x / rect.width) * 100}%`,
            '--y': `${(y / rect.height) * 100}%`
        } as React.CSSProperties & { [key: string]: any });
    };

    const handleMouseLeave = () => {
        setStyle({
            transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg)',
            transition: 'all 0.5s cubic-bezier(0.23, 1, 0.32, 1)'
        });
    };

    const isShura = activeTab === 'shurahiwa';

    return (
        <div className="card-container">
            <div
                ref={cardRef}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                style={style}
                className={`relative group tcg-card-glow w-[360px] aspect-[1/1.6] rounded-[2.2rem] shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden transition-all duration-100 ease-out select-none ${isShura ? 'legendary-border bg-metallic-gold' : 'bg-gold-gradient border-[6px] border-gold-dark shadow-holo-glow'}`}
            >
                {/* Textures / Overlays */}
                <div className="absolute inset-x-0 inset-y-0 etched-pattern opacity-30 z-10"></div>
                <div className="absolute inset-0 holo-overlay z-20"></div>
                <div className="absolute inset-0 card-texture z-10"></div>
                <div className="absolute inset-0 shiny-sparkle opacity-20 mix-blend-screen z-20"></div>

                {/* Silver Inner Bevel for Shura, or simple border for Pantcookie */}
                <div className={`w-full h-full p-1.5 relative z-30 ${isShura ? 'bg-metallic-silver rounded-[1.8rem]' : ''}`}>
                    <div className={`w-full h-full rounded-[1.5rem] p-4 flex flex-col relative overflow-hidden ${isShura ? 'bg-gradient-to-br from-indigo-950 via-purple-900 to-black' : 'bg-[#FFD700] border-4 border-gold-dark'}`}>

                        {/* Shura specific Holo Chromatic for background if it was Pantcookie style, but user wants it for the cards differently */}
                        {!isShura && <div className="absolute inset-0 bg-gold-gradient opacity-40 mix-blend-overlay"></div>}

                        {/* Shimmer overlay for extra height room */}
                        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none opacity-20"></div>

                        {/* Header */}
                        <div className="flex justify-between items-start mb-2 relative z-40">
                            <div className="flex flex-col">
                                <span className={`text-[9px] font-black italic tracking-widest drop-shadow-sm ${isShura ? 'text-brand-gold' : 'text-blue-950 uppercase'}`}>
                                    {isShura ? 'CHROMATIC LEGENDARY' : 'BÁSICO ★ LEGENDARIO'}
                                </span>
                                <h2 className={`text-2xl font-orbitron font-black leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] tracking-tighter ${isShura ? 'text-white' : 'text-blue-950 italic'}`}>
                                    {data.name}
                                </h2>
                            </div>
                            <div className="flex items-center space-x-1">
                                <span className={`text-xs font-black italic drop-shadow-sm ${isShura ? 'text-white' : 'text-blue-900 mt-2'}`}>PS</span>
                                <span className={`text-3xl font-orbitron font-black drop-shadow-[0_0_10px_rgba(255,0,122,0.8)] ${isShura ? 'text-brand-pink' : 'text-blue-950'}`}>{data.hp}</span>
                                <div className={`w-7 h-7 rounded-full border-2 border-white/50 flex items-center justify-center shadow-lg ${isShura ? 'bg-gradient-to-br from-orange-400 to-red-600' : 'bg-gold-gradient border-gold-dark'}`}>
                                    <span className="text-[10px]">{isShura ? '🔥' : '⚡'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Main Illustration */}
                        <div className={`w-full aspect-square rounded-lg overflow-hidden bg-black shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] relative group/img z-40 border-[3px] ${isShura ? 'border-brand-gold' : 'border-silver-dark'}`}>
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-white/10 z-10"></div>
                            <img
                                src={data.image}
                                alt={data.name}
                                className="w-full h-full object-cover"
                                style={{ objectPosition: data.imagePosition || 'center' }}
                            />
                            {/* Reflection on image */}
                            <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-60 transition-opacity duration-300 mix-blend-color-dodge z-30 bg-holographic"></div>
                        </div>

                        {/* Info Bar */}
                        <div className={`text-[7px] font-black text-center py-1 my-2 border-y italic z-40 ${isShura ? 'bg-white/5 border-white/10 text-brand-silver' : 'bg-gold-dark/20 border-gold-dark/30 text-blue-900'}`}>
                            N.º {data.number} Pokémon {data.species} Altura: {data.height} Peso: {data.weight}
                        </div>

                        {/* Attacks */}
                        <div className="flex-grow space-y-3 z-40 overflow-visible py-2">
                            {data.attacks.map((attack, idx) => (
                                <div key={idx} className="relative group/attack">
                                    <div className={`flex items-center justify-between border-b pb-1 ${isShura ? 'border-brand-gold/20' : 'border-blue-950/20'}`}>
                                        <div className="flex items-center gap-2">
                                            <div className="flex gap-0.5">
                                                {attack.cost.map((c, i) => <EnergyIcon key={i} type={c} />)}
                                            </div>
                                            <span className={`text-[10px] font-black uppercase tracking-tighter ${isShura ? 'text-white' : 'text-blue-950'}`}>{attack.name}</span>
                                        </div>
                                        <span className={`text-base font-black ${isShura ? 'text-white' : 'text-blue-950'}`}>{attack.damage}</span>
                                    </div>
                                    <p className={`text-[8px] font-medium leading-[1.1] pt-1 ${isShura ? 'text-gray-300' : 'text-blue-900'}`}>
                                        {attack.description}
                                    </p>
                                </div>
                            ))}
                        </div>

                        {/* Bottom Stats & Flavor */}
                        <div className={`mt-auto pt-2 border-t flex justify-between items-end z-40 ${isShura ? 'border-white/10' : 'border-blue-950/10'}`}>
                            <div className="space-y-1">
                                <div className="flex items-center gap-1">
                                    <span className={`text-[7px] font-black uppercase italic ${isShura ? 'text-brand-gold' : 'text-blue-900'}`}>debilidad</span>
                                    <div className="flex items-center gap-0.5">
                                        <EnergyIcon type={data.weakness} />
                                        <span className={`text-[7px] font-black ${isShura ? 'text-white' : 'text-blue-950'}`}>x2</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className={`text-[7px] font-black uppercase italic ${isShura ? 'text-brand-gold' : 'text-blue-900'}`}>retirada</span>
                                    <div className="flex gap-0.5">
                                        {Array(data.retreatCost).fill(0).map((_, i) => <EnergyIcon key={i} type="normal" />)}
                                    </div>
                                </div>
                            </div>
                            <div className="max-w-[140px]">
                                <p className={`text-[8px] italic leading-tight font-medium text-right ${isShura ? 'text-brand-silver' : 'text-blue-900'}`}>
                                    {data.flavorText}
                                </p>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className={`flex justify-between items-center text-[7px] font-black mt-2 relative z-40 ${isShura ? 'text-gray-500' : 'text-blue-950 opacity-60'}`}>
                            <span>©2026 Pokemon / Shake-Gang</span>
                            <span>ilus. {data.illustrator} {data.cardNumber}/{data.totalCards} ★</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const About = () => {
    const [activeTab, setActiveTab] = useState('shurahiwa');
    const { t } = useLanguage();
    const containerRef = useRef(null);
    const bgRef = useRef(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.from(containerRef.current, {
                opacity: 0,
                y: 20,
                duration: 0.6,
                ease: 'power2.out',
                delay: 0.8
            });
        }, containerRef);
        return () => ctx.revert();
    }, []);

    useEffect(() => {
        if (bgRef.current) {
            gsap.to(bgRef.current, {
                backgroundPosition: "150px 150px",
                duration: 20,
                repeat: -1,
                ease: "none"
            });
        }
    }, []);

    const shuraData = {
        name: 'ShuraHiwa',
        hp: '150',
        type: 'fire',
        image: 'https://ik.imagekit.io/7zy1frxsr/Fotos/shura.jpg?updatedAt=1769060921088',
        number: '001',
        species: 'Vtuber Legendaria',
        height: '1,75 m',
        weight: '70,0 kg',
        imagePosition: '50% 15%',
        attacks: [
            {
                name: 'El encando de madura',
                cost: ['fire', 'fire'],
                damage: '80',
                description: 'Lanza una moneda. Si sale cara, este ataque hace 40 puntos más de daño y el oponente queda paralizado por el hype.'
            },
            {
                name: 'Ataque frente a frente',
                cost: ['fire', 'fire', 'electric'],
                damage: '120+',
                description: 'Este ataque hace 20 puntos más de daño por cada suscriptor en el chat activo.'
            }
        ],
        weakness: 'water',
        retreatCost: 2,
        flavorText: 'Shakeee-Gang! Una personalidad explosiva que domina el campo de batalla.',
        illustrator: 'Poke-Gamer AI',
        cardNumber: '01',
        totalCards: '10'
    };

    const pantcookieData = {
        name: 'Pantcookie',
        hp: '200',
        type: 'electric',
        image: 'https://ik.imagekit.io/7zy1frxsr/Fotos/pantcake.png?updatedAt=1769060919997',
        number: '002',
        species: 'Pantcakes',
        height: 'Varia',
        weight: 'Varia',
        attacks: [
            {
                name: 'Cookie Bite',
                cost: ['electric', 'normal'],
                damage: '50',
                description: 'Restaura 20 PS a ShuraHiwa si está en la banca.'
            },
            {
                name: 'Bienvenido a casa FIEL',
                cost: ['electric', 'electric', 'normal'],
                damage: '100',
                description: 'Crea un escudo comunitario que reduce el daño recibido en el siguiente turno en 30.'
            }
        ],
        weakness: 'dark',
        resistance: { type: 'psychic', value: '-20' },
        retreatCost: 1,
        flavorText: 'Somos la comunidad más leal del mundo gaming, siempre lista para apoyar a su líder.',
        illustrator: 'Shura Design',
        cardNumber: '02',
        totalCards: '10'
    };

    const activeData = activeTab === 'shurahiwa' ? shuraData : pantcookieData;

    return (
        <div ref={containerRef} className="min-h-screen pt-24 pb-12 relative overflow-hidden font-orbitron transition-colors duration-500">
            {/* FONDO DE PIKACHU ADAPTABLE */}
            <div
                ref={bgRef}
                className="absolute inset-0 z-0 opacity-[0.07] dark:opacity-[0.12] pointer-events-none bg-repeat"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 2836 2835'%3E%3Cpath fill='%23eecd6e' d='M1394.1 1967.7c-122.5 70.9-265.9-19.3-256.3-49.7 11-3.5 20.2 7.3 30.1 14.4 10.5 7.5 18.8 12.9 31.1 19.6 22.3 12.3 45.9 20 75.8 21.5 103 5.3 128.9-44.6 148.7-47.5 19.5-2.9 139.3 92.4 259.2 3.6 15.5-11.5 13.5-18.5 30.1-12.7.3 31.6-83.5 65.1-127 70.6-80.6 10.2-105.3-24-159.2-42.5-12.1 7.4-18.1 14.2-32.7 22.7zM1464.1 1813.7c-4.4 26.7-56.6 43.7-78.2 13.3-13.5-19 9.5-27 29.1-27.2 22.7-.2 38.5.5 49.1 13.9zM1831.7 1497.1c42.4-11.5 83.5 12.7 105.1 32.5 90 82.8 51 241.8-59.1 259.7-170.6 27.7-226.3-243.3-46-292.2zm-854.4 2.8c74.6-20.3 150.5 57.5 157 119.3 6.6 62.5-31.5 155-111 168.4-166 27.8-233.7-236.6-46-287.7zm-360.3-1016.2c-30.7 29.7-43.3 180.3-45.1 234.8-2.2 65.2-5.4 62.4 18.7 117.1 14.2 32.3 30.1 62.5 47.1 93.1 68.1 122.8 106.6 189.3 207.1 283.6 12.7 12 31.4 18.9 31.5 35.7-22.9 5.2-16.4-11-41.2-14.7-39.2 42.1-67.5 167.7-73.1 238.9-4 50.7-.4 103.5-.8 154.6-.4 50.8-5.4 101.9-4.7 152.6 171.2-18.9 285 278.7 175.9 365.2-16 12.7-48 21-57.8 30.8 10.1 6.7 14.4 12.7 25.1 21.2 89 70.6 100.6 68.5 210.6 112.5 110.7 44.2 189.3 54 319.9 47.5 109.7-5.5 232.3-1.4 326.9-41.4 93.7-39.6 169.6-82 224.6-140.4-19.4-15.4-32.2-12.9-53.1-33.8-110-110.5 4.2-383 170-367.6-10.3-102.8-9.4-210-11.2-314.2-.9-51.8-19.9-146.7-48.2-191.7-8.1-12.8-22.3-33.9-32.2-43.7-8.2 6.4-15.7 18-25.9 13.3-.1-.1-15.4-4.1 2-23.1 5.3-5.8 12.2-10.8 18.3-17 12.7-12.8 25-19.9 39.3-30.8 98.1-74.4 191.9-215 234.6-325.9 24.7-64.1-17.6-322.3-34.8-366-5.1 3.2-1.1.2-6.4 5.3-.8.8-3 3.2-3.8 4-24.8 27.7-82.9 105.3-116.2 144.5-108.6 127.9-142.9 177.5-236.5 324-29.2 45.7-52 85.1-77.9 132.2-21.9 39.7-5.6 39.2-26.3 45.4-12.6-19.6 5.6-34.6 8.8-63.6-59.6-9.4-113.4-26.9-175.7-36.1-151.3-22.2-232.8-23.9-384.3 2.7-70 12.3-144.2 37.1-165.3 40.5 2.6 19 9.8 17.8.2 33-17.3-2-23.1-25-30.7-40.6-27.7-56.7-35.1-71.1-73.7-125-37-51.8-69.7-104.9-106.5-158.2-53.9-78-138.6-187.3-200-263.2-10.9-13.4-16.7-22.1-29.1-35.7zM1999.1 2158.5c-80.4-3.2-113.3-124.5-76.5-222.6 22.8-60.7 92.1-164.7 176.1-151.8 8 59.1 7.9 171.9-5.6 224.5-14.9 58-61.8 117.6-94 149.9zm-1245.7-208.6c-3.4-31-3-113.6.7-144.3 4.7-39.4 81.4 6.9 96.1 16.3 55.5 35.6 87 101.9 105.2 182.8 13.5 60-9.8 117.5-62.3 143.3-25.7 12.6-31.4 15.9-48.4-1.3-46-46.7-81.5-106.1-91.3-156.8z'/%3E%3Cpath fill='%23000' d='M1800.7 1552.2c55.9-30.4 90.3 64.4 44 91.6-48.4 28.5-94.7-64-44-91.6zm31 -55.1c-180.4 48.9-124.7 319.9 45.9 292.2 110-17.9 149.1-177 59.1-259.8-21.5-19.8-62.6-44-105-32.4zM1015.1 1556.1c60.3-23.3 77 70.4 20.8 89.3-28.9 9.7-50.9-13.4-55.5-35.7-6.8-32.5 12.6-45.1 34.7-53.6zm-37.8-56.2c-187.7 51-120 315.4 46 287.6 79.4-13.3 117.5-105.8 111-168.3-6.5-61.8-82.4-139.5-157-119.3z'/%3E%3Cpath fill='%23e94337' d='M753.4 1949.9c9.8 90.7 45.4 150.1 91.3 196.8 17 17.3 22.7 14 48.4 1.4 52.5-25.8 75.9-83.3 62.4-143.3-18.2-80.9-49.7-147.2-105.2-182.8-14.7-9.4-91.4-55.7-96.1-16.4-3.7 30.7-4 113.3-.8 144.3zm1245.7 208.6c32.2-32.3 79.1-91.9 94-149.9 15-52.6 14.9-165.4 6.9-224.5-84 12.9-153.3 116.9-176.1 177.6-36.8 98 -3.9 219.4 75.2 222.6z'/%3E%3C/svg%3E")`,
                    backgroundSize: '150px 150px',
                    backgroundRepeat: 'repeat',
                }}
            />

            <div className="container mx-auto px-4 relative z-10">
                {/* Header */}
                <div className="text-center mb-20">
                    <div className="inline-block px-8 py-2 rounded-sm bg-[#ff00e5] text-white text-[10px] font-black uppercase tracking-[0.4em] mb-10 shadow-holo-glow-pink skew-x-[-20deg]">
                        <span className="inline-block skew-x-[20deg]">SYSTEM DATABASE // {t('nav.about').toUpperCase()}</span>
                    </div>
                    <h1 className="text-5xl md:text-8xl font-black text-[#00f2ff] mb-6 italic tracking-tighter drop-shadow-holo-glow">
                        {t('about.title') || 'CARTAS DE ENTRENADOR'}
                    </h1>
                </div>

                {/* Tab Navigation */}
                <div className="flex justify-center mb-16" data-purpose="character-tabs">
                    <div className="flex space-x-4">
                        <button
                            onClick={() => setActiveTab('shurahiwa')}
                            className={`px-10 py-3 rounded-sm font-bold skew-x-[-12deg] transition-all transform hover:scale-105 ${activeTab === 'shurahiwa' ? 'bg-[#ff00e5] text-white shadow-holo-glow-pink' : 'bg-white/10 text-gray-400 border border-white/20'}`}
                        >
                            <span className="inline-block skew-x-[12deg]">SHURAHIWA</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('pantcookie')}
                            className={`px-10 py-3 rounded-sm font-bold skew-x-[-12deg] transition-all transform hover:scale-105 ${activeTab === 'pantcookie' ? 'bg-[#ff00e5] text-white shadow-holo-glow-pink' : 'bg-white/10 text-gray-400 border border-white/20'}`}
                        >
                            <span className="inline-block skew-x-[12deg]">PANTCOOKIE</span>
                        </button>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="flex flex-col lg:flex-row gap-16 items-center justify-center max-w-7xl mx-auto">
                    {/* Card Column */}
                    <div className="w-full lg:w-[450px] flex justify-center order-2 lg:order-1">
                        <PokemonCard data={activeData} activeTab={activeTab} />
                    </div>

                    {/* Description & Socials Column */}
                    <div className="w-full lg:flex-grow space-y-10 order-1 lg:order-2">
                        <div className="glass-panel scanlines bg-black/40 p-10 rounded-[2rem] shadow-holo-glow relative overflow-hidden group">
                            {/* Decorative Corner */}
                            <div className={`absolute top-0 right-0 w-24 h-24 border-b-2 border-l-2 border-[#00f2ff]/30 flex items-center justify-center bg-gradient-to-br transition-all duration-500 ${activeTab === 'shurahiwa' ? 'from-orange-500/20 to-pink-500/20' : 'from-yellow-400/20 to-blue-500/20'}`}>
                                <EnergyIcon type={activeData.type} />
                            </div>

                            <div className="flex items-center gap-4 mb-8">
                                <div className={`w-1 h-12 ${activeTab === 'shurahiwa' ? 'bg-[#ff00e5]' : 'bg-[#00f2ff]'}`}></div>
                                <h2 className={`text-4xl md:text-5xl font-black uppercase italic tracking-tighter ${activeTab === 'shurahiwa' ? 'text-[#ff00e5]' : 'text-[#00f2ff]'}`}>
                                    {activeData.name}
                                </h2>
                            </div>

                            <p className="text-base md:text-xl text-gray-300 leading-relaxed font-medium mb-12 font-roboto">
                                {activeTab === 'shurahiwa' ? t('about.shuraDesc1') : t('about.communityDesc1')}
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-white/5 p-6 rounded-2xl border border-white/10 group-hover:border-[#00f2ff]/30 transition-colors">
                                    <span className={`text-[10px] font-black uppercase tracking-widest block mb-1 text-gray-500`}>Especie</span>
                                    <span className="font-bold text-lg text-white uppercase">{activeData.species}</span>
                                </div>
                                <div className="bg-white/5 p-6 rounded-2xl border border-white/10 group-hover:border-[#00f2ff]/30 transition-colors">
                                    <span className={`text-[10px] font-black uppercase tracking-widest block mb-1 text-gray-500`}>Habilidad Especial</span>
                                    <span className="font-bold text-lg text-white uppercase">{activeData.attacks[1].name}</span>
                                </div>
                            </div>

                            {/* Social Links */}
                            <div className="flex flex-wrap gap-4 mt-12 bg-white/5 p-6 rounded-2xl border border-white/10">
                                <IconLink href="#" icon={FaYoutube} color="bg-[#FF0000]" />
                                <IconLink href="#" icon={FaTwitch} color="bg-[#9146FF]" />
                                <IconLink href="#" icon={FaTiktok} color="bg-black border-white/20" />
                                <IconLink href="#" icon={FaTwitter} color="bg-[#1DA1F2]" />
                                <IconLink href="#" icon={FaInstagram} color="bg-gradient-to-tr from-[#fd5949] to-[#d6249f]" />
                                <IconLink href="#" icon={SiKofi} color="bg-[#29abe0]" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const IconLink = ({ href, icon: Icon, color }: { href: string; icon: any; color: string }) => (
    <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`w-14 h-14 ${color} text-white rounded-xl border-2 border-white/20 shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-all group/icon relative overflow-hidden`}
    >
        <div className="absolute inset-0 bg-white opacity-0 group-hover/icon:opacity-20 transition-opacity"></div>
        <Icon className="text-2xl drop-shadow-md" />
    </a>
);

export default About;
