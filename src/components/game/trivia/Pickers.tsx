'use client';
import type { ReactNode } from 'react';
import { MdAllInclusive, MdBolt, MdCake, MdMusicNote, MdPets, MdPsychology, MdTimer } from 'react-icons/md';
import { useLanguage } from '../../../context/LanguageContext';
import type { Category, GameMode } from './types';

const ART = {
    pantcake:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuADmNov2I1T3_GAPg4x6T2vc6Fio5cSU4M2wKPdKqzF65X9YvbsgPb8vo9mtABT1BQGEEY73P-rrGZpfIMxXC1kPZ_pRm1livhbXPkVRBqux0rfNqt6xN8A0XnigLhD0ZJRgz5yJPxN2GAA5qZhKcls00e0zztFlPxyTljSnRqe0e4tmfeiQYVvjhdJIYkp0PN7MX99T82pNvsr496dmg3NcyFid9eXnEmPgQcLqGCAHHEL0481iZEKwAVZYywTp7u6uW3UjkcvqRI',
    shurahiwa:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuAy4HZrC4g-8Zmziv4BRCnLFks-2CZSAEHICVSO60Zm9pvzJAmbzW8LteJzSU1o88U6-WJhrVjYuCk15Wdv0RvNCuWWQKOa0ZBm-6MahOj1tZDR0cOO-Jp_o-VBgtp2JXZrB7RW-dS3BDX0z9-x3H5kwL4Ugx7ubmCrvvYgH1bDqRLg7GpZgqgi-XOCXDlwiGI1X3PF8qRlSILVqAgtVCqkVifG9T8dWE9sNCAg3EiVIbm6lsGmo4tMnZj5-PatL2AyOi5INWmZFIk',
    music: '/music_category.png',
};

type Tone = 'pink' | 'blue' | 'cyan' | 'yellow';

function Heading({ title, subtitle }: { title: string; subtitle?: string }) {
    return (
        <header className="mb-12">
            <h1 className="font-display text-[clamp(2.2rem,5.5vw,4.5rem)] font-bold uppercase leading-[0.95] tracking-[-0.02em]">{title}</h1>
            {subtitle && <p className="mt-4 max-w-[56ch] text-lg font-medium text-[var(--muted)]">{subtitle}</p>}
        </header>
    );
}

function CartButton({ tone, onClick, children }: { tone: Tone; onClick: () => void; children: ReactNode }) {
    return (
        <button type="button" onClick={onClick} className="group h-full text-left outline-offset-8">
            <div className="cart-shell is-interactive h-full">
                <div className={`cart cart--${tone} h-full`}>
                    <div className="cart__face flex h-full flex-col">{children}</div>
                </div>
            </div>
        </button>
    );
}

export function CategoryPicker({ onSelect }: { onSelect: (category: Category) => void }) {
    const { t } = useLanguage();

    const items: { id: Category; title: string; desc: string; tone: Tone; Icon: typeof MdCake; image: string }[] = [
        { id: 'pantcake', title: 'pantcake', desc: t('games.trivia.categorypantcake'), tone: 'blue', Icon: MdCake, image: ART.pantcake },
        { id: 'shurahiwa', title: 'ShuraHiwa', desc: t('games.trivia.categoryShura'), tone: 'pink', Icon: MdPets, image: ART.shurahiwa },
        { id: 'music', title: t('games.trivia.categoryMusicTitle'), desc: t('games.trivia.categoryMusic'), tone: 'yellow', Icon: MdMusicNote, image: ART.music },
    ];

    return (
        <section>
            <Heading title={t('games.trivia.chooseCategory')} subtitle={t('games.trivia.chooseCategoryDesc')} />
            <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">
                {items.map(({ id, title, desc, tone, Icon, image }) => (
                    <CartButton key={id} tone={tone} onClick={() => onSelect(id)}>
                        <div className="relative aspect-video overflow-hidden border-b-[3px] border-[var(--ink)] bg-[var(--ink)]">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={image} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-110" />
                            <span className="absolute left-4 top-4 flex h-12 w-12 items-center justify-center border-[3px] border-[var(--ink)] bg-[var(--yellow)] text-[var(--ink)] shadow-[3px_3px_0_var(--ink)]" aria-hidden>
                                <Icon className="text-2xl" />
                            </span>
                        </div>
                        <div className="flex-1 p-5">
                            <h2 className="font-display text-3xl font-bold uppercase leading-none">{title}</h2>
                            <p className="mt-3 text-base font-semibold leading-snug">{desc}</p>
                        </div>
                        <div className="pins" aria-hidden />
                    </CartButton>
                ))}
            </div>
        </section>
    );
}

export function ModePicker({ category, onStart }: { category: Category; onStart: (mode: GameMode) => void }) {
    const { t } = useLanguage();
    const music = category === 'music';

    const items: { mode: GameMode; title: string; tone: Tone; Icon: typeof MdTimer; cta: string }[] = music
        ? [
              { mode: 'insane', title: t('games.trivia.insaneMode'), tone: 'pink', Icon: MdPsychology, cta: 'HARDCORE' },
              { mode: 'chaos', title: t('games.trivia.chaosMode'), tone: 'blue', Icon: MdBolt, cta: 'CHAOS' },
          ]
        : [
              { mode: 'timed', title: t('games.trivia.timedMode'), tone: 'cyan', Icon: MdTimer, cta: t('games.trivia.start') },
              { mode: 'untimed', title: t('games.trivia.untimedMode'), tone: 'yellow', Icon: MdAllInclusive, cta: t('games.trivia.explore') },
          ];

    return (
        <section>
            <Heading
                title={music ? t('games.trivia.musicChallenge') : t('games.trivia.chooseChallenge')}
                subtitle={music ? t('games.trivia.musicChallengeDesc') : String(category).toUpperCase()}
            />
            <div className="grid max-w-4xl gap-10 md:grid-cols-2">
                {items.map(({ mode, title, tone, Icon, cta }) => (
                    <CartButton key={mode} tone={tone} onClick={() => onStart(mode)}>
                        <div className="flex flex-1 flex-col items-start gap-8 p-7">
                            <span className="flex h-20 w-20 items-center justify-center border-[3px] border-[var(--ink)] bg-white text-[var(--ink)] shadow-[5px_5px_0_var(--ink)]" aria-hidden>
                                <Icon className="text-5xl" />
                            </span>
                            <h2 className="font-display text-4xl font-bold uppercase leading-none">{title}</h2>
                            <span className="mt-auto inline-flex min-h-12 items-center border-[3px] border-[var(--ink)] bg-[var(--ink)] px-5 font-display text-sm font-bold uppercase tracking-[0.1em] text-[#fde0f6]">{cta}</span>
                        </div>
                        <div className="pins" aria-hidden />
                    </CartButton>
                ))}
            </div>
        </section>
    );
}

export function Countdown({ value }: { value: number }) {
    const { t } = useLanguage();
    return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center" role="status" aria-live="assertive">
            <div key={value} className="pop-in">
                <div className="cart-shell">
                    <div className="cart cart--pink">
                        <div className="cart__face px-14 py-8 sm:px-20 sm:py-10">
                            <span className="score text-6xl sm:text-8xl">{value === 0 ? 'GO!' : value}</span>
                        </div>
                    </div>
                </div>
            </div>
            <p className="mt-10 font-display text-2xl font-bold uppercase tracking-[0.2em] text-[var(--muted)]">
                {value === 0 ? t('games.trivia.countdownGo') : t('games.trivia.countdownReady')}
            </p>
        </div>
    );
}
