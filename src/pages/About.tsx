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

const PokemonCard = ({ data, isHolographic = true }: { data: PokemonData; isHolographic?: boolean }) => {
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

    return (
        <div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={style}
            className="poke-card-frame w-full max-w-[360px] mx-auto transition-transform duration-100 ease-out group select-none"
        >
            <div className={`poke-card-inner flex flex-col h-full bg-gradient-to-b ${data.cardColor || 'from-[#ffde00] to-[#f8d030]'}`}>
                {/* Top Header */}
                <div className="flex justify-between items-start mb-1 px-1">
                    <div className="flex flex-col">
                        <span className="text-[8px] font-black uppercase text-gray-800 leading-none">Básico</span>
                        <h3 className="text-xl font-black tracking-tighter text-gray-900 leading-none mt-1">{data.name}</h3>
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="text-[10px] font-black text-gray-800">PS</span>
                        <span className="text-2xl font-black text-gray-900 tracking-tighter">{data.hp}</span>
                        <EnergyIcon type={data.type} />
                    </div>
                </div>

                {/* Illustration Box */}
                <div className="poke-image-box rounded-lg">
                    <img
                        src={data.image}
                        alt={data.name}
                        className="w-full h-full object-cover"
                        style={{ objectPosition: data.imagePosition || 'center' }}
                    />
                    {isHolographic && (
                        <>
                            <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-60 transition-opacity duration-300 mix-blend-color-dodge z-30"
                                style={{
                                    background: `radial-gradient(circle at var(--x, 50%) var(--y, 50%), rgba(255,255,255,0.6) 0%, rgba(255,255,255,0) 60%), 
                                                 linear-gradient(135deg, #ff00ff33 0%, #00ffff33 25%, #ffff0033 50%, #00ffff33 75%, #ff00ff33 100%)`,
                                    backgroundSize: '200% 200%'
                                }}
                            ></div>
                            <div className="absolute inset-[-100%] pointer-events-none opacity-0 group-hover:opacity-20 transition-opacity duration-500 z-20 overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent rotate-45 animate-pulse"></div>
                            </div>
                        </>
                    )}
                </div>

                {/* Info Bar */}
                <div className="bg-[#e0c020] text-[7px] font-black text-center py-0.5 my-1 border-y border-[#b3a125] italic">
                    N.º {data.number} Pokémon {data.species} Altura: {data.height} Peso: {data.weight}
                </div>

                {/* Abilities/Attacks */}
                <div className="flex-grow px-1 my-2 space-y-4">
                    {data.attacks.map((attack, idx) => (
                        <div key={idx} className="relative">
                            <div className="flex items-center justify-between border-b border-[#b3a125]/30 pb-1">
                                <div className="flex items-center gap-2">
                                    <div className="flex gap-0.5">
                                        {attack.cost.map((c, i) => <EnergyIcon key={i} type={c} />)}
                                    </div>
                                    <span className="text-sm font-black text-gray-900 uppercase tracking-tighter">{attack.name}</span>
                                </div>
                                <span className="text-lg font-black text-gray-900">{attack.damage}</span>
                            </div>
                            <p className="text-[9px] font-medium leading-[1.1] text-gray-800 pt-1">
                                {attack.description}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Bottom Stats */}
                <div className="mt-auto px-1 pt-2 border-t border-[#b3a125] flex justify-between items-end">
                    <div className="space-y-1">
                        <div className="flex items-center gap-1">
                            <span className="poke-stat-label">debilidad</span>
                            <div className="flex items-center gap-0.5">
                                <EnergyIcon type={data.weakness} />
                                <span className="text-[8px] font-black">x2</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="poke-stat-label">resistencia</span>
                            {data.resistance && (
                                <div className="flex items-center gap-0.5">
                                    <EnergyIcon type={data.resistance.type} />
                                    <span className="text-[8px] font-black">{data.resistance.value}</span>
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="poke-stat-label">retirada</span>
                            <div className="flex gap-0.5">
                                {Array(data.retreatCost).fill(0).map((_, i) => <EnergyIcon key={i} type="normal" />)}
                            </div>
                        </div>
                    </div>
                    <div className="max-w-[140px]">
                        <p className="poke-flavor-text">
                            {data.flavorText}
                        </p>
                    </div>
                </div>

                {/* Footer Info */}
                <div className="flex justify-between items-center text-[6px] font-black text-gray-700 mt-1 px-1">
                    <span>©2026 Pokemon / Shake-Gang</span>
                    <span>ilus. {data.illustrator}  {data.cardNumber}/{data.totalCards} ★</span>
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
            gsap.from(containerRef.current, { opacity: 0, y: 20, duration: 0.6, ease: 'power2.out' });
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
        cardColor: 'from-[#ff007f] via-[#3b4cca] to-[#00ffff]',
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
        flavorText: 'Shakeee-Gang! Una personalidad explosiva que domina el campo de batalla con streams de alta intensidad.',
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
        species: 'Comunidad Fiel',
        height: 'Varia',
        weight: 'Varia',
        cardColor: 'from-[#0070ff] via-[#ffde00] to-[#ff8a00]',
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
        <div ref={containerRef} className="min-h-screen bg-pattern py-24 transition-colors duration-300">
            <div className="container mx-auto px-4">
                {/* Header */}
                <div className="text-center mb-16">
                    <div className="inline-block px-6 py-2 rounded-xl border-4 border-black bg-pokemon-yellow text-black text-xs uppercase tracking-[0.2em] font-black mb-8 shadow-[4px_4px_0px_0px_black]">
                        System Database // Profiles
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black neon-text-pink mb-6 uppercase italic tracking-tighter">
                        CARTAS DE ENTRENADOR
                    </h1>
                </div>

                {/* Tab Navigation */}
                <div className="flex justify-center mb-16">
                    <div className="bg-white/40 dark:bg-black/40 backdrop-blur-2xl p-3 rounded-2xl shadow-[8px_8px_0px_0px_black] inline-flex gap-4 border-4 border-black">
                        <button
                            onClick={() => setActiveTab('shurahiwa')}
                            className={`poke-button px-10 py-3 text-xs leading-none ${activeTab === 'shurahiwa' ? 'poke-button-pink' : 'bg-white dark:bg-gray-800'}`}
                        >
                            ShuraHiwa
                        </button>
                        <button
                            onClick={() => setActiveTab('pantcookie')}
                            className={`poke-button px-10 py-3 text-xs leading-none ${activeTab === 'pantcookie' ? 'poke-button-blue' : 'bg-white dark:bg-gray-800'}`}
                        >
                            PantCookie
                        </button>
                    </div>
                </div>

                {/* Card Display Area */}
                <div className="flex flex-col lg:flex-row gap-12 items-center justify-center max-w-6xl mx-auto">
                    <div className="w-full lg:w-1/2 flex justify-center order-2 lg:order-1">
                        <PokemonCard data={activeData} />
                    </div>

                    <div className="w-full lg:w-1/2 space-y-8 order-1 lg:order-2">
                        <div className="poke-card p-10 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-16 h-16 bg-pokemon-yellow border-b-4 border-l-4 border-black flex items-center justify-center">
                                <EnergyIcon type={activeData.type} />
                            </div>
                            <h2 className={`text-4xl font-black uppercase italic tracking-tighter mb-6 ${activeTab === 'shurahiwa' ? 'neon-text-pink' : 'neon-text-blue'}`}>
                                {activeData.name}
                            </h2>
                            <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
                                {activeTab === 'shurahiwa' ? t('about.shuraDesc1') : t('about.communityDesc1')}
                            </p>
                            <div className="grid grid-cols-2 gap-4 mt-8">
                                <div className="bg-black/5 dark:bg-white/5 p-4 rounded-xl border-2 border-dashed border-black/20">
                                    <span className="poke-stat-label block mb-1 text-gray-700 dark:text-pokemon-yellow">Especie</span>
                                    <span className="font-black text-sm uppercase">{activeData.species}</span>
                                </div>
                                <div className="bg-black/5 dark:bg-white/5 p-4 rounded-xl border-2 border-dashed border-black/20">
                                    <span className="poke-stat-label block mb-1 text-gray-700 dark:text-pokemon-yellow">Habilidad Especial</span>
                                    <span className="font-black text-sm uppercase">{activeData.attacks[1].name}</span>
                                </div>
                            </div>

                            {/* Social Links Updated Style */}
                            <div className="flex flex-wrap gap-3 mt-10">
                                <IconLink href="#" icon={FaYoutube} color="bg-[#FF0000]" />
                                <IconLink href="#" icon={FaTwitch} color="bg-[#9146FF]" />
                                <IconLink href="#" icon={FaTiktok} color="bg-black" />
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
        className={`w-12 h-12 ${color} text-white rounded-xl border-4 border-black shadow-[4px_4px_0px_0px_black] flex items-center justify-center hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_black] transition-all`}
    >
        <Icon className="text-xl" />
    </a>
);

export default About;
