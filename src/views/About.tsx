'use client';
import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { FaBolt, FaCircle, FaFire, FaInstagram, FaLeaf, FaSkull, FaTiktok, FaTwitch, FaWater, FaYoutube } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import { SiDiscord, SiKofi } from 'react-icons/si';
import type { IconType } from 'react-icons';
import { MdArrowForward } from 'react-icons/md';
import { useLanguage } from '../context/LanguageContext';
import { useScrollReveal } from '../hooks/useScrollReveal';
import RevealTitle from '../components/ui/RevealTitle';
import socials from '../data/socials.json';

type TokenType = 'fire' | 'water' | 'electric' | 'grass' | 'dark' | 'normal';

interface Move {
    name: string;
    cost: TokenType[];
    damage: string;
    description: string;
}

interface Character {
    id: 'shurahiwa' | 'pantcake';
    name: string;
    hp: string;
    type: TokenType;
    image: string;
    imagePosition?: string;
    species: string;
    height: string;
    weight: string;
    moves: Move[];
    weakness: TokenType;
    retreatCost: number;
    flavorText: string;
    tone: 'pink' | 'cyan';
    descKey: string;
}

// Character data. Names, moves and flavour text are the community's own lore, kept as written.
const CHARACTERS: Character[] = [
    {
        id: 'shurahiwa',
        name: 'ShuraHiwa',
        hp: '150',
        type: 'fire',
        image: 'https://ik.imagekit.io/7zy1frxsr/Fotos/shura.jpg?updatedAt=1769060921088',
        imagePosition: '50% 15%',
        species: 'Vtuber Legendaria',
        height: '1,75 m',
        weight: '70,0 kg',
        moves: [
            { name: 'El encando de madura', cost: ['fire', 'fire'], damage: '80', description: 'Lanza una moneda. Si sale cara, este ataque hace 40 puntos más de daño y el oponente queda paralizado por el hype.' },
            { name: 'Ataque frente a frente', cost: ['fire', 'fire', 'electric'], damage: '120+', description: 'Este ataque hace 20 puntos más de daño por cada suscriptor en el chat activo.' },
        ],
        weakness: 'water',
        retreatCost: 2,
        flavorText: 'Shakeee-Gang! Una personalidad explosiva que domina el campo de batalla.',
        tone: 'pink',
        descKey: 'about.shuraDesc1',
    },
    {
        id: 'pantcake',
        name: 'pantcake',
        hp: '200',
        type: 'electric',
        image: 'https://ik.imagekit.io/7zy1frxsr/Fotos/pantcake.png?updatedAt=1769060919997',
        species: 'Pantcakes',
        height: 'Varía',
        weight: 'Varía',
        moves: [
            { name: 'Cookie Bite', cost: ['electric', 'normal'], damage: '50', description: 'Restaura 20 PS a ShuraHiwa si está en la banca.' },
            { name: 'Bienvenido a casa FIEL', cost: ['electric', 'electric', 'normal'], damage: '100', description: 'Crea un escudo comunitario que reduce el daño recibido en el siguiente turno en 30.' },
        ],
        weakness: 'dark',
        retreatCost: 1,
        flavorText: 'Somos la comunidad más leal del mundo gaming, siempre lista para apoyar a su líder.',
        tone: 'cyan',
        descKey: 'about.communityDesc1',
    },
];

const TOKENS: Record<TokenType, { Icon: IconType; className: string }> = {
    fire: { Icon: FaFire, className: 'bg-[var(--pink)] text-[var(--ink)]' },
    water: { Icon: FaWater, className: 'bg-[var(--blue)] text-white' },
    electric: { Icon: FaBolt, className: 'bg-[var(--yellow)] text-[var(--ink)]' },
    grass: { Icon: FaLeaf, className: 'bg-[var(--cyan)] text-[var(--ink)]' },
    dark: { Icon: FaSkull, className: 'bg-[var(--ink)] text-[#fde0f6]' },
    normal: { Icon: FaCircle, className: 'bg-white text-[var(--ink)]' },
};

function Token({ type }: { type: TokenType }) {
    const { Icon, className } = TOKENS[type];
    return (
        <span className={`inline-flex h-6 w-6 shrink-0 items-center justify-center border-2 border-[var(--ink)] text-[0.7rem] ${className}`} aria-hidden>
            <Icon />
        </span>
    );
}

const SOCIAL_ICONS: Record<string, { Icon: IconType; className: string }> = {
    twitch: { Icon: FaTwitch, className: 'bg-[#9146ff] text-white' },
    youtube: { Icon: FaYoutube, className: 'bg-[#ff0000] text-white' },
    discord: { Icon: SiDiscord, className: 'bg-[#5865f2] text-white' },
    kofi: { Icon: SiKofi, className: 'bg-[var(--cyan)] text-[var(--ink)]' },
    tiktok: { Icon: FaTiktok, className: 'bg-[var(--ink)] text-[#fde0f6]' },
    x: { Icon: FaXTwitter, className: 'bg-[var(--ink)] text-[#fde0f6]' },
    instagram: { Icon: FaInstagram, className: 'bg-[var(--pink)] text-[var(--ink)]' },
};

function CharacterCard({ character }: { character: Character }) {
    const { t } = useLanguage();
    const ref = useRef<HTMLDivElement>(null);

    // Gentle pointer tilt on fine pointers
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const mm = gsap.matchMedia();
        mm.add('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)', () => {
            const rx = gsap.quickTo(el, 'rotationX', { duration: 0.5, ease: 'power3' });
            const ry = gsap.quickTo(el, 'rotationY', { duration: 0.5, ease: 'power3' });
            gsap.set(el, { transformPerspective: 900 });
            const move = (e: PointerEvent) => {
                const r = el.getBoundingClientRect();
                ry(((e.clientX - r.left) / r.width - 0.5) * 10);
                rx(-((e.clientY - r.top) / r.height - 0.5) * 10);
            };
            const leave = () => {
                rx(0);
                ry(0);
            };
            el.addEventListener('pointermove', move);
            el.addEventListener('pointerleave', leave);
            return () => {
                el.removeEventListener('pointermove', move);
                el.removeEventListener('pointerleave', leave);
            };
        });
        return () => mm.revert();
    }, [character.id]);

    return (
        <div ref={ref} className="about-card mx-auto w-full max-w-[26rem] will-change-transform">
            <div className="cart-shell">
                <div className={`cart cart--${character.tone}`}>
                    <div className="cart__face flex flex-col gap-4 p-5">
                        <header className="flex items-start justify-between gap-3">
                            <h2 className="font-display text-3xl font-bold uppercase leading-none">{character.name}</h2>
                            <p className="flex shrink-0 items-center gap-2">
                                <span className="font-display text-sm font-bold uppercase">{t('about.hp')}</span>
                                <span className="score text-lg">{character.hp}</span>
                                <Token type={character.type} />
                            </p>
                        </header>

                        <div className="bezel !p-2">
                            <div className="bezel__screen aspect-square bg-black after:hidden">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={character.image} alt={character.name} className="h-full w-full object-cover" style={{ objectPosition: character.imagePosition || 'center' }} />
                            </div>
                        </div>

                        <p className="border-y-[3px] border-[var(--ink)] py-2 text-center font-display text-sm font-bold uppercase tracking-[0.06em]">
                            {character.species} &middot; {character.height} &middot; {character.weight}
                        </p>

                        <section aria-label={t('about.moves')}>
                            <ul className="space-y-4">
                                {character.moves.map((move) => (
                                    <li key={move.name}>
                                        <div className="flex items-center justify-between gap-3">
                                            <span className="flex items-center gap-2">
                                                <span className="flex gap-1">{move.cost.map((c, i) => <Token key={i} type={c} />)}</span>
                                                <span className="font-display text-base font-bold uppercase leading-tight">{move.name}</span>
                                            </span>
                                            <span className="score text-sm">{move.damage}</span>
                                        </div>
                                        <p className="mt-1 text-sm font-semibold leading-snug">{move.description}</p>
                                    </li>
                                ))}
                            </ul>
                        </section>

                        <footer className="mt-1 flex items-end justify-between gap-4 border-t-[3px] border-[var(--ink)] pt-3">
                            <dl className="space-y-1.5 font-display text-xs font-bold uppercase">
                                <div className="flex items-center gap-2">
                                    <dt>{t('about.weakness')}</dt>
                                    <dd><Token type={character.weakness} /></dd>
                                </div>
                                <div className="flex items-center gap-2">
                                    <dt>{t('about.retreat')}</dt>
                                    <dd className="flex gap-1">{Array.from({ length: character.retreatCost }).map((_, i) => <Token key={i} type="normal" />)}</dd>
                                </div>
                            </dl>
                            <p className="max-w-[11rem] text-right text-sm font-semibold italic leading-snug">{character.flavorText}</p>
                        </footer>
                    </div>
                    <div className="pins" aria-hidden />
                </div>
            </div>
        </div>
    );
}

const About = () => {
    const { t, language } = useLanguage();
    const [activeId, setActiveId] = useState<Character['id']>('shurahiwa');
    const rootRef = useRef<HTMLDivElement>(null);
    const active = CHARACTERS.find((c) => c.id === activeId) ?? CHARACTERS[0];

    // Entrance each time the character changes
    useEffect(() => {
        const mm = gsap.matchMedia();
        mm.add('(prefers-reduced-motion: no-preference)', () => {
            gsap.fromTo('.about-card', { y: 40, rotate: -3, opacity: 0 }, { y: 0, rotate: 0, opacity: 1, duration: 0.7, ease: 'back.out(1.5)', clearProps: 'transform,opacity' });
            gsap.from('.about-info', { y: 24, opacity: 0, duration: 0.6, ease: 'power3.out', clearProps: 'transform,opacity' });
        }, rootRef);
        return () => mm.revert();
    }, [activeId]);

    useScrollReveal(rootRef, [language]);

    const links = socials.filter((s) => s.url);
    const discord = socials.find((s) => s.id === 'discord');

    const values = [
        { title: t('about.values.friendship'), desc: t('about.values.friendshipDesc') },
        { title: t('about.values.inclusion'), desc: t('about.values.inclusionDesc') },
        { title: t('about.values.fun'), desc: t('about.values.funDesc') },
    ];

    return (
        <div ref={rootRef}>
            <div className="mx-auto max-w-[1400px] px-4 py-12 sm:px-6 sm:py-16">
                <RevealTitle as="h1" className="font-display text-[clamp(2.8rem,8vw,6.5rem)] font-bold uppercase leading-[0.95] tracking-[-0.02em]">
                    {t('about.title')}
                </RevealTitle>
                <p data-reveal className="mt-5 max-w-[56ch] text-lg font-medium text-[var(--muted)]">
                    {t('about.subtitle')}
                </p>

                {/* Character select */}
                <div role="tablist" aria-label={t('about.characters')} className="mt-12 flex flex-wrap items-end gap-2 border-b-[3px] border-[var(--line)]">
                    {CHARACTERS.map((c) => {
                        const on = c.id === activeId;
                        return (
                            <button
                                key={c.id}
                                type="button"
                                role="tab"
                                id={`char-${c.id}`}
                                aria-selected={on}
                                aria-controls="char-panel"
                                onClick={() => setActiveId(c.id)}
                                className={`flex min-h-[3.25rem] items-center border-[3px] border-b-0 border-[var(--line)] px-7 font-display text-base font-bold uppercase tracking-[0.06em] transition-colors ${
                                    on ? `${c.tone === 'pink' ? 'bg-[var(--pink)]' : 'bg-[var(--cyan)]'} text-[var(--ink)]` : 'bg-[var(--surface-2)] hover:bg-[var(--yellow)] hover:text-[var(--ink)]'
                                }`}
                            >
                                {c.name}
                            </button>
                        );
                    })}
                </div>

                <div id="char-panel" role="tabpanel" aria-labelledby={`char-${activeId}`} className="grid items-start gap-14 pt-14 lg:grid-cols-[26rem_minmax(0,1fr)]">
                    <CharacterCard key={active.id} character={active} />

                    <div className="about-info max-w-[68ch]">
                        <h2 className="font-display text-[clamp(2.2rem,5vw,4rem)] font-bold uppercase leading-[0.95] tracking-[-0.02em]">
                            {active.id === 'shurahiwa' ? t('about.shuraTitle') : t('about.communityTitle')}
                        </h2>
                        <p className="mt-6 text-lg font-medium leading-relaxed sm:text-xl">{t(active.descKey)}</p>

                        <dl className="mt-10 grid gap-6 sm:grid-cols-2">
                            <div className="border-[3px] border-[var(--line)] bg-[var(--surface)] p-5 shadow-[5px_5px_0_var(--shadow)]">
                                <dt className="font-display text-xs font-bold uppercase tracking-[0.14em] text-[var(--muted)]">{t('about.species')}</dt>
                                <dd className="mt-2 font-display text-xl font-bold uppercase">{active.species}</dd>
                            </div>
                            <div className="border-[3px] border-[var(--line)] bg-[var(--surface)] p-5 shadow-[5px_5px_0_var(--shadow)]">
                                <dt className="font-display text-xs font-bold uppercase tracking-[0.14em] text-[var(--muted)]">{t('about.specialMove')}</dt>
                                <dd className="mt-2 font-display text-xl font-bold uppercase">{active.moves[1].name}</dd>
                            </div>
                        </dl>

                        {links.length > 0 && (
                            <div className="mt-10">
                                <h3 className="mb-4 font-display text-sm font-bold uppercase tracking-[0.14em] text-[var(--muted)]">{t('about.findHer')}</h3>
                                <ul className="flex flex-wrap gap-4">
                                    {links.map((s) => {
                                        const { Icon, className } = SOCIAL_ICONS[s.id];
                                        return (
                                            <li key={s.id}>
                                                <a
                                                    href={s.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    aria-label={s.label}
                                                    title={s.label}
                                                    className={`flex h-14 w-14 items-center justify-center border-[3px] border-[var(--line)] text-2xl shadow-[4px_4px_0_var(--shadow)] transition-transform duration-100 hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-1 active:translate-y-1 active:shadow-none ${className}`}
                                                >
                                                    <Icon />
                                                </a>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Values */}
            <section className="border-y-[3px] border-[var(--line)] bg-[var(--blue)] py-20 text-white [--line:var(--ink)] [--shadow:var(--ink)] sm:py-28">
                <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
                    <RevealTitle as="h2" className="font-display text-sm font-bold uppercase tracking-[0.2em] text-white/85">
                        {t('about.valuesTitle')}
                    </RevealTitle>
                    <ul className="mt-10 grid gap-12 md:grid-cols-3 md:gap-0 md:divide-x-[3px] md:divide-[var(--ink)]">
                        {values.map((v) => (
                            <li key={v.title} data-reveal className="md:px-10 first:md:pl-0 last:md:pr-0">
                                <p className="font-display text-[clamp(2.2rem,5vw,4.2rem)] font-bold uppercase leading-[0.95] tracking-[-0.02em]">{v.title}</p>
                                <p className="mt-4 max-w-[28ch] text-lg font-semibold leading-snug">{v.desc}</p>
                            </li>
                        ))}
                    </ul>
                </div>
            </section>

            {/* Join */}
            <section className="mx-auto max-w-[1400px] px-4 pb-4 pt-20 sm:px-6 sm:pt-28">
                <div className="cart-shell">
                    <div className="cart cart--yellow">
                        <div className="cart__face flex flex-col items-start justify-between gap-8 p-8 sm:p-12 lg:flex-row lg:items-center">
                            <div>
                                <RevealTitle as="h2" className="font-display text-[clamp(2rem,5vw,4rem)] font-bold uppercase leading-[0.95] tracking-[-0.02em]">
                                    {t('about.joinCommunity')}
                                </RevealTitle>
                                <p data-reveal className="mt-4 max-w-[50ch] text-lg font-semibold leading-snug">{t('about.joinText')}</p>
                            </div>
                            {discord && (
                                <a href={discord.url} target="_blank" rel="noopener noreferrer" className="btn !px-8 !py-4 !text-lg [--shadow:var(--ink)] [--line:var(--ink)]">
                                    <SiDiscord className="text-2xl" aria-hidden />
                                    {t('about.joinDiscord')}
                                    <MdArrowForward className="text-2xl" aria-hidden />
                                </a>
                            )}
                        </div>
                        <div className="pins" aria-hidden />
                    </div>
                </div>
            </section>
        </div>
    );
};

export default About;
