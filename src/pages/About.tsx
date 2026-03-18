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
        <div ref={containerRef} className="min-h-screen bg-pattern dark:bg-radial-dark py-32 transition-colors duration-500 font-orbitron">
            <div className="container mx-auto px-4">
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
