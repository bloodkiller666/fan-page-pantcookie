'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { MdBedtime, MdForum, MdSportsEsports } from 'react-icons/md';
import type { IconType } from 'react-icons';
import calendarData from '../../data/calendar.json';
import { useLanguage } from '../../context/LanguageContext';
import { useScrollReveal } from '../../hooks/useScrollReveal';
import RevealTitle from '../ui/RevealTitle';

// calendar.json stores an emoji per entry; map it to a drawn icon.
const ICONS: Record<string, IconType> = {
    '💬': MdForum,
    '🎮': MdSportsEsports,
    '😴': MdBedtime,
};

export default function WeeklySchedule() {
    const { t, language } = useLanguage();
    const rootRef = useRef<HTMLElement>(null);

    // Monday-first index of today, matching calendar.json order. Set after mount to avoid a server/client mismatch.
    const [todayIndex, setTodayIndex] = useState(-1);
    useEffect(() => setTodayIndex((new Date().getDay() + 6) % 7), []);

    const dayNames = useMemo(
        () =>
            calendarData.map((_, i) =>
                // 2024-01-01 is a Monday
                new Date(2024, 0, 1 + i).toLocaleDateString(language, { weekday: 'long' })
            ),
        [language]
    );

    useScrollReveal(rootRef, [language]);

    return (
        <section ref={rootRef} className="relative overflow-hidden border-b-[3px] border-[var(--line)] bg-[var(--blue)] py-24 text-white [--shadow:var(--ink)] [--line:var(--ink)] sm:py-32">
            <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
                <RevealTitle className="font-display text-[clamp(2.4rem,6.5vw,5.5rem)] font-bold uppercase leading-[0.95] tracking-[-0.02em]">
                    {t('home.weeklyCalendar')}
                </RevealTitle>

                <ul className="mt-14 grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
                    {calendarData.map((item, i) => {
                        const Icon = ICONS[item.icon] ?? MdSportsEsports;
                        const rest = !item.activity;
                        const today = i === todayIndex;
                        return (
                            <li key={item.day} data-reveal className={i === 6 ? 'lg:col-start-3' : ''}>
                                <div className="cart-shell">
                                    <div className={`cart ${today ? 'cart--yellow' : ''}`}>
                                        <div className={`cart__face flex min-h-[210px] flex-col justify-between gap-6 p-6 ${rest ? 'opacity-90' : ''}`} style={today ? undefined : { color: 'var(--ink)', background: '#fff' }}>
                                            <div className="flex items-start justify-between gap-3">
                                                <h3 className="font-display text-2xl font-bold uppercase leading-none tracking-tight">{dayNames[i]}</h3>
                                                <Icon className="shrink-0 text-3xl" aria-hidden />
                                            </div>
                                            <div>
                                                <p className="font-display text-xl font-bold uppercase leading-tight">
                                                    {rest ? t('home.restDay') : item.activity}
                                                </p>
                                                {item.time && (
                                                    <p className="mt-2 text-sm font-semibold leading-snug">{item.time.replace('||', '·')}</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="pins" aria-hidden />
                                    </div>
                                </div>
                                {today && (
                                    <span className="tag tag--pink -mt-3 ml-4 inline-flex -rotate-2 !border-[var(--ink)] relative z-10">{t('home.today')}</span>
                                )}
                            </li>
                        );
                    })}
                </ul>
            </div>
        </section>
    );
}
