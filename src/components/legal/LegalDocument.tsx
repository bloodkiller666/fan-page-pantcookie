'use client';
import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useLanguage } from '../../context/LanguageContext';
import { useScrollReveal } from '../../hooks/useScrollReveal';
import RevealTitle from '../ui/RevealTitle';

gsap.registerPlugin(ScrollTrigger);

export interface LegalSection {
    id: string;
    title: string;
    paragraphs?: string[];
    points?: string[];
}

/** Drops a leading "1. " from copy that was written as a numbered list. */
export const stripNumber = (text: string) => text.replace(/^\s*\d+\.\s*/, '');

interface LegalDocumentProps {
    title: string;
    sections: LegalSection[];
}

/**
 * Reading layout shared by Terms and Privacy: a sticky table of contents that follows
 * the scroll, and sections set at a comfortable measure.
 */
export default function LegalDocument({ title, sections }: LegalDocumentProps) {
    const { t, language } = useLanguage();
    const rootRef = useRef<HTMLDivElement>(null);
    const [activeId, setActiveId] = useState(sections[0]?.id);

    useScrollReveal(rootRef, [language]);

    // Scroll spy: highlight the section that crosses the upper third of the viewport
    useEffect(() => {
        const root = rootRef.current;
        if (!root) return;
        const ctx = gsap.context(() => {
            sections.forEach((section) => {
                ScrollTrigger.create({
                    trigger: `#${section.id}`,
                    start: 'top 35%',
                    end: 'bottom 35%',
                    onToggle: (self) => self.isActive && setActiveId(section.id),
                });
            });
        }, root);
        return () => ctx.revert();
    }, [sections]);

    const goTo = (e: React.MouseEvent, id: string) => {
        e.preventDefault();
        document.getElementById(id)?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
        setActiveId(id);
    };

    const toc = (
        <ul className="space-y-1">
            {sections.map((s) => (
                <li key={s.id}>
                    <a
                        href={`#${s.id}`}
                        onClick={(e) => goTo(e, s.id)}
                        aria-current={activeId === s.id ? 'location' : undefined}
                        className={`block border-[3px] px-3 py-2 font-display text-sm font-bold uppercase leading-tight tracking-[0.04em] transition-colors ${
                            activeId === s.id ? 'border-[var(--line)] bg-[var(--yellow)] text-[var(--ink)]' : 'border-transparent text-[var(--muted)] hover:border-[var(--line)] hover:text-[var(--text)]'
                        }`}
                    >
                        {s.title}
                    </a>
                </li>
            ))}
        </ul>
    );

    return (
        <div ref={rootRef} className="mx-auto max-w-[1200px] px-4 py-12 sm:px-6 sm:py-16">
            <RevealTitle as="h1" className="font-display text-[clamp(2.4rem,7vw,5.5rem)] font-bold uppercase leading-[0.95] tracking-[-0.02em]">
                {title}
            </RevealTitle>

            <div className="mt-12 grid items-start gap-12 lg:grid-cols-[16rem_minmax(0,1fr)]">
                {/* Table of contents */}
                <nav aria-label={t('legal.toc')} className="lg:sticky lg:top-28">
                    <details className="border-[3px] border-[var(--line)] bg-[var(--surface)] lg:hidden">
                        <summary className="cursor-pointer px-4 py-3 font-display text-sm font-bold uppercase tracking-[0.12em]">{t('legal.toc')}</summary>
                        <div className="border-t-[3px] border-[var(--line)] p-2">{toc}</div>
                    </details>
                    <div className="hidden lg:block">
                        <p className="mb-3 font-display text-xs font-bold uppercase tracking-[0.16em] text-[var(--muted)]">{t('legal.toc')}</p>
                        {toc}
                    </div>
                </nav>

                {/* Document */}
                <div className="max-w-[72ch]">
                    {sections.map((section) => (
                        <section key={section.id} id={section.id} className="scroll-mt-28 border-t-[3px] border-[var(--line)] py-10 first:border-t-0 first:pt-0">
                            <RevealTitle as="h2" className="font-display text-[clamp(1.6rem,3.2vw,2.4rem)] font-bold uppercase leading-[1] tracking-[-0.01em]">
                                {section.title}
                            </RevealTitle>
                            <div data-reveal className="mt-5 space-y-4 text-lg font-medium leading-relaxed">
                                {section.paragraphs?.map((p, i) => (
                                    <p key={i}>{p}</p>
                                ))}
                                {section.points && section.points.length > 0 && (
                                    <ul className="space-y-3">
                                        {section.points.map((point, i) => (
                                            <li key={i} className="flex gap-3">
                                                <span className="mt-[0.55em] h-3 w-3 shrink-0 bg-[var(--pink)]" aria-hidden />
                                                <span>{stripNumber(point)}</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </section>
                    ))}
                </div>
            </div>
        </div>
    );
}
