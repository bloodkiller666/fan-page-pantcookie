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
            // Kill any previous animations to avoid conflicts
            gsap.set(".gallery-item", { perspective: 1000 });
            
            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: containerRef.current,
                    start: "top 85%",
                }
            });

            // Initial Staggered Reveal
            tl.fromTo(".gallery-item", 
                { opacity: 0, y: 30 },
                { opacity: 1, y: 0, duration: 0.5, stagger: 0.1 }
            );

            // Per-item Reveal Animation (Overlay + Image Zoom)
            gsap.utils.toArray<HTMLElement>(".gallery-item").forEach((item) => {
                const overlay = item.querySelector(".reveal-overlay");
                const img = item.querySelector("img, .cld-image");
                const border = item.querySelector(".running-border-path");

                if (overlay && img) {
                    const itemTl = gsap.timeline({
                        scrollTrigger: {
                            trigger: item,
                            start: "top 90%",
                        }
                    });

                    itemTl.to(overlay, {
                        xPercent: 101,
                        duration: 0.8,
                        ease: "expo.inOut"
                    })
                    .from(img, {
                        scale: 1.4,
                        duration: 1.2,
                        ease: "expo.out"
                    }, 0);

                    // Running Border Animation
                    if (border instanceof SVGGeometryElement) {
                        const length = border.getTotalLength();
                        gsap.set(border, { strokeDasharray: length });
                        gsap.fromTo(border, 
                            { strokeDashoffset: length },
                            {
                                strokeDashoffset: 0,
                                duration: 3,
                                repeat: -1,
                                ease: "none"
                            }
                        );
                    }
                }
            });
        }
    }, { scope: containerRef, dependencies: [filtered] });

    return (
        <>
            <div ref={containerRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 p-4">
                {filtered.map((image, index) => (
                    <div
                        key={image.id}
                        className="gallery-item group relative h-72 w-full cursor-pointer opacity-0"
                        onClick={() => openLightbox(index)}
                        onMouseEnter={onMouseEnterCard}
                        onMouseLeave={onMouseLeaveCard}
                    >
                        {/* Animated Border Container */}
                        <svg className="absolute -inset-[2px] w-[calc(100%+4px)] h-[calc(100%+4px)] pointer-events-none z-10 overflow-visible">
                            <rect
                                x="0" y="0" width="100%" height="100%"
                                rx="12" ry="12"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                className="running-border-path text-[#ff00ff] dark:text-[#00ffff] opacity-50"
                            />
                        </svg>

                        <div className="relative h-full w-full shadow-2xl rounded-xl transition-all duration-700 transform-style-3d group-hover:rotate-y-180">

                            {/* Cara Frontal */}
                            <div className="absolute inset-0 h-full w-full backface-hidden rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800">
                                {/* Reveal Overlay */}
                                <div className="reveal-overlay absolute inset-0 z-20 bg-gradient-to-r from-[#ff00ff] via-[#bc13fe] to-[#00ffff] will-change-transform" />
                                
                                <div className="w-full h-full transform-gpu transition-transform duration-500 group-hover:scale-110">
                                    {image.isLocal ? (
                                        <img src={image.src} alt={image.alt} className="w-full h-full object-cover" />
                                    ) : (
                                        image.thumbnail && (
                                            <AdvancedImage
                                                cldImg={image.thumbnail}
                                                plugins={[placeholder({ mode: 'blur' })]}
                                                className="cld-image w-full h-full object-cover"
                                                alt={image.alt}
                                            />
                                        )
                                    )}
                                </div>
                                
                                {/* Overlay Gradient static */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10" />
                            </div>

                            {/* Cara Trasera */}
                            <div className="absolute inset-0 h-full w-full backface-hidden rotate-y-180 rounded-xl bg-white dark:bg-black/95 p-8 flex flex-col items-center justify-center text-center border-2 border-[#ff00ff]/30 shadow-[0_0_15px_rgba(255,0,255,0.2)]">
                                <h3 className="text-2xl font-black neon-text-pink mb-3 tracking-tighter uppercase italic">{image.alt}</h3>
                                <p className="text-gray-600 dark:text-gray-400 text-base font-medium leading-relaxed">{image.description}</p>
                                <div className="mt-6 p-3 rounded-full bg-pink-500/10 text-[#00ffff] animate-pulse shadow-[0_0_10px_rgba(0,255,255,0.3)]">
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