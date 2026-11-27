'use client';
import { useMemo, useRef, useState } from 'react';
import { AdvancedImage, lazyload, placeholder } from '@cloudinary/react';
import { MdZoomIn } from 'react-icons/md';
import Lightbox from './Lightbox';
import { getCloudinaryDisplay, getCloudinaryThumbnail } from '../../utils/cloudinary';
import { useLanguage } from '../../context/LanguageContext';
import { useScrollReveal } from '../../hooks/useScrollReveal';

// Cloudinary public ids, in display order (text comes from the translations).
const IMAGE_IDS = [
    'image_iyhqyo',
    'image_tvh8vq',
    'Untitled_design_9_ccg9g8',
    'VRChat_2026-05-09_22-15-39.861_2560x1440_rz8prs',
    'ElViciooo_kw12zv',
    'image_j0ctql',
    'Se_buscan_gwkkfu',
    '120_hrs_j746zp',
    'Quien_es_tu_princesa_hitnyg',
];

const TONES = ['', 'cart--cyan', 'cart--yellow', 'cart--pink'] as const;

const Gallery = ({ query = '' }: { query?: string }) => {
    const { t, language } = useLanguage();
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const rootRef = useRef<HTMLUListElement>(null);

    const images = useMemo(
        () =>
            IMAGE_IDS.map((filename, index) => ({
                id: index,
                alt: t(`multimedia.gallery.titles.img${index + 1}`) || `${t('multimedia.gallery.fanArt')} ${index + 1}`,
                description: t(`multimedia.gallery.img${index + 1}`),
                credit: t(`multimedia.gallery.credits.img${index + 1}`),
                thumbnail: getCloudinaryThumbnail(filename, 640, 480),
                display: getCloudinaryDisplay(filename, 1600),
            })),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [language]
    );

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return images;
        return images.filter((img) => `${img.alt} ${img.description} ${img.credit}`.toLowerCase().includes(q));
    }, [images, query]);

    useScrollReveal(rootRef, [filtered.length, language]);

    if (filtered.length === 0) {
        return <p className="py-16 text-center font-display text-2xl font-bold uppercase text-[var(--muted)]">{t('multimedia.noResults')}</p>;
    }

    return (
        <>
            <ul ref={rootRef} className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((image, index) => (
                    <li key={image.id} data-reveal>
                        <button
                            type="button"
                            onClick={() => {
                                setCurrentIndex(index);
                                setLightboxOpen(true);
                            }}
                            className="group block w-full text-left outline-offset-8"
                        >
                            <div className="cart-shell is-interactive">
                                <div className={`cart ${TONES[index % TONES.length]}`}>
                                    <div className="cart__face">
                                        <div className="relative aspect-[4/3] overflow-hidden border-b-[3px] border-[var(--ink)] bg-[var(--ink)]">
                                            <AdvancedImage
                                                cldImg={image.thumbnail}
                                                plugins={[lazyload(), placeholder({ mode: 'blur' })]}
                                                alt=""
                                                className="h-full w-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
                                            />
                                            <span className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center border-[3px] border-[var(--ink)] bg-[var(--yellow)] text-[var(--ink)] opacity-0 shadow-[3px_3px_0_var(--ink)] transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100" aria-hidden>
                                                <MdZoomIn className="text-2xl" />
                                            </span>
                                        </div>
                                        <div className="px-5 py-4">
                                            <h3 className="line-clamp-1 font-display text-xl font-bold uppercase leading-tight">{image.alt}</h3>
                                            <p className="mt-1 line-clamp-1 font-display text-xs font-bold uppercase tracking-[0.12em] opacity-70">{image.credit}</p>
                                        </div>
                                        <div className="pins" aria-hidden />
                                    </div>
                                </div>
                            </div>
                        </button>
                    </li>
                ))}
            </ul>

            {lightboxOpen && (
                <Lightbox
                    images={filtered}
                    currentIndex={currentIndex}
                    onClose={() => setLightboxOpen(false)}
                    onNext={() => setCurrentIndex((prev) => (prev + 1) % filtered.length)}
                    onPrev={() => setCurrentIndex((prev) => (prev - 1 + filtered.length) % filtered.length)}
                />
            )}
        </>
    );
};

export default Gallery;
