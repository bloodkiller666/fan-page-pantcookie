'use client';
import { ReactNode, useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { gsap } from 'gsap';

type Tone = 'pink' | 'blue' | 'cyan' | 'yellow';

interface GameDialogProps {
    open: boolean;
    title: string;
    icon?: ReactNode;
    tone?: Tone;
    /** Called on Escape. Omit for dialogs that must be answered with a button. */
    onClose?: () => void;
    /** Wider panel for reading content (default is a compact prompt). */
    wide?: boolean;
    children: ReactNode;
}

const HEADER_TONE: Record<Tone, string> = {
    pink: 'bg-[var(--pink)] text-[var(--ink)]',
    blue: 'bg-[var(--blue)] text-white',
    cyan: 'bg-[var(--cyan)] text-[var(--ink)]',
    yellow: 'bg-[var(--yellow)] text-[var(--ink)]',
};

/**
 * Cartridge-style modal shared by every game: rules, pause, confirmations.
 * Portaled to <body>, traps nothing but moves focus in, closes on Escape and
 * restores focus to the opener.
 */
export default function GameDialog({ open, title, icon, tone = 'pink', onClose, wide = false, children }: GameDialogProps) {
    const panelRef = useRef<HTMLDivElement>(null);
    const titleId = useId();
    // Keep the latest handler without re-running the open effect on every parent render
    const onCloseRef = useRef(onClose);
    onCloseRef.current = onClose;

    useEffect(() => {
        if (!open) return;
        const opener = document.activeElement as HTMLElement | null;
        panelRef.current?.focus();

        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (!reduce && panelRef.current) {
            gsap.fromTo(panelRef.current, { y: 36, scale: 0.94, opacity: 0 }, { y: 0, scale: 1, opacity: 1, duration: 0.45, ease: 'back.out(1.6)' });
        }

        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onCloseRef.current?.();
        };
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('keydown', onKey);
            opener?.focus?.();
        };
    }, [open]);

    if (!open || typeof document === 'undefined') return null;

    return createPortal(
        <div className="fixed inset-0 z-[12000] flex items-center justify-center overflow-y-auto bg-black/75 p-4" onClick={onClose}>
            <div
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                tabIndex={-1}
                onClick={(e) => e.stopPropagation()}
                className={`my-auto w-full outline-none ${wide ? 'max-w-3xl' : 'max-w-md'}`}
            >
                <div className="cart-shell">
                    <div className="cart">
                        <div className="cart__face">
                            <div className={`flex items-center gap-4 border-b-[3px] border-[var(--line)] px-6 py-5 ${HEADER_TONE[tone]} [--line:var(--ink)]`}>
                                {icon && <span className="text-4xl" aria-hidden>{icon}</span>}
                                <h2 id={titleId} className="font-display text-3xl font-bold uppercase leading-none tracking-tight">
                                    {title}
                                </h2>
                            </div>
                            <div className="p-6">{children}</div>
                            <div className="pins" aria-hidden />
                        </div>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
