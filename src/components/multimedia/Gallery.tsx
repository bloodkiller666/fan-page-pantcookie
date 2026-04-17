'use client';
import { useState, useMemo, useRef } from 'react';
import { FiZoomIn } from 'react-icons/fi';
import Lightbox from './Lightbox';
import { AdvancedImage } from '@cloudinary/react';
import { getCloudinaryThumbnail, getCloudinaryImage } from '../../utils/cloudinary';
import { placeholder } from '@cloudinary/react';
import { useLanguage } from '../../context/LanguageContext';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

const Gallery = ({ query = '' }) => {
    const { t } = useLanguage();
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const containerRef = useRef(null);

    const imageList = useMemo(() => [
        { filename: 'image_iyhqyo', description: t('multimedia.gallery.img1') },
        { filename: 'image_tvh8vq', description: t('multimedia.gallery.img2') },
        { filename: 'image_iyhqyo', description: t('multimedia.gallery.img3') }, // Placeholder temporal para evitar error 404
    ], [t]);

    const images = useMemo(() => imageList.map((item, index) => {
        const isLocal = item.filename.endsWith('.gif');

        return {
            id: index,
            src: item.filename,
            cldImg: isLocal ? null : getCloudinaryImage(item.filename),
            thumbnail: isLocal ? null : getCloudinaryThumbnail(item.filename),
            alt: `${t('multimedia.gallery.fanArt')} ${index + 1}`,
            description: item.description,
            isLocal
        };
    }), [imageList, t]);

    const openLightbox = (index: number) => {
        setCurrentImageIndex(index);
        setLightboxOpen(true);
    };

    const onMouseEnterCard = (e: any) => {
        if (window.matchMedia("(pointer: fine)").matches) {
            gsap.to(e.currentTarget, {
                scale: 1.05,
                duration: 0.4,
                ease: 'power2.out'
            });
        }
    };

    const onMouseLeaveCard = (e: any) => {
        gsap.to(e.currentTarget, {
            scale: 1,
            duration: 0.4,
            ease: 'power2.inOut'
        });
    };

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return images;
        return images.filter(img =>
            (img.alt || '').toLowerCase().includes(q) ||
            (img.description || '').toLowerCase().includes(q)
        );
    }, [images, query]);

    useGSAP(() => {
        if (filtered.length > 0) {
            gsap.fromTo(".gallery-item",
                {
                    opacity: 0,
                    y: 50,
                    scale: 0.9,
                    rotateX: -15
                },
                {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    rotateX: 0,
                    duration: 1,
                    stagger: {
                        amount: 0.5,
                        grid: "auto",
                        from: "start"
                    },
                    ease: "elastic.out(1, 0.8)"
                }
            );
        }
    }, { scope: containerRef, dependencies: [filtered] });

    return (
        <>
            <div ref={containerRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
                {filtered.map((image, index) => (
                    <div
                        key={image.id}
                        className="gallery-item group relative h-64 w-full cursor-pointer perspective-1000 opacity-0"
                        onClick={() => openLightbox(index)}
                        onMouseEnter={onMouseEnterCard}
                        onMouseLeave={onMouseLeaveCard}
                    >
                        {/* El efecto de giro CSS se mantiene aquí */}
                        <div className="relative h-full w-full shadow-lg rounded-xl transition-all duration-500 transform-style-3d group-hover:rotate-y-180">

                            {/* Cara Frontal */}
                            <div className="absolute inset-0 h-full w-full backface-hidden rounded-xl overflow-hidden bg-gray-200 dark:bg-gray-700">
                                {image.isLocal ? (
                                    <img src={image.src} alt={image.alt} className="w-full h-full object-cover" loading="lazy" />
                                ) : (
                                    image.thumbnail && (
                                        <AdvancedImage
                                            cldImg={image.thumbnail}
                                            plugins={[placeholder({ mode: 'blur' })]}
                                            className="w-full h-full object-cover"
                                            alt={image.alt}
                                        />
                                    )
                                )}
                            </div>

                            {/* Cara Trasera */}
                            <div className="absolute inset-0 h-full w-full backface-hidden rotate-y-180 rounded-xl bg-gray-50 dark:bg-black/90 p-6 flex flex-col items-center justify-center text-center transform rotate-y-180 border border-[#ff00ff]/20">
                                <h3 className="text-xl font-bold neon-text-pink mb-2 tracking-tighter uppercase">{image.alt}</h3>
                                <p className="text-gray-600 dark:text-gray-300 text-sm font-medium">{image.description}</p>
                                <div className="mt-4 text-[#00ffff] drop-shadow-[0_0_5px_rgba(0,255,255,0.5)]">
                                    <FiZoomIn className="w-8 h-8" />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {lightboxOpen && (
                <Lightbox
                    images={filtered} // Passing filtered images array
                    currentIndex={currentImageIndex}
                    onClose={() => setLightboxOpen(false)}
                    onNext={() => setCurrentImageIndex((prev) => (prev + 1) % images.length)}
                    onPrev={() => setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)}
                />
            )}
        </>
    );
};

export default Gallery;