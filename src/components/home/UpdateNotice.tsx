'use client';
import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { MdClose } from 'react-icons/md';
import { useLanguage } from '../../context/LanguageContext';

const STORAGE_KEY = 'update_4_0_seen';

/** Non-blocking "what's new" card. It never takes focus or covers the page. */
export default function UpdateNotice({ parentLoading }: { parentLoading: boolean }) {
    const { t } = useLanguage();
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (parentLoading || localStorage.getItem(STORAGE_KEY)) return;
        const timer = setTimeout(() => setOpen(true), 2500);
        return () => clearTimeout(timer);
    }, [parentLoading]);

    // Auto-dismiss: it is a courtesy, not a gate
    useEffect(() => {
        if (!open) return;
        const timer = setTimeout(() => {
            setOpen(false);
            localStorage.setItem(STORAGE_KEY, 'true');
        }, 9000);
        return () => clearTimeout(timer);
    }, [open]);

    useEffect(() => {
        if (open && ref.current) {
            gsap.from(ref.current, { y: 40, x: -20, opacity: 0, duration: 0.6, ease: 'back.out(1.6)' });
        }
    }, [open]);

    const dismiss = () => {
        setOpen(false);
        localStorage.setItem(STORAGE_KEY, 'true');
    };

    if (!open) return null;

    return (
        <div ref={ref} role="status" className="fixed bottom-3 left-3 z-[900] w-[min(78vw,22rem)] sm:bottom-4 sm:left-4">
            <div className="cart-shell">
                <div className="cart cart--yellow">
                    <div className="cart__face p-5">
                        <div className="flex items-start justify-between gap-4">
                            <h2 className="font-display text-xl font-bold uppercase leading-none">{t('home.updateTitle')}</h2>
                            <button type="button" onClick={dismiss} aria-label={t('home.dismiss')} className="-m-2 flex h-10 w-10 items-center justify-center">
                                <MdClose className="text-2xl" />
                            </button>
                        </div>
                        <p className="mt-2 text-sm font-semibold leading-snug sm:mt-3 sm:text-base">{t('home.updateBody')}</p>
                        <button type="button" onClick={dismiss} className="btn btn--ghost mt-3 hidden sm:inline-flex !min-h-10 !px-4 !py-2 !text-sm [--shadow:var(--ink)] [--line:var(--ink)]">
                            {t('home.dismiss')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
