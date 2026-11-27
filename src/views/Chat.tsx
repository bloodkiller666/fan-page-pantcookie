'use client';
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import ChatInterface from '../components/chat/ChatInterface';
import { useLanguage } from '../context/LanguageContext';

const LOGO = 'https://pub-bdbaaa8e6a3e405c965b621a6503229c.r2.dev/Shura%20HiwaLogo%206.png';

const Chat = () => {
    const { t } = useLanguage();
    const rootRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const mm = gsap.matchMedia();
        mm.add('(prefers-reduced-motion: no-preference)', () => {
            gsap.from('.chat-in', { opacity: 0, y: 24, duration: 0.6, ease: 'power3.out', stagger: 0.12, clearProps: 'transform,opacity' });
        }, rootRef);
        return () => mm.revert();
    }, []);

    return (
        <div ref={rootRef} className="mx-auto grid h-[calc(100svh-var(--nav-h))] min-h-[560px] max-w-[1400px] grid-cols-[minmax(0,1fr)] gap-8 px-4 py-6 sm:px-6 lg:grid-cols-[20rem_minmax(0,1fr)]">
            {/* Profile */}
            <aside className="chat-in hidden flex-col gap-8 lg:flex">
                <div className="cart-shell">
                    <div className="cart cart--pink">
                        <div className="cart__face flex flex-col gap-5 p-6">
                            <span className="block aspect-square w-full overflow-hidden border-[3px] border-[var(--ink)] bg-[var(--yellow)] shadow-[5px_5px_0_var(--ink)]">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={LOGO} alt="" className="h-full w-full object-cover" />
                            </span>
                            <div>
                                <h2 className="font-display text-3xl font-bold uppercase leading-none">{t('chat.welcomeName')}</h2>
                                <p className="mt-3 text-base font-semibold leading-snug">{t('chat.subtitle')}</p>
                            </div>
                        </div>
                        <div className="pins" aria-hidden />
                    </div>
                </div>
                <p className="text-sm font-medium leading-snug text-[var(--muted)]">{t('chat.aiNote')}</p>
            </aside>

            <section className="chat-in flex min-h-0 flex-col">
                <ChatInterface />
            </section>
        </div>
    );
};

export default Chat;
