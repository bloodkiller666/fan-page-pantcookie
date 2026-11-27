'use client';
import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AdvancedImage } from '@cloudinary/react';
import type { CloudinaryImage } from '@cloudinary/url-gen';
import { MdArrowBack, MdArrowForward, MdClose } from 'react-icons/md';
import { useLanguage } from '../../context/LanguageContext';

export interface LightboxImage {
    id: number;
    alt: string;
    description: string;
    credit?: string;
    /** Large, resized version for the viewer. */
    display: CloudinaryImage;
}

interface LightboxProps {
    images: LightboxImage[];
    currentIndex: number;
    onClose: () => void;
    onNext: () => void;
    onPrev: () => void;
}

const Lightbox = ({ images, currentIndex, onClose, onNext, onPrev }: LightboxProps) => {
    const { t } = useLanguage();
    const current = images[currentIndex];
    const closeRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowLeft') onPrev();
            if (e.key === 'ArrowRight') onNext();
        };
        window.addEventListener('keydown', onKey);
        document.body.style.overflow = 'hidden';
        closeRef.current?.focus();
        return () => {
            window.removeEventListener('keydown', onKey);
            document.body.style.overflow = '';
        };
    }, [onClose, onNext, onPrev]);

    if (!current) return null;

    return createPortal(
        <div className="fixed inset-0 z-[12000] overflow-y-auto bg-black/90 p-3 sm:p-8" onClick={onClose} role="dialog" aria-modal="true" aria-label={current.alt}>
            <div className="mx-auto grid min-h-full max-w-[1500px] items-center gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]" onClick={(e) => e.stopPropagation()}>
                {/* Image */}
                <div className="bezel">
                    <div className="bezel__screen flex max-h-[78svh] items-center justify-center bg-black after:hidden">
                        <AdvancedImage cldImg={current.display} alt={current.alt} className="max-h-[78svh] w-full object-contain" />
                    </div>
                </div>

                {/* Info */}
                <div className="cart-shell">
                    <div className="cart">
                        <div className="cart__face">
                            <div className="flex items-center justify-between gap-3 border-b-[3px] border-[var(--ink)] bg-[var(--pink)] px-5 py-3 text-[var(--ink)]">
                                <span className="score text-[0.6rem]">
                                    {currentIndex + 1}/{images.length}
                                </span>
                                <button ref={closeRef} type="button" onClick={onClose} aria-label={t('multimedia.lightbox.close')} className="flex h-11 w-11 items-center justify-center border-[3px] border-[var(--ink)] bg-[var(--yellow)]">
                                    <MdClose className="text-2xl" />
                                </button>
                            </div>
                            <div className="max-h-[48svh] overflow-y-auto p-5">
                                <h2 className="font-display text-3xl font-bold uppercase leading-none">{current.alt}</h2>
                                {current.credit && (
                                    <p className="tag mt-4 !normal-case">
                                        {t('multimedia.lightbox.credit')}: {current.credit}
                                    </p>
                                )}
                                <p className="mt-5 text-lg font-medium leading-relaxed">{current.description}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-3 border-t-[3px] border-[var(--line)] p-4">
                                <button type="button" onClick={onPrev} className="btn btn--ghost !min-h-11 !px-3 !py-2 !text-sm">
                                    <MdArrowBack className="text-xl" aria-hidden />
                                    {t('multimedia.lightbox.prev')}
                                </button>
                                <button type="button" onClick={onNext} className="btn !min-h-11 !px-3 !py-2 !text-sm">
                                    {t('multimedia.lightbox.next')}
                                    <MdArrowForward className="text-xl" aria-hidden />
                                </button>
                            </div>
                            <div className="pins" aria-hidden />
                        </div>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default Lightbox;
